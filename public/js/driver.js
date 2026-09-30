// driver.js
const API = "http://localhost:3000";
const socket = io("http://localhost:3000");

let map, driverMarker, userMarker, directionsService, directionsRenderer;
let watchId = null;
const token = localStorage.getItem("token");
const driverId = localStorage.getItem("id");

async function init() {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers:true });

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 28.6139, lng: 77.2090 },
    zoom: 12
  });
  directionsRenderer.setMap(map);

  if (!token || !driverId) { location.href = "/index.html"; return; }
  socket.emit("identify", { token });

  // get assigned request(s)
  await refreshAssigned();

  // listen for being assigned
  socket.on("assigned", (data) => {
    const req = data.request;
    if (req.driverId === Number(driverId) || req.driverId === driverId) {
      document.getElementById("status").innerText = `Assigned to ${req.locationName}`;
      ensureMarkers(req.driverLat, req.driverLng, req.locationLat, req.locationLng);
      drawRoute({ lat: req.driverLat, lng: req.driverLng }, { lat: req.locationLat, lng: req.locationLng });
      socket.emit("joinRequest", { requestId: req.id });
    }
  });

  // receive location updates for requests we are part of (driver sees own updates too)
  socket.on("locationUpdate", (d) => {
    if (d.driverId != driverId) return;
    
    // Update driver's position
    if (driverMarker) {
      driverMarker.setPosition({ lat: d.lat, lng: d.lng });
    }
    
    // If we have a user marker, update the route
    if (userMarker) {
      drawRoute({ lat: d.lat, lng: d.lng }, userMarker.getPosition());
      
      // Update map view to include both markers
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: d.lat, lng: d.lng });
      bounds.extend(userMarker.getPosition());
      map.fitBounds(bounds);
    }
  });

  // start auto GPS sharing if permitted
  setupAutoLocation();
}

async function refreshAssigned() {
  const res = await fetch(`${API}/driver/requests`, { headers: { "Authorization": "Bearer " + token }});
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    const r = data[0];
    document.getElementById("status").innerText = `Assigned to ${r.locationName}`;
    ensureMarkers(r.driverLat, r.driverLng, r.locationLat, r.locationLng);
    drawRoute({ lat: r.driverLat, lng: r.driverLng }, { lat: r.locationLat, lng: r.locationLng });
    socket.emit("joinRequest", { requestId: r.id });
  } else {
    document.getElementById("status").innerText = "No assigned requests";
  }
}

function ensureMarkers(dlat, dlng, ulat, ulng) {
  // Create or update driver marker (red)
  if (!driverMarker) {
    driverMarker = new google.maps.Marker({
      position: { lat: dlat, lng: dlng },
      map: map,
      icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      title: 'Your Location'
    });
  } else {
    driverMarker.setPosition({ lat: dlat, lng: dlng });
  }
  
  // Create or update user marker (blue)
  if (!userMarker) {
    userMarker = new google.maps.Marker({
      position: { lat: ulat, lng: ulng },
      map: map,
      icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      title: 'User Location'
    });
  } else {
    userMarker.setPosition({ lat: ulat, lng: ulng });
  }
  
  // Fit map to show both markers
  const bounds = new google.maps.LatLngBounds();
  bounds.extend(driverMarker.getPosition());
  bounds.extend(userMarker.getPosition());
  map.fitBounds(bounds);
  
  // Add padding to the bounds
  const padding = 0.02; // degrees of padding
  map.panToBounds(bounds, {
    top: padding * 100, right: padding * 100,
    bottom: padding * 100, left: padding * 100
  });
}

function drawRoute(origin, destination) {
  directionsService.route({ origin, destination, travelMode: google.maps.TravelMode.DRIVING }, (res, st) => {
    if (st === "OK") directionsRenderer.setDirections(res);
  });
}

function setupAutoLocation() {
  if (!navigator.geolocation) { document.getElementById("status").innerText = "Geolocation not supported"; return; }
  const opts = { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 };
  watchId = navigator.geolocation.watchPosition(async (pos) => {
    const lat = pos.coords.latitude, lng = pos.coords.longitude;
    socket.emit("driverLocation", { token, lat, lng });
    try {
      await fetch(`${API}/driver/update-location`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ lat, lng })
      });
    } catch {}
    if (!driverMarker) driverMarker = new google.maps.Marker({ map, icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" });
    driverMarker.setPosition({ lat, lng });
    if (userMarker) drawRoute({ lat, lng }, userMarker.getPosition());
  }, (err) => {
    document.getElementById("status").innerText = "GPS error: " + err.message;
  }, opts);
}

document.getElementById("logoutBtn").addEventListener("click", ()=>{ 
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  localStorage.clear(); 
  location.href = "/index.html";
});

window.onload = init;