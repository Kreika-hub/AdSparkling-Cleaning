/* ============================================
   ADMIN PANEL — Ad Sparkling Cleaning
   Autenticación Serverless y Sincronización
   ============================================ */

let adminToken = sessionStorage.getItem('admin_token') || null;

let customPricing = null;
try { customPricing = JSON.parse(localStorage.getItem('adsparkling_pricing')); } catch(e) {}
const PRICING = customPricing || {
  1200: { 10: 150, 15: 150, 30: 180, deep: 240 },
  1700: { 10: 165, 15: 170, 30: 200, deep: 270 },
  2200: { 10: 180, 15: 195, 30: 225, deep: 300 },
  2800: { 10: 200, 15: 220, 30: 260, deep: 350 },
  3500: { 10: 225, 15: 250, 30: 290, deep: 400 },
  4500: { 10: 250, 15: 280, 30: 340, deep: 450 }
};

const PRICING_ADDONS = { oven: 40, fridge: 50, cabinets: 50, overdue: 30 };

// ============================================
// SISTEMA DE TOASTS (Notificaciones Nativas)
// ============================================
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
  toast.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.remove(); }, 300);
  }, 3000);
}

// ============================================
// DATASTORE (PERSISTENCIA LOCAL & CLOUD SYNC)
// ============================================
const DataStore = {
  KEYS: {
    LEADS: 'adsparkling_leads',
    CLIENTS: 'adsparkling_clients',
    APPTS: 'adsparkling_appointments',
    EXPENSES: 'adsparkling_expenses',
    REVIEWS: 'adsparkling_reviews',
    PLANS: 'adsparkling_plans',
    CONTRACTS: 'adsparkling_contracts',
    TEAM: 'adsparkling_team',
    ASSIGNMENTS: 'adsparkling_assignments'
  },

  generateUUID() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  async init() {
    this.seedInitialData();
  },
  
  async cloudQuery(table, method, payload = null) {
    if (!adminToken) return { error: 'No token' };
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'query', token: adminToken, table, method, payload })
      });
      return await res.json();
    } catch (e) {
      console.error('Cloud Query Error:', e);
      return { error: e.message };
    }
  },

  async hydrateFromCloud() {
    console.log('Hydrating from cloud...');
    const tables = ['leads', 'clients', 'appointments', 'expenses', 'reviews', 'plans', 'contracts'];
    for (const t of tables) {
      const res = await this.cloudQuery(t, 'select');
      if (res && res.data) {
        let key;
        if(t === 'leads') key = this.KEYS.LEADS;
        if(t === 'clients') key = this.KEYS.CLIENTS;
        if(t === 'appointments') key = this.KEYS.APPTS;
        if(t === 'expenses') key = this.KEYS.EXPENSES;
        if(t === 'reviews') key = this.KEYS.REVIEWS;
        if(t === 'plans') key = this.KEYS.PLANS;
        if(t === 'contracts') key = this.KEYS.CONTRACTS;
        
        // Sincronizar datos locales que no están en la nube (ej: leads generados sin internet o en local)
        const localData = this.getList(key);
        if (localData && localData.length > 0) {
          const cloudIds = new Set(res.data.map(item => item.id));
          const unsynced = localData.filter(item => !cloudIds.has(item.id));
          for (const item of unsynced) {
            await this.cloudQuery(t, 'upsert', item);
            res.data.push(item);
          }
        }
        
        this.setList(key, res.data);
      }
    }
  },

  isLoggedIn() {
    return !!adminToken;
  },

  setLoggedIn(token) {
    adminToken = token;
    if (token) {
      sessionStorage.setItem('admin_token', token);
    } else {
      sessionStorage.removeItem('admin_token');
    }
  },

  getPassword() {
    return localStorage.getItem('adsparkling_admin_pass') || 'Anggie2026';
  },

  setPassword(newPass) {
    localStorage.setItem('adsparkling_admin_pass', newPass);
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
      localStorage.setItem(this.KEYS.EXPENSES, JSON.stringify(initialExpenses));
    }

    // Planes de ejemplo
    if (!localStorage.getItem(this.KEYS.PLANS)) {
      const initialPlans = [
        {
          id: 'p-1',
          name: 'Limpieza Regular Quincenal',
          frequency: '15',
          price: 180,
          included: 'Polvo general en todas las áreas\nLimpieza de espejos\nAspirado y trapeado\nLimpieza externa de electrodomésticos\nSanitización de baños',
          excluded: 'Interior de nevera/horno\nLimpieza profunda de persianas\nOrganización de closets',
          terms: 'Cancelación requiere 24h de aviso.\nLas mascotas deben estar aseguradas.',
          active: true
        },
        {
          id: 'p-2',
          name: 'Limpieza Profunda Mensual',
          frequency: '30',
          price: 250,
          included: 'Todo lo de limpieza regular\nLimpieza de rodapiés\nLimpieza profunda de duchas (sarro)\nLimpieza interior de ventanas accesibles',
          excluded: 'Interior de nevera/horno\nRecogida de desorden extremo',
          terms: 'Si la casa excede 45 días sin limpiar, aplica recargo.',
          active: true
        }
      ];
      localStorage.setItem(this.KEYS.PLANS, JSON.stringify(initialPlans));
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

    // Equipo de ejemplo
    if (!localStorage.getItem(this.KEYS.TEAM)) {
      const initialTeam = [
        {
          id: 't-1',
          name: 'Anggie (Líder / Fundadora)',
          phone: '7864582442',
          role: 'admin',
          active: true
        },
        {
          id: 't-2',
          name: 'Yurimar (Asistente de Limpieza)',
          phone: '3055551122',
          role: 'cleaner',
          active: true
        },
        {
          id: 't-3',
          name: 'Carmen (Especialista en Mudanzas)',
          phone: '9545553344',
          role: 'cleaner',
          active: true
        }
      ];
      localStorage.setItem(this.KEYS.TEAM, JSON.stringify(initialTeam));
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
    lead.id = lead.id || this.generateUUID();
    lead.created_at = lead.created_at || new Date().toISOString();
    lead.status = lead.status || 'nuevo';
    const leads = this.getLeads();
    leads.unshift(lead);
    this.setList(this.KEYS.LEADS, leads);

    this.cloudQuery('leads', 'insert', [lead]);
    return lead;
  },
  updateLead(id, updates) {
    const leads = this.getLeads();
    const idx = leads.findIndex(l => l.id == id);
    if (idx !== -1) {
      leads[idx] = { ...leads[idx], ...updates, updated_at: new Date().toISOString() };
      this.setList(this.KEYS.LEADS, leads);
      this.cloudQuery('leads', 'update', { id, data: updates });
    }
  },
  deleteLead(id) {
    const leads = this.getLeads().filter(l => l.id != id);
    this.setList(this.KEYS.LEADS, leads);
    this.cloudQuery('leads', 'delete', { id });
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
      client.id = this.generateUUID();
      client.created_at = new Date().toISOString();
      client.status = client.status || 'activo';
      clients.push(client);
    }
    this.setList(this.KEYS.CLIENTS, clients);
    this.cloudQuery('clients', 'upsert', [client]);
    return client;
  },
  deleteClient(id) {
    const clients = this.getClients().filter(c => c.id != id);
    this.setList(this.KEYS.CLIENTS, clients);
    this.cloudQuery('clients', 'delete', { id });
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
      appt.id = this.generateUUID();
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

    const cleanAppt = { ...appt };
    delete cleanAppt.clients;
    this.cloudQuery('appointments', 'upsert', [cleanAppt]);
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
      this.cloudQuery('appointments', 'update', { id, data: { status: newStatus } });
    }
  },
  deleteAppointment(id) {
    const appts = this.getList(this.KEYS.APPTS).filter(a => a.id != id);
    this.setList(this.KEYS.APPTS, appts);
    this.cloudQuery('appointments', 'delete', { id });
  },

  // Equipo (Team Members)
  getTeam() { return this.getList(this.KEYS.TEAM); },
  saveTeamMember(member) {
    const team = this.getTeam();
    if (member.id) {
      const idx = team.findIndex(t => t.id == member.id);
      if (idx !== -1) team[idx] = { ...team[idx], ...member };
      else team.push(member);
    } else {
      member.id = this.generateUUID();
      member.created_at = new Date().toISOString();
      member.active = member.active !== false;
      team.push(member);
    }
    this.setList(this.KEYS.TEAM, team);
    this.cloudQuery('team_members', 'upsert', [member]);
    return member;
  },
  deleteTeamMember(id) {
    const team = this.getTeam().filter(t => t.id != id);
    this.setList(this.KEYS.TEAM, team);
    this.cloudQuery('team_members', 'delete', { id });
  },

  // Gastos
  getExpenses() { return this.getList(this.KEYS.EXPENSES); },
  saveExpense(exp) {
    exp.id = exp.id || this.generateUUID();
    exp.created_at = new Date().toISOString();
    const exps = this.getExpenses();
    exps.unshift(exp);
    this.setList(this.KEYS.EXPENSES, exps);
    this.cloudQuery('expenses', 'insert', [exp]);
    return exp;
  },
  deleteExpense(id) {
    const exps = this.getExpenses().filter(e => e.id != id);
    this.setList(this.KEYS.EXPENSES, exps);
    this.cloudQuery('expenses', 'delete', { id });
  },

  // Reseñas
  getReviews() { return this.getList(this.KEYS.REVIEWS); },
  saveReview(review) {
    review.id = review.id || this.generateUUID();
    review.created_at = review.created_at || new Date().toISOString();
    review.status = review.status || 'pendiente';
    const reviews = this.getReviews();
    reviews.unshift(review);
    this.setList(this.KEYS.REVIEWS, reviews);
    this.cloudQuery('reviews', 'insert', [review]);
    return review;
  },
  updateReview(id, updates) {
    const reviews = this.getReviews();
    const idx = reviews.findIndex(r => r.id == id);
    if (idx !== -1) {
      reviews[idx] = { ...reviews[idx], ...updates };
      this.setList(this.KEYS.REVIEWS, reviews);
      this.cloudQuery('reviews', 'update', { id, data: updates });
    }
  },
  deleteReview(id) {
    const reviews = this.getReviews().filter(r => r.id != id);
    this.setList(this.KEYS.REVIEWS, reviews);
    this.cloudQuery('reviews', 'delete', { id });
  },

  // Planes
  getPlans() { return this.getList(this.KEYS.PLANS); },
  savePlan(plan) {
    const plans = this.getPlans();
    if (plan.id) {
      const idx = plans.findIndex(p => p.id == plan.id);
      if (idx !== -1) plans[idx] = { ...plans[idx], ...plan };
      else plans.push(plan);
    } else {
      plan.id = this.generateUUID();
      plan.created_at = new Date().toISOString();
      plan.active = plan.active !== false; // Default to true if undefined
      plans.push(plan);
    }
    this.setList(this.KEYS.PLANS, plans);
    this.cloudQuery('plans', 'upsert', [plan]);
    return plan;
  },

  // Contracts
  getContracts() { return this.getList(this.KEYS.CONTRACTS); },
  saveContract(contract) {
    const contracts = this.getContracts();
    if (contract.id) {
      const idx = contracts.findIndex(c => c.id == contract.id);
      if (idx !== -1) contracts[idx] = { ...contracts[idx], ...contract };
      else contracts.push(contract);
    } else {
      contract.id = this.generateUUID();
      contract.created_at = new Date().toISOString();
      contracts.push(contract);
    }
    this.setList(this.KEYS.CONTRACTS, contracts);
    this.cloudQuery('contracts', 'upsert', [contract]);
    return contract;
  },
  getActiveContractForClient(clientId) {
    const contracts = this.getContracts();
    const clientContracts = contracts.filter(c => c.client_id === clientId && c.status === 'activo');
    // Si hay varios 'activo' (no deberia), tomamos el mas reciente por created_at
    if (clientContracts.length === 0) return null;
    return clientContracts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
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
    if (loginScreen) loginScreen.style.display = 'none';
    if (adminApp) adminApp.style.display = 'block';
    DataStore.hydrateFromCloud().then(() => {
      try {
        loadDashboard();
      } catch (err) {
        console.warn('Dashboard load warning:', err);
      }
    }).catch(err => {
      console.warn('Hydration error, loading dashboard anyway:', err);
      try { loadDashboard(); } catch (e) { console.error('Local load failed:', e); }
    });
  } else {
    if (loginScreen) loginScreen.style.display = 'flex';
    if (adminApp) adminApp.style.display = 'none';
    setupPushCard();
  }
}

