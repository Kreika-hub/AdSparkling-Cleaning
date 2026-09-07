/* ============================================
   ADMIN PANEL v3 — Ad Sparkling Cleaning
   Calendario, Scoring, Alertas, Finanzas Pro
   ============================================ */

// ============================================
// DATASTORE
// ============================================
const DB = {
  get(key, def) {
    try { const v = localStorage.getItem('asc_' + key); return v ? JSON.parse(v) : def; }
    catch(e) { return def; }
  },
  set(key, val) { localStorage.setItem('asc_' + key, JSON.stringify(val)); },
  now() { return new Date().toISOString(); }
};

const PRICING = {
  1200: { 10: 150, 15: 150, 30: 180, deep: 240 },
  1700: { 10: 165, 15: 170, 30: 200, deep: 270 },
  2200: { 10: 180, 15: 195, 30: 225, deep: 300 },
  2800: { 10: 200, 15: 220, 30: 260, deep: 350 },
  3500: { 10: 225, 15: 250, 30: 290, deep: 400 },
  4500: { 10: 250, 15: 280, 30: 340, deep: 450 }
};

const SIZE_LABELS = {
  1200: 'Hasta 1,200', 1700: '1,201-1,700', 2200: '1,701-2,200',
  2800: '2,201-2,800', 3500: '2,801-3,500', 4500: '3,501-4,500'
};

const FREQ_LABELS = { 10: '10 días', 15: 'Quincenal', 30: 'Mensual', deep: 'Profunda', once: 'Solo una vez' };
const STATUS_LABELS = {
  nuevo: 'Nuevo', contactado: 'Contactado', agendado: 'Agendado', descartado: 'Descartado',
  pendiente: 'Pendiente', completada: 'Completada', cancelada: 'Cancelada', no_show: 'No asistió',
  activo: 'Activo', pausado: 'Pausado', inactivo: 'Inactivo',
  pagado: 'Pagado', pendiente_pago: 'Pago pendiente', vencido: 'Vencido'
};

// ============================================
// INIT & DEMO DATA v3
// ============================================
function initData() {
  if (DB.get('initialized_v3', false)) return;

  const today = new Date();
  const fmt = d => d.toISOString().split('T')[0];
  const d60 = new Date(today); d60.setDate(d60.getDate() - 60);
  const d45 = new Date(today); d45.setDate(d45.getDate() - 45);
  const d30 = new Date(today); d30.setDate(d30.getDate() - 30);
  const d15 = new Date(today); d15.setDate(d15.getDate() - 15);
  const d7 = new Date(today); d7.setDate(d7.getDate() - 7);
  const d3 = new Date(today); d3.setDate(d3.getDate() - 3);
  const d1 = new Date(today); d1.setDate(d1.getDate() - 1);
  const next1 = new Date(today); next1.setDate(next1.getDate() + 1);
  const next3 = new Date(today); next3.setDate(next3.getDate() + 3);
  const next7 = new Date(today); next7.setDate(next7.getDate() + 7);
  const next14 = new Date(today); next14.setDate(next14.getDate() + 14);

  DB.set('config', {
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
    ],
    expenseCategories: ['Insumos', 'Gasolina', 'Auto', 'Salario asistente', 'Equipo', 'Otro'],
    gallery: []
  });

  DB.set('leads', [
    { id: 'l1', name: 'María González', phone: '(305) 111-2222', address: '123 Brickell Ave, Miami', size_sqft: 1800, frequency: '15', extras_requested: [{id:'oven',name:'Horno'}], notes: 'Tiene 2 perros', status: 'nuevo', assigned_price: null, angie_notes: '', whatsapp_sent: false, created_at: d7.toISOString() },
    { id: 'l2', name: 'Carlos Ruiz', phone: '(305) 333-4444', address: '456 Coral Way, Miami', size_sqft: 2200, frequency: '30', extras_requested: [], notes: '', status: 'contactado', assigned_price: 225, angie_notes: 'Pendiente confirmar fecha', whatsapp_sent: true, created_at: d15.toISOString() },
    { id: 'l3', name: 'Sofía Herrera', phone: '(305) 555-1234', address: '789 Kendall Dr, Miami', size_sqft: 1500, frequency: '15', extras_requested: [{id:'blinds',name:'Persianas'}], notes: 'Primera vez', status: 'nuevo', assigned_price: null, angie_notes: '', whatsapp_sent: false, created_at: d3.toISOString() }
  ]);

  DB.set('clients', [
    { id: 'c1', name: 'Ana Martínez', phone: '(305) 555-6666', address: '789 Wynwood St, Miami', size_sqft: 1700, frequency: '15', base_price: 170, notes: 'Muy ordenada', status: 'activo', last_visit: fmt(d15), next_visit: fmt(next3), rating: 5, cancelCount: 0, totalRevenue: 1020, totalAppointments: 6, contractStatus: 'activo', paymentDueDate: fmt(next7) },
    { id: 'c2', name: 'Pedro López', phone: '(305) 777-8888', address: '321 Doral Blvd, Doral', size_sqft: 2200, frequency: '30', base_price: 225, notes: 'Gato, no tocar cuarto de huéspedes', status: 'activo', last_visit: fmt(d30), next_visit: null, rating: 3, cancelCount: 2, totalRevenue: 900, totalAppointments: 4, contractStatus: 'por_vencer', paymentDueDate: fmt(d3) },
    { id: 'c3', name: 'Laura Sánchez', phone: '(305) 999-0000', address: '654 Aventura Cir, Aventura', size_sqft: 3500, frequency: '30', base_price: 290, notes: 'Casa grande, 5 baños', status: 'activo', last_visit: fmt(d7), next_visit: fmt(next7), rating: 5, cancelCount: 0, totalRevenue: 1740, totalAppointments: 6, contractStatus: 'activo', paymentDueDate: fmt(next14) },
    { id: 'c4', name: 'Roberto Díaz', phone: '(305) 444-7777', address: '111 Hialeah Gardens, Hialeah', size_sqft: 1200, frequency: '10', base_price: 150, notes: 'Cancela mucho', status: 'pausado', last_visit: fmt(d45), next_visit: null, rating: 1, cancelCount: 4, totalRevenue: 450, totalAppointments: 3, contractStatus: 'inactivo', paymentDueDate: fmt(d30) },
    { id: 'c5', name: 'Carmen Vega', phone: '(305) 222-9999', address: '222 Miami Beach, Miami Beach', size_sqft: 2800, frequency: '15', base_price: 220, notes: 'Cliente VIP', status: 'activo', last_visit: fmt(d3), next_visit: fmt(next1), rating: 5, cancelCount: 0, totalRevenue: 2640, totalAppointments: 12, contractStatus: 'activo', paymentDueDate: fmt(next3) }
  ]);

  DB.set('appointments', [
    { id: 'a1', client_id: 'c1', date: fmt(d15), time: '9:00 AM', price: 170, addons: [], notes: '', status: 'completada', cleaning_time: 180, paymentStatus: 'pagado', contractType: 'regular' },
    { id: 'a2', client_id: 'c2', date: fmt(d30), time: '10:00 AM', price: 225, addons: ['oven'], notes: 'Horno muy sucio', status: 'completada', cleaning_time: 240, paymentStatus: 'pendiente_pago', contractType: 'regular' },
    { id: 'a3', client_id: 'c3', date: fmt(d7), time: '8:30 AM', price: 340, addons: ['blinds'], notes: '10 persianas', status: 'completada', cleaning_time: 300, paymentStatus: 'pagado', contractType: 'regular' },
    { id: 'a4', client_id: 'c1', date: fmt(next3), time: '9:00 AM', price: 170, addons: [], notes: '', status: 'pendiente', cleaning_time: null, paymentStatus: 'pendiente_pago', contractType: 'regular' },
    { id: 'a5', client_id: 'c3', date: fmt(next7), time: '8:30 AM', price: 290, addons: [], notes: '', status: 'pendiente', cleaning_time: null, paymentStatus: 'pendiente_pago', contractType: 'regular' },
    { id: 'a6', client_id: 'c5', date: fmt(next1), time: '11:00 AM', price: 220, addons: [], notes: '', status: 'pendiente', cleaning_time: null, paymentStatus: 'pendiente_pago', contractType: 'regular' },
    { id: 'a7', client_id: 'c4', date: fmt(d45), time: '2:00 PM', price: 150, addons: [], notes: 'Canceló última vez', status: 'cancelada', cleaning_time: null, paymentStatus: 'vencido', contractType: 'regular' },
    { id: 'a8', client_id: 'c2', date: fmt(d60), time: '10:00 AM', price: 225, addons: [], notes: '', status: 'completada', cleaning_time: 210, paymentStatus: 'pagado', contractType: 'regular' },
    { id: 'a9', client_id: 'c5', date: fmt(d3), time: '11:00 AM', price: 220, addons: ['fridge'], notes: '', status: 'completada', cleaning_time: 200, paymentStatus: 'pagado', contractType: 'regular' },
    { id: 'a10', client_id: 'c4', date: fmt(d30), time: '2:00 PM', price: 150, addons: [], notes: 'No asistió', status: 'no_show', cleaning_time: null, paymentStatus: 'vencido', contractType: 'regular' }
  ]);

  DB.set('expenses', [
    { id: 'e1', category: 'Insumos', amount: 45.50, description: 'Detergente, desinfectante, trapos', date: fmt(d7) },
    { id: 'e2', category: 'Gasolina', amount: 35.00, description: 'Viajes esta semana', date: fmt(d3) },
    { id: 'e3', category: 'Salario asistente', amount: 180.00, description: 'Pago semanal asistente', date: fmt(d3) },
    { id: 'e4', category: 'Equipo', amount: 25.99, description: 'Nueva aspiradora handheld', date: fmt(d15) },
    { id: 'e5', category: 'Insumos', amount: 62.30, description: 'Productos de limpieza bulk', date: fmt(d1) },
    { id: 'e6', category: 'Gasolina', amount: 40.00, description: 'Viajes 2 semanas', date: fmt(d7) }
  ]);

  DB.set('initialized_v3', true);
}

