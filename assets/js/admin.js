/* ============================================
   ADMIN PANEL — Ad Sparkling Cleaning
   Autenticación, PWA Push, DataStore autónomo
   y Sincronización con Variables Vercel & Supabase
   ============================================ */

const DEFAULT_PASSWORD = 'Anggie2026';

let SUPABASE_URL = '';
let SUPABASE_KEY = '';
let supabase = null;

const PRICING = {
  1200: { 10: 150, 15: 150, 30: 180, deep: 240 },
  1700: { 10: 165, 15: 170, 30: 200, deep: 270 },
  2200: { 10: 180, 15: 195, 30: 225, deep: 300 },
  2800: { 10: 200, 15: 220, 30: 260, deep: 350 },
  3500: { 10: 225, 15: 250, 30: 290, deep: 400 },
  4500: { 10: 250, 15: 280, 30: 340, deep: 450 }
};

// ============================================
// DATASTORE (PERSISTENCIA LOCAL & SUPABASE SYNC)
// ============================================
const DataStore = {
  KEYS: {
    LEADS: 'adsparkling_leads',
    CLIENTS: 'adsparkling_clients',
    APPTS: 'adsparkling_appointments',
    EXPENSES: 'adsparkling_expenses',
    REVIEWS: 'adsparkling_reviews',
    AUTH_PASS: 'adsparkling_admin_password',
    AUTH_SESSION: 'adsparkling_logged_in'
  },

  async init() {
    this.seedInitialData();
    await this.loadVercelEnv();
  },

  async loadVercelEnv() {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (data.supabaseUrl && data.supabaseKey && window.supabase) {
          SUPABASE_URL = data.supabaseUrl;
          SUPABASE_KEY = data.supabaseKey;
          supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
          console.log('✅ Supabase conectado automáticamente desde Vercel');
        }
      }
    } catch (e) {
      // Entorno local o sin endpoint
    }
  },

  getPassword() {
    return localStorage.getItem(this.KEYS.AUTH_PASS) || DEFAULT_PASSWORD;
  },

  setPassword(newPass) {
    localStorage.setItem(this.KEYS.AUTH_PASS, newPass);
  },

  isLoggedIn() {
    return localStorage.getItem(this.KEYS.AUTH_SESSION) === 'true';
  },

  setLoggedIn(val) {
    localStorage.setItem(this.KEYS.AUTH_SESSION, val ? 'true' : 'false');
  },

  seedInitialData() {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');

    // Clientes de ejemplo
    if (!localStorage.getItem(this.KEYS.CLIENTS)) {
      const initialClients = [
        {
          id: 'c-101',
          name: 'María Rodríguez',
          phone: '3055550192',
          address: '742 Brickell Ave, Miami, FL 33131',
          size_sqft: 2200,
          frequency: '15',
          base_price: 195,
          last_visit: `${curYear}-${curMonth}-02`,
          next_visit: `${curYear}-${curMonth}-16`,
          status: 'activo',
          notes: 'Tiene un perro pequeño amigable. Clave portón #4052.'
        },
        {
          id: 'c-102',
          name: 'Carlos Gómez',
          phone: '7865550143',
          address: '1200 Ocean Dr, Miami Beach, FL 33139',
          size_sqft: 1700,
          frequency: '10',
          base_price: 165,
          last_visit: `${curYear}-${curMonth}-05`,
          next_visit: `${curYear}-${curMonth}-15`,
          status: 'activo',
          notes: 'Enfocar en baños y balcón.'
        },
        {
          id: 'c-103',
          name: 'Elena Suárez',
          phone: '9545550881',
          address: '2500 Las Olas Blvd, Fort Lauderdale, FL 33301',
          size_sqft: 2800,
          frequency: '30',
          base_price: 260,
          last_visit: `${curYear}-${curMonth}-01`,
          next_visit: `${curYear}-${curMonth}-28`,
          status: 'activo',
          notes: 'Productos eco-amigables preferidos.'
        },
        {
          id: 'c-104',
          name: 'David Pérez',
          phone: '3055559821',
          address: '8800 Doral Blvd, Doral, FL 33178',
          size_sqft: 1200,
          frequency: '15',
          base_price: 150,
          last_visit: '2026-07-15',
          next_visit: null,
          status: 'activo',
          notes: 'Viajó de vacaciones.'
        }
      ];
      localStorage.setItem(this.KEYS.CLIENTS, JSON.stringify(initialClients));
    }

    // Citas de ejemplo
    if (!localStorage.getItem(this.KEYS.APPTS)) {
      const initialAppts = [
        {
          id: 'a-201',
          client_id: 'c-101',
          date: `${curYear}-${curMonth}-02`,
          time: '09:00 AM',
          price: 195,
          addons: [],
          notes: 'Limpieza quincenal regular',
          status: 'completada'
        },
        {
          id: 'a-202',
          client_id: 'c-102',
          date: `${curYear}-${curMonth}-05`,
          time: '01:30 PM',
          price: 215,
          addons: ['Nevera por dentro'],
          notes: 'Incluyó limpieza interior de nevera',
          status: 'completada'
        },
        {
          id: 'a-203',
          client_id: 'c-101',
          date: `${curYear}-${curMonth}-16`,
          time: '09:00 AM',
          price: 195,
          addons: [],
          notes: 'Próxima visita agendada',
          status: 'pendiente'
        },
        {
          id: 'a-204',
          client_id: 'c-102',
          date: `${curYear}-${curMonth}-15`,
          time: '02:00 PM',
          price: 165,
          addons: [],
          notes: 'Confirmada por WhatsApp',
          status: 'pendiente'
        }
      ];
      localStorage.setItem(this.KEYS.APPTS, JSON.stringify(initialAppts));
    }

    // Gastos de ejemplo
    if (!localStorage.getItem(this.KEYS.EXPENSES)) {
      const initialExpenses = [
        {
          id: 'e-301',
          category: 'insumos',
          amount: 65.50,
          date: `${curYear}-${curMonth}-03`,
          description: 'Detergentes, microfibras y desinfectantes (Home Depot)'
        },
        {
          id: 'e-302',
          category: 'gasolina',
          amount: 45.00,
          date: `${curYear}-${curMonth}-04`,
          description: 'Gasolina semana 1 (Ruta Miami Beach - Brickell)'
        },
        {
          id: 'e-303',
          category: 'salario_asistente',
          amount: 120.00,
          date: `${curYear}-${curMonth}-05`,
          description: 'Pago asistente apoyo casa grande'
        }
      ];
      localStorage.setItem(this.KEYS.EXPENSES, JSON.stringify(initialExpenses));
    }

    // Leads de ejemplo
    if (!localStorage.getItem(this.KEYS.LEADS)) {
      const initialLeads = [
        {
          id: 'l-401',
          name: 'Andrés Morales',
          phone: '3055553322',
          address: '150 SE 2nd Ave, Miami, FL 33131',
          size_sqft: 1700,
          frequency: '15',
          notes: 'Interesado en empezar la próxima semana. Apartamento piso 12.',
          status: 'nuevo',
          created_at: new Date().toISOString()
        },
        {
          id: 'l-402',
          name: 'Sofía Navarro',
          phone: '9545557766',
          address: '401 E Las Olas, Fort Lauderdale, FL 33301',
          size_sqft: 2800,
          frequency: 'deep',
          notes: 'Mudanza a fin de mes. Quiere horno y gabinetes.',
          status: 'contactado',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      localStorage.setItem(this.KEYS.LEADS, JSON.stringify(initialLeads));
    }

    // Reseñas de ejemplo
    if (!localStorage.getItem(this.KEYS.REVIEWS)) {
      const initialReviews = [
        {
          id: 'rev-501',
          client_id: 'c-101',
          client_name: 'María Rodríguez',
          client_phone: '3055550192',
          rating: 5,
          comment: '¡El servicio de Anggie superó todas nuestras expectativas! Nuestra casa quedó impecable, y el aroma a limpio duró días.',
          photo_url: 'imagenes%20comparativa/ba%C3%B1o%20blanco%20limpio.jpeg',
          status: 'publicada',
          created_at: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: 'rev-502',
          client_id: 'c-102',
          client_name: 'Carlos Gómez',
          client_phone: '7865550143',
          rating: 5,
          comment: 'La limpieza profunda del horno y la sala fue increíble. Se nota el amor y la dedicación con la que trabajan.',
          photo_url: 'imagenes%20comparativa/horno%20azul%20limpio%202.jpeg',
          status: 'pendiente',
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      localStorage.setItem(this.KEYS.REVIEWS, JSON.stringify(initialReviews));
    }
  },

  getList(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  },

  setList(key, items) {
    localStorage.setItem(key, JSON.stringify(items));
  },

  // Leads
  getLeads() { return this.getList(this.KEYS.LEADS); },
  saveLead(lead) {
    lead.id = lead.id || 'l-' + Date.now();
    lead.created_at = lead.created_at || new Date().toISOString();
    lead.status = lead.status || 'nuevo';
    const leads = this.getLeads();
    leads.unshift(lead);
    this.setList(this.KEYS.LEADS, leads);

    if (supabase) {
      supabase.from('leads').insert([lead]).then(() => {}).catch(() => {});
    }
    return lead;
  },
  updateLead(id, updates) {
    const leads = this.getLeads();
    const idx = leads.findIndex(l => l.id == id);
    if (idx !== -1) {
      leads[idx] = { ...leads[idx], ...updates, updated_at: new Date().toISOString() };
      this.setList(this.KEYS.LEADS, leads);
      if (supabase) {
        supabase.from('leads').update(updates).eq('id', id).then(() => {}).catch(() => {});
      }
    }
  },
  deleteLead(id) {
    const leads = this.getLeads().filter(l => l.id != id);
    this.setList(this.KEYS.LEADS, leads);
    if (supabase) {
      supabase.from('leads').delete().eq('id', id).then(() => {}).catch(() => {});
    }
  },

  // Clientes
  getClients() { return this.getList(this.KEYS.CLIENTS); },
  saveClient(client) {
    const clients = this.getClients();
    if (client.id) {
      const idx = clients.findIndex(c => c.id == client.id);
      if (idx !== -1) clients[idx] = { ...clients[idx], ...client };
      else clients.push(client);
    } else {
      client.id = 'c-' + Date.now();
      client.created_at = new Date().toISOString();
      client.status = client.status || 'activo';
      clients.push(client);
    }
    this.setList(this.KEYS.CLIENTS, clients);
    if (supabase) {
      supabase.from('clients').upsert([client]).then(() => {}).catch(() => {});
    }
    return client;
  },
  deleteClient(id) {
    const clients = this.getClients().filter(c => c.id != id);
    this.setList(this.KEYS.CLIENTS, clients);
    if (supabase) {
      supabase.from('clients').delete().eq('id', id).then(() => {}).catch(() => {});
    }
  },

  // Citas
  getAppointments() {
    const appts = this.getList(this.KEYS.APPTS);
    const clients = this.getClients();
    return appts.map(a => {
      const client = clients.find(c => c.id == a.client_id) || {};
      return { ...a, clients: { name: client.name || 'Sin asignar', address: client.address || '', phone: client.phone || '' } };
    });
  },
  saveAppointment(appt) {
    const appts = this.getList(this.KEYS.APPTS);
    if (appt.id) {
      const idx = appts.findIndex(a => a.id == appt.id);
      if (idx !== -1) appts[idx] = { ...appts[idx], ...appt };
      else appts.unshift(appt);
    } else {
      appt.id = 'a-' + Date.now();
      appt.created_at = new Date().toISOString();
      appt.status = appt.status || 'pendiente';
      appts.unshift(appt);
    }
    this.setList(this.KEYS.APPTS, appts);

    // Actualizar fecha última/próxima visita en el cliente
    const clients = this.getClients();
    const cIdx = clients.findIndex(c => c.id == appt.client_id);
    if (cIdx !== -1) {
      if (appt.status === 'completada') clients[cIdx].last_visit = appt.date;
      else clients[cIdx].next_visit = appt.date;
      this.setList(this.KEYS.CLIENTS, clients);
    }

    if (supabase) {
      const cleanAppt = { ...appt };
      delete cleanAppt.clients;
      supabase.from('appointments').upsert([cleanAppt]).then(() => {}).catch(() => {});
    }
    return appt;
  },
  updateAppointmentStatus(id, newStatus) {
    const appts = this.getList(this.KEYS.APPTS);
    const idx = appts.findIndex(a => a.id == id);
    if (idx !== -1) {
      appts[idx].status = newStatus;
      this.setList(this.KEYS.APPTS, appts);
      if (newStatus === 'completada') {
        const clients = this.getClients();
        const cIdx = clients.findIndex(c => c.id == appts[idx].client_id);
        if (cIdx !== -1) {
          clients[cIdx].last_visit = appts[idx].date;
          this.setList(this.KEYS.CLIENTS, clients);
        }
      }
      if (supabase) {
        supabase.from('appointments').update({ status: newStatus }).eq('id', id).then(() => {}).catch(() => {});
      }
    }
  },
  deleteAppointment(id) {
    const appts = this.getList(this.KEYS.APPTS).filter(a => a.id != id);
    this.setList(this.KEYS.APPTS, appts);
    if (supabase) {
      supabase.from('appointments').delete().eq('id', id).then(() => {}).catch(() => {});
    }
  },

  // Gastos
  getExpenses() { return this.getList(this.KEYS.EXPENSES); },
  saveExpense(exp) {
    exp.id = exp.id || 'e-' + Date.now();
    exp.created_at = new Date().toISOString();
    const exps = this.getExpenses();
    exps.unshift(exp);
    this.setList(this.KEYS.EXPENSES, exps);
    if (supabase) {
      supabase.from('expenses').insert([exp]).then(() => {}).catch(() => {});
    }
    return exp;
  },
  deleteExpense(id) {
    const exps = this.getExpenses().filter(e => e.id != id);
    this.setList(this.KEYS.EXPENSES, exps);
    if (supabase) {
      supabase.from('expenses').delete().eq('id', id).then(() => {}).catch(() => {});
    }
  },

  // Reseñas
  getReviews() { return this.getList(this.KEYS.REVIEWS); },
  saveReview(review) {
    review.id = review.id || 'rev-' + Date.now();
    review.created_at = review.created_at || new Date().toISOString();
    review.status = review.status || 'pendiente';
    const reviews = this.getReviews();
    reviews.unshift(review);
    this.setList(this.KEYS.REVIEWS, reviews);
    if (supabase) {
      supabase.from('reviews').insert([review]).then(() => {}).catch(() => {});
    }
    return review;
  },
  updateReview(id, updates) {
    const reviews = this.getReviews();
    const idx = reviews.findIndex(r => r.id == id);
    if (idx !== -1) {
      reviews[idx] = { ...reviews[idx], ...updates };
      this.setList(this.KEYS.REVIEWS, reviews);
      if (supabase) {
        supabase.from('reviews').update(updates).eq('id', id).then(() => {}).catch(() => {});
      }
    }
  },
  deleteReview(id) {
    const reviews = this.getReviews().filter(r => r.id != id);
    this.setList(this.KEYS.REVIEWS, reviews);
    if (supabase) {
      supabase.from('reviews').delete().eq('id', id).then(() => {}).catch(() => {});
    }
  }
};

// ============================================
// AUTENTICACIÓN & LOGIN
// ============================================
function checkAuth() {
  const isLogged = DataStore.isLoggedIn();
  const loginScreen = document.getElementById('loginScreen');
  const adminApp = document.getElementById('adminApp');

  if (isLogged) {
    loginScreen.style.display = 'none';
    adminApp.style.display = 'block';
    loadDashboard();
  } else {
    loginScreen.style.display = 'flex';
    adminApp.style.display = 'none';
    setupPushCard();
  }
}

function handleLogin(e) {
  e.preventDefault();
  const input = document.getElementById('loginPassword');
  const errorMsg = document.getElementById('loginError');
  const currentPassword = DataStore.getPassword();

  if (input.value === currentPassword) {
    errorMsg.style.display = 'none';
    DataStore.setLoggedIn(true);
    input.value = '';
    checkAuth();
  } else {
    errorMsg.style.display = 'block';
    input.focus();
  }
}

function handleLogout() {
  if (confirm('¿Cerrar sesión del panel de administración?')) {
    DataStore.setLoggedIn(false);
    checkAuth();
  }
}

function togglePasswordVisibility(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    field.type = field.type === 'password' ? 'text' : 'password';
  }
}

function saveNewPassword() {
  const current = document.getElementById('pwdCurrent').value;
  const newPass = document.getElementById('pwdNew').value;
  const confirmPass = document.getElementById('pwdConfirm').value;
  const storedPass = DataStore.getPassword();

  if (current !== storedPass) {
    alert('La contraseña actual es incorrecta.');
    return;
  }
  if (!newPass || newPass.length < 4) {
    alert('La nueva contraseña debe tener al menos 4 caracteres.');
    return;
  }
  if (newPass !== confirmPass) {
    alert('La nueva contraseña y su confirmación no coinciden.');
    return;
  }

  DataStore.setPassword(newPass);
  document.getElementById('pwdCurrent').value = '';
  document.getElementById('pwdNew').value = '';
  document.getElementById('pwdConfirm').value = '';
  closeSettingsModal();
  alert('¡Contraseña actualizada exitosamente! ✅');
}

// ============================================
// PUSH NATIVO DE DESCARGA (PWA)
// ============================================
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('btnAndroidInstall');
  if (btn) btn.style.display = 'flex';
});

