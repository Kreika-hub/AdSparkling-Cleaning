/* ============================================
   ADMIN PANEL — Ad Sparkling Cleaning
   Gestión completa, LocalStorage + Supabase sync,
   Dashboard, CRUD, WhatsApp y PWA
   ============================================ */

// ============================================
// CONFIGURACIÓN & ESTADO
// ============================================
let SUPABASE_URL = 'https://TU-PROJECT.supabase.co';
let SUPABASE_KEY = 'TU-ANON-KEY';
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
// DATASTORE: LOCALSTORAGE + SUPABASE HYBRID
// ============================================
const DataStore = {
  KEYS: {
    LEADS: 'adsparkling_leads',
    CLIENTS: 'adsparkling_clients',
    APPTS: 'adsparkling_appointments',
    EXPENSES: 'adsparkling_expenses',
    SETTINGS: 'adsparkling_settings'
  },

  init() {
    this.loadSettings();
    this.initSupabase();
    this.seedInitialData();
  },

  loadSettings() {
    const raw = localStorage.getItem(this.KEYS.SETTINGS);
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s.supabaseUrl) SUPABASE_URL = s.supabaseUrl;
        if (s.supabaseKey) SUPABASE_KEY = s.supabaseKey;
      } catch (e) {
        console.error('Error cargando settings:', e);
      }
    }
  },

  initSupabase() {
    if (SUPABASE_URL && !SUPABASE_URL.includes('TU-PROJECT') && window.supabase) {
      try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        this.updateConnectionStatus(true);
      } catch (err) {
        console.warn('Error conectando a Supabase:', err);
        this.updateConnectionStatus(false);
      }
    } else {
      supabase = null;
      this.updateConnectionStatus(false);
    }
  },

  updateConnectionStatus(connected) {
    const badge = document.getElementById('connStatusBadge');
    if (badge) {
      if (connected) {
        badge.className = 'conn-badge online';
        badge.innerHTML = '<span class="dot"></span> Supabase Conectado';
      } else {
        badge.className = 'conn-badge local';
        badge.innerHTML = '<span class="dot"></span> Modo Local (Offline)';
      }
    }
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
  },

  // Helper local storage genérico
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

  // LEADS
  async getLeads() {
    if (supabase) {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return this.getList(this.KEYS.LEADS);
  },

  async saveLead(lead) {
    lead.id = lead.id || 'l-' + Date.now();
    lead.created_at = lead.created_at || new Date().toISOString();
    lead.status = lead.status || 'nuevo';

    const leads = this.getList(this.KEYS.LEADS);
    leads.unshift(lead);
    this.setList(this.KEYS.LEADS, leads);

    if (supabase) {
      try {
        await supabase.from('leads').insert([lead]);
      } catch (e) {
        console.warn('Error sincronizando lead con Supabase:', e);
      }
    }
    return lead;
  },

  async updateLead(id, updates) {
    const leads = this.getList(this.KEYS.LEADS);
    const idx = leads.findIndex(l => l.id == id);
    if (idx !== -1) {
      leads[idx] = { ...leads[idx], ...updates, updated_at: new Date().toISOString() };
      this.setList(this.KEYS.LEADS, leads);
    }

    if (supabase) {
      try {
        await supabase.from('leads').update(updates).eq('id', id);
      } catch (e) {
        console.warn('Error actualizando lead en Supabase:', e);
      }
    }
  },

  async deleteLead(id) {
    const leads = this.getList(this.KEYS.LEADS).filter(l => l.id != id);
    this.setList(this.KEYS.LEADS, leads);

    if (supabase) {
      try {
        await supabase.from('leads').delete().eq('id', id);
      } catch (e) {
        console.warn('Error eliminando lead en Supabase:', e);
      }
    }
  },

  // CLIENTS
  async getClients() {
    if (supabase) {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (!error && data) return data;
    }
    return this.getList(this.KEYS.CLIENTS);
  },

  async saveClient(client) {
    const clients = this.getList(this.KEYS.CLIENTS);
    if (client.id) {
      const idx = clients.findIndex(c => c.id == client.id);
      if (idx !== -1) {
        clients[idx] = { ...clients[idx], ...client };
      } else {
        clients.push(client);
      }
    } else {
      client.id = 'c-' + Date.now();
      client.created_at = new Date().toISOString();
      client.status = client.status || 'activo';
      clients.push(client);
    }
    this.setList(this.KEYS.CLIENTS, clients);

    if (supabase) {
      try {
        await supabase.from('clients').upsert([client]);
      } catch (e) {
        console.warn('Error guardando cliente en Supabase:', e);
      }
    }
    return client;
  },

  async deleteClient(id) {
    const clients = this.getList(this.KEYS.CLIENTS).filter(c => c.id != id);
    this.setList(this.KEYS.CLIENTS, clients);

    if (supabase) {
      try {
        await supabase.from('clients').delete().eq('id', id);
      } catch (e) {
        console.warn('Error eliminando cliente en Supabase:', e);
      }
    }
  },

  // APPOINTMENTS
  async getAppointments() {
    if (supabase) {
      const { data, error } = await supabase.from('appointments').select('*, clients(name, address, phone)').order('date', { ascending: false });
      if (!error && data) return data;
    }
    const appts = this.getList(this.KEYS.APPTS);
    const clients = this.getList(this.KEYS.CLIENTS);
    return appts.map(a => {
      const client = clients.find(c => c.id == a.client_id) || {};
      return { ...a, clients: { name: client.name || 'Sin asignar', address: client.address || '', phone: client.phone || '' } };
    });
  },

  async saveAppointment(appt) {
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
    const clients = this.getList(this.KEYS.CLIENTS);
    const cIdx = clients.findIndex(c => c.id == appt.client_id);
    if (cIdx !== -1) {
      if (appt.status === 'completada') {
        clients[cIdx].last_visit = appt.date;
      } else {
        clients[cIdx].next_visit = appt.date;
      }
      this.setList(this.KEYS.CLIENTS, clients);
    }

    if (supabase) {
      try {
        const cleanAppt = { ...appt };
        delete cleanAppt.clients;
        await supabase.from('appointments').upsert([cleanAppt]);
      } catch (e) {
        console.warn('Error guardando cita en Supabase:', e);
      }
    }
    return appt;
  },

  async updateAppointmentStatus(id, newStatus) {
    const appts = this.getList(this.KEYS.APPTS);
    const idx = appts.findIndex(a => a.id == id);
    if (idx !== -1) {
      appts[idx].status = newStatus;
      this.setList(this.KEYS.APPTS, appts);

      if (newStatus === 'completada') {
        const clients = this.getList(this.KEYS.CLIENTS);
        const cIdx = clients.findIndex(c => c.id == appts[idx].client_id);
        if (cIdx !== -1) {
          clients[cIdx].last_visit = appts[idx].date;
          this.setList(this.KEYS.CLIENTS, clients);
        }
      }
    }

    if (supabase) {
      try {
        await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
      } catch (e) {
        console.warn('Error actualizando estado de cita:', e);
      }
    }
  },

  async deleteAppointment(id) {
    const appts = this.getList(this.KEYS.APPTS).filter(a => a.id != id);
    this.setList(this.KEYS.APPTS, appts);

    if (supabase) {
      try {
        await supabase.from('appointments').delete().eq('id', id);
      } catch (e) {
        console.warn('Error eliminando cita en Supabase:', e);
      }
    }
  },

  // EXPENSES
  async getExpenses() {
    if (supabase) {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (!error && data) return data;
    }
    return this.getList(this.KEYS.EXPENSES);
  },

  async saveExpense(exp) {
    exp.id = exp.id || 'e-' + Date.now();
    exp.created_at = new Date().toISOString();
    const exps = this.getList(this.KEYS.EXPENSES);
    exps.unshift(exp);
    this.setList(this.KEYS.EXPENSES, exps);

    if (supabase) {
      try {
        await supabase.from('expenses').insert([exp]);
      } catch (e) {
        console.warn('Error guardando gasto en Supabase:', e);
      }
    }
    return exp;
  },

  async deleteExpense(id) {
    const exps = this.getList(this.KEYS.EXPENSES).filter(e => e.id != id);
    this.setList(this.KEYS.EXPENSES, exps);

    if (supabase) {
      try {
        await supabase.from('expenses').delete().eq('id', id);
      } catch (e) {
        console.warn('Error eliminando gasto en Supabase:', e);
      }
    }
  }
};

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

  // Cargar datos
  if (tabId === 'dashboard') loadDashboard();
  if (tabId === 'leads') loadLeads();
  if (tabId === 'clients') loadClients();
  if (tabId === 'appointments') { loadClientsForSelect(); loadAppointments(); }
  if (tabId === 'expenses') loadExpenses();
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
async function loadDashboard() {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();

  const appts = await DataStore.getAppointments();
  const exps = await DataStore.getExpenses();
  const clients = await DataStore.getClients();

  // Ingresos del mes (citas completadas del mes actual)
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

  // Actualizar DOM Stats
  document.getElementById('dashRevenue').textContent = '$' + revenue.toLocaleString();
  document.getElementById('dashExpenses').textContent = '$' + expenses.toLocaleString();
  document.getElementById('dashProfit').textContent = '$' + profit.toLocaleString();
  document.getElementById('dashMargin').textContent = margin + '% margen';
  document.getElementById('dashClients').textContent = activeClients.length;

  // Próximas citas (pendientes ordenadas por fecha)
  const todayStr = now.toISOString().split('T')[0];
  const upcoming = appts
    .filter(a => a.status === 'pendiente' && a.date >= todayStr)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const upcomingEl = document.getElementById('upcomingAppointments');
  if (upcoming.length === 0) {
    upcomingEl.innerHTML = '<p class="empty">No hay citas pendientes próximas. ¡Buen trabajo! ✨</p>';
  } else {
    upcomingEl.innerHTML = upcoming.map(a => `
      <div class="dash-item">
        <div class="dash-item-info">
          <span class="dash-item-name">${a.clients?.name || 'Cliente'} <strong style="color:var(--success);">$${a.price}</strong></span>
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

async function quickCompleteAppt(id) {
  if (confirm('¿Marcar esta cita como completada? Esto sumará el pago a tus ingresos del mes.')) {
    await DataStore.updateAppointmentStatus(id, 'completada');
    loadDashboard();
  }
}

// ============================================
// LEADS
// ============================================
let allLeads = [];

async function loadLeads() {
  allLeads = await DataStore.getLeads();
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
      <td><a href="tel:${cleanPhone(l.phone)}" style="color:inherit;">${l.phone}</a></td>
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

async function changeLeadStatus(id, newStatus) {
  await DataStore.updateLead(id, { status: newStatus });
  const lead = allLeads.find(l => l.id == id);
  if (lead) lead.status = newStatus;
  loadLeads();
}

async function deleteLead(id) {
  if (confirm('¿Seguro que deseas eliminar este lead?')) {
    await DataStore.deleteLead(id);
    loadLeads();
  }
}

async function saveManualLead() {
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

  await DataStore.saveLead({
    name, phone, address, size_sqft: size, frequency: freq, notes, status: 'nuevo'
  });

  // Limpiar formulario y cerrar
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

async function loadClients() {
  allClients = await DataStore.getClients();
  renderClientsTable(allClients);
}

function renderClientsTable(clients) {
  const tbody = document.getElementById('clientsTable');
  if (!clients || clients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-cell">No hay clientes registrados aún.</td></tr>';
    return;
  }

  tbody.innerHTML = clients.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td><a href="tel:${cleanPhone(c.phone)}" style="color:inherit;">${c.phone}</a></td>
      <td title="${c.address}">${truncate(c.address, 28)}</td>
      <td><strong>$${c.base_price || '-'}</strong></td>
      <td>${freqLabel(c.frequency)}</td>
      <td>${formatDate(c.last_visit)}</td>
      <td>${formatDate(c.next_visit)}</td>
      <td>
        <span class="badge badge-${c.status}">${c.status}</span>
      </td>
      <td class="action-cell">
        <button class="btn-table-action btn-schedule-table" onclick="scheduleForClient('${c.id}')" title="Agendar Cita">📅 Cita</button>
        <button class="btn-table-action btn-edit-table" onclick="editClient('${c.id}')" title="Editar cliente">✏️</button>
        <a href="https://wa.me/${cleanPhone(c.phone)}" target="_blank" class="btn-table-action btn-wa-table" title="Enviar WhatsApp">📱</a>
        <button class="btn-table-action btn-del-table" onclick="deleteClient('${c.id}')" title="Eliminar cliente">🗑</button>
      </td>
    </tr>
  `).join('');
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

async function saveClient() {
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

  await DataStore.saveClient(clientData);
  toggleForm('clientForm');
  resetClientForm();
  loadClients();
  loadDashboard();
  alert('Cliente guardado con éxito ✅');
}

async function deleteClient(id) {
  if (confirm('¿Seguro que deseas eliminar este cliente?')) {
    await DataStore.deleteClient(id);
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

async function loadAppointments() {
  allAppointments = await DataStore.getAppointments();
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
      <td><strong style="color:var(--primary);">$${a.price}</strong></td>
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

async function loadClientsForSelect() {
  const clients = await DataStore.getClients();
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

async function saveAppointment() {
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

  await DataStore.saveAppointment(apptData);
  toggleForm('apptForm');
  resetApptForm();
  loadAppointments();
  loadDashboard();
  alert('Cita guardada correctamente ✅');
}

async function changeApptStatus(id, newStatus) {
  await DataStore.updateAppointmentStatus(id, newStatus);
  loadAppointments();
  loadDashboard();
}

async function deleteAppt(id) {
  if (confirm('¿Seguro que deseas eliminar esta cita?')) {
    await DataStore.deleteAppointment(id);
    loadAppointments();
    loadDashboard();
  }
}

// ============================================
// GASTOS
// ============================================
let allExpenses = [];

async function loadExpenses() {
  allExpenses = await DataStore.getExpenses();
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
      <td><strong style="color:var(--danger);">$${parseFloat(e.amount).toFixed(2)}</strong></td>
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

async function saveExpense() {
  const category = document.getElementById('eCategory').value;
  const amount = parseFloat(document.getElementById('eAmount').value);
  const date = document.getElementById('eDate').value || new Date().toISOString().split('T')[0];
  const desc = document.getElementById('eDesc').value.trim();

  if (!category || isNaN(amount) || amount <= 0) {
    alert('Por favor selecciona una categoría e ingresa un monto válido.');
    return;
  }

  await DataStore.saveExpense({
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

async function deleteExpense(id) {
  if (confirm('¿Seguro que deseas eliminar este registro de gasto?')) {
    await DataStore.deleteExpense(id);
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
// AJUSTES & CONFIGURACIÓN SUPABASE
// ============================================
function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (!modal) return;
  document.getElementById('cfgSupabaseUrl').value = SUPABASE_URL.includes('TU-PROJECT') ? '' : SUPABASE_URL;
  document.getElementById('cfgSupabaseKey').value = SUPABASE_KEY.includes('TU-ANON-KEY') ? '' : SUPABASE_KEY;
  modal.style.display = 'flex';
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.style.display = 'none';
}

function saveSettings() {
  const url = document.getElementById('cfgSupabaseUrl').value.trim();
  const key = document.getElementById('cfgSupabaseKey').value.trim();

  const settings = {
    supabaseUrl: url || 'https://TU-PROJECT.supabase.co',
    supabaseKey: key || 'TU-ANON-KEY'
  };

  localStorage.setItem(DataStore.KEYS.SETTINGS, JSON.stringify(settings));
  SUPABASE_URL = settings.supabaseUrl;
  SUPABASE_KEY = settings.supabaseKey;

  DataStore.initSupabase();
  closeSettingsModal();
  loadDashboard();
  alert('Configuración guardada ✅');
}

function resetDemoData() {
  if (confirm('¿Restaurar todos los datos a la demostración inicial? (Esto sobreescribirá cambios locales)')) {
    localStorage.removeItem(DataStore.KEYS.CLIENTS);
    localStorage.removeItem(DataStore.KEYS.APPTS);
    localStorage.removeItem(DataStore.KEYS.EXPENSES);
    localStorage.removeItem(DataStore.KEYS.LEADS);
    DataStore.seedInitialData();
    closeSettingsModal();
    loadDashboard();
    alert('Datos de prueba restaurados ✅');
  }
}

// ============================================
// PWA INSTALLATION & MOBILE EXPERIENCE
// ============================================
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtns = document.querySelectorAll('.btn-install-pwa');
  installBtns.forEach(btn => btn.style.display = 'flex');
});

function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choice) => {
      if (choice.outcome === 'accepted') {
        console.log('PWA instalada');
      }
      deferredPrompt = null;
    });
  } else {
    // Si está en iOS Safari o ya instalada
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      alert('Para instalar en iPhone/iPad:\n1. Toca el botón Compartir (cuadrado con flecha hacia arriba)\n2. Selecciona "Añadir a pantalla de inicio" 📲');
    } else {
      alert('Para instalar esta app:\n1. Toca el menú de tu navegador (los tres puntos)\n2. Selecciona "Instalar aplicación" o "Añadir a pantalla de inicio" 📲');
    }
  }
}

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrado correctamente'))
      .catch(err => console.log('Service Worker no se pudo registrar:', err));
  });
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
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar almacén de datos
  DataStore.init();

  // Fecha por defecto en gastos y citas
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

  // Selector de cliente en formulario de citas
  const aClientSelect = document.getElementById('aClient');
  if (aClientSelect) {
    aClientSelect.addEventListener('change', onClientSelectChange);
  }

  // Cargar Dashboard inicial
  loadDashboard();
});