// ============================================
// NAVIGATION
// ============================================
function showTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');
  document.querySelector(`.nav-item[data-tab="${tabId}"]`)?.classList.add('active');

  if (tabId === 'dashboard') renderDashboard();
  if (tabId === 'solicitudes') renderLeads();
  if (tabId === 'clientes') renderClients();
  if (tabId === 'citas') renderAppointments();
  if (tabId === 'calendario') renderCalendar();
  if (tabId === 'gastos') renderExpenses();
  if (tabId === 'cotizador') renderCotizador();
  if (tabId === 'finanzas') renderFinanzas();
  if (tabId === 'config') renderConfig();
}

function openModal(id) {
  document.getElementById(id).classList.add('active');
  if (id === 'expenseModal') populateExpenseCategories();
  if (id === 'appointmentModal') populateClientSelect();
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.querySelectorAll(`#${id} input, #${id} select, #${id} textarea`).forEach(el => {
    if (el.type === 'checkbox') el.checked = false;
    else if (el.tagName === 'SELECT') el.selectedIndex = 0;
    else el.value = '';
  });
}

// ============================================
// SCORING & ALERT ENGINE
// ============================================
function computeClientScore(client) {
  const appts = DB.get('appointments', []).filter(a => a.client_id === client.id);
  const completed = appts.filter(a => a.status === 'completada').length;
  const cancelled = appts.filter(a => a.status === 'cancelada').length;
  const noShows = appts.filter(a => a.status === 'no_show').length;
  const total = appts.length;
  const revenue = appts.filter(a => a.status === 'completada').reduce((s, a) => s + (a.price || 0), 0);

  const daysSinceLast = client.last_visit ? Math.floor((new Date() - new Date(client.last_visit)) / (1000*60*60*24)) : 999;
  const cancelRate = total > 0 ? ((cancelled + noShows) / total) * 100 : 0;

  // Score 0-100
  let score = 50;
  score += Math.min(completed * 5, 30); // +5 por cita completada, max 30
  score += Math.min(revenue / 50, 20); // +1 por cada $50, max 20
  score -= cancelRate * 0.8; // -0.8 por % de cancelación
  score -= Math.min(daysSinceLast * 0.3, 20); // -0.3 por día sin visita, max 20
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Classification
  let tier = 'regular';
  let tierLabel = 'Regular';
  let tierIcon = '⚪';
  if (score >= 80 && cancelRate < 10 && daysSinceLast < 20) {
    tier = 'vip'; tierLabel = 'VIP ⭐'; tierIcon = '⭐';
  } else if (score >= 60 && cancelRate < 20) {
    tier = 'bueno'; tierLabel = 'Buen cliente'; tierIcon = '✅';
  } else if (cancelRate >= 40 || daysSinceLast > 45) {
    tier = 'riesgo'; tierLabel = 'En riesgo'; tierIcon = '⚠️';
  } else if (cancelRate >= 60 || score < 20) {
    tier = 'problematico'; tierLabel = 'Problemático'; tierIcon = '❌';
  }

  return { score, tier, tierLabel, tierIcon, completed, cancelled, noShows, total, revenue, daysSinceLast, cancelRate };
}

function getAlerts() {
  const alerts = [];
  const clients = DB.get('clients', []);
  const appts = DB.get('appointments', []);
  const today = new Date().toISOString().split('T')[0];

  clients.forEach(c => {
    const score = computeClientScore(c);

    // Alerta: Inactivo +30 días
    if (score.daysSinceLast > 30 && c.status === 'activo') {
      alerts.push({
        type: 'warning', priority: 2,
        title: `${c.name} inactivo +${score.daysSinceLast} días`,
        message: `Última visita: ${formatDate(c.last_visit)}. Contactar para reactivar.`,
        action: () => waClient(c.id),
        actionLabel: 'Contactar',
        clientId: c.id
      });
    }

    // Alerta: Muchas cancelaciones
    if (c.cancelCount >= 3) {
      alerts.push({
        type: 'danger', priority: 1,
        title: `${c.name} — ${c.cancelCount} cancelaciones`,
        message: `Tasa de cancelación: ${score.cancelRate.toFixed(0)}%. Considerar pausar contrato.`,
        action: () => editClient(c.id),
        actionLabel: 'Revisar',
        clientId: c.id
      });
    }

    // Alerta: Pago vencido
    if (c.paymentDueDate && c.paymentDueDate < today && score.revenue > 0) {
      const daysOverdue = Math.floor((new Date(today) - new Date(c.paymentDueDate)) / (1000*60*60*24));
      alerts.push({
        type: 'danger', priority: 1,
        title: `Pago vencido: ${c.name}`,
        message: `Venció hace ${daysOverdue} días ($${c.base_price || 0}).`,
        action: () => waClient(c.id),
        actionLabel: 'Cobrar',
        clientId: c.id
      });
    }

    // Alerta: Contrato por vencer
    if (c.contractStatus === 'por_vencer') {
      alerts.push({
        type: 'info', priority: 3,
        title: `Contrato por vencer: ${c.name}`,
        message: 'Renovación próxima. Preparar propuesta.',
        action: () => editClient(c.id),
        actionLabel: 'Renovar',
        clientId: c.id
      });
    }
  });

  // Alerta: Citas de mañana
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tmrwStr = tomorrow.toISOString().split('T')[0];
  const tmrwAppts = appts.filter(a => a.date === tmrwStr && a.status === 'pendiente');
  if (tmrwAppts.length > 0) {
    alerts.push({
      type: 'info', priority: 3,
      title: `${tmrwAppts.length} cita(s) mañana`,
      message: 'Preparar rutina y confirmar con clientes.',
      action: () => showTab('calendario'),
      actionLabel: 'Ver calendario'
    });
  }

  // Alerta: Citas de hoy
  const todayAppts = appts.filter(a => a.date === today && a.status === 'pendiente');
  if (todayAppts.length > 0) {
    alerts.push({
      type: 'success', priority: 3,
      title: `${todayAppts.length} cita(s) hoy`,
      message: '¡Buen día de trabajo!',
      action: () => showTab('calendario'),
      actionLabel: 'Ver calendario'
    });
  }

  return alerts.sort((a, b) => a.priority - b.priority);
}

