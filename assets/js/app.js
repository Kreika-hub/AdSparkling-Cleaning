/* ============================================
   LANDING APP — Ad Sparkling Cleaning
   Sincronización con Admin, Formulario de Cotización,
   Animaciones y PWA
   ============================================ */

// Sincronización de Leads con la Nube y Respaldo Local
async function saveLeadFromLanding(lead) {
  try {
    // 1. Guardar en la nube (Vercel Serverless Function)
    await fetch('/api/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    });
  } catch (e) {
    console.error('Error enviando lead a la nube:', e);
  }

  try {
    // 2. Respaldo local visual
    const key = 'adsparkling_leads';
    const raw = localStorage.getItem(key);
    const leads = raw ? JSON.parse(raw) : [];
    leads.unshift(lead);
    localStorage.setItem(key, JSON.stringify(leads));
    localStorage.setItem('asc_leads', JSON.stringify(leads));
    localStorage.setItem('adsparkling_notify_lead', Date.now().toString());
  } catch (e) {
    console.error('Error guardando lead en localStorage:', e);
  }
}

// ============================================
// CONFIGURACIÓN DINÁMICA
// ============================================
function getConfig() {
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
      { id: 'pets', name: 'Excremento de mascotas', active: true }
    ]
  };
}

function renderExtras() {
  const cfg = getConfig();
  const container = document.getElementById('extrasBubbles');
  const requestContainer = document.getElementById('requestExtras');

  if (container) {
    const active = cfg.extras.filter(e => e.active);
    container.innerHTML = active.length ? active.map(e => 
      `<span class="extra-bubble">${e.name}${e.perUnit ? ' (c/u)' : ''}</span>`
    ).join('') : '<span class="extra-bubble">Consultar adicionales</span>';
  }

  if (requestContainer) {
    const active = cfg.extras.filter(e => e.active);
    requestContainer.innerHTML = active.length ? active.map(e => `
      <label class="request-extra-item">
        <input type="checkbox" value="${e.id}" data-name="${e.name}">
        <span>${e.name}${e.perUnit ? ' (c/u)' : ''}</span>
      </label>
    `).join('') : '<p class="empty-extras">No hay adicionales configurados</p>';
  }
}

function renderNotIncluded() {
  const cfg = getConfig();
  const container = document.getElementById('notIncludedTags');
  if (!container) return;

  const active = cfg.notIncluded.filter(n => n.active);
  container.innerHTML = active.length ? active.map(n => 
    `<span class="not-tag">${n.name}</span>`
  ).join('') : '<span class="not-tag">Consultar con Anggie</span>';
}

// ============================================
// FORMULARIO DE SOLICITUD / CONTACTO
// ============================================
function handleRequest(e) {
  e.preventDefault();

  const btn = document.getElementById('submitBtn');
  const btnText = btn?.querySelector('.btn-text');
  const btnLoader = btn?.querySelector('.btn-loader');

  // Validaciones
  const name = (document.getElementById('reqName') || document.getElementById('contactName'))?.value.trim() || '';
  const phone = (document.getElementById('reqPhone') || document.getElementById('contactPhone'))?.value.trim() || '';
  const address = (document.getElementById('reqAddress') || document.getElementById('contactAddress'))?.value.trim() || '';

  if (name.length < 2) { alert('Por favor ingresa tu nombre completo'); return; }
  if (phone.length < 7) { alert('Por favor ingresa un teléfono válido'); return; }
  if (address.length < 5) { alert('Por favor ingresa una dirección completa'); return; }

  // Loading state
  if (btn) {
    btn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'inline-block';
  }

  const sizeEl = document.getElementById('reqSize') || document.getElementById('contactSize');
  const freqEl = document.getElementById('reqFreq') || document.getElementById('contactFreq');
  const notesEl = document.getElementById('reqNotes') || document.getElementById('contactNotes');

  const size = sizeEl ? sizeEl.value : null;
  const freq = freqEl ? freqEl.value : null;
  const notes = notesEl ? notesEl.value.trim() : '';

  const extras = [];
  document.querySelectorAll('#requestExtras input:checked').forEach(el => {
    extras.push(el.dataset.name || el.value);
  });

  const lead = {
    id: 'l-' + Date.now(),
    name,
    phone,
    address,
    size_sqft: size ? parseInt(size) : null,
    frequency: freq || null,
    notes: (extras.length ? `Extras: ${extras.join(', ')}. ` : '') + (notes || ''),
    status: 'nuevo',
    created_at: new Date().toISOString()
  };

  // Guardar lead
  saveLeadFromLanding(lead);

  setTimeout(() => {
    const form = document.getElementById('requestForm') || document.getElementById('contactForm');
    const success = document.getElementById('requestSuccess') || document.getElementById('formSuccess');

    if (form) form.style.display = 'none';
    if (success) {
      success.style.display = 'block';
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (btn) {
      btn.disabled = false;
      if (btnText) btnText.style.display = 'inline';
      if (btnLoader) btnLoader.style.display = 'none';
    }
  }, 600);
}

// Cotizador de la landing si existe
function handleContact(e) {
  handleRequest(e);
}

// Menu toggle móvil
function toggleMenu() {
  const nav = document.querySelector('.nav-links');
  if (nav) nav.classList.toggle('open');
}

// Scroll animations
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.service-card, .step-card, .testimonial-card, .hero-card').forEach(el => {
    el.classList.add('animate-ready');
    observer.observe(el);
  });
}

// Renderizar testimonios aprobados dinámicamente
function renderApprovedTestimonials() {
  const container = document.getElementById('testimonialsGrid');
  if (!container) return;

  try {
    const raw = localStorage.getItem('adsparkling_reviews');
    if (!raw) return;
    const reviews = JSON.parse(raw);
    const approved = reviews.filter(r => r.status === 'publicada');
    if (!approved || approved.length === 0) return;

    const cardsHtml = approved.map(r => `
      <div class="testimonial-card animate-ready animate-in" style="border-left: 4px solid var(--primary);">
        <div class="testimonial-stars">${'⭐'.repeat(r.rating || 5)}</div>
        <p class="testimonial-text">"${r.comment}"</p>
        ${r.photo_url ? `<img src="${r.photo_url}" alt="Foto del trabajo" style="width:100%; height:140px; object-fit:cover; border-radius:8px; margin: 10px 0;">` : ''}
        <div class="testimonial-author">
          <strong>${r.client_name || 'Cliente Verificado'}</strong>
          <span>Cliente de Ad Sparkling Cleaning</span>
        </div>
      </div>
    `).join('');

    container.innerHTML = cardsHtml + container.innerHTML;
  } catch (e) {
    console.warn('Error cargando testimonios públicos:', e);
  }
}

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderExtras();
  renderNotIncluded();
  renderApprovedTestimonials();
  initScrollAnimations();
});
