/* ============================================
   CLIENT PORTAL LOGIC — Ad Sparkling Cleaning
   Gestión de citas del cliente, calificaciones y fotos
   ============================================ */

let currentClient = null;
let selectedRating = 5;
let uploadedPhotos = [];

// ============================================
// PWA LOGIC
// ============================================
let deferredInstallPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW error:', err));
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  // Solo se mostrará si está en la vista main, pero lo controlamos en renderClientPortal
});

function installPortalPWA() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    alert("Para instalar en iPhone/iPad:\n1. Toca el botón de Compartir (cuadrado con flecha hacia arriba).\n2. Selecciona 'Añadir a pantalla de inicio'.");
    return;
  }
  
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA prompt');
      }
      deferredInstallPrompt = null;
      document.getElementById('btnPortalInstall').style.display = 'none';
    });
  } else {
    alert("Para instalar la aplicación, usa las opciones de tu navegador ('Instalar aplicación' o 'Añadir a pantalla de inicio').");
  }
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const phoneParam = urlParams.get('phone');
  const storedPhone = localStorage.getItem('adsparkling_client_phone');

  const phoneToUse = phoneParam || storedPhone;

  if (phoneToUse) {
    loginWithPhone(phoneToUse);
  } else {
    showPhoneLogin();
  }

  setupStarRating();
});

