function initSwipeCard(cardEl, actionsWidthPx) {
  let startX = 0;
  let currentX = 0;
  let isDragging = false;
  
  // Touch Events for Mobile Swipe
  cardEl.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });

  cardEl.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    
    // Solo permitir deslizar hacia la izquierda (negativo) y hasta el ancho máximo de las acciones
    if (diff < 0 && Math.abs(diff) <= actionsWidthPx) {
      cardEl.style.transform = `translateX(${diff}px)`;
    }
  }, { passive: true });

  cardEl.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const diff = currentX - startX;
    
    // Si desliza al menos 40px, se abre. Si no, se cierra.
    cardEl.style.transform = ''; // Limpiar transform en línea para dejar que CSS tome el control
    if (diff < -40) {
      openCard(cardEl, actionsWidthPx);
    } else {
      closeCard(cardEl);
    }
    
    // Resetear
    startX = 0;
    currentX = 0;
  });

  // Desktop click fallback
  cardEl.addEventListener('click', (e) => {
    // Si la tarjeta no está abierta, al hacer clic se abre.
    if (!cardEl.classList.contains('open')) {
      openCard(cardEl, actionsWidthPx);
    } else {
      // Si está abierta y hace clic, se cierra.
      closeCard(cardEl);
    }
  });
}

function openCard(cardEl, actionsWidthPx) {
  // Cerrar cualquier otra tarjeta abierta
  document.querySelectorAll('.swipe-card.open').forEach(el => {
    if (el !== cardEl) closeCard(el);
  });
  
  cardEl.style.setProperty('--swipe-offset', `-${actionsWidthPx}px`);
  cardEl.classList.add('open');
}

function closeCard(cardEl) {
  cardEl.classList.remove('open');
}

// Escuchar toques/clics fuera de las tarjetas para cerrarlas
document.addEventListener('click', (e) => {
  if (!e.target.closest('.swipe-wrap')) {
    document.querySelectorAll('.swipe-card.open').forEach(el => closeCard(el));
  }
});

document.addEventListener('touchstart', (e) => {
  if (!e.target.closest('.swipe-wrap')) {
    document.querySelectorAll('.swipe-card.open').forEach(el => closeCard(el));
  }
}, { passive: true });
