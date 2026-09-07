/* ============================================
   LANDING APP — Ad Sparkling Cleaning v2
   Carga config dinámica, maneja solicitudes
   ============================================ */

// ============================================
// CONFIGURACIÓN COMPARTIDA (sync con admin)
// ============================================
function getConfig() {
  const cfg = localStorage.getItem('asc_config');
  if (cfg) return JSON.parse(cfg);
  // Config por defecto
  return {
    companyName: 'Ad Sparkling Cleaning LLC',
    phone: '13050000000',
    address: 'Miami-Dade & Broward, FL',
    extras: [
      { id: 'oven', name: 'Horno por dentro', price: 40, active: true },
      { id: 'fridge', name: 'Nevera por dentro', price: 50, active: true },
      { id: 'blinds', name: 'Persianas', price: 10, active: true, perUnit: true },
      { id: 'cabinets', name: 'Gabinetes + ventanas interior', price: 50, active: true },
      { id: 'distance', name: 'Recargo por distancia', price: 50, active: true },
      { id: 'overdue', name: 'Recargo +30 días sin limpiar', price: 30, active: true }
    ],
    notIncluded: [
      { id: 'laundry', name: 'Laundry', active: true },
      { id: 'dishes', name: 'Lavar platos', active: true },
      { id: 'patio', name: 'Patio exterior', active: true },
      { id: 'oven_extra', name: 'Horno (servicio extra)', active: false },
      { id: 'fridge_extra', name: 'Nevera (servicio extra)', active: false },
      { id: 'pets', name: 'Excremento de mascotas', active: true }
    ],
    gallery: []
  };
}

function getLeads() {
  const data = localStorage.getItem('asc_leads');
  return data ? JSON.parse(data) : [];
}

function saveLeads(leads) {
  localStorage.setItem('asc_leads', JSON.stringify(leads));
}

// ============================================
// UI DINÁMICA
// ============================================
function renderExtras() {
  const cfg = getConfig();
  const container = document.getElementById('extrasBubbles');
  const requestContainer = document.getElementById('requestExtras');

  if (container) {
    const active = cfg.extras.filter(e => e.active);
    container.innerHTML = active.map(e => 
      `<span class="extra-bubble">${e.name}${e.perUnit ? ' (c/u)' : ''}</span>`
    ).join('');
  }

  if (requestContainer) {
    const active = cfg.extras.filter(e => e.active);
    requestContainer.innerHTML = active.map(e => `
      <label class="request-extra-item">
        <input type="checkbox" value="${e.id}" data-name="${e.name}">
        <span>${e.name}${e.perUnit ? ' (c/u)' : ''}</span>
      </label>
    `).join('');
  }
}

function renderNotIncluded() {
  const cfg = getConfig();
  const container = document.getElementById('notIncludedTags');
  if (!container) return;

  const active = cfg.notIncluded.filter(n => n.active);
  container.innerHTML = active.map(n => 
    `<span class="not-tag">${n.name}</span>`
  ).join('');
}

function renderGallery() {
  const cfg = getConfig();
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  if (!cfg.gallery || cfg.gallery.length === 0) {
    grid.innerHTML = `
      <div class="gallery-placeholder">
        <div class="ph-icon">📸</div>
        <p>Próximamente: fotos de nuestros trabajos</p>
        <small>Anggie está actualizando su galería</small>
      </div>`;
    return;
  }

  grid.innerHTML = cfg.gallery.map(url => `
    <div class="gallery-item"><img src="${url}" alt="Trabajo de limpieza" loading="lazy"></div>
  `).join('');
}

// ============================================
// FORMULARIO DE SOLICITUD
// ============================================
function handleRequest(e) {
  e.preventDefault();

  const name = document.getElementById('reqName').value.trim();
  const phone = document.getElementById('reqPhone').value.trim();
  const address = document.getElementById('reqAddress').value.trim();
  const size = document.getElementById('reqSize').value;
  const freq = document.getElementById('reqFreq').value;
  const notes = document.getElementById('reqNotes').value.trim();

  // Recoger adicionales seleccionados
  const extras = [];
  document.querySelectorAll('#requestExtras input:checked').forEach(el => {
    extras.push({ id: el.value, name: el.dataset.name });
  });

  const lead = {
    id: 'lead_' + Date.now(),
    name,
    phone,
    address,
    size_sqft: size ? parseInt(size) : null,
    frequency: freq || null,
    extras_requested: extras,
    notes,
    status: 'nuevo',
    assigned_price: null,
    angie_notes: '',
    whatsapp_sent: false,
    created_at: new Date().toISOString()
  };

  const leads = getLeads();
  leads.unshift(lead);
  saveLeads(leads);

  // Mostrar éxito
  document.getElementById('requestForm').style.display = 'none';
  document.getElementById('requestSuccess').style.display = 'block';

  // Notificar al admin (si está abierto en otra pestaña)
  try {
    localStorage.setItem('asc_notify_new_lead', Date.now().toString());
  } catch(e) {}
}

// ============================================
// UTILIDADES
// ============================================
function toggleMenu() {
  const nav = document.getElementById('navLinks');
  nav.classList.toggle('open');
}

// Navbar scroll
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 50) {
    nav.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
  } else {
    nav.style.boxShadow = 'none';
  }
});

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  renderExtras();
  renderNotIncluded();
  renderGallery();
});