async function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById('loginPassword');
  const errorMsg = document.getElementById('loginError');
  const submitBtn = document.querySelector('.btn-login-submit');
  const entered = (input ? input.value : '').trim();

  if (!entered) {
    if (errorMsg) {
      errorMsg.textContent = 'Por favor ingresa tu contraseña.';
      errorMsg.style.display = 'block';
    }
    return;
  }

  if (submitBtn) submitBtn.textContent = 'Verificando...';

  const storedCustom = DataStore.getPassword();
  const validPasses = ['Anggie2026', storedCustom];

  try {
    let authenticated = false;
    let tokenToStore = null;

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password: entered })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.token) {
          authenticated = true;
          tokenToStore = data.token;
        }
      }
    } catch (netErr) {
      console.warn('API connection failed, falling back to local authentication:', netErr);
    }

    // Fallback local check
    if (!authenticated && validPasses.includes(entered)) {
      authenticated = true;
      tokenToStore = 'admin-local-session';
    }

    if (authenticated && tokenToStore) {
      if (errorMsg) errorMsg.style.display = 'none';
      DataStore.setLoggedIn(tokenToStore);
      if (input) input.value = '';
      
      const loginScreen = document.getElementById('loginScreen');
      const adminApp = document.getElementById('adminApp');
      if (loginScreen) loginScreen.style.display = 'none';
      if (adminApp) adminApp.style.display = 'block';
      
      checkAuth();
      showToast('¡Bienvenida a tu Panel de Control! ✨');
    } else {
      if (errorMsg) {
        errorMsg.textContent = 'Contraseña incorrecta. Por favor intenta de nuevo.';
        errorMsg.style.display = 'block';
      }
      if (input) input.focus();
    }
  } catch (err) {
    console.error('Login exception:', err);
    if (validPasses.includes(entered)) {
      if (errorMsg) errorMsg.style.display = 'none';
      DataStore.setLoggedIn('admin-local-session');
      if (input) input.value = '';
      checkAuth();
    } else if (errorMsg) {
      errorMsg.textContent = 'Contraseña incorrecta. Por favor intenta de nuevo.';
      errorMsg.style.display = 'block';
    }
  } finally {
    if (submitBtn) submitBtn.textContent = 'Ingresar a mi Panel';
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
    showToast('La contraseña actual es incorrecta.');
    return;
  }
  if (!newPass || newPass.length < 4) {
    showToast('La nueva contraseña debe tener al menos 4 caracteres.');
    return;
  }
  if (newPass !== confirmPass) {
    showToast('La nueva contraseña y su confirmación no coinciden.');
    return;
  }

  DataStore.setPassword(newPass);
  document.getElementById('pwdCurrent').value = '';
  document.getElementById('pwdNew').value = '';
  document.getElementById('pwdConfirm').value = '';
  closeSettingsModal();
  showToast('¡Contraseña actualizada exitosamente! ✅');
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
      showToast('Para instalar en iPhone:\n1. Toca el botón Compartir (cuadrado con flecha 📤 en Safari)\n2. Selecciona "Añadir a pantalla de inicio" 📲');
    } else {
      showToast('Para instalar en tu celular:\n1. Toca el menú de tu navegador (los tres puntos arriba a la derecha)\n2. Toca "Instalar aplicación" o "Añadir a pantalla principal" 📲');
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
  if (tabId === 'appointments') { loadClientsForSelect(); loadTeamForSelect(); loadAppointments(); setTimeout(() => setApptView(currentApptView), 0); }
  if (tabId === 'expenses') loadExpenses();
  if (tabId === 'reviews') loadAdminReviews();
  if (tabId === 'plans') loadPlans();
  if (tabId === 'team') loadTeam();
  if (tabId === 'cotizar') { qcCalculate(); renderPricingTable(); }
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
  
  // Tiempo promedio
  const completedApptsWithTime = appts.filter(a => a.status === 'completada' && a.duration_minutes);
  let avgMins = 0;
  if (completedApptsWithTime.length > 0) {
    const totalMins = completedApptsWithTime.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
    avgMins = Math.round(totalMins / completedApptsWithTime.length);
  }

  // Actualizar DOM
  document.getElementById('dashRevenue').textContent = '$' + revenue.toLocaleString();
  document.getElementById('dashExpenses').textContent = '$' + expenses.toLocaleString();
  document.getElementById('dashProfit').textContent = '$' + profit.toLocaleString();
  document.getElementById('dashMargin').textContent = margin + '% margen';
  document.getElementById('dashClients').textContent = activeClients.length;
  
  const avgTimeEl = document.getElementById('dashAvgTime');
  if (avgTimeEl) avgTimeEl.textContent = avgMins > 0 ? formatDuration(avgMins) : '0h 0min';

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

  // Renderizar Gráfico
  renderFinanceChart(appts, exps);
}

let financeChartInstance = null;
function renderFinanceChart(appts, exps) {
  const ctx = document.getElementById('financeChart');
  if (!ctx || typeof Chart === 'undefined') return;

  // Agrupar por mes (últimos 6 meses)
  const months = [];
  const revData = [];
  const expData = [];
  
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = d.toISOString().substring(0, 7); // YYYY-MM
    months.push(d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }));
    
    // Revenue for month
    const rev = appts.filter(a => a.status === 'completada' && a.date.startsWith(monthStr))
                     .reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);
    revData.push(rev);
    
    // Expenses for month
    const exp = exps.filter(e => e.date.startsWith(monthStr))
                    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    expData.push(exp);
  }

  if (financeChartInstance) {
    financeChartInstance.destroy();
  }

  financeChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Ingresos',
          data: revData,
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Gastos',
          data: expData,
          borderColor: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
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

function getSuggestedPrice(sqft, frequency) {
  if (!sqft) return null;
  const s = parseInt(sqft);
  let q = 150, m = 180, d = 240;
  if (s >= 1771 && s <= 2200) { q = 170; m = 210; d = 280; }
  else if (s >= 2201 && s <= 2700) { q = 200; m = 240; d = 330; }
  else if (s >= 2701 && s <= 3200) { q = 225; m = 270; d = 380; }
  else if (s >= 3201) { q = 240; m = 290; d = 420; }
  
  if (frequency === '15') return q;
  if (frequency === '30') return m;
  if (frequency === 'deep' || frequency === 'once') return d;
  if (frequency === '10') return q;
  return { biweekly: q, monthly: m, deep: d };
}

