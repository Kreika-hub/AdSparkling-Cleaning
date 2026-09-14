/* ============================================
   INLINE LOGOS — Ad Sparkling Cleaning
   Reemplaza <img src="*.svg"> por <svg> inline
   para permitir carga de fuentes externas en móviles
   ============================================ */
document.addEventListener("DOMContentLoaded", () => {
  const images = document.querySelectorAll('img[src$="logo-color.svg"], img[src$="logo-white.svg"], img[src$="logo-color.svg#"]');

  images.forEach((img, index) => {
    const imgID = img.id;
    const imgClass = img.className;
    // Manejar src relativo
    const imgURL = img.getAttribute('src');
    const imgStyle = img.getAttribute('style');
    const imgAlt = img.alt || 'Ad Sparkling Logo';

    fetch(imgURL)
      .then(response => {
        if (!response.ok) throw new Error('No se pudo cargar el SVG');
        return response.text();
      })
      .then(svgText => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const svg = xmlDoc.querySelector('svg');

        if (!svg) throw new Error('El archivo obtenido no es un SVG válido');

        // Aislar estilos css para evitar conflictos entre versiones de color
        const prefix = `logo${index}-`;
        const styleTag = svg.querySelector('style');
        if (styleTag) {
          // Reemplazar .cls-X con .logoN-cls-X en el CSS
          styleTag.textContent = styleTag.textContent.replace(/\.cls-(\d+)/g, `.${prefix}cls-$1`);
        }

        // Reemplazar class="cls-X" con class="logoN-cls-X" en los elementos
        const elements = svg.querySelectorAll('[class*="cls-"]');
        elements.forEach(el => {
          if (el.getAttribute('class')) {
            const newClass = el.getAttribute('class').split(' ').map(c => c.startsWith('cls-') ? `${prefix}${c}` : c).join(' ');
            el.setAttribute('class', newClass);
          }
        });

        // Copiar atributos originales de la imagen
        if (imgID) svg.id = imgID;
        if (imgClass) svg.setAttribute('class', imgClass);
        if (imgStyle) svg.setAttribute('style', imgStyle);
        
        // Atributos de accesibilidad
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', imgAlt);

        // Reemplazar la imagen en el DOM
        img.replaceWith(svg);
      })
      .catch(err => {
        console.warn('Error inlining SVG logo (manteniendo <img> original):', err);
      });
  });
});
