// Variabile globale pentru harta
let map;
let markers = [];
let pins = [];
let selectedIcon = '🎄';
let clickedLocation = null;
let selectedPin = null;
let isConnected = false;

function initMap() {
    map = L.map('map').setView([44.545593, 25.931531], 17);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    L.DomEvent.on(map.getContainer(), 'touchstart', L.DomEvent.stopPropagation);
    
    map.on('click', (e) => {
        clickedLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
        
        if (window.tempMarker) {
            window.tempMarker.remove();
        }
        
        window.tempMarker = L.marker([e.latlng.lat, e.latlng.lng], {
            icon: L.divIcon({
                html: '<div style="font-size: 48px; animation: pulse 1s infinite; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));">📍</div>',
                className: 'temp-marker',
                iconSize: [48, 48],
                iconAnchor: [24, 48]
            })
        }).addTo(map);
        
        if (!document.getElementById('add-modal').classList.contains('hidden')) {
            document.getElementById('location-success').classList.remove('hidden');
        }
    });
    
    setTimeout(() => {
        map.invalidateSize();
        document.getElementById('loading').classList.add('hidden');
    }, 300);
    
    window.addEventListener('resize', () => {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    });
}

function centerMap() {
    if (clickedLocation) {
        map.setView([clickedLocation.lat, clickedLocation.lng], 17);
    } else {
        map.setView([44.545593, 25.931531], 17);
    }
}

function updateMap() {
    markers.forEach(marker => marker.remove());
    markers = [];
    
    pins.forEach(pin => {
        const icon = pin.icon || '🎄';
        const marker = L.marker([pin.lat, pin.lng], {
            icon: L.divIcon({
                html: `<div style="font-size: 42px; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4)); transform: translateY(-5px);">${icon}</div>`,
                className: 'custom-marker',
                iconSize: [42, 42],
                iconAnchor: [21, 42]
            })
        }).addTo(map);
        
        const tooltipText = `<strong>${pin.name}</strong><br>Str. ${pin.address}, Nr. ${pin.streetNumber}`;
        marker.bindTooltip(tooltipText, {
            direction: 'top',
            offset: [0, -40],
            opacity: 0.95
        });
        
        marker.on('click', () => showPin(pin));
        markers.push(marker);
    });
}