function renderLeadsTable(leads) {
  const tbody = document.getElementById('leadsTable');
  if (!leads || leads.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-cell">No hay leads registrados aún.</td></tr>';
    return;
  }

  tbody.innerHTML = leads.map(l => {
    let suggestedHtml = '-';
    let suggestedPriceText = '';
    if (l.size_sqft) {
      const price = getSuggestedPrice(l.size_sqft, l.frequency);
      if (typeof price === 'number') {
        suggestedHtml = `<div style="font-size:12px; color:var(--text-sec);">${l.size_sqft} sqft</div><strong style="color:var(--primary); font-size:14px;">$${price} sug.</strong>`;
        suggestedPriceText = ` Tu cotización estimada es de $${price}.`;
      } else if (price) {
        suggestedHtml = `<div style="font-size:12px; color:var(--text-sec);">${l.size_sqft} sqft</div><span style="font-size:11px; color:var(--primary); font-weight:700;">Q:$${price.biweekly} | M:$${price.monthly}</span>`;
        suggestedPriceText = ` El estimado es Quincenal: $${price.biweekly} o Mensual: $${price.monthly}.`;
      }
    }

    let extrasList = '';
    if (l.notes && l.notes.includes('Extras:')) {
       extrasList = '<div style="font-size:10px; color:#c0392b; font-weight:bold; margin-top:4px;">Tiene extras solicitados</div>';
    }

    return `
    <tr>
      <td><strong>${l.name}</strong><br><span style="font-size:11px; color:var(--text-muted);">${l.source === 'referral' ? '⭐ Referido' : l.source}</span></td>
      <td><a href="tel:${cleanPhone(l.phone)}" style="color:inherit; font-weight:600;">${l.phone}</a></td>
      <td title="${l.address}">
        ${truncate(l.address, 25)}
        ${l.address ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address)}" target="_blank" style="text-decoration:none; margin-left:4px;" title="Ver ubicación en Google Maps">🗺️</a>` : ''}
      </td>
      <td>${suggestedHtml}${extrasList}</td>
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
        <a href="https://wa.me/${cleanPhone(l.phone)}?text=Hola ${encodeURIComponent(l.name)}, te saluda Anggie de Ad Sparkling Cleaning ✨. Recibimos tu solicitud de cotización para tu hogar en ${l.address}.${encodeURIComponent(suggestedPriceText)} ¿Tienes alguna fecha en mente para agendar?" target="_blank" class="btn-table-action btn-wa-table" style="background:#25d366; color:#fff;" title="Contactar por WhatsApp">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </a>
        <button class="btn-table-action btn-convert-table" style="background:var(--primary); color:#fff;" onclick="convertLeadToClient('${l.id}')" title="Convertir a Cliente">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
        </button>
        <button class="btn-table-action btn-del-table" style="background:#f44336; color:#fff;" onclick="deleteLead('${l.id}')" title="Eliminar lead">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </td>
    </tr>
    `;
  }).join('');
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
    showToast('Por favor ingresa al menos nombre y teléfono del lead.');
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
  showToast('Lead guardado exitosamente ✅');
}

function convertLeadToClient(leadId) {
  const lead = allLeads.find(l => l.id == leadId);
  if (!lead) return;

  showTab('clients');
  const form = document.getElementById('clientForm');
  form.style.display = 'block';

  document.getElementById('cId').value = '';
  document.getElementById('cReferralCode').value = lead.referral_code || '';
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
  const container = document.getElementById('clientsTable');
  if (!clients || clients.length === 0) {
    container.innerHTML = '<p class="empty">No hay clientes registrados aún.</p>';
    return;
  }

  container.innerHTML = clients.map(c => {
    const statusColor = c.status === 'activo' ? 'var(--success)' : 'var(--text-muted)';
    const statusBg = c.status === 'activo' ? 'var(--success-bg)' : '#f0ecf4';
    const mapsUrl = c.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address + ', Miami, FL')}`
      : `https://www.google.com/maps/search/?api=1&query=Miami+FL`;
    const nextVisit = c.next_visit ? formatDate(c.next_visit) : '—';
    const lastVisit = c.last_visit ? formatDate(c.last_visit) : '—';
    const ltv = c.lifetime_value ? `$${c.lifetime_value.toLocaleString()}` : `$${(c.base_price || 0)}`;

    return `
    <div class="dash-item dash-item--card">
      
      <!-- Fila principal: nombre + badge -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
        <div>
          <div style="font-size:16px; font-weight:700; color:var(--primary); margin-bottom:2px;">${c.name}</div>
          <div style="font-size:13px; color:var(--text-sec);">📞 ${c.phone || '—'}</div>
        </div>
        <span style="background:${statusBg}; color:${statusColor}; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; white-space:nowrap; text-transform:uppercase; letter-spacing:0.4px;">${c.status || 'activo'}</span>
      </div>

      <!-- Info grid: próxima visita, última, precio, LTV -->
      <div class="card-info-grid" style="background:var(--bg); padding:10px 12px; border-radius:10px;">
        <div>
          <div style="font-size:10px; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.5px; margin-bottom:2px;">Próxima cita</div>
          <div style="font-size:13px; font-weight:600; color:var(--text);">${nextVisit}</div>
        </div>
        <div>
          <div style="font-size:10px; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.5px; margin-bottom:2px;">Última limpieza</div>
          <div style="font-size:13px; font-weight:600; color:var(--text);">${lastVisit}</div>
        </div>
        <div>
          <div style="font-size:10px; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.5px; margin-bottom:2px;">Precio base</div>
          <div style="font-size:13px; font-weight:600; color:var(--text);">$${c.base_price || '—'}</div>
        </div>
        <div>
          <div style="font-size:10px; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.5px; margin-bottom:2px;">Valor total</div>
          <div style="font-size:13px; font-weight:700; color:var(--primary);">${ltv}</div>
        </div>
      </div>

      ${(() => {
        const refCount = c.referrals || 0;
        if (refCount === 0) return '';
        const slots = [1, 2, '🎁'].map((txt, i) => {
          const filled = refCount > i;
          const bg = filled ? 'var(--primary)' : '#fff';
          const color = filled ? '#fff' : 'var(--text-muted)';
          return `<div style="width:20px; height:20px; border-radius:50%; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:10px; background:${bg}; color:${color}; font-weight:bold;">${txt}</div>`;
        }).join('');
        return `
        <div style="margin-top:10px; background:#f4ebf8; padding:8px 12px; border-radius:8px; display:flex; align-items:center; justify-content:space-between; border:1px dashed var(--primary);">
          <div style="font-size:12px; font-weight:600; color:var(--primary);">Referidos: ${refCount}/3 ${refCount >= 3 ? '⭐ ¡Premio Extra!' : ''}</div>
          <div style="display:flex; gap:4px;">${slots}</div>
        </div>`;
      })()}

      ${c.address ? `
      <div class="card-address-row">
        📍 <span style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.address}</span>
      </div>` : ''}

      <!-- Acciones -->
      <div class="card-actions-row" style="flex-wrap:wrap;">
        <a href="${mapsUrl}" target="_blank" title="Ver en Google Maps" 
           style="display:inline-flex; align-items:center; gap:5px; background:#f0e8f8; color:var(--primary); border:none; padding:7px 12px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; text-decoration:none;">
          🗺️ Ver en Mapa
        </a>
        <button onclick="scheduleForClient('${c.id}')" title="Agendar Cita" 
           style="display:inline-flex; align-items:center; gap:5px; background:#e8f3ff; color:#1565c0; border:none; padding:7px 12px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer;">
          📅 Agendar
        </button>
        <button onclick="openClientPortalModal('${c.id}')" title="Acceso a Portal y Referidos" 
           style="display:inline-flex; align-items:center; gap:5px; background:#e8f5e9; color:var(--success); border:none; padding:7px 12px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;">
          📱 Portal & Referidos
        </button>
        <a href="https://wa.me/${cleanPhone(c.phone)}" target="_blank" title="WhatsApp"
           style="display:inline-flex; align-items:center; gap:5px; background:#e8faf0; color:#25d366; border:none; padding:7px 12px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; text-decoration:none;">
          💬 WA
        </a>
        <button onclick="editClient('${c.id}')" title="Editar cliente" 
           style="display:inline-flex; align-items:center; gap:5px; background:#fff8ed; color:#d4a017; border:none; padding:7px 12px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; margin-left:auto;">
          ✏️
        </button>
        <button onclick="deleteClient('${c.id}')" title="Eliminar" 
           style="display:inline-flex; align-items:center; gap:5px; background:var(--danger-bg); color:var(--danger); border:none; padding:7px 12px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer;">
          🗑
        </button>
      </div>
    </div>`;
  }).join('');
}

let currentSelectedClientForModal = null;

function openClientPortalModal(clientId) {
  const client = allClients.find(c => c.id == clientId);
  if (!client) return;

  currentSelectedClientForModal = client;
  const phone = cleanPhone(client.phone);
  const baseUrl = window.location.href.split('admin.html')[0];
  const portalUrl = `${baseUrl}portal.html?phone=${phone}`;
  const refCode = client.referral_code || ('AD-' + (client.name ? client.name.split(' ')[0].toUpperCase() : 'VIP') + '-' + String(client.id).slice(-4));

  document.getElementById('cpClientName').textContent = client.name;
  document.getElementById('cpClientPhone').textContent = client.phone || 'Sin teléfono';
  document.getElementById('cpReferralCode').textContent = refCode;
  document.getElementById('cpDirectUrl').value = portalUrl;

  const waMsg = `¡Hola ${client.name}! ✨ Te comparto tu acceso exclusivo al Portal de Clientes de *Ad Sparkling Cleaning*.\n\n📲 Ingresa aquí para ver tus próximas limpiezas, historial, facturas y descargar tu App:\n🔗 ${portalUrl}\n\n🎁 *Tu Código de Referidos:* ${refCode}\n¡Invita a tus amigos y gana un servicio extra gratis al acumular 3 referidos!\n\n¡Gracias por confiar en nosotros! 🏠✨`;
  
  const btnWa = document.getElementById('btnSendWaPortal');
  if (btnWa) {
    btnWa.href = `https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}`;
  }

  const btnOpen = document.getElementById('btnOpenPortalTab');
  if (btnOpen) {
    btnOpen.href = portalUrl;
  }

  const modal = document.getElementById('clientPortalModal');
  if (modal) modal.style.display = 'flex';
}