function setupPushCard() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const iosBox = document.getElementById('iosInstallBox');
  const androidBtn = document.getElementById('btnAndroidInstall');

  if (isIOS) {
    if (iosBox) iosBox.style.display = 'block';
    if (androidBtn) androidBtn.style.display = 'none';
  } else {
    if (iosBox) iosBox.style.display = 'none';
    if (androidBtn) androidBtn.style.display = 'flex';
  }
}

function dismissPushCard() {
  const card = document.getElementById('nativePushCard');
  if (card) card.style.display = 'none';
}

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
    });
  } else {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      alert('Para instalar en iPhone:\n1. Toca el botón Compartir (cuadrado con flecha 📤 en Safari)\n2. Selecciona "Añadir a pantalla de inicio" 📲');
    } else {
      alert('Para instalar en tu celular:\n1. Toca el menú de tu navegador (los tres puntos arriba a la derecha)\n2. Toca "Instalar aplicación" o "Añadir a pantalla principal" 📲');
    }
  }
}

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// ============================================
// NAVEGACIÓN & PESTAÑAS
// ============================================
function showTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(n => n.classList.remove('active'));

  const panel = document.getElementById('tab-' + tabId);
  if (panel) panel.classList.add('active');

  document.querySelectorAll(`[data-tab="${tabId}"]`).forEach(el => el.classList.add('active'));

  // Cerrar sidebar en móvil si está abierto
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.classList.remove('open');
  const overlay = document.querySelector('.mobile-overlay');
  if (overlay) overlay.classList.remove('active');

  // Cargar datos según pestaña
  if (tabId === 'dashboard') loadDashboard();
  if (tabId === 'leads') loadLeads();
  if (tabId === 'clients') loadClients();
  if (tabId === 'appointments') { loadClientsForSelect(); loadAppointments(); }
  if (tabId === 'expenses') loadExpenses();
  if (tabId === 'reviews') loadAdminReviews();
  if (tabId === 'cotizar') qcCalculate();
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.mobile-overlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('active');
}