// ============================================
// AUTENTICACIÓN POR TELÉFONO
// ============================================
function showPhoneLogin() {
  document.getElementById('portalLoginView').style.display = 'block';
  document.getElementById('portalMainView').style.display = 'none';
  
  // Mostrar botón PWA en login
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (deferredInstallPrompt || isIOS) {
    const btnInstall = document.getElementById('btnPortalInstallLogin');
    if (btnInstall) btnInstall.style.display = 'block';
  }
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

async function loginWithPhone(phone) {
  const cleanPhone = String(phone).replace(/[^0-9]/g, '');
  const btn = document.getElementById('btnPortalLogin');
  if (btn) btn.textContent = 'Buscando...';

  try {
    const res = await fetch('/api/portal?phone=' + cleanPhone);
    const data = await res.json();

    if (res.ok && data.found) {
      currentClient = data.client;
      // Guardar en variable global el historial para renderClientPortal
      window.clientHistory = data.history; 
      localStorage.setItem('adsparkling_client_phone', cleanPhone);
      renderClientPortal(currentClient, data.history, data.contract, data.plan);
    } else {
      // Cliente no encontrado - mensaje honesto
      document.getElementById('portalLoginView').style.display = 'block';
      document.getElementById('portalMainView').style.display = 'none';
      const loginDiv = document.querySelector('.portal-login-card');
      loginDiv.innerHTML = `
        <img src="assets/images/logo-color.svg" alt="Ad Sparkling" style="height: 60px; margin: 0 auto 20px auto; display:block;">
        <h2 style="color:var(--text-dark); margin-bottom:10px;">Registro no encontrado</h2>
        <p style="color:var(--text-gray); margin-bottom:20px;">No encontramos un plan activo con el número <b>${cleanPhone}</b>. Si eres cliente nuevo o cambiaste de número, contáctanos.</p>
        <a href="https://wa.me/17864582442" class="btn-primary" style="display:inline-block; text-align:center;">Contactar por WhatsApp</a>
        <a href="portal.html" class="btn-secondary" style="display:inline-block; text-align:center; margin-top:10px;">Intentar otro número</a>
      `;
      localStorage.removeItem('adsparkling_client_phone');
    }
  } catch (err) {
    console.error('Error cargando portal:', err);
    alert('Error conectando con el servidor. Por favor intenta de nuevo.');
  } finally {
    if (btn) btn.textContent = 'Acceder a mi Portal';
  }
}

function handleClientLogout() {
  localStorage.removeItem('adsparkling_client_phone');
  window.location.href = 'portal.html';
}

// ============================================
// RENDERIZAR DATOS DEL CLIENTE
// ============================================
let currentContractData = null;
let currentPlanData = null;

function renderClientPortal(client, history = null, contract = null, plan = null) {
  document.getElementById('portalLoginView').style.display = 'none';
  document.getElementById('portalMainView').style.display = 'block';
  
  currentClient = client;
  currentContractData = contract;
  currentPlanData = plan;

  // Saludo y Nombre
  document.getElementById('clientNameHeader').textContent = client.name ? `¡Hola, ${client.name.split(' ')[0]}! ✨` : '¡Bienvenido/a! ✨';
  document.getElementById('clientAddressSub').textContent = client.address || client.zone || 'Servicio de limpieza residencial';

  // Mostrar botón PWA
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (deferredInstallPrompt || isIOS) {
    const installBtn = document.getElementById('btnPortalInstall');
    if (installBtn) installBtn.style.display = 'inline-block';
  }

  // Plan info
  document.getElementById('planFreq').textContent = freqLabel(client.plan_freq || client.frequency);
  document.getElementById('planPrice').textContent = (client.plan_price || client.base_price) ? `$${client.plan_price || client.base_price}` : 'Consultar';
  document.getElementById('planAddress').textContent = client.address || client.zone || 'Miami-Dade';

  // Obtener citas del cliente (desde el parámetro history de la API)
  const clientAppts = history || window.clientHistory || [];

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

  // Historial de visitas
  const pastAppts = clientAppts.filter(a => a.status === 'completada' || a.status === 'cancelada').slice(0, 5);
  const historyList = document.getElementById('historyList');
  if (pastAppts.length === 0) {
    historyList.innerHTML = `<div class="history-item"><span class="history-item-date">${client.last_visit ? formatDate(client.last_visit) : 'Servicio reciente'}</span><span class="history-item-badge">Completado ✓</span></div>`;
  } else {
    historyList.innerHTML = pastAppts.map(a => {
      const isCanceled = a.status === 'cancelada';
      const badgeStyle = isCanceled ? 'background: #ffebee; color: #c62828;' : '';
      const badgeText = isCanceled ? 'Cancelada ⚠️' : 'Completado ✓';
      return `
      <div class="history-item">
        <div>
          <span class="history-item-date">📅 ${formatDate(a.date)}</span>
          ${a.addons && a.addons.length ? `<div style="font-size:11px; color:var(--text-muted);">Extras: ${a.addons.join(', ')}</div>` : ''}
          ${isCanceled && a.notes ? `<div style="font-size:11px; color:#c62828;">Motivo: ${a.notes}</div>` : ''}
        </div>
        <span class="history-item-badge" style="${badgeStyle}">${badgeText}</span>
      </div>
      `;
    }).join('');
  }

  // Banner persuasivo de recargo (30+ días)
  const lastVisitStr = client.last_visit;
  if (lastVisitStr) {
    const lastVisitDate = new Date(lastVisitStr);
    const todayDate = new Date();
    const diffTime = Math.abs(todayDate - lastVisitDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays >= 25 && !nextAppt) { // Si pasaron más de 25 días y no hay cita programada
      const warningHtml = `
        <div style="background: #fff8e1; border-left: 4px solid #ffc107; padding: 12px 16px; margin: 16px 0; border-radius: 8px; font-size: 13px;">
          <h4 style="color: #b28900; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <svg style="width:16px; height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            Importante: Mantenimiento de Limpieza
          </h4>
          <p style="color: #5c4e63; margin-bottom: 8px;">Mantener tu hogar reluciente es más fácil (¡y económico!) cuando lo hacemos de forma constante. Notamos que tu última limpieza fue hace casi un mes.</p>
          <p style="color: #5c4e63;"><strong>Recuerda:</strong> Si pasan más de 30 días sin servicio, la casa acumula más polvo y suciedad profunda, requiriendo un reinicio de limpieza (recargo de $30 - $45). ¡Agenda ahora para mantener tu hogar impecable y ahorrar dinero! ✨</p>
        </div>
      `;
      // Insertar después de la tarjeta de la próxima visita
      const nextVisitCard = document.querySelector('.next-visit-card');
      if (nextVisitCard) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = warningHtml;
        nextVisitCard.parentNode.insertBefore(tempDiv.firstElementChild, nextVisitCard.nextSibling);
      }
    }
  }

  // Link de WhatsApp con mensaje personalizado
  const waBtn = document.getElementById('btnWaContact');
  const waMsg = encodeURIComponent(`¡Hola Anggie! Soy ${client.name} de ${client.address}. Te escribo desde mi portal de cliente sobre mis citas de limpieza ✨.`);
  waBtn.href = `https://wa.me/17864582442?text=${waMsg}`;

  // Plan y Contrato
  const planSection = document.getElementById('planSection');
  if (contract && plan) {
    planSection.style.display = 'block';
    
    let includesHtml = '';
    if (plan.included && plan.included.length > 0) {
      includesHtml = `<strong>Incluye:</strong><ul style="padding-left:20px; list-style:none;">` + plan.included.map(i => `<li style="margin-bottom:4px;">✓ ${i}</li>`).join('') + `</ul>`;
    }
    
    let excludesHtml = '';
    if (plan.excluded && plan.excluded.length > 0) {
      excludesHtml = `<strong>No incluye:</strong><ul style="padding-left:20px; list-style:none;">` + plan.excluded.map(e => `<li style="margin-bottom:4px; color:var(--text-muted);">✕ ${e}</li>`).join('') + `</ul>`;
    }

    document.getElementById('planContent').innerHTML = `
      <div style="margin-bottom:12px;">
        <strong style="color:var(--primary); font-size:16px;">${plan.name}</strong><br>
        Precio: <strong>$${plan.price}</strong> • Frecuencia: <strong>${freqLabel(plan.frequency)}</strong>
      </div>
      <div style="margin-bottom:12px;">${includesHtml}</div>
      <div style="margin-bottom:12px;">${excludesHtml}</div>
      ${plan.terms ? `<div style="background:#f9f9f9; padding:10px; border-radius:6px; font-size:12px; margin-top:10px; border:1px dashed var(--border);"><strong>Políticas y Términos Adicionales:</strong><br><br>${plan.terms.replace(/\\n/g, '<br>')}</div>` : ''}
    `;

    const actionArea = document.getElementById('planActionArea');
    if (contract.accepted) {
      actionArea.innerHTML = `
        <div style="color:var(--success); font-weight:bold; margin-bottom:10px;">✅ Aceptado el ${formatDate(contract.accepted_at)}</div>
        <button class="btn-secondary" onclick="downloadMyContract()" style="width:100%;">📄 Descargar mi contrato</button>
      `;
    } else {
      actionArea.innerHTML = `
        <button id="btnAcceptContract" class="btn-primary" onclick="acceptContractTerms()" style="width:100%; background:var(--primary); color:#fff;">✅ Acepto los Términos y Condiciones</button>
      `;
    }
  } else {
    planSection.style.display = 'none';
  }
}

