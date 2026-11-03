/**
 * landing.js — Interactivity for the redesigned immersive landing page
 * Handles:
 * 1. Sticky / Scrolled navbar styling
 * 2. Mobile menu toggle
 * 3. Services carousel horizontal controls
 * 4. Hero cards carousel / navigation
 * 5. Scroll-triggered reveal animations (IntersectionObserver)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky / Scrolled Navbar
  const navbar = document.getElementById('navbar');
  const handleScroll = () => {
    if (window.scrollY > 40) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // 2. Mobile Menu Toggle
  window.toggleMenu = function() {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
      navLinks.classList.toggle('open');
    }
  };

  // Close menu when clicking a link
  const navLinksList = document.querySelectorAll('.nav-links a');
  navLinksList.forEach(link => {
    link.addEventListener('click', () => {
      const navLinks = document.getElementById('navLinks');
      if (navLinks && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
      }
    });
  });

  // 3. Services Horizontal Carousel
  const srvCarousel = document.getElementById('srvCarousel');
  const srvPrev = document.getElementById('srvPrev');
  const srvNext = document.getElementById('srvNext');

  if (srvCarousel && srvPrev && srvNext) {
    const scrollAmount = 300;
    srvPrev.addEventListener('click', () => {
      srvCarousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
    srvNext.addEventListener('click', () => {
      srvCarousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }

  // 4. Hero Cards Navigation (for smaller screens / button controls)
  const heroCardsTrack = document.getElementById('heroCardsTrack');
  const heroPrev = document.getElementById('heroPrev');
  const heroNext = document.getElementById('heroNext');

  if (heroCardsTrack && heroPrev && heroNext) {
    heroPrev.addEventListener('click', () => {
      heroCardsTrack.scrollBy({ left: -260, behavior: 'smooth' });
    });
    heroNext.addEventListener('click', () => {
      heroCardsTrack.scrollBy({ left: 260, behavior: 'smooth' });
    });
  }

  // 5. Scroll Reveal with IntersectionObserver
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  } else {
    // Fallback if IntersectionObserver not available
    revealElements.forEach(el => el.classList.add('visible'));
  }
});