function toggleForm(formId) {
  const el = document.getElementById(formId);
  if (!el) return;
  const isHidden = el.style.display === 'none' || getComputedStyle(el).display === 'none';
  el.style.display = isHidden ? 'block' : 'none';
  if (isHidden) {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// ============================================
// DASHBOARD
// ============================================
function loadDashboard() {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();

  const appts = DataStore.getAppointments();
  const exps = DataStore.getExpenses();
  const clients = DataStore.getClients();

  // Ingresos del mes
  const monthAppts = appts.filter(a => {
    if (a.status !== 'completada') return false;
    const d = new Date(a.date);
    return d.getFullYear() === curYear && d.getMonth() === curMonth;
  });
  const revenue = monthAppts.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);

  // Gastos del mes
  const monthExps = exps.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === curYear && d.getMonth() === curMonth;
  });
  const expenses = monthExps.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  // Clientes activos
  const activeClients = clients.filter(c => c.status === 'activo');
  const profit = revenue - expenses;
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  // Actualizar DOM
  document.getElementById('dashRevenue').textContent = '$' + revenue.toLocaleString();
  document.getElementById('dashExpenses').textContent = '$' + expenses.toLocaleString();
  document.getElementById('dashProfit').textContent = '$' + profit.toLocaleString();
  document.getElementById('dashMargin').textContent = margin + '% margen';
  document.getElementById('dashClients').textContent = activeClients.length;

  // Próximas citas
  const todayStr = now.toISOString().split('T')[0];
  const upcoming = appts
    .filter(a => a.status === 'pendiente' && a.date >= todayStr)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const upcomingEl = document.getElementById('upcomingAppointments');
  if (upcoming.length === 0) {
    upcomingEl.innerHTML = '<p class="empty">No hay citas pendientes próximas. ¡Todo al día! ✨</p>';
  } else {
    upcomingEl.innerHTML = upcoming.map(a => `
      <div class="dash-item">
        <div class="dash-item-info">
          <span class="dash-item-name">${a.clients?.name || 'Cliente'} <strong style="color:var(--success); font-weight:800;">$${a.price}</strong></span>
          <span class="dash-item-meta">📅 ${formatDate(a.date)} ${a.time ? '• ⏰ ' + a.time : ''} — 📍 ${a.clients?.address || 'Sin dirección'}</span>
          ${a.addons && a.addons.length ? `<span class="dash-item-addons">Extras: ${a.addons.join(', ')}</span>` : ''}
        </div>
        <div class="dash-item-actions">
          <button class="btn-action btn-complete" title="Marcar como Completada" onclick="quickCompleteAppt('${a.id}')">✓ Completar</button>
          <a href="https://wa.me/${cleanPhone(a.clients?.phone || '')}?text=Hola ${encodeURIComponent(a.clients?.name || '')}, te recordamos tu cita de limpieza de Ad Sparkling para el ${formatDate(a.date)} a las ${a.time || 'hora acordada'}. ¡Nos vemos pronto!" target="_blank" class="btn-action btn-wa-sm" title="Recordar por WhatsApp">📱 Recordar</a>
        </div>
      </div>
    `).join('');
  }

  // Clientes inactivos (+30 días)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const inactive = clients.filter(c => {
    if (c.status !== 'activo') return false;
    return !c.last_visit || c.last_visit < thirtyDaysAgoStr;
  });

  const inactiveEl = document.getElementById('inactiveClients');
  if (inactive.length === 0) {
    inactiveEl.innerHTML = '<p class="empty">Todos tus clientes están al día con sus visitas 🎉</p>';
  } else {
    inactiveEl.innerHTML = inactive.map(c => `
      <div class="dash-item">
        <div class="dash-item-info">
          <span class="dash-item-name">${c.name}</span>
          <span class="dash-item-meta">Última visita: ${c.last_visit ? formatDate(c.last_visit) : 'Sin registro'} — 📞 ${c.phone}</span>
        </div>
        <a href="https://wa.me/${cleanPhone(c.phone)}?text=Hola ${encodeURIComponent(c.name)}, te saluda Anggie de Ad Sparkling Cleaning ✨. Notamos que han pasado varios días desde tu última limpieza. ¿Te gustaría agendar una visita esta semana?" class="dash-item-action" target="_blank">📱 Reactivar por WhatsApp →</a>
      </div>
    `).join('');
  }
}

