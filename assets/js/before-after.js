function initBeforeAfterSliders() {
  const sliders = document.querySelectorAll('.before-after-container');
  
  sliders.forEach(container => {
    const slider = container.querySelector('.ba-slider');
    const beforeImg = container.querySelector('.ba-before');
    let isDragging = false;
    
    // Desktop mouse events
    slider.addEventListener('mousedown', (e) => {
      isDragging = true;
    });
    window.addEventListener('mouseup', () => {
      isDragging = false;
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      moveSlider(e.pageX, container, beforeImg, slider);
    });
    
    // Mobile touch events
    slider.addEventListener('touchstart', (e) => {
      isDragging = true;
    }, {passive: true});
    window.addEventListener('touchend', () => {
      isDragging = false;
    });
    window.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      moveSlider(e.touches[0].pageX, container, beforeImg, slider);
    }, {passive: true});
  });
}

function moveSlider(pageX, container, beforeImg, slider) {
  const rect = container.getBoundingClientRect();
  const containerLeft = rect.left + window.scrollX;
  const containerWidth = rect.width;
  
  let xOffset = pageX - containerLeft;
  if (xOffset < 0) xOffset = 0;
  if (xOffset > containerWidth) xOffset = containerWidth;
  
  const percentage = (xOffset / containerWidth) * 100;
  
  beforeImg.style.clipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
  slider.style.left = `${percentage}%`;
}

document.addEventListener('DOMContentLoaded', initBeforeAfterSliders);
