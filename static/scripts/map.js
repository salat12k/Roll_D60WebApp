var map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -5
});
var bounds = [[0, 0], [1536, 2048]];
var image = L.imageOverlay('/static/map.jpg', bounds).addTo(map);

map.fitBounds(bounds);

var icons = {
    'Miasto': L.icon({
        iconUrl: '/static/town.png',
        iconSize: [30, 49.2],
        iconAnchor: [15, 49.2],
        popupAnchor: [1, -34],
        className: 'icon-shadow'
    }),
    'Ważne Miejsce': L.icon({
        iconUrl: '/static/wazne.png',
        iconSize: [30, 49.2],
        iconAnchor: [15, 49.2],
        popupAnchor: [1, -34],
        className: 'icon-shadow'
    }),
    'Stolica': L.icon({
        iconUrl: '/static/stolica.png',
        iconSize: [30, 49.2],
        iconAnchor: [15, 49.2],
        popupAnchor: [1, -34],
        className: 'icon-shadow'
    }),
    'Miejsce odpoczynku': L.icon({
        iconUrl: '/static/ognisko.gif',
        iconSize: [30, 49.2],
        iconAnchor: [15, 49.2],
        popupAnchor: [1, -34],
        className: 'icon-shadow'
    }),
    'Fort': L.icon({
        iconUrl: '/static/Fort.png',
        iconSize: [30, 49.2],
        iconAnchor: [15, 49.2],
        popupAnchor: [1, -34],
        className: 'icon-shadow'
    })
};

var currentLatLng = null;
var currentMarker = null;
var currentLabelMarker = null;
var dropdownMenu = document.getElementById("dropdown-menu");

map.on('contextmenu', function(e) {
    e.originalEvent.preventDefault();
    currentLatLng = e.latlng;
    dropdownMenu.style.display = "block";
    dropdownMenu.style.left = e.originalEvent.pageX + "px";
    dropdownMenu.style.top = e.originalEvent.pageY + "px";
});

dropdownMenu.onclick = function(event) {
    var target = event.target.closest("li");
    if (!target) return;

    var category = target.getAttribute("data-category");
    if (category && icons[category]) {
        var marker = L.marker(currentLatLng, {icon: icons[category]}).addTo(map);
        var label = L.divIcon({
            className: 'marker-label',
            html: category,
            iconAnchor: [15, -5]
        });
        var labelMarker = L.marker(currentLatLng, {icon: label}).addTo(map);
        var popupContent = '<b>' + category + '</b><br>' + 
            '<button onclick="removeMarker(' + marker._leaflet_id + ', ' + labelMarker._leaflet_id + ', ' + currentLatLng.lat + ', ' + currentLatLng.lng + ')">Usuń</button>' + 
            '<button onclick="editMarkerDescription(' + marker._leaflet_id + ', ' + currentLatLng.lat + ', ' + currentLatLng.lng + ', \'' + category + '\', \'\')">Edytuj</button>';
        marker.bindPopup(popupContent);

        fetch('/add_marker', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                lat: currentLatLng.lat,
                lng: currentLatLng.lng,
                category: category,
                description: ''
            })
        }).then(response => response.json())
          .then(data => {
              console.log("Marker added to database:", data);
              marker._markerId = data.id;
              labelMarker._markerId = data.id;
          });
    } else {
        console.log("Invalid category or icon not found.");
    }
    dropdownMenu.style.display = "none";
};

function removeMarker(markerId, labelMarkerId, lat, lng) {
    var marker = map._layers[markerId];
    var labelMarker = map._layers[labelMarkerId];
    if (marker) {
        map.removeLayer(marker);
    }
    if (labelMarker) {
        map.removeLayer(labelMarker);
    }
    fetch('/remove_marker', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            lat: lat,
            lng: lng
        })
    }).then(response => response.json())
      .then(data => {
          console.log("Marker removed from database:", data);
      });
}

function editMarkerDescription(markerId, lat, lng, category, description) {
    var editPopup = L.popup()
        .setLatLng([lat, lng])
        .setContent('<textarea id="edit-description-textarea">' + (description || '') + '</textarea><br><button onclick="saveDescription(' + markerId + ', \'' + category + '\')">Save</button>')
        .openOn(map);
    document.getElementById('edit-description-textarea').focus();
}

