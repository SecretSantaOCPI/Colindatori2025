// Funcții principale ale aplicației
document.addEventListener('DOMContentLoaded', init);

function init() {
    initFirebase();
    initMap();
    initIconGrid();
    setupEventListeners();
    checkScreenSize();
    
    window.addEventListener('resize', checkScreenSize);
}

function checkScreenSize() {
    const addBtnPc = document.getElementById('add-btn-pc');
    if (window.innerWidth >= 768) {
        addBtnPc.classList.remove('hidden');
    } else {
        addBtnPc.classList.add('hidden');
    }
}

function setupEventListeners() {
    document.getElementById('add-btn-pc').addEventListener('click', openAddModal);
    document.getElementById('add-btn-mobile').addEventListener('click', openAddModal);
    document.getElementById('location-btn-mobile').addEventListener('click', centerMap);
    document.getElementById('modal-overlay').addEventListener('click', closeAllModals);
}

function initFirebase() {
    try {
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();
        
        const connectedRef = database.ref(".info/connected");
        connectedRef.on("value", function(snap) {
            isConnected = snap.val() === true;
            updateConnectionStatus();
        });
        
        loadPins();
    } catch (error) {
        console.error("Eroare la inițializarea Firebase:", error);
        showToast("Eroare de conexiune cu baza de date", "error");
    }
}

function updateConnectionStatus() {
    const statusElement = document.getElementById('connection-status');
    const statusIcon = statusElement.querySelector('.status-icon');
    const statusText = statusElement.querySelector('.status-text');
    
    if (isConnected) {
        statusElement.className = 'connection-status connected';
        statusIcon.textContent = '✓';
        statusText.textContent = 'Conectat';
    } else {
        statusElement.className = 'connection-status disconnected';
        statusIcon.textContent = '⚠️';
        statusText.textContent = 'Deconectat';
    }
    
    statusElement.classList.remove('hidden');
}

function initIconGrid() {
    const grid = document.getElementById('icon-grid');
    grid.innerHTML = '';
    ICONS.forEach(icon => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'icon-btn';
        btn.textContent = icon;
        btn.onclick = () => selectIcon(icon);
        if (icon === selectedIcon) btn.classList.add('selected');
        grid.appendChild(btn);
    });
}

function selectIcon(icon) {
    selectedIcon = icon;
    document.querySelectorAll('.icon-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent === icon);
    });
}

function loadPins() {
    try {
        const database = firebase.database();
        database.ref('pins').on('value', (snapshot) => {
            pins = [];
            snapshot.forEach((child) => {
                pins.push({ id: child.key, ...child.val() });
            });
            updateMap();
            updatePinCount();
        }, (error) => {
            console.error("Eroare la încărcarea pin-urilor:", error);
            showToast("Eroare la încărcarea datelor", "error");
        });
    } catch (error) {
        console.error("Eroare la încărcarea pin-urilor:", error);
        showToast("Eroare la încărcarea datelor", "error");
    }
}

function updatePinCount() {
    const count = pins.length;
    const text = count === 1 ? 'casă' : 'case';
    document.getElementById('pin-count-text').textContent = `${count} ${text}`;
}

function showError(message) {
    document.getElementById('error-text').textContent = message;
    document.getElementById('error-message').classList.remove('hidden');
}

function closeError() {
    document.getElementById('error-message').classList.add('hidden');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function openAddModal() {
    if (!clickedLocation) {
        showToast('⚠️ Mai întâi dă click pe hartă unde vrei să adaugi casa!', 'error');
        return;
    }
    showModal('add-modal');
    document.getElementById('location-success').classList.remove('hidden');
}

function closeAddModal() {
    hideModal('add-modal');
    document.getElementById('add-form').reset();
    document.getElementById('error-message').classList.add('hidden');
    clickedLocation = null;
    selectedIcon = '🎄';
    initIconGrid();
    
    if (window.tempMarker) {
        window.tempMarker.remove();
        window.tempMarker = null;
    }
}

function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    document.getElementById('modal-overlay').classList.add('hidden');
    document.body.style.overflow = '';
}

function closeAllModals() {
    hideModal('add-modal');
    hideModal('view-modal');
}