// ============================================
// DASHBOARD
// ============================================
function renderDashboard() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const fmtFirst = firstDay.toISOString().split('T')[0];

  const appts = DB.get('appointments', []);
  const expenses = DB.get('expenses', []);
  const clients = DB.get('clients', []);
  const leads = DB.get('leads', []);

  const monthAppts = appts.filter(a => a.date >= fmtFirst && a.status === 'completada');
  const revenue = monthAppts.reduce((s, a) => s + (a.price || 0), 0);

  const monthExp = expenses.filter(e => e.date >= fmtFirst);
  const expTotal = monthExp.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);

  const profit = revenue - expTotal;
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
  const activeClients = clients.filter(c => c.status === 'activo').length;

  // Pagos pendientes
  const pendingPayments = appts.filter(a => a.paymentStatus === 'pendiente_pago' && a.status === 'completada').reduce((s, a) => s + a.price, 0);
  const overduePayments = appts.filter(a => a.paymentStatus === 'vencido').reduce((s, a) => s + a.price, 0);

  document.getElementById('dashRevenue').textContent = '$' + revenue.toLocaleString();
  document.getElementById('dashRevenueCount').textContent = monthAppts.length + ' citas completadas';
  document.getElementById('dashExpenses').textContent = '$' + expTotal.toLocaleString();
  document.getElementById('dashExpensesCount').textContent = monthExp.length + ' registros';
  document.getElementById('dashProfit').textContent = '$' + profit.toLocaleString();
  document.getElementById('dashMargin').textContent = margin + '% margen';
  document.getElementById('dashClients').textContent = activeClients;
  document.getElementById('dashPending').textContent = '$' + pendingPayments.toLocaleString();
  document.getElementById('dashOverdue').textContent = '$' + overduePayments.toLocaleString();

  const newLeads = leads.filter(l => l.status === 'nuevo').length;
  const badge = document.getElementById('badgeSolicitudes');
  if (newLeads > 0) { badge.textContent = newLeads; badge.style.display = 'inline-block'; }
  else badge.style.display = 'none';

  // ALERTS
  const alerts = getAlerts();
  const alertsEl = document.getElementById('dashAlerts');
  if (alerts.length > 0) {
    alertsEl.innerHTML = alerts.slice(0, 5).map(a => `
      <div class="alert-item alert-${a.type}">
        <div class="alert-content">
          <strong>${a.title}</strong>
          <span>${a.message}</span>
        </div>
        <button class="btn-alert" onclick="${a.action.toString().includes('waClient') ? `waClient('${a.clientId}')` : a.action.toString().includes('editClient') ? `editClient('${a.clientId}')` : `showTab('calendario')`}">${a.actionLabel}</button>
      </div>
    `).join('');
  } else {
    alertsEl.innerHTML = '<div class="alert-item alert-success"><div class="alert-content"><strong>¡Todo en orden!</strong><span>No hay alertas pendientes.</span></div></div>';
  }

  const todayStr = now.toISOString().split('T')[0];
  const upcoming = appts
    .filter(a => a.date >= todayStr && a.status === 'pendiente')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const upEl = document.getElementById('upcomingAppointments');
  upEl.innerHTML = upcoming.length ? upcoming.map(a => {
    const c = clients.find(x => x.id === a.client_id);
    return `<div class="dash-item">
      <div class="dash-item-info">
        <span class="dash-item-name">${c?.name || 'Desconocido'}</span>
        <span class="dash-item-meta">${formatDate(a.date)} ${a.time || ''} — ${c?.address || ''} — <span class="pay-badge pay-${a.paymentStatus}">${STATUS_LABELS[a.paymentStatus] || a.paymentStatus}</span></span>
      </div>
      <div class="dash-item-actions">
        <button class="btn-icon btn-wa-sm" onclick="waAppt('${a.client_id}')" title="WhatsApp">📱</button>
        <button class="btn-icon btn-edit" onclick="completeAppt('${a.id}')" title="Completar">✓</button>
      </div>
    </div>`;
  }).join('') : '<p class="empty">No hay citas próximas</p>';

  const d30 = new Date(); d30.setDate(d30.getDate() - 30);
  const d30str = d30.toISOString().split('T')[0];
  const inactive = clients.filter(c => c.status === 'activo' && (!c.last_visit || c.last_visit < d30str));

  const inEl = document.getElementById('inactiveClients');
  inEl.innerHTML = inactive.length ? inactive.map(c => `
    <div class="dash-item">
      <div class="dash-item-info">
        <span class="dash-item-name">${c.name} ${getClientTier(c).icon}</span>
        <span class="dash-item-meta">Última: ${formatDate(c.last_visit)} — ${c.phone}</span>
      </div>
      <a href="https://wa.me/${cleanPhone(c.phone)}?text=Hola ${c.name}, notamos que han pasado más de 30 días desde tu última limpieza. ¿Te gustaría reactivar tu agenda?" class="dash-item-action" target="_blank">Contactar →</a>
    </div>
  `).join('') : '<p class="empty">Todos están al día 🎉</p>';

  const recent = leads.filter(l => l.status === 'nuevo').slice(0, 3);
  const rlEl = document.getElementById('recentLeads');
  rlEl.innerHTML = recent.length ? recent.map(l => `
    <div class="dash-item">
      <div class="dash-item-info">
        <span class="dash-item-name">${l.name}</span>
        <span class="dash-item-meta">${l.address} — ${l.size_sqft ? l.size_sqft + ' sqft' : ''}</span>
      </div>
      <button class="btn-icon btn-wa-sm" onclick="waLead('${l.id}')" title="WhatsApp">📱</button>
    </div>
  `).join('') : '<p class="empty">No hay solicitudes nuevas</p>';
}

function getClientTier(client) {
  return computeClientScore(client);
}

