// map.js — shared helper functions for initializing maps if needed

function createMap(elementId, center = { lat: 28.6139, lng: 77.2090 }, zoom = 12) {
  return new google.maps.Map(document.getElementById(elementId), { center, zoom });
}

function addMarker(map, position, title, icon = null) {
  return new google.maps.Marker({
    position,
    map,
    title,
    icon,
  });
}// map.js — shared helper functions for initializing maps if needed

function createMap(elementId, center = { lat: 28.6139, lng: 77.2090 }, zoom = 12) {
  return new google.maps.Map(document.getElementById(elementId), { center, zoom });
}

function addMarker(map, position, title, icon = null) {
  return new google.maps.Marker({
    position,
    map,
    title,
    icon,
  });
}