function quickCompleteAppt(id) {
  if (confirm('¿Marcar esta cita como completada? Esto sumará el pago a tus ingresos del mes.')) {
    DataStore.updateAppointmentStatus(id, 'completada');
    loadDashboard();
  }
}

// ============================================
// LEADS
// ============================================
let allLeads = [];

function loadLeads() {
  allLeads = DataStore.getLeads();
  renderLeadsTable(allLeads);
}

function renderLeadsTable(leads) {
  const tbody = document.getElementById('leadsTable');
  if (!leads || leads.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-cell">No hay leads registrados aún.</td></tr>';
    return;
  }

  tbody.innerHTML = leads.map(l => `
    <tr>
      <td><strong>${l.name}</strong></td>
      <td><a href="tel:${cleanPhone(l.phone)}" style="color:inherit; font-weight:600;">${l.phone}</a></td>
      <td title="${l.address}">${truncate(l.address, 30)}</td>
      <td>${l.size_sqft ? l.size_sqft + ' sqft' : '-'}</td>
      <td>${l.frequency ? freqLabel(l.frequency) : '-'}</td>
      <td>
        <select class="status-select status-${l.status}" onchange="changeLeadStatus('${l.id}', this.value)">
          <option value="nuevo" ${l.status === 'nuevo' ? 'selected' : ''}>Nuevo</option>
          <option value="contactado" ${l.status === 'contactado' ? 'selected' : ''}>Contactado</option>
          <option value="agendado" ${l.status === 'agendado' ? 'selected' : ''}>Agendado</option>
          <option value="descartado" ${l.status === 'descartado' ? 'selected' : ''}>Descartado</option>
        </select>
      </td>
      <td><small>${formatDate(l.created_at)}</small></td>
      <td class="action-cell">
        <a href="https://wa.me/${cleanPhone(l.phone)}?text=Hola ${encodeURIComponent(l.name)}, te saluda Anggie de Ad Sparkling Cleaning ✨. Recibimos tu solicitud de cotización para ${l.address}. ¿Tienes alguna fecha en mente para comenzar?" target="_blank" class="btn-table-action btn-wa-table" title="Contactar por WhatsApp">📱 Chat</a>
        <button class="btn-table-action btn-convert-table" onclick="convertLeadToClient('${l.id}')" title="Convertir a Cliente">👥 Convertir</button>
        <button class="btn-table-action btn-del-table" onclick="deleteLead('${l.id}')" title="Eliminar lead">🗑</button>
      </td>
    </tr>
  `).join('');
}

function filterLeads(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    renderLeadsTable(allLeads);
    return;
  }
  const filtered = allLeads.filter(l => 
    (l.name && l.name.toLowerCase().includes(q)) ||
    (l.phone && l.phone.includes(q)) ||
    (l.address && l.address.toLowerCase().includes(q)) ||
    (l.status && l.status.toLowerCase().includes(q))
  );
  renderLeadsTable(filtered);
}

function changeLeadStatus(id, newStatus) {
  DataStore.updateLead(id, { status: newStatus });
  const lead = allLeads.find(l => l.id == id);
  if (lead) lead.status = newStatus;
  loadLeads();
}

function deleteLead(id) {
  if (confirm('¿Seguro que deseas eliminar este lead?')) {
    DataStore.deleteLead(id);
    loadLeads();
  }
}

function saveManualLead() {
  const name = document.getElementById('lName').value.trim();
  const phone = document.getElementById('lPhone').value.trim();
  const address = document.getElementById('lAddress').value.trim();
  const size = document.getElementById('lSize').value ? parseInt(document.getElementById('lSize').value) : null;
  const freq = document.getElementById('lFreq').value || null;
  const notes = document.getElementById('lNotes').value.trim();

  if (!name || !phone) {
    alert('Por favor ingresa al menos nombre y teléfono del lead.');
    return;
  }

  DataStore.saveLead({
    name, phone, address, size_sqft: size, frequency: freq, notes, status: 'nuevo'
  });

  document.getElementById('lName').value = '';
  document.getElementById('lPhone').value = '';
  document.getElementById('lAddress').value = '';
  document.getElementById('lSize').value = '';
  document.getElementById('lFreq').value = '';
  document.getElementById('lNotes').value = '';
  toggleForm('leadForm');
  loadLeads();
  alert('Lead guardado exitosamente ✅');
}