// ============================================
// LEADS
// ============================================
let leadFilter = '';
function renderLeads() {
  let leads = DB.get('leads', []);
  if (leadFilter) {
    const f = leadFilter.toLowerCase();
    leads = leads.filter(l => l.name.toLowerCase().includes(f) || l.phone.includes(f) || l.address.toLowerCase().includes(f));
  }
  leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const tbody = document.getElementById('leadsTable');
  tbody.innerHTML = leads.length ? leads.map(l => `
    <tr>
      <td><strong>${l.name}</strong></td>
      <td>${l.phone}</td>
      <td>${l.address}</td>
      <td>${l.size_sqft ? l.size_sqft + ' sqft' : '-'}<br>${l.frequency ? FREQ_LABELS[l.frequency] : ''}</td>
      <td><span class="badge badge-${l.status}">${STATUS_LABELS[l.status] || l.status}</span></td>
      <td>${formatDate(l.created_at)}</td>
      <td>
        <button class="btn-icon btn-wa-sm" onclick="waLead('${l.id}')" title="WhatsApp">📱</button>
        <button class="btn-icon btn-edit" onclick="quoteLead('${l.id}')" title="Cotizar">💰</button>
        <button class="btn-icon btn-convert" onclick="convertLead('${l.id}')" title="Convertir">👤</button>
        <button class="btn-icon" onclick="cycleLeadStatus('${l.id}')" title="Estado">🔄</button>
        <button class="btn-icon btn-delete" onclick="deleteLead('${l.id}')" title="Eliminar">🗑</button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="7" class="empty-cell">No hay solicitudes</td></tr>';
}

function filterLeads() { leadFilter = document.getElementById('leadSearch').value; renderLeads(); }

function saveLeadModal() {
  const lead = {
    id: 'lead_' + Date.now(),
    name: document.getElementById('mLeadName').value.trim(),
    phone: document.getElementById('mLeadPhone').value.trim(),
    address: document.getElementById('mLeadAddress').value.trim(),
    size_sqft: document.getElementById('mLeadSize').value ? parseInt(document.getElementById('mLeadSize').value) : null,
    frequency: document.getElementById('mLeadFreq').value || null,
    extras_requested: [],
    notes: document.getElementById('mLeadNotes').value.trim(),
    status: 'nuevo', assigned_price: null, angie_notes: '', whatsapp_sent: false,
    created_at: DB.now()
  };
  if (!lead.name || !lead.phone || !lead.address) { alert('Completa los campos obligatorios'); return; }
  const leads = DB.get('leads', []); leads.unshift(lead); DB.set('leads', leads);
  closeModal('leadModal'); renderLeads(); renderDashboard();
}

function waLead(id) {
  const l = DB.get('leads', []).find(x => x.id === id);
  if (!l) return;
  let msg = 'Hola ' + l.name + ', soy Anggie de Ad Sparkling Cleaning. ';
  if (l.assigned_price) {
    msg += 'Tu cotización es de $' + l.assigned_price + '. ';
    if (l.angie_notes) msg += l.angie_notes + ' ';
  } else {
    msg += 'Recibí tu solicitud de cotización. ¿Podemos coordinar una visita para evaluar tu hogar? ';
  }
  msg += '¿Qué día te funciona mejor?';
  window.open('https://wa.me/' + cleanPhone(l.phone) + '?text=' + encodeURIComponent(msg), '_blank');
  const leads = DB.get('leads', []);
  const idx = leads.findIndex(x => x.id === id);
  if (idx >= 0) { leads[idx].whatsapp_sent = true; DB.set('leads', leads); }
}

function quoteLead(id) {
  const l = DB.get('leads', []).find(x => x.id === id);
  if (!l) return;
  document.getElementById('mQuoteLeadId').value = id;
  document.getElementById('mQuoteLeadInfo').innerHTML = `<strong>${l.name}</strong> — ${l.phone}<br>${l.address} | ${l.size_sqft ? l.size_sqft + ' sqft' : 'Sin tamaño'} | ${l.frequency ? FREQ_LABELS[l.frequency] : 'Sin frecuencia'}`;
  document.getElementById('mQuotePrice').value = l.assigned_price || '';
  document.getElementById('mQuoteFreq').value = l.frequency || '';
  openModal('quoteLeadModal');
}

function saveQuoteOnly() {
  const id = document.getElementById('mQuoteLeadId').value;
  const price = parseFloat(document.getElementById('mQuotePrice').value);
  const freq = document.getElementById('mQuoteFreq').value;
  const msg = document.getElementById('mQuoteMessage').value.trim();
  const leads = DB.get('leads', []);
  const idx = leads.findIndex(l => l.id === id);
  if (idx >= 0) {
    leads[idx].assigned_price = price || null;
    leads[idx].frequency = freq || leads[idx].frequency;
    leads[idx].angie_notes = msg;
    leads[idx].status = 'contactado';
    DB.set('leads', leads);
  }
  closeModal('quoteLeadModal'); renderLeads(); renderDashboard();
}

function sendQuoteFromModal() { saveQuoteOnly(); waLead(document.getElementById('mQuoteLeadId').value); }

function convertLead(id) {
  const l = DB.get('leads', []).find(x => x.id === id);
  if (!l) return;
  if (!confirm('¿Convertir "' + l.name + '" en cliente?')) return;
  const client = {
    id: 'c_' + Date.now(), name: l.name, phone: l.phone, address: l.address,
    size_sqft: l.size_sqft, frequency: l.frequency, base_price: l.assigned_price,
    notes: l.notes, status: 'activo', last_visit: null, next_visit: null,
    rating: 3, cancelCount: 0, totalRevenue: 0, totalAppointments: 0,
    contractStatus: 'activo', paymentDueDate: null
  };
  const clients = DB.get('clients', []); clients.push(client); DB.set('clients', clients);
  const leads = DB.get('leads', []);
  const idx = leads.findIndex(x => x.id === id);
  if (idx >= 0) { leads[idx].status = 'agendado'; DB.set('leads', leads); }
  renderLeads(); renderClients(); renderDashboard();
  alert('Cliente creado ✅');
}

function cycleLeadStatus(id) {
  const leads = DB.get('leads', []);
  const idx = leads.findIndex(l => l.id === id);
  if (idx < 0) return;
  const states = ['nuevo', 'contactado', 'agendado', 'descartado'];
  leads[idx].status = states[(states.indexOf(leads[idx].status) + 1) % states.length];
  DB.set('leads', leads); renderLeads();
}

function deleteLead(id) {
  if (!confirm('¿Eliminar esta solicitud?')) return;
  DB.set('leads', DB.get('leads', []).filter(l => l.id !== id));
  renderLeads(); renderDashboard();
}

// ============================================
// CLIENTES (con Scoring)
// ============================================
let clientFilter = '';
let clientSort = 'name'; // name, score, revenue, visits, lastVisit

function renderClients() {
  let clients = DB.get('clients', []);
  if (clientFilter) {
    const f = clientFilter.toLowerCase();
    clients = clients.filter(c => c.name.toLowerCase().includes(f) || c.phone.includes(f));
  }

  // Compute scores for sorting
  clients = clients.map(c => ({ ...c, _score: computeClientScore(c) }));

  if (clientSort === 'name') clients.sort((a, b) => a.name.localeCompare(b.name));
  else if (clientSort === 'score') clients.sort((a, b) => b._score.score - a._score.score);
  else if (clientSort === 'revenue') clients.sort((a, b) => b._score.revenue - a._score.revenue);
  else if (clientSort === 'visits') clients.sort((a, b) => b._score.completed - a._score.completed);
  else if (clientSort === 'lastVisit') clients.sort((a, b) => (b.last_visit || '0').localeCompare(a.last_visit || '0'));

  const tbody = document.getElementById('clientsTable');
  tbody.innerHTML = clients.length ? clients.map(c => {
    const s = c._score;
    return `<tr>
      <td>
        <strong>${c.name}</strong>
        <div class="client-tier tier-${s.tier}">${s.tierIcon} ${s.tierLabel}</div>
      </td>
      <td>${c.phone}</td>
      <td>${c.address}</td>
      <td>$${c.base_price || '-'}</td>
      <td>${c.frequency ? FREQ_LABELS[c.frequency] : '-'}</td>
      <td>${formatDate(c.last_visit)}</td>
      <td><span class="badge badge-${c.status}">${STATUS_LABELS[c.status] || c.status}</span></td>
      <td>
        <div class="client-score-bar" title="Score: ${s.score}/100">
          <div class="client-score-fill" style="width:${s.score}%;background:${s.score >= 70 ? '#2d8a5e' : s.score >= 40 ? '#d4a017' : '#c0392b'}"></div>
        </div>
      </td>
      <td>
        <button class="btn-icon btn-wa-sm" onclick="waClient('${c.id}')" title="WhatsApp">📱</button>
        <button class="btn-icon btn-edit" onclick="editClient('${c.id}')" title="Editar">✏️</button>
        <button class="btn-icon btn-convert" onclick="quickAppt('${c.id}')" title="Agendar">📅</button>
        <button class="btn-icon btn-delete" onclick="deleteClient('${c.id}')" title="Eliminar">🗑</button>
      </td>
    </tr>`;
  }).join('') : '<tr><td colspan="9" class="empty-cell">No hay clientes</td></tr>';

  // Render client ranking summary
  renderClientRanking(clients);
}

function renderClientRanking(allClients) {
  const container = document.getElementById('clientRanking');
  if (!container) return;

  const scored = allClients.map(c => ({ ...c, score: computeClientScore(c) }));
  const best = scored.filter(c => c.score.tier === 'vip').slice(0, 3);
  const worst = scored.filter(c => c.score.tier === 'problematico' || c.score.tier === 'riesgo').slice(0, 3);
  const frequent = scored.sort((a, b) => b.score.completed - a.score.completed).slice(0, 3);

  container.innerHTML = `
    <div class="ranking-grid">
      <div class="ranking-card">
        <h4>🏆 Mejores clientes</h4>
        ${best.length ? best.map(c => `<div class="rank-item"><span>${c.name}</span><span class="rank-score">${c.score.score} pts</span></div>`).join('') : '<span class="rank-empty">Sin datos</span>'}
      </div>
      <div class="ranking-card">
        <h4>⚠️ Necesitan atención</h4>
        ${worst.length ? worst.map(c => `<div class="rank-item rank-warn"><span>${c.name}</span><span class="rank-score">${c.score.cancelRate.toFixed(0)}% cancel</span></div>`).join('') : '<span class="rank-empty">Todos bien</span>'}
      </div>
      <div class="ranking-card">
        <h4>🔄 Más frecuentes</h4>
        ${frequent.length ? frequent.map(c => `<div class="rank-item"><span>${c.name}</span><span class="rank-score">${c.score.completed} visitas</span></div>`).join('') : '<span class="rank-empty">Sin datos</span>'}
      </div>
    </div>
  `;
}

function filterClients() { clientFilter = document.getElementById('clientSearch').value; renderClients(); }
function sortClients(sortBy) { clientSort = sortBy; renderClients(); }

function saveClientModal() {
  const id = document.getElementById('mClientId').value;
  const data = {
    name: document.getElementById('mClientName').value.trim(),
    phone: document.getElementById('mClientPhone').value.trim(),
    address: document.getElementById('mClientAddress').value.trim(),
    size_sqft: document.getElementById('mClientSize').value ? parseInt(document.getElementById('mClientSize').value) : null,
    frequency: document.getElementById('mClientFreq').value || null,
    base_price: document.getElementById('mClientPrice').value ? parseInt(document.getElementById('mClientPrice').value) : null,
    next_visit: document.getElementById('mClientNext').value || null,
    status: document.getElementById('mClientStatus').value,
    notes: document.getElementById('mClientNotes').value.trim(),
    contractStatus: document.getElementById('mClientContract').value,
    paymentDueDate: document.getElementById('mClientPaymentDue').value || null
  };
  if (!data.name || !data.phone || !data.address) { alert('Nombre, teléfono y dirección son obligatorios'); return; }

  const clients = DB.get('clients', []);
  if (id) {
    const idx = clients.findIndex(c => c.id === id);
    if (idx >= 0) clients[idx] = { ...clients[idx], ...data };
  } else {
    data.id = 'c_' + Date.now(); data.last_visit = null;
    data.rating = 3; data.cancelCount = 0; data.totalRevenue = 0; data.totalAppointments = 0;
    clients.push(data);
  }
  DB.set('clients', clients);
  closeModal('clientModal'); renderClients(); renderDashboard();
}

function editClient(id) {
  const c = DB.get('clients', []).find(x => x.id === id);
  if (!c) return;
  document.getElementById('clientModalTitle').textContent = 'Editar cliente';
  document.getElementById('mClientId').value = c.id;
  document.getElementById('mClientName').value = c.name;
  document.getElementById('mClientPhone').value = c.phone;
  document.getElementById('mClientAddress').value = c.address;
  document.getElementById('mClientSize').value = c.size_sqft || '';
  document.getElementById('mClientFreq').value = c.frequency || '';
  document.getElementById('mClientPrice').value = c.base_price || '';
  document.getElementById('mClientNext').value = c.next_visit || '';
  document.getElementById('mClientStatus').value = c.status;
  document.getElementById('mClientNotes').value = c.notes || '';
  document.getElementById('mClientContract').value = c.contractStatus || 'activo';
  document.getElementById('mClientPaymentDue').value = c.paymentDueDate || '';
  openModal('clientModal');
}

function waClient(id) {
  const c = DB.get('clients', []).find(x => x.id === id);
  if (!c) return;
  window.open('https://wa.me/' + cleanPhone(c.phone), '_blank');
}

function deleteClient(id) {
  if (!confirm('¿Eliminar este cliente? Se perderán sus citas.')) return;
  DB.set('clients', DB.get('clients', []).filter(c => c.id !== id));
  DB.set('appointments', DB.get('appointments', []).filter(a => a.client_id !== id));
  renderClients(); renderDashboard();
}

function quickAppt(clientId) {
  showTab('citas');
  document.getElementById('mApptClient').value = clientId;
  fillApptPrice();
  openModal('appointmentModal');
}

// ============================================
// CITAS
// ============================================
function renderAppointments() {
  const appts = DB.get('appointments', []).sort((a, b) => b.date.localeCompare(a.date));
  const clients = DB.get('clients', []);

  const tbody = document.getElementById('appointmentsTable');
  tbody.innerHTML = appts.length ? appts.map(a => {
    const c = clients.find(x => x.id === a.client_id);
    return `<tr>
      <td>${formatDate(a.date)} ${a.time || ''}</td>
      <td><strong>${c?.name || 'Desconocido'}</strong></td>
      <td>${c?.address || '-'}</td>
      <td>$${a.price}</td>
      <td>${a.cleaning_time ? Math.floor(a.cleaning_time/60) + 'h ' + (a.cleaning_time%60) + 'm' : '-'}</td>
      <td><span class="badge badge-${a.status}">${STATUS_LABELS[a.status] || a.status}</span></td>
      <td><span class="pay-badge pay-${a.paymentStatus}">${STATUS_LABELS[a.paymentStatus] || a.paymentStatus}</span></td>
      <td>
        <button class="btn-icon btn-edit" onclick="editAppt('${a.id}')" title="Editar">✏️</button>
        ${a.status === 'pendiente' ? `<button class="btn-icon btn-convert" onclick="completeAppt('${a.id}')" title="Completar">✓</button>` : ''}
        ${a.status === 'completada' && a.paymentStatus !== 'pagado' ? `<button class="btn-icon btn-wa-sm" onclick="markApptPaid('${a.id}')" title="Marcar pagado">💵</button>` : ''}
        <button class="btn-icon btn-delete" onclick="deleteAppt('${a.id}')" title="Eliminar">🗑</button>
      </td>
    </tr>`;
  }).join('') : '<tr><td colspan="8" class="empty-cell">No hay citas</td></tr>';
}

function populateClientSelect() {
  const clients = DB.get('clients', []).filter(c => c.status === 'activo').sort((a, b) => a.name.localeCompare(b.name));
  const opts = '<option value="">Seleccionar cliente...</option>' + 
    clients.map(c => `<option value="${c.id}" data-price="${c.base_price || ''}">${c.name} — ${c.address}</option>`).join('');
  document.getElementById('mApptClient').innerHTML = opts;
  document.getElementById('qClient').innerHTML = '<option value="">-- Cliente nuevo --</option>' + 
    clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function fillApptPrice() {
  const sel = document.getElementById('mApptClient');
  const price = sel.options[sel.selectedIndex]?.dataset.price;
  if (price) document.getElementById('mApptPrice').value = price;
}

function saveApptModal() {
  const id = document.getElementById('mApptId').value;
  const clientId = document.getElementById('mApptClient').value;
  if (!clientId) { alert('Selecciona un cliente'); return; }

  const data = {
    client_id: clientId,
    date: document.getElementById('mApptDate').value,
    time: document.getElementById('mApptTime').value.trim(),
    price: parseInt(document.getElementById('mApptPrice').value) || 0,
    cleaning_time: document.getElementById('mApptTimeSpent').value ? parseInt(document.getElementById('mApptTimeSpent').value) : null,
    status: document.getElementById('mApptStatus').value,
    paymentStatus: document.getElementById('mApptPayment').value,
    contractType: document.getElementById('mApptContract').value,
    notes: document.getElementById('mApptNotes').value.trim(),
    addons: []
  };
  if (!data.date) { alert('La fecha es obligatoria'); return; }

  const appts = DB.get('appointments', []);
  const oldAppt = id ? appts.find(a => a.id === id) : null;

  if (id) {
    const idx = appts.findIndex(a => a.id === id);
    if (idx >= 0) appts[idx] = { ...appts[idx], ...data };
  } else {
    data.id = 'a_' + Date.now();
    appts.push(data);
  }
  DB.set('appointments', appts);

  // Update client stats
  updateClientStats(clientId);

  // Handle status changes
  if (data.status === 'cancelada' && (!oldAppt || oldAppt.status !== 'cancelada')) {
    const clients = DB.get('clients', []);
    const cidx = clients.findIndex(c => c.id === clientId);
    if (cidx >= 0) { clients[cidx].cancelCount = (clients[cidx].cancelCount || 0) + 1; DB.set('clients', clients); }
  }

  closeModal('appointmentModal');
  document.getElementById('apptModalTitle').textContent = 'Nueva cita';
  renderAppointments(); renderDashboard(); renderCalendar();
}

function updateClientStats(clientId) {
  const appts = DB.get('appointments', []).filter(a => a.client_id === clientId);
  const completed = appts.filter(a => a.status === 'completada');
  const revenue = completed.reduce((s, a) => s + (a.price || 0), 0);
  const clients = DB.get('clients', []);
  const idx = clients.findIndex(c => c.id === clientId);
  if (idx >= 0) {
    clients[idx].totalAppointments = completed.length;
    clients[idx].totalRevenue = revenue;
    if (completed.length > 0) {
      const last = completed.sort((a, b) => b.date.localeCompare(a.date))[0];
      clients[idx].last_visit = last.date;
    }
    DB.set('clients', clients);
  }
}

function editAppt(id) {
  const a = DB.get('appointments', []).find(x => x.id === id);
  if (!a) return;
  populateClientSelect();
  document.getElementById('apptModalTitle').textContent = 'Editar cita';
  document.getElementById('mApptId').value = a.id;
  document.getElementById('mApptClient').value = a.client_id;
  document.getElementById('mApptDate').value = a.date;
  document.getElementById('mApptTime').value = a.time || '';
  document.getElementById('mApptPrice').value = a.price;
  document.getElementById('mApptTimeSpent').value = a.cleaning_time || '';
  document.getElementById('mApptStatus').value = a.status;
  document.getElementById('mApptPayment').value = a.paymentStatus || 'pendiente_pago';
  document.getElementById('mApptContract').value = a.contractType || 'regular';
  document.getElementById('mApptNotes').value = a.notes || '';
  openModal('appointmentModal');
}

function completeAppt(id) {
  const appts = DB.get('appointments', []);
  const idx = appts.findIndex(a => a.id === id);
  if (idx < 0) return;
  appts[idx].status = 'completada';
  DB.set('appointments', appts);
  updateClientStats(appts[idx].client_id);
  renderAppointments(); renderDashboard(); renderCalendar();
}

function markApptPaid(id) {
  const appts = DB.get('appointments', []);
  const idx = appts.findIndex(a => a.id === id);
  if (idx < 0) return;
  appts[idx].paymentStatus = 'pagado';
  DB.set('appointments', appts);
  renderAppointments(); renderDashboard(); renderFinanzas();
}

function deleteAppt(id) {
  if (!confirm('¿Eliminar esta cita?')) return;
  const appt = DB.get('appointments', []).find(a => a.id === id);
  DB.set('appointments', DB.get('appointments', []).filter(a => a.id !== id));
  if (appt) updateClientStats(appt.client_id);
  renderAppointments(); renderDashboard(); renderCalendar();
}

// ============================================
// CALENDARIO
// ============================================
let calCurrentDate = new Date();
let calView = 'month'; // month, week

function renderCalendar() {
  const container = document.getElementById('calendarContainer');
  if (!container) return;

  const year = calCurrentDate.getFullYear();
  const month = calCurrentDate.getMonth();

  document.getElementById('calMonthYear').textContent = calCurrentDate.toLocaleDateString('es-US', { month: 'long', year: 'numeric' });

  const appts = DB.get('appointments', []);
  const clients = DB.get('clients', []);

  if (calView === 'month') {
    renderMonthView(container, year, month, appts, clients);
  } else {
    renderWeekView(container, year, month, appts, clients);
  }
}

function renderMonthView(container, year, month, appts, clients) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  let html = '<div class="cal-grid">';
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  dayNames.forEach(d => html += `<div class="cal-day-header">${d}</div>`);

  for (let i = 0; i < startPad; i++) html += '<div class="cal-day empty"></div>';

  const todayStr = new Date().toISOString().split('T')[0];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayAppts = appts.filter(a => a.date === dateStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    const isToday = dateStr === todayStr;

    html += `<div class="cal-day ${isToday ? 'today' : ''}" onclick="showDayDetails('${dateStr}')">`;
    html += `<div class="cal-day-num">${d}</div>`;
    if (dayAppts.length > 0) {
      html += '<div class="cal-day-events">';
      dayAppts.forEach(a => {
        const c = clients.find(x => x.id === a.client_id);
        const statusColor = a.status === 'completada' ? 'green' : a.status === 'cancelada' ? 'red' : a.status === 'no_show' ? 'gray' : 'orange';
        html += `<div class="cal-event cal-${statusColor}" title="${c?.name || 'Desconocido'} — ${a.time || 'Sin hora'} — $${a.price}">
          <span class="cal-event-time">${a.time || '—'}</span>
          <span class="cal-event-name">${c?.name?.split(' ')[0] || '?'}</span>
          <span class="cal-event-pay pay-${a.paymentStatus}"></span>
        </div>`;
      });
      html += '</div>';
    }
    html += '</div>';
  }
  html += '</div>';
  container.innerHTML = html;
}

function renderWeekView(container, year, month, appts, clients) {
  // Simple week view showing next 7 days from current date
  let html = '<div class="cal-week">';
  for (let i = 0; i < 7; i++) {
    const d = new Date(calCurrentDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayAppts = appts.filter(a => a.date === dateStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    const isToday = i === 0;

    html += `<div class="cal-week-day ${isToday ? 'today' : ''}">`;
    html += `<div class="cal-week-header">${d.toLocaleDateString('es-US', { weekday: 'short', day: 'numeric' })}</div>`;
    html += '<div class="cal-week-events">';
    if (dayAppts.length === 0) {
      html += '<div class="cal-week-empty">Sin citas</div>';
    } else {
      dayAppts.forEach(a => {
        const c = clients.find(x => x.id === a.client_id);
        const statusColor = a.status === 'completada' ? 'green' : a.status === 'cancelada' ? 'red' : a.status === 'no_show' ? 'gray' : 'orange';
        html += `<div class="cal-week-event cal-${statusColor}">
          <div class="cal-week-time">${a.time || '—'}</div>
          <div class="cal-week-client">${c?.name || '?'}</div>
          <div class="cal-week-meta">$${a.price} · ${STATUS_LABELS[a.paymentStatus] || a.paymentStatus}</div>
        </div>`;
      });
    }
    html += '</div></div>';
  }
  html += '</div>';
  container.innerHTML = html;
}

function showDayDetails(dateStr) {
  const appts = DB.get('appointments', []).filter(a => a.date === dateStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const clients = DB.get('clients', []);

  let html = `<h3>${formatDate(dateStr)}</h3>`;
  if (appts.length === 0) {
    html += '<p class="empty">Sin citas este día</p>';
  } else {
    html += '<div class="day-details-list">';
    appts.forEach(a => {
      const c = clients.find(x => x.id === a.client_id);
      html += `<div class="day-detail-item">
        <div class="day-detail-time">${a.time || 'Sin hora'}</div>
        <div class="day-detail-info">
          <strong>${c?.name || 'Desconocido'}</strong>
          <span>${c?.address || ''} · $${a.price}</span>
          <span class="badge badge-${a.status}">${STATUS_LABELS[a.status]}</span>
          <span class="pay-badge pay-${a.paymentStatus}">${STATUS_LABELS[a.paymentStatus]}</span>
        </div>
        <div class="day-detail-actions">
          <button class="btn-icon btn-wa-sm" onclick="waClient('${a.client_id}')">📱</button>
          ${a.status === 'pendiente' ? `<button class="btn-icon btn-convert" onclick="completeAppt('${a.id}')">✓</button>` : ''}
        </div>
      </div>`;
    });
    html += '</div>';
  }

  document.getElementById('dayDetailContent').innerHTML = html;
  openModal('dayDetailModal');
}

function prevCalMonth() { calCurrentDate.setMonth(calCurrentDate.getMonth() - 1); renderCalendar(); }
function nextCalMonth() { calCurrentDate.setMonth(calCurrentDate.getMonth() + 1); renderCalendar(); }
function todayCal() { calCurrentDate = new Date(); renderCalendar(); }
function setCalView(view) { calView = view; renderCalendar(); }

// ============================================
// GASTOS
// ============================================
function renderExpenses() {
  const expenses = DB.get('expenses', []).sort((a, b) => b.date.localeCompare(a.date));

  const tbody = document.getElementById('expensesTable');
  tbody.innerHTML = expenses.length ? expenses.map(e => `
    <tr>
      <td>${formatDate(e.date)}</td>
      <td><span class="badge" style="background:${catColor(e.category)}20;color:${catColor(e.category)}">${e.category}</span></td>
      <td>${e.description || '-'}</td>
      <td><strong>$${parseFloat(e.amount).toFixed(2)}</strong></td>
      <td><button class="btn-icon btn-delete" onclick="deleteExpense('${e.id}')">🗑</button></td>
    </tr>
  `).join('') : '<tr><td colspan="5" class="empty-cell">No hay gastos</td></tr>';
}

function populateExpenseCategories() {
  const cats = DB.get('config', {}).expenseCategories || [];
  document.getElementById('mExpCat').innerHTML = '<option value="">Categoría...</option>' + 
    cats.map(c => `<option value="${c}">${c}</option>`).join('');
  document.getElementById('mExpDate').value = new Date().toISOString().split('T')[0];
}

function saveExpenseModal() {
  const data = {
    id: 'e_' + Date.now(),
    category: document.getElementById('mExpCat').value,
    amount: parseFloat(document.getElementById('mExpAmount').value),
    date: document.getElementById('mExpDate').value,
    description: document.getElementById('mExpDesc').value.trim()
  };
  if (!data.category || isNaN(data.amount)) { alert('Categoría y monto son obligatorios'); return; }

  const expenses = DB.get('expenses', []); expenses.push(data); DB.set('expenses', expenses);
  closeModal('expenseModal'); renderExpenses(); renderDashboard();
}

function deleteExpense(id) {
  if (!confirm('¿Eliminar este gasto?')) return;
  DB.set('expenses', DB.get('expenses', []).filter(e => e.id !== id));
  renderExpenses(); renderDashboard();
}

function catColor(cat) {
  const map = { 'Insumos': '#1565c0', 'Gasolina': '#e65100', 'Auto': '#2e7d32', 'Salario asistente': '#6a1b9a', 'Equipo': '#d4a017', 'Otro': '#5a5a6e' };
  return map[cat] || '#5a5a6e';
}

// ============================================
// COTIZADOR
// ============================================
function renderCotizador() {
  populateClientSelect();

  const tbody = document.getElementById('refTableBody');
  tbody.innerHTML = Object.entries(SIZE_LABELS).map(([k, label]) => {
    const p = PRICING[k];
    return `<tr><td><strong>${label}</strong></td><td>$${p[10]}</td><td>$${p[15]}</td><td>$${p[30]}</td><td>$${p.deep}</td></tr>`;
  }).join('');

  const extras = (DB.get('config', {}).extras || []).filter(e => e.active);
  document.getElementById('refExtras').innerHTML = extras.map(e => 
    `<span class="ref-extra-tag">${e.name}: $${e.price}${e.perUnit ? '/u' : ''}</span>`
  ).join('');

  const qContainer = document.getElementById('quoteAddons');
  qContainer.innerHTML = extras.map(e => `
    <label class="quote-addon-item">
      <input type="checkbox" value="${e.id}" data-price="${e.price}" onchange="calcQuote()">
      <span>${e.name} +$${e.price}${e.perUnit ? '/u' : ''}</span>
    </label>
  `).join('');

  calcQuote();
}

function autoFillClient() {
  const sel = document.getElementById('qClient');
  const cid = sel.value;
  if (!cid) return;
  const c = DB.get('clients', []).find(x => x.id === cid);
  if (!c) return;
  document.getElementById('qName').value = c.name;
  document.getElementById('qPhone').value = c.phone;
  document.getElementById('qSize').value = c.size_sqft || '';
  document.getElementById('qFinalPrice').value = c.base_price || '';
  calcQuote();
}

function calcQuote() {
  const size = parseInt(document.getElementById('qSize').value);
  const freq = document.getElementById('qFreq').value;
  let total = 0;
  if (size && PRICING[size] && PRICING[size][freq]) total = PRICING[size][freq];
  document.querySelectorAll('#quoteAddons input:checked').forEach(el => {
    total += parseInt(el.dataset.price) || 0;
  });
  document.getElementById('qCalcPrice').value = total || '';
  const finalInput = document.getElementById('qFinalPrice');
  const final = finalInput.value ? parseInt(finalInput.value) : total;
  document.getElementById('qDisplayTotal').textContent = '$' + (final || 0);
}

function sendQuoteWhatsApp() {
  const name = document.getElementById('qName').value.trim();
  const phone = document.getElementById('qPhone').value.trim();
  const final = document.getElementById('qFinalPrice').value || document.getElementById('qCalcPrice').value;
  const notes = document.getElementById('qNotes').value.trim();
  if (!name || !phone || !final) { alert('Completa nombre, teléfono y precio'); return; }

  let msg = '¡Hola ' + name + '! Soy Anggie de *Ad Sparkling Cleaning*.\n\n';
  msg += 'Tu cotización personalizada:\n';
  const size = document.getElementById('qSize');
  if (size.value) msg += '📍 Tamaño: ' + size.options[size.selectedIndex].text + '\n';
  msg += '💰 *Total: $' + final + '*\n';
  if (notes) msg += '📝 ' + notes + '\n';
  msg += '\n¿Te gustaría agendar? Confírmanos tu dirección completa. ¡Gracias! ✨';
  window.open('https://wa.me/' + cleanPhone(phone) + '?text=' + encodeURIComponent(msg), '_blank');
}

function saveQuoteAsLead() {
  const name = document.getElementById('qName').value.trim();
  const phone = document.getElementById('qPhone').value.trim();
  if (!name || !phone) { alert('Nombre y teléfono son obligatorios'); return; }
  const lead = {
    id: 'lead_' + Date.now(), name, phone, address: '',
    size_sqft: document.getElementById('qSize').value ? parseInt(document.getElementById('qSize').value) : null,
    frequency: document.getElementById('qFreq').value,
    extras_requested: [],
    notes: document.getElementById('qNotes').value,
    status: 'nuevo',
    assigned_price: document.getElementById('qFinalPrice').value ? parseInt(document.getElementById('qFinalPrice').value) : null,
    angie_notes: '', whatsapp_sent: false,
    created_at: DB.now()
  };
  const leads = DB.get('leads', []); leads.unshift(lead); DB.set('leads', leads);
  alert('Guardado como solicitud ✅'); renderLeads(); renderDashboard();
}

function saveQuoteAsClient() {
  const name = document.getElementById('qName').value.trim();
  const phone = document.getElementById('qPhone').value.trim();
  if (!name || !phone) { alert('Nombre y teléfono son obligatorios'); return; }
  const client = {
    id: 'c_' + Date.now(), name, phone, address: '',
    size_sqft: document.getElementById('qSize').value ? parseInt(document.getElementById('qSize').value) : null,
    frequency: document.getElementById('qFreq').value,
    base_price: document.getElementById('qFinalPrice').value ? parseInt(document.getElementById('qFinalPrice').value) : null,
    notes: document.getElementById('qNotes').value,
    status: 'activo', last_visit: null, next_visit: null,
    rating: 3, cancelCount: 0, totalRevenue: 0, totalAppointments: 0,
    contractStatus: 'activo', paymentDueDate: null
  };
  const clients = DB.get('clients', []); clients.push(client); DB.set('clients', clients);
  alert('Cliente creado ✅'); renderClients(); renderDashboard();
}

// ============================================
// FINANZAS PRO
// ============================================
function renderFinanzas() {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().split('T')[0].slice(0, 7));
  }

  const appts = DB.get('appointments', []).filter(a => a.status === 'completada');
  const expenses = DB.get('expenses', []);
  const clients = DB.get('clients', []);

  const data = months.map(m => {
    const rev = appts.filter(a => a.date.startsWith(m)).reduce((s, a) => s + a.price, 0);
    const exp = expenses.filter(e => e.date.startsWith(m)).reduce((s, e) => s + parseFloat(e.amount), 0);
    return { month: m, revenue: rev, expenses: exp, profit: rev - exp };
  });

  const totalRev = data.reduce((s, d) => s + d.revenue, 0);
  const totalExp = data.reduce((s, d) => s + d.expenses, 0);
  const avgRevPerAppt = appts.length > 0 ? totalRev / appts.length : 0;

  // Pagos pendientes y vencidos
  const pendingPayments = DB.get('appointments', []).filter(a => a.paymentStatus === 'pendiente_pago' && a.status === 'completada').reduce((s, a) => s + a.price, 0);
  const overduePayments = DB.get('appointments', []).filter(a => a.paymentStatus === 'vencido').reduce((s, a) => s + a.price, 0);
  const paidThisMonth = appts.filter(a => a.date.startsWith(months[5])).reduce((s, a) => s + a.price, 0);

  document.getElementById('finRevenue').textContent = '$' + totalRev.toLocaleString();
  document.getElementById('finExpenses').textContent = '$' + totalExp.toLocaleString();
  document.getElementById('finProfit').textContent = '$' + (totalRev - totalExp).toLocaleString();
  document.getElementById('finAvgPerAppt').textContent = '$' + avgRevPerAppt.toFixed(0);
  document.getElementById('finPending').textContent = '$' + pendingPayments.toLocaleString();
  document.getElementById('finOverdue').textContent = '$' + overduePayments.toLocaleString();
  document.getElementById('finPaidThisMonth').textContent = '$' + paidThisMonth.toLocaleString();

  drawBarChart('financeChart', data);

  const curMonth = now.toISOString().split('T')[0].slice(0, 7);
  const curExp = expenses.filter(e => e.date.startsWith(curMonth));
  const catTotals = {};
  curExp.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + parseFloat(e.amount); });
  drawPieChart('categoryChart', catTotals);

  // Revenue by client
  const revByClient = {};
  appts.forEach(a => {
    revByClient[a.client_id] = (revByClient[a.client_id] || 0) + a.price;
  });
  const topClients = Object.entries(revByClient)
    .map(([cid, rev]) => ({ name: clients.find(c => c.id === cid)?.name || 'Desconocido', revenue: rev }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const topClientEl = document.getElementById('topClientsChart');
  if (topClientEl && topClients.length > 0) {
    drawHorizontalBarChart('topClientsChart', topClients);
  } else if (topClientEl) {
    const ctx = topClientEl.getContext('2d');
    ctx.clearRect(0, 0, topClientEl.width, topClientEl.height);
    ctx.fillStyle = '#8a8a9e'; ctx.font = '14px Inter'; ctx.textAlign = 'center';
    ctx.fillText('Sin datos suficientes', topClientEl.width/2, topClientEl.height/2);
  }

  // Monthly trend projection
  const trend = data.map(d => d.profit);
  const avgGrowth = trend.length > 1 ? (trend[trend.length-1] - trend[0]) / (trend.length - 1) : 0;
  const projection = trend[trend.length-1] + avgGrowth;
  document.getElementById('finProjection').textContent = '$' + Math.round(projection).toLocaleString();
}

function drawBarChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const max = Math.max(...data.map(d => Math.max(d.revenue, d.expenses)), 1);
  const barW = 40, gap = 60, startX = 60, startY = h - 40;
  const chartH = h - 80;

  ctx.strokeStyle = '#e8e8ec'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(40, 20); ctx.lineTo(40, startY); ctx.lineTo(w-20, startY); ctx.stroke();

  data.forEach((d, i) => {
    const x = startX + i * (barW * 2 + gap);
    const rh = (d.revenue / max) * chartH;
    const eh = (d.expenses / max) * chartH;
    ctx.fillStyle = '#2d8a5e'; ctx.fillRect(x, startY - rh, barW, rh);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(x + barW + 4, startY - eh, barW, eh);
    ctx.fillStyle = '#5a5a6e'; ctx.font = '11px Inter'; ctx.textAlign = 'center';
    ctx.fillText(d.month.slice(5), x + barW, startY + 20);
  });

  ctx.fillStyle = '#2d8a5e'; ctx.fillRect(w - 140, 10, 12, 12);
  ctx.fillStyle = '#1a1a2e'; ctx.fillText('Ingresos', w - 110, 20);
  ctx.fillStyle = '#c0392b'; ctx.fillRect(w - 140, 28, 12, 12);
  ctx.fillStyle = '#1a1a2e'; ctx.fillText('Gastos', w - 110, 38);
}

function drawPieChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const total = Object.values(data).reduce((s, v) => s + v, 0);
  if (total === 0) { ctx.fillStyle = '#8a8a9e'; ctx.font = '14px Inter'; ctx.textAlign = 'center'; ctx.fillText('Sin datos este mes', w/2, h/2); return; }

  const colors = ['#1565c0', '#e65100', '#2e7d32', '#6a1b9a', '#d4a017', '#5a5a6e', '#c0392b'];
  let angle = -Math.PI / 2;
  const cx = w / 2 - 80, cy = h / 2, r = Math.min(w, h) / 2 - 40;

  Object.entries(data).forEach(([cat, val], i) => {
    const slice = (val / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.fillStyle = colors[i % colors.length]; ctx.fill();
    angle += slice;
  });

  let ly = 30;
  Object.entries(data).forEach(([cat, val], i) => {
    ctx.fillStyle = colors[i % colors.length]; ctx.fillRect(w - 200, ly, 12, 12);
    ctx.fillStyle = '#1a1a2e'; ctx.font = '12px Inter'; ctx.textAlign = 'left';
    ctx.fillText(cat + ' ($' + val.toFixed(0) + ')', w - 180, ly + 10);
    ly += 22;
  });
}

function drawHorizontalBarChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const max = Math.max(...data.map(d => d.revenue), 1);
  const barH = 28, gap = 12, startY = 30, startX = 140;
  const chartW = w - startX - 40;

  data.forEach((d, i) => {
    const y = startY + i * (barH + gap);
    const bw = (d.revenue / max) * chartW;
    ctx.fillStyle = '#e8e8ec'; ctx.fillRect(startX, y, chartW, barH);
    ctx.fillStyle = '#2d8a5e'; ctx.fillRect(startX, y, bw, barH);
    ctx.fillStyle = '#1a1a2e'; ctx.font = '12px Inter'; ctx.textAlign = 'right';
    ctx.fillText(d.name, startX - 10, y + barH/2 + 4);
    ctx.fillStyle = '#fff'; ctx.font = '11px Inter'; ctx.textAlign = 'left';
    ctx.fillText('$' + d.revenue.toLocaleString(), startX + 8, y + barH/2 + 4);
  });
}

// ============================================
// CONFIGURACIÓN
// ============================================
function renderConfig() {
  const cfg = DB.get('config', {});
  document.getElementById('cfgName').value = cfg.companyName || '';
  document.getElementById('cfgPhone').value = cfg.phone || '';
  document.getElementById('cfgAddress').value = cfg.address || '';

  const exContainer = document.getElementById('configExtras');
  exContainer.innerHTML = (cfg.extras || []).map((e, i) => `
    <div class="config-item">
      <input type="checkbox" ${e.active ? 'checked' : ''} onchange="toggleExtraActive(${i})">
      <input type="text" value="${e.name}" onchange="updateExtra(${i}, 'name', this.value)" placeholder="Nombre">
      <input type="number" value="${e.price}" onchange="updateExtra(${i}, 'price', this.value)" placeholder="Precio">
      <button class="btn-icon btn-delete" onclick="removeExtra(${i})">🗑</button>
    </div>
  `).join('');

  const niContainer = document.getElementById('configNotIncluded');
  niContainer.innerHTML = (cfg.notIncluded || []).map((n, i) => `
    <div class="config-item">
      <input type="checkbox" ${n.active ? 'checked' : ''} onchange="toggleNotIncludedActive(${i})">
      <input type="text" value="${n.name}" onchange="updateNotIncluded(${i}, this.value)" placeholder="Nombre" style="flex:1">
      <button class="btn-icon btn-delete" onclick="removeNotIncluded(${i})">🗑</button>
    </div>
  `).join('');

  const ecContainer = document.getElementById('configExpenseCats');
  ecContainer.innerHTML = (cfg.expenseCategories || []).map((c, i) => `
    <div class="config-item">
      <input type="text" value="${c}" onchange="updateExpenseCat(${i}, this.value)" placeholder="Categoría" style="flex:1">
      <button class="btn-icon btn-delete" onclick="removeExpenseCat(${i})">🗑</button>
    </div>
  `).join('');
}

function saveCompanyConfig() {
  const cfg = DB.get('config', {});
  cfg.companyName = document.getElementById('cfgName').value;
  cfg.phone = document.getElementById('cfgPhone').value;
  cfg.address = document.getElementById('cfgAddress').value;
  DB.set('config', cfg);
  alert('Configuración guardada ✅');
}

function addExtraItem() {
  const cfg = DB.get('config', {});
  cfg.extras = cfg.extras || [];
  cfg.extras.push({ id: 'ex_' + Date.now(), name: 'Nuevo adicional', price: 0, active: true });
  DB.set('config', cfg); renderConfig();
}
function updateExtra(i, field, val) {
  const cfg = DB.get('config', {});
  if (field === 'price') cfg.extras[i].price = parseInt(val) || 0;
  else cfg.extras[i].name = val;
  DB.set('config', cfg);
}
function toggleExtraActive(i) {
  const cfg = DB.get('config', {});
  cfg.extras[i].active = !cfg.extras[i].active;
  DB.set('config', cfg); renderConfig();
}
function removeExtra(i) {
  const cfg = DB.get('config', {}); cfg.extras.splice(i, 1); DB.set('config', cfg); renderConfig();
}

function addNotIncludedItem() {
  const cfg = DB.get('config', {});
  cfg.notIncluded = cfg.notIncluded || [];
  cfg.notIncluded.push({ id: 'ni_' + Date.now(), name: 'Nuevo item', active: true });
  DB.set('config', cfg); renderConfig();
}
function updateNotIncluded(i, val) {
  const cfg = DB.get('config', {}); cfg.notIncluded[i].name = val; DB.set('config', cfg);
}
function toggleNotIncludedActive(i) {
  const cfg = DB.get('config', {});
  cfg.notIncluded[i].active = !cfg.notIncluded[i].active;
  DB.set('config', cfg); renderConfig();
}
function removeNotIncluded(i) {
  const cfg = DB.get('config', {}); cfg.notIncluded.splice(i, 1); DB.set('config', cfg); renderConfig();
}

function addExpenseCategory() {
  const cfg = DB.get('config', {});
  cfg.expenseCategories = cfg.expenseCategories || [];
  cfg.expenseCategories.push('Nueva categoría');
  DB.set('config', cfg); renderConfig();
}
function updateExpenseCat(i, val) {
  const cfg = DB.get('config', {}); cfg.expenseCategories[i] = val; DB.set('config', cfg);
}
function removeExpenseCat(i) {
  const cfg = DB.get('config', {}); cfg.expenseCategories.splice(i, 1); DB.set('config', cfg); renderConfig();
}

function resetAllData() {
  if (!confirm('⚠️ ¿ESTÁS SEGURA? Esto borra TODO. No se puede deshacer.')) return;
  if (prompt('Escribe BORRAR para confirmar:') !== 'BORRAR') return;
  localStorage.removeItem('asc_initialized_v3');
  localStorage.removeItem('asc_config');
  localStorage.removeItem('asc_leads');
  localStorage.removeItem('asc_clients');
  localStorage.removeItem('asc_appointments');
  localStorage.removeItem('asc_expenses');
  location.reload();
}

// ============================================
// UTILIDADES
// ============================================
function formatDate(str) {
  if (!str) return '-';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('es-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function cleanPhone(p) {
  return (p || '').replace(/[^0-9]/g, '');
}

// Sync landing -> admin
window.addEventListener('storage', (e) => {
  if (e.key === 'asc_notify_new_lead') { renderDashboard(); renderLeads(); }
});

// Init
function waAppt(clientId) {
  const c = DB.get('clients', []).find(x => x.id === clientId);
  if (c) window.open('https://wa.me/' + cleanPhone(c.phone), '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
  initData(); renderDashboard();
  document.getElementById('qSize')?.addEventListener('change', calcQuote);
  document.getElementById('qFreq')?.addEventListener('change', calcQuote);
  document.getElementById('qFinalPrice')?.addEventListener('input', calcQuote);
});