function closeClientPortalModal() {
  const modal = document.getElementById('clientPortalModal');
  if (modal) modal.style.display = 'none';
}

function copyClientPortalUrl() {
  const input = document.getElementById('cpDirectUrl');
  if (!input) return;
  navigator.clipboard.writeText(input.value).then(() => {
    showToast('¡Enlace del portal copiado al portapapeles! 📋');
  }).catch(() => {
    input.select();
    document.execCommand('copy');
    showToast('¡Enlace copiado! 📋');
  });
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

function populatePlanSelect() {
  const select = document.getElementById('cPlanId');
  if (!select) return;
  const plans = DataStore.getPlans().filter(p => p.active !== false);
  select.innerHTML = '<option value="">Sin plan asignado</option>' + plans.map(p => `<option value="${p.id}">${p.name} ($${p.price})</option>`).join('');
}

function checkContractState() {
  const clientId = document.getElementById('cId').value;
  const selectedPlanId = document.getElementById('cPlanId').value;
  const btn = document.getElementById('btnGenContract');
  const statusDiv = document.getElementById('cContractStatus');

  if (!clientId) {
    statusDiv.innerHTML = '';
    btn.style.display = selectedPlanId ? 'block' : 'none';
    return;
  }

  const activeContract = DataStore.getActiveContractForClient(clientId);
  
  if (!activeContract) {
    statusDiv.innerHTML = 'Sin contrato activo';
    statusDiv.style.color = 'var(--text-sec)';
    btn.style.display = selectedPlanId ? 'block' : 'none';
  } else {
    if (activeContract.accepted) {
      statusDiv.innerHTML = `Aceptado el ${formatDate(activeContract.accepted_at)}`;
      statusDiv.style.color = 'var(--success)';
    } else {
      statusDiv.innerHTML = 'Pendiente de aceptar';
      statusDiv.style.color = '#f57c00'; // Amber
    }
    btn.style.display = (selectedPlanId && selectedPlanId !== activeContract.plan_id) ? 'block' : 'none';
  }

  // Render Contracts History
  const historyDiv = document.getElementById('cContractsHistory');
  if (historyDiv) {
    const allContracts = DataStore.getContracts().filter(c => c.client_id === clientId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    if (allContracts.length > 0) {
      historyDiv.innerHTML = `
        <div style="font-size:12px; font-weight:bold; color:var(--text-color); margin-bottom:6px;">Historial de Contratos:</div>
        <table class="data-table" style="font-size:12px;">
          <thead><tr><th>Fecha</th><th>Plan</th><th>Estado</th><th>PDF</th></tr></thead>
          <tbody>
            ${allContracts.map(c => {
              const p = DataStore.getPlans().find(pl => pl.id === c.plan_id);
              const pName = p ? p.name : 'Desconocido';
              const stateText = c.status === 'activo' ? (c.accepted ? 'Activo (Aceptado)' : 'Activo (Pendiente)') : 'Reemplazado';
              const btnHtml = (c.accepted && c.pdf_url) ? `<button type="button" onclick="viewContractPdf('${c.pdf_url}')" style="background:var(--primary); color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer;">Ver PDF</button>` : '-';
              return `<tr>
                <td>${formatDate(c.created_at)}</td>
                <td>${pName}</td>
                <td>${stateText}</td>
                <td>${btnHtml}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      `;
    } else {
      historyDiv.innerHTML = '';
    }
  }

  // Render Cleaning History
  const cleaningDiv = document.getElementById('cCleaningHistory');
  if (cleaningDiv) {
    const allAppts = DataStore.getAppointments().filter(a => a.client_id === clientId && a.status === 'completada' && a.duration_minutes).sort((a,b) => new Date(b.date) - new Date(a.date));
    
    if (allAppts.length > 0) {
      const totalMins = allAppts.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
      const avgMins = Math.round(totalMins / allAppts.length);
      
      cleaningDiv.innerHTML = `
        <div style="font-size:12px; font-weight:bold; color:var(--text-color); margin-bottom:6px; margin-top:12px;">Historial de Tiempos de Limpieza:</div>
        <table class="data-table" style="font-size:12px;">
          <thead><tr><th>Fecha</th><th>Duración</th></tr></thead>
          <tbody>
            ${allAppts.map(a => `<tr>
                <td>${formatDate(a.date)}</td>
                <td>${formatDuration(a.duration_minutes)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div style="font-size:12px; font-weight:bold; margin-top:6px; color:var(--primary);">Promedio: ${formatDuration(avgMins)}</div>
      `;
    } else {
      cleaningDiv.innerHTML = '';
    }
  }
}

async function viewContractPdf(path) {
  if (!adminToken) return;
  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'signedUrl', token: adminToken, path })
    });
    const data = await res.json();
    if (data.url) {
      window.open(data.url, '_blank');
    } else {
      showToast('No se pudo obtener el PDF: ' + (data.error || 'Error desconocido'));
    }
  } catch(e) {
    showToast('Error de conexión');
  }
}
function generateContract() {
  const clientId = document.getElementById('cId').value;
  const planId = document.getElementById('cPlanId').value;
  
  if (!clientId) {
    showToast('Por favor guarda el cliente primero antes de generar el contrato.');
    return;
  }
  
  if (!planId) return;

  const activeContract = DataStore.getActiveContractForClient(clientId);
  if (activeContract) {
    DataStore.saveContract({ ...activeContract, status: 'reemplazado' });
  }
  
  DataStore.saveContract({
    client_id: clientId,
    plan_id: planId,
    status: 'activo',
    accepted: false,
    start_date: new Date().toISOString().split('T')[0]
  });

  checkContractState();
  showToast('Contrato generado. El cliente lo verá en su portal para aceptarlo. ✅');
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
  populatePlanSelect();
  document.getElementById('cPlanId').value = '';
  checkContractState();
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
  
  populatePlanSelect();
  const activeContract = DataStore.getActiveContractForClient(client.id);
  if (activeContract) {
    document.getElementById('cPlanId').value = activeContract.plan_id;
  } else {
    document.getElementById('cPlanId').value = '';
  }
  checkContractState();

  form.scrollIntoView({ behavior: 'smooth' });
}

function saveClient() {
  const id = document.getElementById('cId').value;
  const refCode = document.getElementById('cReferralCode').value;
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
    showToast('Nombre, teléfono y dirección son obligatorios.');
    return;
  }

  const cleanPhoneStr = String(phone).replace(/[^0-9]/g, '');

  const clientData = {
    id: id || undefined,
    name,
    phone: cleanPhoneStr,
    address,
    size_sqft: size,
    frequency: freq,
    base_price: price,
    next_visit: nextVisit,
    notes,
    status
  };

  if (!id && refCode) {
    const referrer = allClients.find(c => c.id && c.id.toUpperCase().startsWith(refCode.toUpperCase()));
    if (referrer) {
      referrer.referrals = (referrer.referrals || 0) + 1;
      DataStore.updateClient(referrer.id, { referrals: referrer.referrals });
      showToast(`¡Referido sumado a ${referrer.name}! 🎁`);
    }
  }

  DataStore.saveClient(clientData);
  toggleForm('clientForm');
  resetClientForm();
  loadClients();
  loadDashboard();
  showToast('Cliente guardado con éxito ✅');
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
// ============================================
// CITAS & CALENDARIO VIOLETA
// ============================================
let allAppointments = [];
let calCurrentYear = new Date().getFullYear();
let calCurrentMonth = new Date().getMonth(); // 0-11
let calSelectedDateStr = new Date().toISOString().split('T')[0];
let currentApptView = 'calendar';

const MONTH_NAMES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function setApptView(view) {
  currentApptView = view;
  const calView = document.getElementById('apptCalendarView');
  const listView = document.getElementById('apptListView');
  const btnCal = document.getElementById('btnViewCal');
  const btnList = document.getElementById('btnViewList');

  if (view === 'calendar') {
    if (calView) calView.style.display = 'grid';
    if (listView) listView.style.display = 'none';
    if (btnCal) btnCal.classList.add('active');
    if (btnList) btnList.classList.remove('active');
    renderAppointmentsCalendar();
    renderCalendarActivities();
  } else {
    if (calView) calView.style.display = 'none';
    if (listView) listView.style.display = 'block';
    if (btnCal) btnCal.classList.remove('active');
    if (btnList) btnList.classList.add('active');
    renderAppointmentsTable(allAppointments);
  }
}

function loadAppointments() {
  allAppointments = DataStore.getAppointments();
  
  if (currentApptView === 'calendar') {
    renderAppointmentsCalendar();
    renderCalendarActivities();
  } else {
    const filterInput = document.getElementById('filterApptDate');
    if (filterInput && filterInput.value) {
      filterAppointmentsByDate(filterInput.value);
    } else {
      renderAppointmentsTable(allAppointments);
    }
  }
}

function navCalendar(delta) {
  calCurrentMonth += delta;
  if (calCurrentMonth > 11) {
    calCurrentMonth = 0;
    calCurrentYear++;
  } else if (calCurrentMonth < 0) {
    calCurrentMonth = 11;
    calCurrentYear--;
  }
  renderAppointmentsCalendar();
}

function goCalendarToday() {
  const today = new Date();
  calCurrentYear = today.getFullYear();
  calCurrentMonth = today.getMonth();
  calSelectedDateStr = today.toISOString().split('T')[0];
  renderAppointmentsCalendar();
  renderCalendarActivities();
}

function selectCalendarDate(dateStr) {
  calSelectedDateStr = dateStr;
  renderAppointmentsCalendar();
  renderCalendarActivities();
}

function quickAddApptForSelectedDate() {
  resetApptForm();
  document.getElementById('aDate').value = calSelectedDateStr;
  const form = document.getElementById('apptForm');
  if (form) {
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });
  }
}

