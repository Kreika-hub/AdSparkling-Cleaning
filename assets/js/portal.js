/* ============================================
   CLIENT PORTAL LOGIC — Ad Sparkling Cleaning
   Gestión de citas del cliente, calificaciones y fotos
   ============================================ */

let currentClient = null;
let selectedRating = 5;
let uploadedPhotos = [];

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Revisar si viene teléfono en la URL (ej. portal.html?phone=3055550192)
  const urlParams = new URLSearchParams(window.location.search);
  const phoneParam = urlParams.get('phone');
  const storedPhone = localStorage.getItem('adsparkling_client_phone');

  const phoneToUse = phoneParam || storedPhone;

  if (phoneToUse) {
    loginWithPhone(phoneToUse);
  } else {
    showPhoneLogin();
  }

  // Configurar estrellas interactivas
  setupStarRating();
});

// ============================================
// AUTENTICACIÓN POR TELÉFONO
// ============================================
function showPhoneLogin() {
  document.getElementById('portalLoginView').style.display = 'block';
  document.getElementById('portalMainView').style.display = 'none';
}

function handleClientLogin(e) {
  e.preventDefault();
  const phoneInput = document.getElementById('clientPhoneInput').value.trim();
  const clean = phoneInput.replace(/[^0-9]/g, '');
  if (clean.length < 7) {
    alert('Por favor ingresa un número de teléfono válido.');
    return;
  }
  loginWithPhone(clean);
}

function loginWithPhone(phone) {
  const cleanPhone = String(phone).replace(/[^0-9]/g, '');
  const rawClients = localStorage.getItem('adsparkling_clients');
  const clients = rawClients ? JSON.parse(rawClients) : [];

  // Buscar cliente por teléfono
  let client = clients.find(c => String(c.phone).replace(/[^0-9]/g, '') === cleanPhone);

  // Si no se encuentra exactamente, permitir buscar por coincidencia parcial o crear invitado
  if (!client && clients.length > 0) {
    client = clients.find(c => String(c.phone).includes(cleanPhone) || cleanPhone.includes(String(c.phone)));
  }

  // Fallback demo si entra con un número nuevo
  if (!client) {
    client = {
      id: 'c-temp-' + cleanPhone,
      name: 'Estimado/a Cliente',
      phone: cleanPhone,
      address: 'Miami-Dade & Broward, FL',
      frequency: '15',
      base_price: 195,
      last_visit: new Date().toISOString().split('T')[0],
      next_visit: null,
      status: 'activo'
    };
  }

  currentClient = client;
  localStorage.setItem('adsparkling_client_phone', cleanPhone);

  renderClientPortal(client);
}

function handleClientLogout() {
  localStorage.removeItem('adsparkling_client_phone');
  window.location.href = 'portal.html';
}

// ============================================
// RENDERIZAR DATOS DEL CLIENTE
// ============================================
function renderClientPortal(client) {
  document.getElementById('portalLoginView').style.display = 'none';
  document.getElementById('portalMainView').style.display = 'block';

  // Saludo y Nombre
  document.getElementById('clientNameHeader').textContent = client.name ? `¡Hola, ${client.name.split(' ')[0]}! ✨` : '¡Bienvenido/a! ✨';
  document.getElementById('clientAddressSub').textContent = client.address || 'Servicio de limpieza residencial';

  // Plan info
  document.getElementById('planFreq').textContent = freqLabel(client.frequency);
  document.getElementById('planPrice').textContent = client.base_price ? `$${client.base_price}` : 'Consultar';
  document.getElementById('planAddress').textContent = client.address || 'Miami-Dade';

  // Obtener citas del cliente
  const rawAppts = localStorage.getItem('adsparkling_appointments');
  const appts = rawAppts ? JSON.parse(rawAppts) : [];
  const clientAppts = appts.filter(a => a.client_id == client.id || (a.clients && a.clients.phone && String(a.clients.phone).replace(/[^0-9]/g, '') === String(client.phone).replace(/[^0-9]/g, '')));

  // Próxima visita
  const todayStr = new Date().toISOString().split('T')[0];
  const nextAppt = clientAppts.find(a => a.status === 'pendiente' && a.date >= todayStr) || 
    (client.next_visit ? { date: client.next_visit, time: '09:00 AM' } : null);

  const nextBox = document.getElementById('nextVisitDateBox');
  if (nextAppt) {
    nextBox.innerHTML = `
      <div class="visit-date-main">📅 ${formatDate(nextAppt.date)}</div>
      <div class="visit-time-detail">⏰ Hora estimada: <strong>${nextAppt.time || '09:00 AM'}</strong></div>
      <p style="font-size:12px; color:var(--text-sec); margin-top:6px;">Todo el equipo e insumos profesionales están listos para dejar tu hogar impecable.</p>
    `;
  } else {
    nextBox.innerHTML = `
      <div class="visit-date-main">Sin cita próxima fijada</div>
      <div class="visit-time-detail">¿Deseas agendar tu próxima visita? Escríbele a Anggie abajo.</div>
    `;
  }

  // Última visita
  document.getElementById('lastVisitDate').textContent = client.last_visit ? formatDate(client.last_visit) : 'Reciente';

  // Historial de visitas completadas
  const completedAppts = clientAppts.filter(a => a.status === 'completada').slice(0, 5);
  const historyList = document.getElementById('historyList');
  if (completedAppts.length === 0) {
    historyList.innerHTML = `<div class="history-item"><span class="history-item-date">${client.last_visit ? formatDate(client.last_visit) : 'Servicio reciente'}</span><span class="history-item-badge">Completado ✓</span></div>`;
  } else {
    historyList.innerHTML = completedAppts.map(a => `
      <div class="history-item">
        <div>
          <span class="history-item-date">📅 ${formatDate(a.date)}</span>
          ${a.addons && a.addons.length ? `<div style="font-size:11px; color:var(--text-muted);">Extras: ${a.addons.join(', ')}</div>` : ''}
        </div>
        <span class="history-item-badge">Completado ✓</span>
      </div>
    `).join('');
  }

  // Link de WhatsApp con mensaje personalizado
  const waBtn = document.getElementById('btnWaContact');
  const waMsg = encodeURIComponent(`¡Hola Anggie! Soy ${client.name} de ${client.address}. Te escribo desde mi portal de cliente sobre mis citas de limpieza ✨.`);
  waBtn.href = `https://wa.me/13050000000?text=${waMsg}`;
}