// ============================================
// SISTEMA DE ESTRELLAS Y RESEÑAS
// ============================================
// CONTRATOS & PDF
// ============================================
function generateContractPDF(client, plan, contract) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  let y = 20;
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(49, 1, 63); // var(--primary) #31013F
  doc.text('Ad Sparkling Cleaning LLC', 105, y, { align: 'center' });
  y += 10;
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Acuerdo de Servicio', 105, y, { align: 'center' });
  y += 15;
  
  // Info Cliente
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text('Datos del Cliente:', 20, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`Nombre: ${client.name}`, 20, y); y += 6;
  doc.text(`Dirección: ${client.address}`, 20, y); y += 6;
  doc.text(`Teléfono: ${client.phone}`, 20, y); y += 12;
  
  // Info Plan
  doc.setFont("helvetica", "bold");
  doc.text('Detalles del Plan:', 20, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`Plan: ${plan.name}`, 20, y); y += 6;
  doc.text(`Precio: $${plan.price}`, 20, y); y += 6;
  doc.text(`Frecuencia: ${freqLabel(plan.frequency)}`, 20, y); y += 12;
  
  // Includes / Excludes
  if (plan.included && plan.included.length) {
    doc.setFont("helvetica", "bold");
    doc.text('Incluye:', 20, y); y += 6;
    doc.setFont("helvetica", "normal");
    plan.included.forEach(item => {
      doc.text(`- ${item}`, 25, y); y += 6;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    y += 4;
  }
  
  if (plan.excluded && plan.excluded.length) {
    doc.setFont("helvetica", "bold");
    doc.text('No incluye:', 20, y); y += 6;
    doc.setFont("helvetica", "normal");
    plan.excluded.forEach(item => {
      doc.text(`x ${item}`, 25, y); y += 6;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    y += 4;
  }
  
  // Terms
  if (plan.terms) {
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.text('Términos y Condiciones Adicionales:', 20, y); y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const splitTerms = doc.splitTextToSize(plan.terms, 170);
    doc.text(splitTerms, 20, y);
    y += (splitTerms.length * 5) + 10;
  }
  
  // Signature / Acceptance
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  if (contract.accepted) {
    doc.setTextColor(45, 138, 94); // success green
    doc.text(`ACEPTADO ELECTRÓNICAMENTE EL: ${formatDate(contract.accepted_at)}`, 20, y);
  } else {
    doc.setTextColor(245, 124, 0); // amber
    doc.text('ESTADO: PENDIENTE DE ACEPTACIÓN', 20, y);
  }
  
  return doc;
}

async function acceptContractTerms() {
  if (!currentClient || !currentContractData || !currentPlanData) return;
  
  const btn = document.getElementById('btnAcceptContract');
  btn.textContent = 'Procesando...';
  btn.disabled = true;
  
  try {
    const doc = generateContractPDF(currentClient, currentPlanData, { ...currentContractData, accepted: true, accepted_at: new Date().toISOString() });
    const pdfBase64 = doc.output('datauristring');
    
    const res = await fetch('/api/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'acceptContract',
        phone: String(currentClient.phone).replace(/[^0-9]/g, ''),
        contract_id: currentContractData.id,
        pdf_base64: pdfBase64
      })
    });
    
    const data = await res.json();
    if (data.success) {
      doc.save('contrato-adsparkling.pdf');
      currentContractData.accepted = true;
      currentContractData.accepted_at = new Date().toISOString();
      
      const actionArea = document.getElementById('planActionArea');
      actionArea.innerHTML = `
        <div style="color:var(--success); font-weight:bold; margin-bottom:10px;">✅ Aceptado exitosamente</div>
        <button class="btn-secondary" onclick="downloadMyContract()" style="width:100%;">📄 Descargar mi contrato</button>
      `;
      alert('¡Gracias! Tu contrato ha sido aceptado y descargado a tu dispositivo.');
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  } catch (err) {
    console.error(err);
    alert('Ocurrió un error al aceptar el contrato: ' + err.message);
    btn.textContent = '✅ Acepto los Términos y Condiciones';
    btn.disabled = false;
  }
}

function downloadMyContract() {
  if (!currentClient || !currentContractData || !currentPlanData) return;
  const doc = generateContractPDF(currentClient, currentPlanData, currentContractData);
  doc.save('contrato-adsparkling.pdf');
}

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