function convertLeadToClient(leadId) {
  const lead = allLeads.find(l => l.id == leadId);
  if (!lead) return;

  showTab('clients');
  const form = document.getElementById('clientForm');
  form.style.display = 'block';

  document.getElementById('cId').value = '';
  document.getElementById('cName').value = lead.name || '';
  document.getElementById('cPhone').value = lead.phone || '';
  document.getElementById('cAddress').value = lead.address || '';
  document.getElementById('cSize').value = lead.size_sqft || '';
  document.getElementById('cFreq').value = lead.frequency || '';
  
  if (lead.size_sqft && lead.frequency && PRICING[lead.size_sqft]) {
    document.getElementById('cPrice').value = PRICING[lead.size_sqft][lead.frequency] || '';
  } else {
    document.getElementById('cPrice').value = '';
  }

  document.getElementById('cNotes').value = lead.notes ? `Lead convertido. Notas: ${lead.notes}` : 'Lead convertido desde la web';
  document.getElementById('cFormTitle').textContent = 'Convertir Lead a Cliente';
  form.scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// CLIENTES
// ============================================
let allClients = [];

function loadClients() {
  allClients = DataStore.getClients();
  renderClientsTable(allClients);
}

function renderClientsTable(clients) {
  const tbody = document.getElementById('clientsTable');
  if (!clients || clients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-cell">No hay clientes registrados aún.</td></tr>';
    return;
  }

  tbody.innerHTML = clients.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td><a href="tel:${cleanPhone(c.phone)}" style="color:inherit; font-weight:600;">${c.phone}</a></td>
      <td title="${c.address}">${truncate(c.address, 28)}</td>
      <td><strong style="color:var(--primary);">$${c.base_price || '-'}</strong></td>
      <td>${freqLabel(c.frequency)}</td>
      <td>${formatDate(c.last_visit)}</td>
      <td>${formatDate(c.next_visit)}</td>
      <td><span class="badge badge-${c.status}">${c.status}</span></td>
      <td class="action-cell">
        <button class="btn-table-action btn-schedule-table" onclick="sendPortalLink('${c.id}')" title="Enviar enlace de Portal al Cliente por WhatsApp" style="background:#f4ebfa; color:var(--primary); font-weight:700;">📲 Portal</button>
        <button class="btn-table-action btn-schedule-table" onclick="scheduleForClient('${c.id}')" title="Agendar Cita">📅 Cita</button>
        <button class="btn-table-action btn-edit-table" onclick="editClient('${c.id}')" title="Editar cliente">✏️</button>
        <a href="https://wa.me/${cleanPhone(c.phone)}" target="_blank" class="btn-table-action btn-wa-table" title="Enviar WhatsApp">📱</a>
        <button class="btn-table-action btn-del-table" onclick="deleteClient('${c.id}')" title="Eliminar cliente">🗑</button>
      </td>
    </tr>
  `).join('');
}

function sendPortalLink(clientId) {
  const client = allClients.find(c => c.id == clientId);
  if (!client) return;
  const phone = cleanPhone(client.phone);
  const portalUrl = `${window.location.origin}${window.location.pathname.replace('admin.html', '')}portal.html?phone=${phone}`;
  const msg = `¡Hola ${client.name}! ✨ Te comparto tu acceso exclusivo a tu Portal de Cliente de *Ad Sparkling Cleaning*. Desde aquí puedes consultar tus fechas de limpieza programadas, historial y dejarnos tu calificación:\n\n🔗 ${portalUrl}\n\n¡Gracias por confiar en nosotros! 🏠✨`;
  
  if (phone) {
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  } else {
    navigator.clipboard.writeText(portalUrl).then(() => {
      alert(`Enlace al portal copiado al portapapeles:\n\n${portalUrl}`);
    });
  }
}

function filterClients(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    renderClientsTable(allClients);
    return;
  }
  const filtered = allClients.filter(c => 
    (c.name && c.name.toLowerCase().includes(q)) ||
    (c.phone && c.phone.includes(q)) ||
    (c.address && c.address.toLowerCase().includes(q)) ||
    (c.notes && c.notes.toLowerCase().includes(q))
  );
  renderClientsTable(filtered);
}

function resetClientForm() {
  document.getElementById('cId').value = '';
  document.getElementById('cName').value = '';
  document.getElementById('cPhone').value = '';
  document.getElementById('cAddress').value = '';
  document.getElementById('cSize').value = '';
  document.getElementById('cFreq').value = '';
  document.getElementById('cPrice').value = '';
  document.getElementById('cNextVisit').value = '';
  document.getElementById('cNotes').value = '';
  document.getElementById('cStatus').value = 'activo';
  document.getElementById('cFormTitle').textContent = 'Agregar Cliente';
}

function editClient(id) {
  const client = allClients.find(c => c.id == id);
  if (!client) return;

  const form = document.getElementById('clientForm');
  form.style.display = 'block';

  document.getElementById('cId').value = client.id;
  document.getElementById('cName').value = client.name || '';
  document.getElementById('cPhone').value = client.phone || '';
  document.getElementById('cAddress').value = client.address || '';
  document.getElementById('cSize').value = client.size_sqft || '';
  document.getElementById('cFreq').value = client.frequency || '';
  document.getElementById('cPrice').value = client.base_price || '';
  document.getElementById('cNextVisit').value = client.next_visit || '';
  document.getElementById('cNotes').value = client.notes || '';
  document.getElementById('cStatus').value = client.status || 'activo';
  document.getElementById('cFormTitle').textContent = 'Editar Cliente: ' + client.name;

  form.scrollIntoView({ behavior: 'smooth' });
}

function saveClient() {
  const id = document.getElementById('cId').value;
  const name = document.getElementById('cName').value.trim();
  const phone = document.getElementById('cPhone').value.trim();
  const address = document.getElementById('cAddress').value.trim();
  const size = document.getElementById('cSize').value ? parseInt(document.getElementById('cSize').value) : null;
  const freq = document.getElementById('cFreq').value || null;
  const price = document.getElementById('cPrice').value ? parseInt(document.getElementById('cPrice').value) : null;
  const nextVisit = document.getElementById('cNextVisit').value || null;
  const notes = document.getElementById('cNotes').value.trim();
  const status = document.getElementById('cStatus').value || 'activo';

  if (!name || !phone || !address) {
    alert('Nombre, teléfono y dirección son obligatorios.');
    return;
  }

  const clientData = {
    id: id || undefined,
    name,
    phone,
    address,
    size_sqft: size,
    frequency: freq,
    base_price: price,
    next_visit: nextVisit,
    notes,
    status
  };

  DataStore.saveClient(clientData);
  toggleForm('clientForm');
  resetClientForm();
  loadClients();
  loadDashboard();
  alert('Cliente guardado con éxito ✅');
}

function deleteClient(id) {
  if (confirm('¿Seguro que deseas eliminar este cliente?')) {
    DataStore.deleteClient(id);
    loadClients();
    loadDashboard();
  }
}

function scheduleForClient(clientId) {
  showTab('appointments');
  const form = document.getElementById('apptForm');
  form.style.display = 'block';

  const select = document.getElementById('aClient');
  select.value = clientId;
  onClientSelectChange();

  document.getElementById('aDate').value = new Date().toISOString().split('T')[0];
  form.scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// CITAS
// ============================================
let allAppointments = [];

function loadAppointments() {
  allAppointments = DataStore.getAppointments();
  renderAppointmentsTable(allAppointments);
}

function renderAppointmentsTable(appts) {
  const tbody = document.getElementById('appointmentsTable');
  if (!appts || appts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-cell">No hay citas registradas aún.</td></tr>';
    return;
  }

  tbody.innerHTML = appts.map(a => `
    <tr>
      <td><strong>${formatDate(a.date)}</strong><br><small>${a.time || ''}</small></td>
      <td><strong>${a.clients?.name || 'Cliente'}</strong></td>
      <td title="${a.clients?.address || ''}">${truncate(a.clients?.address || '-', 25)}</td>
      <td><strong style="color:var(--primary); font-weight:800;">$${a.price}</strong></td>
      <td>${(a.addons || []).join(', ') || '-'}</td>
      <td>
        <select class="status-select status-${a.status}" onchange="changeApptStatus('${a.id}', this.value)">
          <option value="pendiente" ${a.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="completada" ${a.status === 'completada' ? 'selected' : ''}>Completada</option>
          <option value="cancelada" ${a.status === 'cancelada' ? 'selected' : ''}>Cancelada</option>
        </select>
      </td>
      <td title="${a.notes || ''}"><small>${truncate(a.notes || '-', 20)}</small></td>
      <td class="action-cell">
        <a href="https://wa.me/${cleanPhone(a.clients?.phone || '')}?text=Hola ${encodeURIComponent(a.clients?.name || '')}, te saluda Anggie de Ad Sparkling Cleaning sobre tu cita del ${formatDate(a.date)} ${a.time ? 'a las ' + a.time : ''}." target="_blank" class="btn-table-action btn-wa-table" title="WhatsApp">📱</a>
        <button class="btn-table-action btn-edit-table" onclick="editAppt('${a.id}')" title="Editar cita">✏️</button>
        <button class="btn-table-action btn-del-table" onclick="deleteAppt('${a.id}')" title="Eliminar cita">🗑</button>
      </td>
    </tr>
  `).join('');
}

function loadClientsForSelect() {
  const clients = DataStore.getClients();
  const select = document.getElementById('aClient');
  if (!select) return;

  select.innerHTML = '<option value="">Seleccionar cliente...</option>' + 
    clients.map(c => `<option value="${c.id}" data-price="${c.base_price || 0}">${c.name} (${c.address ? truncate(c.address, 25) : 'Sin dir'})</option>`).join('');
}

function onClientSelectChange() {
  const select = document.getElementById('aClient');
  const selected = select.options[select.selectedIndex];
  if (selected && selected.dataset.price) {
    const basePrice = parseInt(selected.dataset.price) || 0;
    if (basePrice > 0) {
      document.getElementById('aPrice').value = basePrice;
    }
  }
}

function resetApptForm() {
  document.getElementById('aId').value = '';
  document.getElementById('aClient').value = '';
  document.getElementById('aDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('aTime').value = '09:00 AM';
  document.getElementById('aPrice').value = '';
  document.getElementById('aAddons').value = '';
  document.getElementById('aNotes').value = '';
  document.getElementById('aStatus').value = 'pendiente';
  document.getElementById('aFormTitle').textContent = 'Agregar Cita';
}

function editAppt(id) {
  const appt = allAppointments.find(a => a.id == id);
  if (!appt) return;

  const form = document.getElementById('apptForm');
  form.style.display = 'block';

  document.getElementById('aId').value = appt.id;
  document.getElementById('aClient').value = appt.client_id;
  document.getElementById('aDate').value = appt.date || '';
  document.getElementById('aTime').value = appt.time || '';
  document.getElementById('aPrice').value = appt.price || '';
  document.getElementById('aAddons').value = (appt.addons || []).join(', ');
  document.getElementById('aNotes').value = appt.notes || '';
  document.getElementById('aStatus').value = appt.status || 'pendiente';
  document.getElementById('aFormTitle').textContent = 'Editar Cita';

  form.scrollIntoView({ behavior: 'smooth' });
}

function saveAppointment() {
  const id = document.getElementById('aId').value;
  const clientId = document.getElementById('aClient').value;
  const date = document.getElementById('aDate').value;
  const time = document.getElementById('aTime').value.trim();
  const price = parseInt(document.getElementById('aPrice').value) || 0;
  const addonsRaw = document.getElementById('aAddons').value;
  const notes = document.getElementById('aNotes').value.trim();
  const status = document.getElementById('aStatus').value || 'pendiente';

  if (!clientId || !date) {
    alert('Por favor selecciona un cliente y la fecha de la cita.');
    return;
  }

  const addons = addonsRaw ? addonsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  const apptData = {
    id: id || undefined,
    client_id: clientId,
    date,
    time,
    price,
    addons,
    notes,
    status
  };

  DataStore.saveAppointment(apptData);
  toggleForm('apptForm');
  resetApptForm();
  loadAppointments();
  loadDashboard();
  alert('Cita guardada correctamente ✅');
}

function changeApptStatus(id, newStatus) {
  DataStore.updateAppointmentStatus(id, newStatus);
  loadAppointments();
  loadDashboard();
}

function deleteAppt(id) {
  if (confirm('¿Seguro que deseas eliminar esta cita?')) {
    DataStore.deleteAppointment(id);
    loadAppointments();
    loadDashboard();
  }
}

// ============================================
// GASTOS
// ============================================
let allExpenses = [];

function loadExpenses() {
  allExpenses = DataStore.getExpenses();
  renderExpensesTable(allExpenses);
}

function renderExpensesTable(exps) {
  const tbody = document.getElementById('expensesTable');
  if (!exps || exps.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">No hay gastos registrados aún.</td></tr>';
    return;
  }

  const catLabels = {
    insumos: 'Insumos de limpieza',
    gasolina: 'Gasolina / Transporte',
    salario_asistente: 'Salario asistente',
    equipo: 'Equipo / Herramientas',
    otro: 'Otro'
  };

  const total = exps.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const totalEl = document.getElementById('expensesTotalHeader');
  if (totalEl) totalEl.textContent = 'Total: $' + total.toFixed(2);

  tbody.innerHTML = exps.map(e => `
    <tr>
      <td><strong>${formatDate(e.date)}</strong></td>
      <td><span class="badge badge-cat-${e.category}">${catLabels[e.category] || e.category}</span></td>
      <td>${e.description || '-'}</td>
      <td><strong style="color:var(--danger); font-weight:800;">$${parseFloat(e.amount).toFixed(2)}</strong></td>
      <td class="action-cell">
        <button class="btn-table-action btn-del-table" onclick="deleteExpense('${e.id}')" title="Eliminar gasto">🗑</button>
      </td>
    </tr>
  `).join('');
}

function filterExpenses(category) {
  if (!category || category === 'todas') {
    renderExpensesTable(allExpenses);
  } else {
    const filtered = allExpenses.filter(e => e.category === category);
    renderExpensesTable(filtered);
  }
}

function saveExpense() {
  const category = document.getElementById('eCategory').value;
  const amount = parseFloat(document.getElementById('eAmount').value);
  const date = document.getElementById('eDate').value || new Date().toISOString().split('T')[0];
  const desc = document.getElementById('eDesc').value.trim();

  if (!category || isNaN(amount) || amount <= 0) {
    alert('Por favor selecciona una categoría e ingresa un monto válido.');
    return;
  }

  DataStore.saveExpense({
    category,
    amount,
    date,
    description: desc
  });

  document.getElementById('eAmount').value = '';
  document.getElementById('eDesc').value = '';
  toggleForm('expenseForm');
  loadExpenses();
  loadDashboard();
  alert('Gasto guardado ✅');
}

function deleteExpense(id) {
  if (confirm('¿Seguro que deseas eliminar este registro de gasto?')) {
    DataStore.deleteExpense(id);
    loadExpenses();
    loadDashboard();
  }
}

// ============================================
// COTIZADOR RÁPIDO
// ============================================
function qcCalculate() {
  const sizeSelect = document.getElementById('qcSize');
  const freqSelect = document.getElementById('qcFreq');
  if (!sizeSelect || !freqSelect) return 0;

  const size = parseInt(sizeSelect.value) || 2200;
  const freq = freqSelect.value || '15';
  let total = (PRICING[size] && PRICING[size][freq]) ? PRICING[size][freq] : 195;

  document.querySelectorAll('.qc-check input:checked').forEach(el => {
    total += parseInt(el.dataset.price) || 0;
  });

  const totalEl = document.getElementById('qcTotal');
  if (totalEl) totalEl.textContent = '$' + total;
  return total;
}

function qcSendWhatsApp() {
  const total = qcCalculate();
  const sizeSelect = document.getElementById('qcSize');
  const freqSelect = document.getElementById('qcFreq');

  const addonsChecked = [];
  document.querySelectorAll('.qc-check input:checked').forEach(el => {
    addonsChecked.push(el.parentElement.textContent.trim());
  });

  let msg = '¡Hola! Soy Anggie de *Ad Sparkling Cleaning*. Te comparto tu cotización personalizada:%0A%0A';
  msg += '📍 *Tamaño:* ' + sizeSelect.options[sizeSelect.selectedIndex].text.split('—')[0].trim() + '%0A';
  msg += '🗓 *Frecuencia:* ' + freqSelect.options[freqSelect.selectedIndex].text + '%0A';
  if (addonsChecked.length) {
    msg += '➕ *Extras incluidos:* ' + addonsChecked.join(', ') + '%0A';
  }
  msg += '%0A💰 *Total estimado: $' + total + '*%0A%0A';
  msg += '¿Te gustaría reservar fecha en la agenda? Confírmanos tu dirección. ¡Muchas gracias! ✨';

  window.open('https://wa.me/?text=' + msg, '_blank');
}

function qcCopyText() {
  const total = qcCalculate();
  const sizeSelect = document.getElementById('qcSize');
  const freqSelect = document.getElementById('qcFreq');

  const addonsChecked = [];
  document.querySelectorAll('.qc-check input:checked').forEach(el => {
    addonsChecked.push(el.parentElement.textContent.trim());
  });

  let text = `Ad Sparkling Cleaning — Cotización\n\n`;
  text += `Tamaño: ${sizeSelect.options[sizeSelect.selectedIndex].text.split('—')[0].trim()}\n`;
  text += `Frecuencia: ${freqSelect.options[freqSelect.selectedIndex].text}\n`;
  if (addonsChecked.length) text += `Extras: ${addonsChecked.join(', ')}\n`;
  text += `Total: $${total}\n\n`;
  text += `Precio sujeto a confirmación al evaluar la propiedad.`;

  navigator.clipboard.writeText(text).then(() => {
    alert('Cotización copiada al portapapeles ✅');
  }).catch(() => {
    alert('Texto de cotización:\n\n' + text);
  });
}

function qcSaveAsLead() {
  const total = qcCalculate();
  const size = parseInt(document.getElementById('qcSize').value);
  const freq = document.getElementById('qcFreq').value;

  const leadName = prompt('Ingresa el nombre del prospecto:');
  if (!leadName) return;
  const leadPhone = prompt('Ingresa el teléfono del prospecto:') || '';
  const leadAddress = prompt('Ingresa la dirección:') || '';

  DataStore.saveLead({
    name: leadName,
    phone: leadPhone,
    address: leadAddress,
    size_sqft: size,
    frequency: freq,
    notes: `Cotización rápida: $${total}`,
    status: 'nuevo'
  });

  alert('Cotización guardada como Lead en el panel ✅');
}

function qcCreateClient() {
  const total = qcCalculate();
  const size = parseInt(document.getElementById('qcSize').value);
  const freq = document.getElementById('qcFreq').value;

  showTab('clients');
  const form = document.getElementById('clientForm');
  form.style.display = 'block';

  document.getElementById('cId').value = '';
  document.getElementById('cSize').value = size;
  document.getElementById('cFreq').value = freq;
  document.getElementById('cPrice').value = total;
  document.getElementById('cNotes').value = 'Cliente creado desde cotizador rápido';
  document.getElementById('cFormTitle').textContent = 'Crear Cliente desde Cotizador';

  form.scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// RESEÑAS & MODERACIÓN
// ============================================
function loadAdminReviews() {
  const listEl = document.getElementById('adminReviewsList');
  if (!listEl) return;
  const reviews = DataStore.getReviews();
  if (!reviews || reviews.length === 0) {
    listEl.innerHTML = '<p class="empty" style="text-align:center; padding:30px 20px;">No hay reseñas registradas aún.</p>';
    return;
  }

  listEl.innerHTML = reviews.map(r => `
    <div class="dash-item" style="display:flex; flex-direction:column; gap:12px; padding:18px; border-left: 4px solid ${r.status === 'publicada' ? 'var(--success)' : (r.status === 'archivada' ? 'var(--text-muted)' : 'var(--accent)')}; margin-bottom:12px; background:#fff; border-radius:8px; box-shadow:var(--shadow-sm);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
        <div>
          <strong style="font-size:16px; color:var(--primary);">${r.client_name || 'Cliente'}</strong>
          <span style="font-size:12px; color:var(--text-muted); margin-left:8px;">(${r.client_phone || 'Sin teléfono'})</span>
          <div style="margin-top:2px; font-size:14px; color:#e8a87c;">${'⭐'.repeat(r.rating || 5)} (${r.rating || 5}/5)</div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="badge badge-${r.status}">${r.status}</span>
          <span style="font-size:12px; color:var(--text-muted);">${formatDate(r.created_at)}</span>
        </div>
      </div>

      <p style="font-size:14px; color:var(--text); line-height:1.5; background:var(--bg-alt); padding:12px 14px; border-radius:8px; margin:0;">
        "${r.comment || 'Sin comentario'}"
      </p>

      ${(r.photo_url || (r.photos && r.photos.length > 0)) ? `
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="${r.photo_url || r.photos[0]}" alt="Foto reseña" style="width:75px; height:75px; object-fit:cover; border-radius:8px; border:1px solid var(--border);">
          <span style="font-size:12px; color:var(--text-muted);">Foto adjuntada por el cliente</span>
        </div>
      ` : ''}

      <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:6px; flex-wrap:wrap;">
        ${r.status !== 'publicada' ? `
          <button class="btn-table-action" style="background:#e8f8f0; color:#2d8a5e; font-weight:700; padding:6px 14px;" onclick="publishReview('${r.id}')" title="Publicar en la web">
            ✓ Publicar en la Web
          </button>
        ` : `
          <button class="btn-table-action" style="background:#f0eef3; color:var(--text-sec); padding:6px 14px;" onclick="archiveReview('${r.id}')" title="Ocultar de la web">
            📦 Ocultar / Archivar
          </button>
        `}
        <button class="btn-table-action btn-del-table" onclick="deleteReview('${r.id}')" title="Eliminar reseña">
          🗑 Eliminar
        </button>
      </div>
    </div>
  `).join('');
}

function publishReview(id) {
  DataStore.updateReview(id, { status: 'publicada' });
  loadAdminReviews();
}

function archiveReview(id) {
  DataStore.updateReview(id, { status: 'archivada' });
  loadAdminReviews();
}

function deleteReview(id) {
  if (confirm('¿Deseas eliminar esta reseña permanentemente?')) {
    DataStore.deleteReview(id);
    loadAdminReviews();
  }
}

// ============================================
// CENTRO DE NOTIFICACIONES & ALERTAS
// ============================================
function toggleNotificationsModal() {
  const modal = document.getElementById('notificationsModal');
  if (!modal) return;
  const isHidden = modal.style.display === 'none' || !modal.style.display;
  modal.style.display = isHidden ? 'flex' : 'none';

  if (isHidden) {
    loadNotificationsList();
  }
}

function loadNotificationsList() {
  const container = document.getElementById('adminNotificationsList');
  if (!container) return;

  const leads = DataStore.getLeads();
  const appts = DataStore.getAppointments();
  const reviews = DataStore.getReviews();
  const clients = DataStore.getClients();

  const alerts = [];

  // Nuevos leads sin atender
  const newLeads = leads.filter(l => l.status === 'nuevo');
  if (newLeads.length > 0) {
    alerts.push({
      type: 'lead',
      title: `📬 ${newLeads.length} Lead(s) nuevo(s) por cotizar`,
      desc: `Último prospecto: ${newLeads[0].name} (${newLeads[0].phone})`,
      action: "showTab('leads'); toggleNotificationsModal();"
    });
  }

  // Reseñas pendientes de moderación
  const pendingReviews = reviews.filter(r => r.status === 'pendiente');
  if (pendingReviews.length > 0) {
    alerts.push({
      type: 'review',
      title: `⭐ ${pendingReviews.length} Reseña(s) pendiente(s) de aprobación`,
      desc: `De: ${pendingReviews[0].client_name} (${pendingReviews[0].rating} estrellas)`,
      action: "showTab('reviews'); toggleNotificationsModal();"
    });
  }

  // Citas para hoy
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appts.filter(a => a.date === todayStr && a.status === 'pendiente');
  if (todayAppts.length > 0) {
    alerts.push({
      type: 'appt',
      title: `📅 ${todayAppts.length} Cita(s) programada(s) para hoy`,
      desc: `${todayAppts.map(a => (a.clients?.name || 'Cliente') + ' (' + (a.time || '') + ')').join(', ')}`,
      action: "showTab('appointments'); toggleNotificationsModal();"
    });
  }

  // Clientes sin visita reciente (>20 días)
  const inactive = clients.filter(c => {
    if (!c.last_visit) return false;
    const diffDays = (new Date() - new Date(c.last_visit)) / (1000 * 60 * 60 * 24);
    return diffDays > 20 && c.status === 'activo';
  });
  if (inactive.length > 0) {
    alerts.push({
      type: 'client',
      title: `🔄 ${inactive.length} Cliente(s) habitual(es) sin visita reciente`,
      desc: `Sugerencia: enviar recordatorio a ${inactive[0].name}`,
      action: "showTab('clients'); toggleNotificationsModal();"
    });
  }

  if (alerts.length === 0) {
    container.innerHTML = '<p class="empty" style="padding:20px; text-align:center;">🎉 Todo al día. No tienes alertas pendientes por ahora.</p>';
    return;
  }

  container.innerHTML = alerts.map(a => `
    <div class="dash-item" style="cursor:pointer; padding:14px; margin-bottom:8px; border-radius:8px; background:var(--bg-alt); border:1px solid var(--border);" onclick="${a.action}">
      <strong style="color:var(--primary); font-size:15px; display:block;">${a.title}</strong>
      <p style="font-size:13px; color:var(--text-sec); margin-top:4px; margin-bottom:0;">${a.desc}</p>
    </div>
  `).join('');
}

// ============================================
// AJUSTES & MODAL
// ============================================
function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.style.display = 'flex';
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.style.display = 'none';
}

function resetDemoData() {
  if (confirm('¿Restaurar todos los datos a la demostración inicial? (Esto sobreescribirá cambios locales)')) {
    localStorage.removeItem(DataStore.KEYS.CLIENTS);
    localStorage.removeItem(DataStore.KEYS.APPTS);
    localStorage.removeItem(DataStore.KEYS.EXPENSES);
    localStorage.removeItem(DataStore.KEYS.LEADS);
    localStorage.removeItem(DataStore.KEYS.REVIEWS);
    DataStore.seedInitialData();
    closeSettingsModal();
    loadDashboard();
    alert('Datos de prueba restaurados exitosamente ✅');
  }
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
  return labels[freq] || freq || '-';
}

function cleanPhone(phone) {
  return String(phone || '').replace(/[^0-9]/g, '');
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '...' : str;
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
  await DataStore.init();

  // Verificar estado de sesión
  checkAuth();

  // Fecha por defecto en formularios
  const today = new Date().toISOString().split('T')[0];
  const eDate = document.getElementById('eDate');
  if (eDate) eDate.value = today;
  const aDate = document.getElementById('aDate');
  if (aDate) aDate.value = today;

  // Listeners del cotizador rápido
  const qcSize = document.getElementById('qcSize');
  if (qcSize) qcSize.addEventListener('change', qcCalculate);
  const qcFreq = document.getElementById('qcFreq');
  if (qcFreq) qcFreq.addEventListener('change', qcCalculate);
  document.querySelectorAll('.qc-check input').forEach(el => {
    el.addEventListener('change', qcCalculate);
  });

  // Selector de cliente en citas
  const aClientSelect = document.getElementById('aClient');
  if (aClientSelect) {
    aClientSelect.addEventListener('change', onClientSelectChange);
  }
});