function renderAppointmentsCalendar() {
  const titleEl = document.getElementById('calMonthYearTitle');
  const gridEl = document.getElementById('calDaysGrid');
  if (!gridEl) return;

  const monthName = (currentLang === 'es' ? MONTH_NAMES_ES : MONTH_NAMES_EN)[calCurrentMonth];
  if (titleEl) {
    titleEl.textContent = `${monthName.toUpperCase()} ${calCurrentYear}`;
  }

  const firstDayIndex = new Date(calCurrentYear, calCurrentMonth, 1).getDay(); // 0 = Dom
  const totalDaysInMonth = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();
  const prevMonthTotalDays = new Date(calCurrentYear, calCurrentMonth, 0).getDate();

  const todayStr = new Date().toISOString().split('T')[0];

  // Agrupar citas por fecha
  const apptsByDate = {};
  allAppointments.forEach(a => {
    if (a.date) {
      apptsByDate[a.date] = (apptsByDate[a.date] || 0) + 1;
    }
  });

  let html = '';

  // Días del mes anterior
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    const prevMonth = calCurrentMonth === 0 ? 11 : calCurrentMonth - 1;
    const prevYear = calCurrentMonth === 0 ? calCurrentYear - 1 : calCurrentYear;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    html += `<div class="cal-day-cell other-month" onclick="selectCalendarDate('${dateStr}')">${dayNum}</div>`;
  }

  // Días del mes actual
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = `${calCurrentYear}-${String(calCurrentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === calSelectedDateStr;
    const count = apptsByDate[dateStr] || 0;
    const hasAppts = count > 0;

    let classes = ['cal-day-cell'];
    if (isToday) classes.push('today');
    if (isSelected) classes.push('selected');
    if (hasAppts) classes.push('has-appts');

    html += `<div class="${classes.join(' ')}" onclick="selectCalendarDate('${dateStr}')" title="${count ? count + ' cita(s)' : ''}">${d}</div>`;
  }

  // Días del mes siguiente para completar la cuadrícula (hasta múltiplo de 7)
  const totalCells = firstDayIndex + totalDaysInMonth;
  const nextDays = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let n = 1; n <= nextDays; n++) {
    const nextMonth = calCurrentMonth === 11 ? 0 : calCurrentMonth + 1;
    const nextYear = calCurrentMonth === 11 ? calCurrentYear + 1 : calCurrentYear;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
    html += `<div class="cal-day-cell other-month" onclick="selectCalendarDate('${dateStr}')">${n}</div>`;
  }

  gridEl.innerHTML = html;
}

function renderCalendarActivities() {
  const container = document.getElementById('calDayActivitiesList');
  const titleEl = document.getElementById('calSelectedDayTitle');
  const subEl = document.getElementById('calSelectedDaySubtitle');
  if (!container) return;

  const dayAppts = allAppointments.filter(a => a.date === calSelectedDateStr);
  const formattedDate = formatDate(calSelectedDateStr);

  if (titleEl) {
    titleEl.textContent = `📅 ${formattedDate}`;
  }
  if (subEl) {
    subEl.textContent = `${dayAppts.length} ${dayAppts.length === 1 ? 'actividad programada' : 'actividades programadas'}`;
  }

  if (dayAppts.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:32px 16px; background:var(--bg-alt); border-radius:12px; border:1px dashed var(--border);">
        <div style="font-size:32px; margin-bottom:8px;">☕</div>
        <strong style="font-size:15px; color:var(--text-sec); display:block;">No hay citas agendadas para este día</strong>
        <p style="font-size:13px; color:var(--text-muted); margin:4px 0 16px;">Puedes programar un nuevo servicio o asignar un cliente a esta fecha.</p>
        <button class="btn-action-pill" onclick="quickAddApptForSelectedDate()" style="background:var(--primary); color:#fff; padding:8px 18px;">+ Agendar Cita Aquí</button>
      </div>
    `;
    return;
  }

  container.innerHTML = dayAppts.map(a => `
    <div class="cal-activity-card status-${a.status}">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; gap:8px;">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <span class="cal-activity-time-badge">⏰ ${a.time || '09:00 AM'}</span>
          <strong style="font-size:16px; color:var(--primary);">${a.clients?.name || 'Cliente'}</strong>
        </div>
        <div style="text-align:right;">
          <div style="font-size:18px; font-weight:900; color:var(--primary);">$${parseFloat(a.price || 0).toFixed(2)}</div>
        </div>
      </div>

      <div style="font-size:13px; color:var(--text-sec); margin-bottom:12px; background:var(--bg-alt); border:1px solid var(--border); padding:10px 12px; border-radius:8px;">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
          <span>📍 <strong>Dirección:</strong> ${a.clients?.address || 'Sin dirección'}</span>
          ${a.clients?.address ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.clients.address)}" target="_blank" style="text-decoration:none; font-size:12px; font-weight:700; color:var(--primary);" title="Ver en Google Maps">🗺️ Mapa y Ruta</a>` : ''}
        </div>
        ${a.addons && a.addons.length ? `<div style="margin-top:4px;">✨ <strong>Extras:</strong> ${Array.isArray(a.addons) ? a.addons.join(', ') : a.addons}</div>` : ''}
        ${a.notes ? `<div style="margin-top:4px;">📝 <strong>Notas:</strong> ${a.notes}</div>` : ''}
        ${a.status === 'en_progreso' && a.started_at ? `<div style="margin-top:4px; color:#f57c00; font-weight:600;">🧹 En progreso desde: ${new Date(a.started_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>` : ''}
        ${a.status === 'pausada' ? `<div style="margin-top:4px; color:#f57c00; font-weight:600;">⏸️ Pausada (${formatDuration(a.accumulated_minutes || 0)})</div>` : ''}
        ${a.status === 'completada' && a.duration_minutes ? `<div style="margin-top:4px; color:var(--success); font-weight:600;">✓ Limpieza completada en: ${formatDuration(a.duration_minutes)}</div>` : ''}
      </div>

      <div class="card-actions-row" style="flex-wrap:wrap; justify-content:space-between; align-items:center;">
        <div>
          <select class="status-select status-${a.status}" onchange="changeApptStatus('${a.id}', this.value)" style="padding:6px 10px; font-size:12px;">
            <option value="pendiente" ${a.status === 'pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
            <option value="en_progreso" ${a.status === 'en_progreso' ? 'selected' : ''}>🧹 En progreso</option>
            <option value="pausada" ${a.status === 'pausada' ? 'selected' : ''}>⏸️ Pausada</option>
            <option value="completada" ${a.status === 'completada' ? 'selected' : ''}>✅ Completada</option>
            <option value="cancelada" ${a.status === 'cancelada' ? 'selected' : ''}>❌ Cancelada</option>
          </select>
        </div>

        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${a.status === 'pendiente' ? `
            <button class="btn-action-pill" onclick="startCleaning('${a.id}')" style="background:var(--primary); color:#fff;">▶️ Iniciar</button>
            <a href="https://wa.me/${cleanPhone(a.clients?.phone || '')}?text=${encodeURIComponent('¡Hola! Anggie está en camino/comenzando tu limpieza de hoy 🧹✨')}" target="_blank" class="btn-action-pill" style="background:#25d366; color:#fff; text-decoration:none;">💬 Voy en camino</a>
          ` : a.status === 'en_progreso' ? `
            <button class="btn-action-pill" onclick="pauseCleaning('${a.id}')" style="background:#f57c00; color:#fff;">⏸️ Pausar</button>
            <button class="btn-action-pill" onclick="finishCleaning('${a.id}')" style="background:#4caf50; color:#fff;">✅ Finalizar</button>
          ` : a.status === 'pausada' ? `
            <button class="btn-action-pill" onclick="resumeCleaning('${a.id}')" style="background:var(--primary); color:#fff;">▶️ Reanudar</button>
            <button class="btn-action-pill" onclick="finishCleaning('${a.id}')" style="background:#4caf50; color:#fff;">✅ Finalizar</button>
          ` : a.status === 'completada' ? `
            <a href="https://wa.me/${cleanPhone(a.clients?.phone || '')}?text=${encodeURIComponent('¡Listo! Tu hogar quedó reluciente ✨ Nos vemos en tu próxima visita.')}" target="_blank" class="btn-action-pill" style="background:#25d366; color:#fff; text-decoration:none;">💬 Confirmar WA</a>
          ` : ''}
          <button class="btn-action-pill" onclick="editAppt('${a.id}')" style="background:var(--bg-alt); color:var(--primary); border:1px solid var(--border);">✏️</button>
          <button class="btn-action-pill" onclick="deleteAppt('${a.id}')" style="background:#ffebee; color:#c62828;">🗑️</button>
        </div>
      </div>
    </div>
  `).join('');
}

function filterAppointmentsByDate(dateStr) {
  if (!dateStr) {
    renderAppointmentsTable(allAppointments);
  } else {
    const filtered = allAppointments.filter(a => a.date === dateStr);
    renderAppointmentsTable(filtered);
  }
}

function renderAppointmentsTable(appts) {
  const container = document.getElementById('appointmentsTable');
  if (!appts || appts.length === 0) {
    container.innerHTML = '<p class="empty">No hay citas registradas aún.</p>';
    return;
  }

  container.innerHTML = appts.map(a => `
    <div class="dash-item dash-item--card">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; gap:8px;">
        <div>
          <strong style="font-size:16px; color:var(--primary); display:block;">${a.clients?.name || 'Cliente'}</strong>
          <div style="font-size:13px; color:var(--text-sec); margin-top:2px;">
            📅 ${formatDate(a.date)} ${a.time ? '· ⏰ ' + a.time : ''}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:18px; font-weight:800; color:var(--primary);">$${a.price}</div>
          <select class="status-select status-${a.status}" onchange="changeApptStatus('${a.id}', this.value)" style="margin-top:4px;">
            <option value="pendiente" ${a.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="en_progreso" ${a.status === 'en_progreso' ? 'selected' : ''}>En progreso</option>
            <option value="pausada" ${a.status === 'pausada' ? 'selected' : ''}>Pausada</option>
            <option value="completada" ${a.status === 'completada' ? 'selected' : ''}>Completada</option>
            <option value="cancelada" ${a.status === 'cancelada' ? 'selected' : ''}>Cancelada</option>
          </select>
        </div>
      </div>

      <div style="font-size:13px; color:var(--text-sec); margin-bottom:12px; background:#fff; border:1px solid var(--border); padding:10px 14px; border-radius:8px;">
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <span>📍 <strong>Dirección:</strong> ${a.clients?.address || 'Sin dirección'}</span>
          ${a.clients?.address ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.clients.address)}" target="_blank" style="text-decoration:none; font-size:12px; font-weight:700; color:var(--primary);" title="Ver en Google Maps">🗺️ Mapa</a>` : ''}
        </div>
        ${a.addons && a.addons.length ? `<div style="margin-top:4px;">✨ <strong>Extras:</strong> ${Array.isArray(a.addons) ? a.addons.join(', ') : a.addons}</div>` : ''}
        ${a.notes ? `<div style="margin-top:4px;">📝 <strong>Notas:</strong> ${a.notes}</div>` : ''}
        ${a.status === 'en_progreso' && a.started_at ? `<div style="margin-top:4px; color:#f57c00; font-weight:600;">🧹 En progreso desde: ${new Date(a.started_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>` : ''}
        ${a.status === 'pausada' ? `<div style="margin-top:4px; color:#f57c00; font-weight:600;">⏸️ Pausada (${formatDuration(a.accumulated_minutes || 0)})</div>` : ''}
        ${a.status === 'completada' && a.duration_minutes ? `<div style="margin-top:4px; color:var(--success); font-weight:600;">✓ Tiempo total: ${formatDuration(a.duration_minutes)}</div>` : ''}
      </div>

      <div class="card-actions-row" style="flex-wrap:wrap; justify-content:flex-end;">
        ${a.status === 'pendiente' ? `
          <button class="btn-action-pill" onclick="startCleaning('${a.id}')" style="background:var(--primary); color:#fff;">▶️ Iniciar</button>
          <a href="https://wa.me/${cleanPhone(a.clients?.phone || '')}?text=${encodeURIComponent('¡Hola! Anggie está en camino/comenzando tu limpieza de hoy 🧹✨')}" target="_blank" class="btn-action-pill" style="background:#25d366; color:#fff; text-decoration:none;">💬 Voy en camino</a>
        ` : a.status === 'en_progreso' ? `
          <button class="btn-action-pill" onclick="pauseCleaning('${a.id}')" style="background:#f57c00; color:#fff;">⏸️ Pausar</button>
          <button class="btn-action-pill" onclick="finishCleaning('${a.id}')" style="background:#4caf50; color:#fff;">✅ Finalizar</button>
        ` : a.status === 'pausada' ? `
          <button class="btn-action-pill" onclick="resumeCleaning('${a.id}')" style="background:var(--primary); color:#fff;">▶️ Reanudar</button>
          <button class="btn-action-pill" onclick="finishCleaning('${a.id}')" style="background:#4caf50; color:#fff;">✅ Finalizar</button>
        ` : a.status === 'completada' ? `
          <a href="https://wa.me/${cleanPhone(a.clients?.phone || '')}?text=${encodeURIComponent('¡Listo! Tu hogar quedó reluciente ✨ Nos vemos en tu próxima visita.')}" target="_blank" class="btn-action-pill" style="background:#25d366; color:#fff; text-decoration:none;">💬 Confirmar WA</a>
        ` : ''}
        <button class="btn-action-pill" onclick="editAppt('${a.id}')" style="background:var(--bg-alt); color:var(--primary); border:1px solid var(--border);">✏️ Editar</button>
        <button class="btn-action-pill" onclick="deleteAppt('${a.id}')" style="background:#ffebee; color:#c62828;">🗑️ Eliminar</button>
      </div>
    </div>
  `).join('');

  // Inicializar swipe cards
  if (typeof initSwipeCard === 'function') {
    container.querySelectorAll('.swipe-card').forEach(el => {
      const count = parseInt(el.dataset.actionsCount) || 2;
      initSwipeCard(el, count * 56);
    });
  }
}

function loadTeamForSelect() {
  const team = DataStore.getTeam().filter(t => t.active !== false);
  const select = document.getElementById('aTeam');
  if (!select) return;

  select.innerHTML = '<option value="">Sin asignar a equipo</option>' + 
    team.map(t => `<option value="${t.id}">${t.name} (${t.role})</option>`).join('');
}

function loadClientsForSelect() {
  const clients = DataStore.getClients();
  const select = document.getElementById('aClient');
  if (!select) return;

  select.innerHTML = '<option value="">Seleccionar cliente...</option>' + 
    clients.map(c => `<option value="${c.id}" data-price="${c.base_price || 0}" data-sqft="${c.size_sqft || 0}" data-freq="${c.frequency || ''}">${c.name} (${c.address ? truncate(c.address, 25) : 'Sin dir'})</option>`).join('');
}

function onClientSelectChange() {
  const select = document.getElementById('aClient');
  const selected = select.options[select.selectedIndex];
  if (!selected || !selected.value) return;

  // First try: use client's stored base_price
  const basePrice = parseInt(selected.dataset.price) || 0;

  // Second try: look up from PRICING table using sqft + freq
  const sqft = parseInt(selected.dataset.sqft) || 0;
  const freq = selected.dataset.freq || '';

  let suggestedPrice = basePrice;
  if (sqft > 0 && freq) {
    // Find the nearest sqft bracket
    const brackets = [1200, 1700, 2200, 2800, 3500, 4500];
    const bracket = brackets.find(b => sqft <= b) || 4500;
    const lookupFreq = (freq === 'once' || freq === 'deep') ? 'deep' : String(freq);
    if (PRICING[bracket] && PRICING[bracket][lookupFreq]) {
      suggestedPrice = PRICING[bracket][lookupFreq];
    }
  }

  if (suggestedPrice > 0) {
    document.getElementById('aPrice').value = suggestedPrice;
  }

  // Show hint
  suggestApptPrice();
}

function suggestApptPrice() {
  const hintEl = document.getElementById('aPriceSuggestionHint');
  if (!hintEl) return;

  const select = document.getElementById('aClient');
  const selected = select.options[select.selectedIndex];
  if (!selected || !selected.value) {
    hintEl.style.display = 'none';
    return;
  }

  const sqft = parseInt(selected.dataset.sqft) || 0;
  const freq = selected.dataset.freq || '';
  if (!sqft || !freq) {
    hintEl.style.display = 'none';
    return;
  }

  const brackets = [1200, 1700, 2200, 2800, 3500, 4500];
  const bracket = brackets.find(b => sqft <= b) || 4500;
  const lookupFreq = (freq === 'once' || freq === 'deep') ? 'deep' : String(freq);
  const baseFromTable = (PRICING[bracket] && PRICING[bracket][lookupFreq]) ? PRICING[bracket][lookupFreq] : 0;

  // Add-ons from the aAddons text field
  const addonsText = (document.getElementById('aAddons').value || '').toLowerCase();
  let extrasTotal = 0;
  if (addonsText.includes('horno')) extrasTotal += PRICING_ADDONS.oven;
  if (addonsText.includes('nevera') || addonsText.includes('fridge')) extrasTotal += PRICING_ADDONS.fridge;
  if (addonsText.includes('gabinete') || addonsText.includes('cabinet')) extrasTotal += PRICING_ADDONS.cabinets;

  const suggestedTotal = baseFromTable + extrasTotal;

  const freqLabels = { '10': 'c/10 días', '15': 'quincenal', '30': 'mensual', 'deep': 'profunda/mudanza', 'once': 'única vez' };

  hintEl.innerHTML = `
    <span style="font-size:11px; color:var(--text-sec);">💡 Precio sugerido según tabla:</span>
    <strong style="color:var(--primary); font-size:13px;"> $${suggestedTotal}</strong>
    <span style="font-size:11px; color:var(--text-muted);">(${sqft} sqft · ${freqLabels[lookupFreq] || lookupFreq}${extrasTotal > 0 ? ' · +$' + extrasTotal + ' extras' : ''})</span>
    <span style="font-size:11px; color:var(--text-muted); margin-left:4px;">— Anggie tiene la última palabra</span>
  `;
  hintEl.style.display = 'flex';
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
  document.getElementById('aTeam').value = '';
  document.getElementById('aFormTitle').textContent = 'Agregar Cita';
  const hint = document.getElementById('aPriceSuggestionHint');
  if (hint) hint.style.display = 'none';
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
  
  // Find assignment
  const assignments = DataStore.getList(DataStore.KEYS.ASSIGNMENTS) || [];
  const assignment = assignments.find(a => a.appointment_id === id);
  if (assignment) {
    document.getElementById('aTeam').value = assignment.team_member_id;
  } else {
    document.getElementById('aTeam').value = '';
  }

  document.getElementById('aFormTitle').textContent = 'Editar Cita';

  // Show suggested price hint
  setTimeout(() => suggestApptPrice(), 0);

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
  const teamMemberId = document.getElementById('aTeam').value;

  if (!clientId || !date) {
    showToast('Por favor selecciona un cliente y la fecha de la cita.');
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

  const savedAppt = DataStore.saveAppointment(apptData);

  // Guardar asignación al equipo si hay una
  if (teamMemberId) {
    const assignments = DataStore.getList(DataStore.KEYS.ASSIGNMENTS) || [];
    let assignment = assignments.find(a => a.appointment_id === savedAppt.id);
    if (!assignment) {
      assignment = {
        id: DataStore.generateUUID(),
        appointment_id: savedAppt.id,
        created_at: new Date().toISOString()
      };
      assignments.push(assignment);
    }
    assignment.team_member_id = teamMemberId;
    DataStore.setList(DataStore.KEYS.ASSIGNMENTS, assignments);
    DataStore.cloudQuery('appointment_assignments', 'upsert', [assignment]);
  } else if (id) {
    // Si se quitó el asignado, podríamos borrarlo pero por ahora no hay endpoint de borrar asignaciones exacto, lo omitimos para mantener histórico.
  }

  toggleForm('apptForm');
  resetApptForm();
  loadAppointments();
  loadDashboard();
  showToast('Cita guardada correctamente ✅');
}

function changeApptStatus(id, newStatus) {
  DataStore.updateAppointmentStatus(id, newStatus);
  loadAppointments();
  loadDashboard();
}

function startCleaning(id) {
  const appt = allAppointments.find(a => a.id == id);
  if (!appt) return;
  appt.started_at = new Date().toISOString();
  appt.status = 'en_progreso';
  DataStore.saveAppointment(appt);
  loadAppointments();
}

function pauseCleaning(id) {
  const appt = allAppointments.find(a => a.id == id);
  if (!appt || !appt.started_at) return;
  
  const currentSessionMins = Math.round((Date.now() - new Date(appt.started_at).getTime()) / 60000);
  appt.accumulated_minutes = (appt.accumulated_minutes || 0) + currentSessionMins;
  appt.started_at = null;
  appt.status = 'pausada';
  DataStore.saveAppointment(appt);
  loadAppointments();
}

function resumeCleaning(id) {
  const appt = allAppointments.find(a => a.id == id);
  if (!appt) return;
  appt.started_at = new Date().toISOString();
  appt.status = 'en_progreso';
  DataStore.saveAppointment(appt);
  loadAppointments();
}

function finishCleaning(id) {
  const appt = allAppointments.find(a => a.id == id);
  if (!appt) return;
  
  let currentSessionMins = 0;
  if (appt.started_at) {
    currentSessionMins = Math.round((Date.now() - new Date(appt.started_at).getTime()) / 60000);
  }
  
  const duration_minutes = (appt.accumulated_minutes || 0) + currentSessionMins;
  appt.completed_at = new Date().toISOString();
  appt.duration_minutes = duration_minutes;
  appt.status = 'completada';
  appt.started_at = null; // Limpiar para el estado final
  
  DataStore.saveAppointment(appt);

  // Aumentar LTV del cliente
  if (appt.client_id) {
    const clients = DataStore.getClients();
    const cIdx = clients.findIndex(c => c.id == appt.client_id);
    if (cIdx !== -1) {
      const client = clients[cIdx];
      client.lifetime_value = (parseFloat(client.lifetime_value) || 0) + (parseFloat(appt.price) || 0);
      client.total_visits = (parseInt(client.total_visits) || 0) + 1;
      client.last_visit = appt.completed_at;
      DataStore.saveClient(client);
    }
  }

  // Marcar minutos trabajados en assignment si existe
  const assignments = DataStore.getList(DataStore.KEYS.ASSIGNMENTS) || [];
  const assignment = assignments.find(a => a.appointment_id === id);
  if (assignment) {
    assignment.minutes_worked = duration_minutes;
    DataStore.setList(DataStore.KEYS.ASSIGNMENTS, assignments);
    DataStore.cloudQuery('appointment_assignments', 'update', { id: assignment.id, data: { minutes_worked: duration_minutes } });
  }
  
  loadAppointments();
  loadDashboard();
  showToast(`Limpieza completada en ${formatDuration(duration_minutes)} ✅`);
}

function formatDuration(mins) {
  if (!mins) return '0min';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m > 0 ? m + 'min' : ''}`;
  return `${m}min`;
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
  
  // Actualizar filtro de categorias
  const filterSelect = document.getElementById('expenseFilter');
  if (filterSelect) {
    const currentVal = filterSelect.value;
    const categories = new Set(allExpenses.map(e => e.category));
    let options = '<option value="todas">Todas las categorías</option>';
    categories.forEach(cat => {
      if(cat) options += `<option value="${cat}">${cat}</option>`;
    });
    filterSelect.innerHTML = options;
    filterSelect.value = currentVal || 'todas';
  }

  renderExpensesTable(allExpenses);
}

