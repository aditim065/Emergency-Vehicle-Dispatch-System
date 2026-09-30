const API = "http://localhost:3000";

let drivers = [];
let locations = [];
let requests = [];
let allDrivers = [];

// Load locations and populate dropdown
async function loadLocations() {
  const res = await fetch(`${API}/locations`);
  locations = await res.json();

  const locationFilter = document.getElementById("locationFilter");
  locations.forEach(loc => {
    const option = document.createElement("option");
    option.value = loc.id;
    option.textContent = loc.name;
    locationFilter.appendChild(option);
  });
}

// Load drivers and render the table
async function loadDrivers() {
  const res = await fetch(`${API}/drivers`);
  drivers = await res.json();
  allDrivers = [...drivers]; // Store a copy of all drivers
  renderDriversTable(drivers);
  populateVehicleFilter();
}

// Render drivers table
function renderDriversTable(driverList) {
  const tbody = document.querySelector("#driversTable tbody");
  tbody.innerHTML = "";

  driverList.forEach(driver => {
    const locationName = locations.find(loc => loc.id == driver.locationId)?.name || "Unknown";
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${driver.name}</td>
      <td>${locationName}</td>
      <td>${driver.status}</td>
      <td>${driver.vehicle}</td>
      <td>${driver.vehicleNo || "-"}</td>
      <td>${driver.phone || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Filter logic
function filterDrivers() {
  const searchVal = document.getElementById("searchDriver").value.toLowerCase();
  const locationVal = document.getElementById("locationFilter").value;
  const statusVal = document.getElementById("statusFilter").value;
  const vehicleVal = document.getElementById("vehicleFilter").value;

  const filtered = drivers.filter(d => {
    const matchesName = d.name.toLowerCase().includes(searchVal);
    const matchesLocation = locationVal ? d.locationId == locationVal : true;
    const matchesStatus = statusVal ? d.status === statusVal : true;
    const matchesVehicle = vehicleVal ? d.vehicle === vehicleVal : true;
    return matchesName && matchesLocation && matchesStatus && matchesVehicle;
  });

  renderDriversTable(filtered);
}

// Populate unique vehicle dropdown options
function populateVehicleFilter() {
  const vehicleFilter = document.getElementById("vehicleFilter");
  vehicleFilter.innerHTML = `<option value="">All</option>`; // reset

  const uniqueVehicles = [...new Set(drivers.map(d => d.vehicle))];
  uniqueVehicles.forEach(vehicle => {
    const option = document.createElement("option");
    option.value = vehicle;
    option.textContent = vehicle;
    vehicleFilter.appendChild(option);
  });
}

// Event listeners
document.getElementById("searchBtn").addEventListener("click", filterDrivers);
document.getElementById("searchDriver").addEventListener("input", filterDrivers);
document.getElementById("locationFilter").addEventListener("change", filterDrivers);
document.getElementById("statusFilter").addEventListener("change", filterDrivers);
document.getElementById("vehicleFilter").addEventListener("change", filterDrivers);

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  location.href = "index.html";
});

// Load and render emergency requests
async function loadRequests() {
  try {
    const res = await fetch(`${API}/requests`);
    requests = await res.json();
    renderRequestsTable(requests);
  } catch (error) {
    console.error('Error loading requests:', error);
  }
}

// Render requests table
function renderRequestsTable(requestList) {
  const tbody = document.querySelector("#requestsTable tbody");
  tbody.innerHTML = "";

  const statusFilter = document.getElementById("statusFilterReq").value.toLowerCase();
  
  const filteredRequests = requestList.filter(request => {
    if (!statusFilter) return true;
    return request.status === statusFilter;
  });

  filteredRequests.forEach(request => {
    const tr = document.createElement("tr");
    const driver = allDrivers.find(d => d.id == request.driverId);
    const driverName = driver ? driver.name : 'Unassigned';
    const requestDate = new Date(request.timestamp);
    const formattedDate = requestDate.toLocaleDateString();
    const formattedTime = requestDate.toLocaleTimeString();
    
    // Determine status badge class
    let statusClass = 'status-badge';
    if (request.status === 'completed') {
      statusClass += ' status-completed';
    } else if (request.status === 'in-progress') {
      statusClass += ' status-inprogress';
    } else {
      statusClass += ' status-pending';
    }

    tr.innerHTML = `
      <td>${request.type.charAt(0).toUpperCase() + request.type.slice(1)}</td>
      <td>${driverName}</td>
      <td>${driver ? 'Assigned' : 'Not Assigned'}</td>
      <td>${formattedDate}</td>
      <td>${formattedTime}</td>
      <td><span class="${statusClass}">${request.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// Filter requests by status
document.getElementById("statusFilterReq").addEventListener("change", () => {
  renderRequestsTable(requests);
});

// Load all data on page load
window.onload = async () => {
  await loadLocations();
  await loadDrivers();
  await loadRequests();
};