function handleSubmit(e) {
    e.preventDefault();
    
    closeError();
    
    const name = document.getElementById('name').value.trim();
    const address = document.getElementById('address').value.trim();
    const streetNumber = document.getElementById('streetNumber').value.trim();
    
    const missingFields = [];
    if (!name) missingFields.push('Nume Familie');
    if (!address) missingFields.push('Denumire Stradă');
    if (!streetNumber) missingFields.push('Număr Poștal');
    
    if (missingFields.length > 0) {
        showError('Te rog completează următoarele câmpuri obligatorii:\n\n• ' + missingFields.join('\n• '));
        return;
    }
    
    if (!clickedLocation) {
        showError('Te rog selectează o locație pe hartă!');
        return;
    }
    
    if (!isConnected) {
        showError('Nu ești conectat la internet. Te rog verifică conexiunea și încearcă din nou.');
        return;
    }
    
    const pinData = {
        name,
        address,
        streetNumber,
        schedule: document.getElementById('schedule').value,
        notes: document.getElementById('notes').value,
        icon: selectedIcon,
        password: document.getElementById('password').value,
        lat: clickedLocation.lat,
        lng: clickedLocation.lng,
        timestamp: new Date().toISOString()
    };
    
    try {
        const database = firebase.database();
        database.ref('pins').push(pinData)
            .then(() => {
                closeAddModal();
                
                if (window.tempMarker) {
                    window.tempMarker.remove();
                    window.tempMarker = null;
                }
                
                showToast('✅ Casă adăugată cu succes!');
            })
            .catch((error) => {
                console.error('Save error:', error);
                showError('Eroare la salvare: ' + error.message);
            });
    } catch (error) {
        console.error('Save error:', error);
        showError('Eroare la salvare: ' + error.message);
    }
}

function showPin(pin) {
    selectedPin = pin;
    const addressText = `Str. ${pin.address}, Nr. ${pin.streetNumber}`;
    
    let html = `
        <div class="modal-header">
            <div>
                <h3 class="modal-title">${pin.name}</h3>
                <p class="pin-detail">
                    <span>🏠</span>
                    ${addressText}
                </p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="icon-delete" onclick="showDeleteForm()">🗑️</button>
                <button class="close-btn" onclick="closeViewModal()">×</button>
            </div>
        </div>
    `;
    
    if (pin.schedule) {
        html += `<p class="pin-detail"><span>🕐</span><span style="font-weight: 500;">${pin.schedule}</span></p>`;
    }
    
    if (pin.notes) {
        html += `<div class="divider"><p style="font-size: 0.875rem; color: #6b7280;">${pin.notes}</p></div>`;
    }
    
    document.getElementById('view-content').innerHTML = html;
    showModal('view-modal');
    document.getElementById('delete-form').classList.add('hidden');
}

function closeViewModal() {
    hideModal('view-modal');
    selectedPin = null;
    document.getElementById('view-content').style.display = 'block';
    document.getElementById('delete-form').classList.add('hidden');
}

function showDeleteForm() {
    document.getElementById('view-content').style.display = 'none';
    document.getElementById('delete-form').classList.remove('hidden');
}

function closeDeleteForm() {
    document.getElementById('view-content').style.display = 'block';
    document.getElementById('delete-form').classList.add('hidden');
    document.getElementById('delete-password').value = '';
}

function confirmDelete() {
    if (!selectedPin) return;
    
    const password = document.getElementById('delete-password').value;
    
    if (!password) {
        showToast('Te rog introdu parola!', 'error');
        return;
    }
    
    const isAdmin = password === ADMIN_PASSWORD;
    const isOwner = selectedPin.password && password === selectedPin.password;
    
    if (!isAdmin && !isOwner) {
        showToast('❌ Parolă incorectă!', 'error');
        document.getElementById('delete-password').value = '';
        return;
    }
    
    try {
        const database = firebase.database();
        database.ref('pins/' + selectedPin.id).remove()
            .then(() => {
                closeViewModal();
                showToast('✅ Pin șters cu succes!');
            })
            .catch((error) => {
                console.error('Delete error:', error);
                showToast('Eroare la ștergere: ' + error.message, 'error');
            });
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Eroare la ștergere: ' + error.message, 'error');
    }
}
