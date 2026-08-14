maptilersdk.config.apiKey = mapToken;

const map = new maptilersdk.Map({
    container: 'map',
    style: maptilersdk.MapStyle.STREETS,
    center: [74.1850, 17.2853], // Default center
    zoom: 9
});

// Add hub locations (Blue)
hubs.forEach(hub => {
    new maptilersdk.Marker({ color: "blue" })
        .setLngLat(hub.coords)
        .setPopup(new maptilersdk.Popup().setText(hub.name))
        .addTo(map);
});

// Add customer locations (Red)
customerLocations.forEach(customer => {
    new maptilersdk.Marker({ color: "red" })
        .setLngLat(customer.coords)
        .setPopup(new maptilersdk.Popup().setText(customer.name))
        .addTo(map);
});

// Find routes for each customer to the nearest hub
async function fetchRoutes() {
    for (let customer of customerLocations) {
        let nearestHub = getNearestHub(customer.coords, hubs);
        let routeUrl = `https://api.maptiler.com/routes/directions/driving/${customer.coords.join(',')};${nearestHub.coords.join(',')}?key=${mapToken}&geometries=geojson`;

        try {
            const response = await fetch(routeUrl);
            const routeData = await response.json();

            if (routeData.routes && routeData.routes.length > 0) {
                const route = routeData.routes[0].geometry;

                map.addSource(`route-${customer.name}`, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: route
                    }
                });

                map.addLayer({
                    id: `route-layer-${customer.name}`,
                    type: 'line',
                    source: `route-${customer.name}`,
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-width': 4,
                        'line-color': '#007bff',
                        'line-opacity': 0.8
                    }
                });
            }
        } catch (error) {
            console.error(`Error fetching route for ${customer.name}:`, error);
        }
    }
}

// Find nearest hub function
function getNearestHub(customerCoords, hubs) {
    let nearestHub = null;
    let minDistance = Infinity;

    hubs.forEach(hub => {
        const distance = Math.sqrt(
            Math.pow(customerCoords[0] - hub.coords[0], 2) +
            Math.pow(customerCoords[1] - hub.coords[1], 2)
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearestHub = hub;
        }
    });

    return nearestHub;
}

// Fetch routes after map loads
map.on('load', fetchRoutes);