function saveDescription(markerId, category) {
    var newDescription = document.getElementById('edit-description-textarea').value;
    fetch('/update_marker_description', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: map._layers[markerId]._markerId,
            description: newDescription || ''
        })
    }).then(response => response.json())
      .then(data => {
          console.log("Marker description updated in database:", data);
          var marker = map._layers[markerId];
          marker.unbindPopup();
          marker.bindPopup('<b>' + category + '</b><br>' + newDescription +
          '<br><button onclick="removeMarker(' + markerId + ', ' + markerId + ', ' + marker.getLatLng().lat + ', ' + marker.getLatLng().lng + ')">Usuń</button>' +
          '<button onclick="editMarkerDescription(' + markerId + ', ' + marker.getLatLng().lat + ', ' + marker.getLatLng().lng + ', \'' + category + '\', \'' + newDescription + '\')">Edytuj</button>');
          marker.openPopup();
          map.closePopup();
      });
}

window.onclick = function(event) {
    if (!event.target.closest("#dropdown-menu")) {
        dropdownMenu.style.display = "none";
    }
}

document.addEventListener('DOMContentLoaded', function() {
    fetch('/get_markers')
        .then(response => response.json())
        .then(data => {
            data.forEach(marker => {
                var latlng = L.latLng(marker.lat, marker.lng);
                var mapMarker = L.marker(latlng, {icon: icons[marker.category]}).addTo(map);
                var label = L.divIcon({
                    className: 'marker-label',
                    html: marker.category,
                    iconAnchor: [15, -5]
                });
                var labelMarker = L.marker(latlng, {icon: label}).addTo(map);
                var popupContent = '<b>' + marker.category + '</b><br>' + (marker.description || '') +
                    '<br><button onclick="removeMarker(' + mapMarker._leaflet_id + ', ' + labelMarker._leaflet_id + ', ' + marker.lat + ', ' + marker.lng + ')">Usuń</button>' +
                    '<button onclick="editMarkerDescription(' + mapMarker._leaflet_id + ', ' + marker.lat + ', ' + marker.lng + ', \'' + marker.category + '\', \'' + (marker.description || '') + '\')">Edytuj</button>';
                mapMarker.bindPopup(popupContent);
                mapMarker._markerId = marker.id;
                labelMarker._markerId = marker.id;
            });
        });

    fetch('/get_fog')
        .then(response => response.json())
        .then(data => {
            data.forEach(fog => {
                var fogBounds = [[fog.lat1, fog.lng1], [fog.lat2, fog.lng2]];
                var fogImage = L.imageOverlay('/static/cloud.png', fogBounds, {
                    interactive: true
                }).addTo(fogLayerGroup);

                fogImage.currentScale = fog.scale;
                fogImage._fogId = fog.id;

                fogImage.on('mousedown', function(e) {
                    map.dragging.disable();
                    map.on('mousemove', moveFogImage);
                    map.on('mouseup', function() {
                        map.dragging.enable();
                        map.off('mousemove', moveFogImage);
                        saveFogOfWar(fogImage, false, fogImage._fogId);
                    });
                });

                function moveFogImage(e) {
                    var newLatLng = map.mouseEventToLatLng(e.originalEvent);
                    var offset = [(fogBounds[1][0] - fogBounds[0][0]) / 2 * fogImage.currentScale, (fogBounds[1][1] - fogBounds[0][1]) / 2 * fogImage.currentScale];
                    fogImage.setBounds([
                        [newLatLng.lat - offset[0], newLatLng.lng - offset[1]],
                        [newLatLng.lat + offset[0], newLatLng.lng + offset[1]]
                    ]);
                }

                fogImage.on('click', function() {
                    if (deleteMode) {
                        fogLayerGroup.removeLayer(fogImage);
                        saveFogOfWar(fogImage, true, fogImage._fogId);
                    } else {
                        currentFogImage = fogImage;
                        document.querySelectorAll('.scale-buttons').forEach(btn => btn.style.display = 'inline-block');
                    }
                });
            });
        });
});

var fogLayerGroup = L.layerGroup().addTo(map);
var deleteMode = false;
var currentFogImage = null;
var addingFog = false;

document.getElementById('fog-of-war-button').onclick = function() {
    addingFog = !addingFog;
    this.style.borderColor = addingFog ? 'red' : '';
    if (addingFog) {
        map.on('click', placeFog);
        deactivateDeleteMode();
    } else {
        map.off('click', placeFog);
    }
};