function resetExpenseForm() {
  const eId = document.getElementById('eId');
  if (eId) eId.value = '';
  document.getElementById('eCategory').value = '';
  document.getElementById('eAmount').value = '';
  document.getElementById('eDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('eDesc').value = '';
  const title = document.getElementById('eFormTitle');
  if (title) title.textContent = 'Registrar gasto operativo';
}

function editExpense(id) {
  const exp = allExpenses.find(e => e.id == id);
  if (!exp) return;

  const form = document.getElementById('expenseForm');
  if (form) form.style.display = 'block';

  const eId = document.getElementById('eId');
  if (eId) eId.value = exp.id;
  document.getElementById('eCategory').value = exp.category || '';
  document.getElementById('eAmount').value = exp.amount || '';
  document.getElementById('eDate').value = exp.date || new Date().toISOString().split('T')[0];
  document.getElementById('eDesc').value = exp.description || '';

  const title = document.getElementById('eFormTitle');
  if (title) title.textContent = 'Editar gasto operativo';

  if (form) form.scrollIntoView({ behavior: 'smooth' });
}

function renderExpensesTable(exps) {
  const tbody = document.getElementById('expensesTable');
  if (!exps || exps.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">No hay gastos registrados aún.</td></tr>';
    document.getElementById('expensesTotalHeader').textContent = 'Total: $0.00';
    return;
  }

  const total = exps.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const totalEl = document.getElementById('expensesTotalHeader');
  if (totalEl) totalEl.textContent = 'Total: $' + total.toFixed(2);

  tbody.innerHTML = exps.map(e => `
    <tr>
      <td><strong>${formatDate(e.date)}</strong></td>
      <td><span class="badge" style="background:#f0e6f5; color:var(--primary); font-weight:700;">${e.category}</span></td>
      <td>${e.description || '-'}</td>
      <td><strong style="color:var(--danger); font-weight:800;">$${parseFloat(e.amount).toFixed(2)}</strong></td>
      <td class="action-cell" style="display:flex; gap:6px; justify-content:flex-end;">
        <button class="btn-table-action" style="background:#fff8ed; color:#d4a017; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;" onclick="editExpense('${e.id}')" title="Editar gasto">
          ✏️
        </button>
        <button class="btn-table-action btn-del-table" style="background:#f44336; color:#fff;" onclick="deleteExpense('${e.id}')" title="Eliminar gasto">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
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
  const eId = document.getElementById('eId') ? document.getElementById('eId').value : '';
  const category = document.getElementById('eCategory').value.trim();
  const amount = parseFloat(document.getElementById('eAmount').value);
  const date = document.getElementById('eDate').value || new Date().toISOString().split('T')[0];
  const desc = document.getElementById('eDesc').value.trim();

  if (!category || isNaN(amount) || amount <= 0) {
    showToast('Por favor selecciona una categoría e ingresa un monto válido.');
    return;
  }

  const expData = {
    id: eId || undefined,
    category,
    amount,
    date,
    description: desc
  };

  DataStore.saveExpense(expData);

  resetExpenseForm();
  toggleForm('expenseForm');
  loadExpenses();
  loadDashboard();
  showToast(eId ? 'Gasto actualizado con éxito ✅' : 'Gasto guardado ✅');
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

function renderPricingTable() {
  const tbody = document.getElementById('pricingRefTableBody');
  if (!tbody) return;
  const sizes = [1200, 1700, 2200, 2800, 3500, 4500];
  const freqs = ['10', '15', '30', 'deep'];
  tbody.innerHTML = sizes.map(sz => `
    <tr>
      <td><strong>${sz} sqft</strong></td>
      ${freqs.map(fq => `
        <td>
          <input type="number" value="${PRICING[sz][fq] || ''}" style="width:70px; padding:6px 8px; border-radius:6px; border:1px solid var(--border); font-size:13px; text-align:center; font-weight:700;" onchange="updatePricingValue(${sz}, '${fq}', this.value)">
        </td>
      `).join('')}
    </tr>
  `).join('');
}

function updatePricingValue(size, freq, val) {
  const num = parseInt(val) || 0;
  if (PRICING[size]) {
    PRICING[size][freq] = num;
    try {
      localStorage.setItem('adsparkling_pricing', JSON.stringify(PRICING));
    } catch(e) {}
    qcCalculate();
    showToast('Precio de referencia actualizado ✅');
  }
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
    showToast('Cotización copiada al portapapeles ✅');
  }).catch(() => {
    showToast('Texto de cotización:\n\n' + text);
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

  showToast('Cotización guardada como Lead en el panel ✅');
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
        ${(!r.status || r.status === 'pendiente' || r.status === 'archivada') ? `
          <button class="btn-table-action" style="background:#e8f8f0; color:#2d8a5e; font-weight:700; padding:6px 14px;" onclick="publishReview('${r.id}')" title="Publicar en la web">
            ✓ Publicar en la Web
          </button>
        ` : `
          <button class="btn-table-action" style="background:#e8f8f0; color:#2d8a5e; font-weight:700; padding:6px 14px; opacity:0.5; cursor:default;" disabled>
            ✓ Publicada
          </button>
        `}
        ${r.status === 'publicada' ? `
          <button class="btn-table-action" style="background:#f0eef3; color:var(--text-sec); padding:6px 14px;" onclick="archiveReview('${r.id}')" title="Ocultar de la web">
            📦 Archivar
          </button>
        ` : ''}
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

  // Contratos recientes aceptados
  const recentContracts = DataStore.getContracts().filter(c => c.accepted && c.accepted_at && (Date.now() - new Date(c.accepted_at).getTime()) < 72*3600*1000);
  if (recentContracts.length > 0) {
    alerts.push({
      type: 'contract',
      title: `📄 ${recentContracts.length} Contrato(s) aceptado(s) recientemente`,
      desc: `Un cliente ha aceptado sus términos. Revisa la pestaña de clientes para ver los PDF.`,
      action: "showTab('clients'); toggleNotificationsModal();"
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
    showToast('Datos de prueba restaurados exitosamente ✅');
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
// PLANES
// ============================================
let allPlans = [];

function loadPlans() {
  allPlans = DataStore.getPlans() || [];
  renderPlansList(allPlans);
}

function renderPlansList(plans) {
  const list = document.getElementById('adminPlansList');
  if (!list) return;

  if (!plans || plans.length === 0) {
    list.innerHTML = '<p class="empty">No hay planes para mostrar.</p>';
    return;
  }

  list.innerHTML = plans.map(p => `
    <div class="dash-item dash-item--card" style="opacity: ${p.active !== false ? '1' : '0.65'};">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
        <div>
          <span class="badge" style="background:rgba(49,1,63,0.08); color:var(--primary); font-weight:700; margin-bottom:6px; display:inline-block;">${freqLabel(p.frequency)}</span>
          <h3 style="margin:4px 0 0 0; color:var(--primary); font-size:18px; font-weight:800;">${p.name || 'Sin nombre'}</h3>
        </div>
        <div style="text-align:right;">
          <div style="font-size:22px; font-weight:800; color:var(--success);">$${p.price || 0}</div>
          <span style="font-size:11px; padding:3px 8px; border-radius:12px; font-weight:600; background:${p.active !== false ? '#e8f5e9' : '#ffebee'}; color:${p.active !== false ? '#2d8a5e' : '#c62828'};">${p.active !== false ? '● Activo' : '○ Inactivo'}</span>
        </div>
      </div>

      ${(p.included && p.included.length) ? `
        <div style="font-size:13px; color:var(--text); margin-bottom:10px;">
          <strong style="color:var(--primary);">Incluye:</strong>
          <ul style="margin:4px 0 0 18px; padding:0; color:var(--text-sec);">
            ${p.included.map(inc => `<li>${inc}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${p.terms ? `<div style="font-size:12px; color:var(--text-muted); background:var(--bg-alt); padding:8px 12px; border-radius:8px; margin-bottom:12px;">📌 ${p.terms}</div>` : ''}

      <div class="card-actions-row" style="justify-content:flex-end;">
        <button class="btn-action-pill" onclick="editPlan('${p.id}')" style="background:var(--bg-alt); color:var(--primary); border:1px solid var(--border);">✏️ Editar Plan</button>
        <button class="btn-action-pill" onclick="togglePlanActive('${p.id}')" style="background:${p.active !== false ? '#ffebee' : '#e8f5e9'}; color:${p.active !== false ? '#c62828' : '#2d8a5e'};">${p.active !== false ? '🚫 Desactivar' : '✅ Activar'}</button>
      </div>
    </div>
  `).join('');
}

function filterPlans(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    renderPlansList(allPlans);
    return;
  }
  const filtered = allPlans.filter(p => 
    (p.name && p.name.toLowerCase().includes(q)) ||
    (p.price && p.price.toString().includes(q))
  );
  renderPlansList(filtered);
}

function resetPlanForm() {
  document.getElementById('pId').value = '';
  document.getElementById('pName').value = '';
  document.getElementById('pFreq').value = '15';
  document.getElementById('pPrice').value = '';
  document.getElementById('pIncluded').value = '';
  document.getElementById('pExcluded').value = '';
  document.getElementById('pTerms').value = '';
  document.getElementById('pActive').checked = true;
  const title = document.getElementById('pFormTitle');
  if (title) title.textContent = 'Agregar Plan';
}

function savePlanForm() {
  const id = document.getElementById('pId').value;
  const name = document.getElementById('pName').value.trim();
  const frequency = document.getElementById('pFreq').value;
  const price = document.getElementById('pPrice').value;
  const includedText = document.getElementById('pIncluded').value;
  const excludedText = document.getElementById('pExcluded').value;
  const terms = document.getElementById('pTerms').value.trim();
  const active = document.getElementById('pActive').checked;

  if (!name || !price) {
    showToast('El nombre y el precio son obligatorios.');
    return;
  }

  const included = includedText.split('\n').map(s => s.trim()).filter(Boolean);
  const excluded = excludedText.split('\n').map(s => s.trim()).filter(Boolean);

  const planData = {
    id: id || undefined,
    name,
    frequency,
    price: parseFloat(price) || 0,
    included,
    excluded,
    terms,
    active
  };

  DataStore.savePlan(planData);
  toggleForm('planForm');
  resetPlanForm();
  loadPlans();
  showToast('Plan guardado con éxito ✅');
}

function editPlan(id) {
  const plan = DataStore.getPlans().find(p => p.id == id);
  if (!plan) return;

  showTab('plans');
  const form = document.getElementById('planForm');
  if (form) form.style.display = 'block';

  document.getElementById('pId').value = plan.id;
  document.getElementById('pName').value = plan.name || '';
  document.getElementById('pFreq').value = plan.frequency || '15';
  document.getElementById('pPrice').value = plan.price || '';
  document.getElementById('pIncluded').value = Array.isArray(plan.included) ? plan.included.join('\n') : '';
  document.getElementById('pExcluded').value = Array.isArray(plan.excluded) ? plan.excluded.join('\n') : '';
  document.getElementById('pTerms').value = plan.terms || '';
  document.getElementById('pActive').checked = plan.active !== false;

  const title = document.getElementById('pFormTitle');
  if (title) title.textContent = 'Editar Plan';
  
  if (form) form.scrollIntoView({ behavior: 'smooth' });
}

function togglePlanActive(id) {
  const plan = DataStore.getPlans().find(p => p.id == id);
  if (!plan) return;
  DataStore.savePlan({ ...plan, active: plan.active === false ? true : false });
  loadPlans();
}

// ============================================
// EQUIPO (TEAM)
// ============================================
let allTeam = [];

function loadTeam() {
  allTeam = DataStore.getTeam() || [];
  renderTeamList(allTeam);
}

function renderTeamList(team) {
  const container = document.getElementById('teamTable');
  if (!container) return;

  if (!team || team.length === 0) {
    container.innerHTML = '<p class="empty">No hay miembros en el equipo aún.</p>';
    return;
  }

  container.innerHTML = team.map(t => `
    <div class="dash-item dash-item--card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:42px; height:42px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px;">
            ${t.name ? t.name.charAt(0).toUpperCase() : 'E'}
          </div>
          <div>
            <strong style="font-size:16px; color:var(--primary); display:block;">${t.name}</strong>
            <div style="font-size:13px; color:var(--text-sec);">
              Rol: <span style="font-weight:600; text-transform:capitalize;">${t.role}</span>
            </div>
          </div>
        </div>
        <span style="font-size:11px; padding:3px 8px; border-radius:12px; font-weight:600; background:${t.active ? '#e8f5e9' : '#ffebee'}; color:${t.active ? '#2d8a5e' : '#c62828'};">
          ${t.active ? '● Disponible' : '○ No disponible'}
        </span>
      </div>

      <div style="font-size:13px; color:var(--text-sec); background:#fff; border:1px solid var(--border); padding:8px 12px; border-radius:8px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
        <span>📞 Teléfono: ${t.phone || 'Sin registrar'}</span>
        ${t.phone ? `<a href="tel:${cleanPhone(t.phone)}" style="color:var(--primary); text-decoration:none; font-weight:600;">Llamar 📞</a>` : ''}
      </div>

      <div class="card-actions-row" style="justify-content:flex-end; border-top:none; padding-top:0;">
        <button class="btn-action-pill" onclick="editTeamMember('${t.id}')" style="background:var(--bg-alt); color:var(--primary); border:1px solid var(--border);">✏️ Editar</button>
        <button class="btn-action-pill" onclick="deleteTeamMember('${t.id}')" style="background:#ffebee; color:#c62828;">🗑️ Eliminar</button>
      </div>
    </div>
  `).join('');
}

function saveTeamMember() {
  const id = document.getElementById('tId').value;
  const name = document.getElementById('tName').value.trim();
  const phone = document.getElementById('tPhone').value.trim();
  const role = document.getElementById('tRole').value;
  const active = document.getElementById('tActive').value === 'true';

  if (!name) {
    showToast('El nombre es obligatorio.');
    return;
  }

  DataStore.saveTeamMember({ id: id || undefined, name, phone, role, active });
  toggleForm('teamForm');
  loadTeam();
  showToast('Miembro del equipo guardado ✅');
}

function resetTeamForm() {
  document.getElementById('tId').value = '';
  document.getElementById('tName').value = '';
  document.getElementById('tPhone').value = '';
  document.getElementById('tRole').value = 'cleaner';
  document.getElementById('tActive').value = 'true';
  document.getElementById('tFormTitle').textContent = 'Añadir Miembro del Equipo';
}

function editTeamMember(id) {
  const member = allTeam.find(t => t.id == id);
  if (!member) return;

  document.getElementById('tId').value = member.id;
  document.getElementById('tName').value = member.name;
  document.getElementById('tPhone').value = member.phone || '';
  document.getElementById('tRole').value = member.role || 'cleaner';
  document.getElementById('tActive').value = member.active ? 'true' : 'false';
  document.getElementById('tFormTitle').textContent = 'Editar Miembro';

  toggleForm('teamForm');
}

function deleteTeamMember(id) {
  if (confirm('¿Eliminar este miembro del equipo?')) {
    DataStore.deleteTeamMember(id);
    loadTeam();
  }
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
