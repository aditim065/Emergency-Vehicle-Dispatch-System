// user.js
const API = "http://localhost:3000";
const socket = io("http://localhost:3000");

let map, driverMarker, userMarker, directionsService, directionsRenderer;
let currentRequestId = null;

async function init() {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers:true });

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 28.6139, lng: 77.2090 },
    zoom: 12
  });
  directionsRenderer.setMap(map);

  const token = localStorage.getItem("token");
  if (!token) { location.href = "/index.html"; return; }

  await loadLocations();

  if (token) socket.emit("identify", { token });

  socket.on("locationUpdate", (data) => {
    // data: { driverId, driverName, lat, lng, vehicleType }
    if (!currentRequestId) return;
    updateDriverMarker(data.lat, data.lng, data.driverName);
    const dest = userMarker.getPosition();
    updateEtaWithRoute({ lat: data.lat, lng: data.lng }, { lat: dest.lat(), lng: dest.lng() });
  });

  socket.on("statusUpdate", (d) => {
    if (d.requestId === currentRequestId) {
      document.getElementById("info").innerHTML += `<div>Status: ${d.status}</div>`;
    }
  });
}

async function loadLocations() {
  const res = await fetch(`${API}/locations`);
  const locs = await res.json();
  const sel = document.getElementById("locationSelect");
  sel.innerHTML = "";
  locs.forEach(l => {
    const opt = document.createElement("option");
    opt.value = l.id;
    opt.textContent = l.name;
    sel.appendChild(opt);
  });
}

function updateDriverMarker(lat, lng, title) {
  const position = { lat, lng };
  
  if (!driverMarker) {
    driverMarker = new google.maps.Marker({
      position,
      map,
      title: `Driver: ${title}`,
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new google.maps.Size(40, 40)
      }
    });
    
    // Add info window
    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="color: black; padding: 5px;">
        <strong>Driver Location</strong><br>
        ${title}
      </div>`
    });
    
    driverMarker.addListener('click', () => {
      infoWindow.open(map, driverMarker);
    });
    
    // Show info window by default
    infoWindow.open(map, driverMarker);
    
    // Auto-close after 5 seconds
    setTimeout(() => infoWindow.close(), 5000);
  } else {
    driverMarker.setPosition(position);
  }
  
  // Update map bounds to show both markers
  if (userMarker) {
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(userMarker.getPosition());
    bounds.extend(position);
    map.fitBounds(bounds);
    
    // Add padding to the bounds
    const padding = 0.02; // degrees of padding
    map.panToBounds(bounds, {
      top: padding * 100, right: padding * 100,
      bottom: padding * 100, left: padding * 100
    });
  } else {
    map.panTo(position);
  }
}

function calculateETA(distanceKm) {
  // Calculate base ETA as distance + 1 minute (minimum 1 minute)
  // Add some randomness between 0-1 minutes for traffic conditions
  const baseEta = Math.ceil(distanceKm) + 1;
  const trafficFactor = Math.floor(Math.random() * 2); // 0-1 minutes
  
  // Ensure ETA is at least 1 minute and at most 6 minutes
  return Math.min(baseEta + trafficFactor, 6);
}

function updateEtaWithRoute(origin, destination) {
  // Clear any existing route
  directionsRenderer.setDirections({ routes: [] });
  
  directionsService.route({
    origin,
    destination,
    travelMode: google.maps.TravelMode.DRIVING,
    provideRouteAlternatives: false
  }, (response, status) => {
    if (status === 'OK') {
      // Set the route on the map
      directionsRenderer.setOptions({
        suppressMarkers: true, // We're using our own markers
        polylineOptions: {
          strokeColor: '#3b82f6', // Blue color for the route line
          strokeOpacity: 0.8,
          strokeWeight: 5,
          zIndex: 1
        }
      });
      directionsRenderer.setDirections(response);
      
      // Update the ETA and distance information
      const route = response.routes[0];
      if (route && route.legs && route.legs[0]) {
        const duration = route.legs[0].duration?.text || 'Calculating...';
        const distance = route.legs[0].distance?.text || '';
        
        // Update the ETA in the info box
        const etaElement = document.getElementById("etaInfo");
        if (etaElement) {
          etaElement.innerHTML = `ETA: ${duration}${distance ? ` (${distance})` : ''}`;
        }
      }
    } else {
      console.error('Directions request failed due to ' + status);
    }
  });
}

document.getElementById("requestBtn").addEventListener("click", async () => {
  const locId = document.getElementById("locationSelect").value;
  const vehicleType = document.getElementById("vehicleType").value;
  const emergencyType = (document.getElementById("emergencyType")?.value || "").trim();
  const token = localStorage.getItem("token");
  if (!token) return alert("Not authenticated");

  const res = await fetch(`${API}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    body: JSON.stringify({ locationId: locId, vehicleType, emergencyType })
  });
  const data = await res.json();
  if (!res.ok) return alert(data.error || "Assign failed");

  const request = data.request;
  currentRequestId = request.id;

  // Update or create user marker at the selected request location
  const userPosition = { lat: parseFloat(request.locationLat), lng: parseFloat(request.locationLng) };
  
  if (!userMarker) {
    userMarker = new google.maps.Marker({
      position: userPosition,
      map,
      title: `Request Location: ${request.locationName}`,
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        scaledSize: new google.maps.Size(40, 40)
      },
      animation: google.maps.Animation.DROP
    });
    
    // Add info window for user location
    const userInfoWindow = new google.maps.InfoWindow({
      content: `<div style="color: black; padding: 8px;">
        <strong>Request Location</strong><br>
        ${request.locationName || 'Selected location'}
      </div>`
    });
    
    userMarker.addListener('click', () => {
      userInfoWindow.open(map, userMarker);
    });
    
    // Show info window by default
    userInfoWindow.open(map, userMarker);
    
    // Auto-close after 5 seconds
    setTimeout(() => userInfoWindow.close(), 5000);
  } else {
    userMarker.setPosition(userPosition);
  }
  
  // Center map on the user's selected location
  map.setCenter(userPosition);

  // show driver marker initially
  updateDriverMarker(request.driverLat, request.driverLng, request.driverName);
  updateEtaWithRoute({ lat: request.driverLat, lng: request.driverLng }, { lat: request.locationLat, lng: request.locationLng });

  // Generate random ETA between 1 and 5 minutes
  const randomEta = Math.floor(Math.random() * 5) + 1;
  
  // show info
  document.getElementById("info").innerHTML = `
    <div class="signup-box">
      <h2>Assignment Details</h2>
      <p><b>Driver:</b> ${request.driverName}</p>
      <p><b>Vehicle:</b> ${request.driverVehicleNumber} (${request.vehicleType})</p>
      <p><b>Phone:</b> ${request.driverPhone || "--"}</p>
      <p><b>Distance:</b> ${request.distanceKm} km</p>
      <p><b>ETA:</b> ${randomEta} min</p>
      <p><b>Emergency:</b> ${request.emergencyType || "--"}</p>
      <p><b>Request ID:</b> ${request.id}</p>
    </div>
  `;

  // join socket room to receive location updates and status updates
  socket.emit("joinRequest", { requestId: request.id });
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  location.href = "/index.html";
});

window.onload = init;