function placeFog(e) {
    if (!addingFog) return;
    var fogLatLng = e.latlng;
    var fogBounds = [
        [fogLatLng.lat - 100, fogLatLng.lng - 100],
        [fogLatLng.lat + 100, fogLatLng.lng + 100]
    ];
    var fogImage = L.imageOverlay('/static/cloud.png', fogBounds, {
        interactive: true
    }).addTo(fogLayerGroup);

    fogImage.currentScale = 1.0;

    fogImage.on('mousedown', function(e) {
        map.dragging.disable();
        map.on('mousemove', moveFogImage);
        map.on('mouseup', function() {
            map.dragging.enable();
            map.off('mousemove', moveFogImage);
            saveFogOfWar(fogImage, false, fogImage._fogId);
        });
    });

    function moveFogImage(e) {
        var newLatLng = map.mouseEventToLatLng(e.originalEvent);
        var offset = [(fogBounds[1][0] - fogBounds[0][0]) / 2 * fogImage.currentScale, (fogBounds[1][1] - fogBounds[0][1]) / 2 * fogImage.currentScale];
        fogImage.setBounds([
            [newLatLng.lat - offset[0], newLatLng.lng - offset[1]],
            [newLatLng.lat + offset[0], newLatLng.lng + offset[1]]
        ]);
    }

    fogImage.on('click', function() {
        if (deleteMode) {
            fogLayerGroup.removeLayer(fogImage);
            saveFogOfWar(fogImage, true, fogImage._fogId);
        } else {
            currentFogImage = fogImage;
            document.querySelectorAll('.scale-buttons').forEach(btn => btn.style.display = 'inline-block');
        }
    });

    saveFogOfWar(fogImage);
    addingFog = false;
    document.getElementById('fog-of-war-button').style.borderColor = '';
    map.off('click', placeFog);
}

document.getElementById('delete-fog-button').onclick = function() {
    deleteMode = !deleteMode;
    this.classList.toggle('active', deleteMode);
    this.style.borderColor = deleteMode ? 'blue' : '';
    if (deleteMode) {
        deactivateAddFogMode();
    }
};

document.getElementById('scale-down').onclick = function() {
    if (currentFogImage) {
        var scaleFactor = Math.max(currentFogImage.currentScale - 0.1, 0.5);
        scaleFogImage(currentFogImage, scaleFactor);
    }
};

document.getElementById('scale-up').onclick = function() {
    if (currentFogImage) {
        var scaleFactor = Math.min(currentFogImage.currentScale + 0.1, 3.0);
        scaleFogImage(currentFogImage, scaleFactor);
    }
};

function scaleFogImage(fogImage, scaleFactor) {
    var bounds = fogImage.getBounds();
    var center = bounds.getCenter();
    var latDiff = (bounds.getNorth() - center.lat) / fogImage.currentScale * scaleFactor;
    var lngDiff = (bounds.getEast() - center.lng) / fogImage.currentScale * scaleFactor;
    fogImage.setBounds([
        [center.lat - latDiff, center.lng - lngDiff],
        [center.lat + latDiff, center.lng + lngDiff]
    ]);
    fogImage.currentScale = scaleFactor;
    saveFogOfWar(fogImage, false, fogImage._fogId);
}

function saveFogOfWar(fogImage, deleteFlag = false, fogId = null) {
    var bounds = fogImage.getBounds();
    var bodyData = {
        lat1: bounds.getSouth(),
        lng1: bounds.getWest(),
        lat2: bounds.getNorth(),
        lng2: bounds.getEast(),
        scale: fogImage.currentScale,
        delete: deleteFlag
    };
    if (fogId !== null) {
        bodyData.id = fogId;
    }
    fetch('/add_fog', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
    }).then(response => response.json())
      .then(data => {
          console.log("Fog of war saved:", data);
          if (!fogId && !deleteFlag) {
              fogImage._fogId = data.id;
          }
          if (deleteFlag) {
              document.querySelectorAll('.scale-buttons').forEach(btn => btn.style.display = 'none');
              currentFogImage = null;
          }
      });
}

function deactivateAddFogMode() {
    addingFog = false;
    document.getElementById('fog-of-war-button').style.borderColor = '';
    map.off('click', placeFog);
}

function deactivateDeleteMode() {
    deleteMode = false;
    document.getElementById('delete-fog-button').style.borderColor = '';
    document.getElementById('delete-fog-button').classList.remove('active');
}

document.getElementById('tech-fog-remove').onclick = function() {
    fetch('/delete_all_fog', {
        method: 'POST'
    }).then(response => response.json())
      .then(data => {
          console.log("All fog data deleted:", data);
          fogLayerGroup.clearLayers();
      });
};