// ============================================
// SISTEMA DE ESTRELLAS Y RESEÑAS
// ============================================
function setupStarRating() {
  const starBtns = document.querySelectorAll('.star-btn');
  starBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.val) || 5;
      selectedRating = val;
      updateStarsUI(val);
    });
  });
}

function updateStarsUI(rating) {
  const starBtns = document.querySelectorAll('.star-btn');
  starBtns.forEach(btn => {
    const val = parseInt(btn.dataset.val);
    if (val <= rating) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Subida de fotos del trabajo
function handlePhotoSelect(e) {
  const files = e.target.files;
  if (!files || !files.length) return;

  const previewGrid = document.getElementById('photoPreviewGrid');
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      uploadedPhotos.push(dataUrl);

      const img = document.createElement('img');
      img.src = dataUrl;
      img.className = 'photo-preview-item';
      previewGrid.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
}

// Enviar reseña
function submitClientReview(e) {
  e.preventDefault();
  const comment = document.getElementById('reviewComment').value.trim();

  if (!comment && selectedRating === 5) {
    // Si no escribe nada, le ponemos un texto de agradecimiento por defecto
  }

  const review = {
    id: 'rev-' + Date.now(),
    client_id: currentClient ? currentClient.id : 'anon',
    client_name: currentClient ? currentClient.name : 'Cliente Satisfecho',
    client_address: currentClient ? currentClient.address : 'Miami-Dade, FL',
    rating: selectedRating,
    comment: comment || '¡Excelente trabajo y atención al detalle! Mi casa quedó reluciente.',
    photos: uploadedPhotos,
    status: 'pendiente', // 'pendiente', 'publicada', 'archivada'
    created_at: new Date().toISOString()
  };

  // Guardar en almacenamiento de reseñas
  const rawReviews = localStorage.getItem('adsparkling_reviews');
  const reviews = rawReviews ? JSON.parse(rawReviews) : [];
  reviews.unshift(review);
  localStorage.setItem('adsparkling_reviews', JSON.stringify(reviews));

  // Crear notificación para Anggie
  createAdminNotification({
    title: `⭐ Nueva reseña de ${review.client_name}`,
    message: `${review.rating} estrellas: "${truncate(review.comment, 40)}"`,
    type: 'review'
  });

  // Mostrar mensaje de éxito
  document.getElementById('reviewFormWrapper').style.display = 'none';
  document.getElementById('reviewSuccessBox').style.display = 'block';
}

function createAdminNotification(notif) {
  const raw = localStorage.getItem('adsparkling_notifications');
  const list = raw ? JSON.parse(raw) : [];
  list.unshift({
    id: 'notif-' + Date.now(),
    ...notif,
    read: false,
    created_at: new Date().toISOString()
  });
  localStorage.setItem('adsparkling_notifications', JSON.stringify(list));
}

// ============================================
// UTILIDADES
// ============================================
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('es-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function freqLabel(freq) {
  const labels = { '10': 'Cada 10 días', '15': 'Quincenal', '30': 'Mensual', 'deep': 'Profunda' };
  return labels[freq] || freq || 'Regular';
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '...' : str;
}
