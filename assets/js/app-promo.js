/**
 * Ad Sparkling Cleaning — App Promo & Unified Plans Script
 * Handles device-aware installation instructions, smooth quote pre-selection,
 * and smart interactive bottom promo banner.
 */
(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', initAppPromo);

  function initAppPromo() {
    const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
                         (navigator.standalone === true);

    const appSection = document.getElementById('app');
    const banner = document.getElementById('appPromoBanner');

    // If running in standalone mode (already installed), hide app section & banner completely
    if (isStandalone) {
      if (appSection) appSection.style.display = 'none';
      if (banner) banner.style.display = 'none';
      return;
    }

    // 1. Device and browser detection
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    const isInApp = /FBAN|FBAV|Instagram|TikTok|Line/i.test(ua);

    const inAppWarning = document.getElementById('appInAppWarning');
    const iosBlock = document.getElementById('appPlatformIos');
    const androidBlock = document.getElementById('appPlatformAndroid');
    const desktopBlock = document.getElementById('appPlatformDesktop');

    if (isInApp && inAppWarning) {
      inAppWarning.style.display = 'flex';
    }

    if (isIOS) {
      if (iosBlock) iosBlock.style.display = 'block';
      if (androidBlock) androidBlock.style.display = 'none';
      if (desktopBlock) desktopBlock.style.display = 'none';
    } else if (isAndroid) {
      if (androidBlock) androidBlock.style.display = 'block';
      if (iosBlock) iosBlock.style.display = 'none';
      if (desktopBlock) desktopBlock.style.display = 'none';
    } else {
      if (desktopBlock) desktopBlock.style.display = 'block';
      if (iosBlock) iosBlock.style.display = 'none';
      if (androidBlock) androidBlock.style.display = 'none';
    }

    // 2. Desktop Copy Link action
    const copyBtn = document.getElementById('appCopyLinkBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function() {
        const portalUrl = new URL('portal.html', window.location.href).href;
        const toast = document.getElementById('appCopyToast');
        
        function showToast() {
          if (toast) {
            toast.classList.add('visible');
            setTimeout(function() {
              toast.classList.remove('visible');
            }, 3200);
          }
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(portalUrl).then(showToast).catch(function() {
            fallbackCopy(portalUrl, showToast);
          });
        } else {
          fallbackCopy(portalUrl, showToast);
        }
      });
    }

    function fallbackCopy(text, callback) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        if (callback) callback();
      } catch (err) {
        console.warn('Fallback copy error:', err);
      }
      document.body.removeChild(textArea);
    }

    // 3. Plan Cards "Solicitar presupuesto" clicks
    const planButtons = document.querySelectorAll('.btn-plan-quote');
    planButtons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const serviceType = btn.getAttribute('data-plan-service');
        const freq = btn.getAttribute('data-plan-freq');
        const sTypeSelect = document.getElementById('reqServiceType');
        const freqSelect = document.getElementById('reqFreq');

        if (sTypeSelect && serviceType) {
          const hasOption = Array.prototype.some.call(sTypeSelect.options, function(opt) {
            return opt.value === serviceType;
          });
          if (hasOption) {
            sTypeSelect.value = serviceType;
            sTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }

        if (freqSelect && freq) {
          const hasOption = Array.prototype.some.call(freqSelect.options, function(opt) {
            return opt.value === freq;
          });
          if (hasOption) {
            freqSelect.value = freq;
            freqSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }

        const quoteSection = document.getElementById('solicitar');
        if (quoteSection) {
          quoteSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // 4. Interactive Promotional Bottom Banner
    initPromoBanner(banner);
  }

  function initPromoBanner(banner) {
    if (!banner) return;

    // Check if dismissed in last 7 days
    try {
      const dismissedTimestamp = localStorage.getItem('ad_app_banner_dismissed');
      if (dismissedTimestamp) {
        const elapsed = Date.now() - parseInt(dismissedTimestamp, 10);
        if (elapsed < 7 * 24 * 60 * 60 * 1000) {
          return;
        }
      }
    } catch (e) {
      // If localStorage is unavailable, proceed without persistence
    }

    let isBannerActive = false;

    function displayBanner() {
      if (isBannerActive) return;
      isBannerActive = true;
      banner.classList.add('visible');
      document.body.classList.add('has-app-banner');
      window.removeEventListener('scroll', checkScrollPosition);
    }

    function checkScrollPosition() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const scrolled = (window.scrollY || document.documentElement.scrollTop) / docHeight;
        if (scrolled >= 0.3) {
          displayBanner();
        }
      }
    }

    // Trigger after 6 seconds
    const timer = setTimeout(displayBanner, 6000);

    // Or trigger when scrolling >= 30%
    window.addEventListener('scroll', checkScrollPosition, { passive: true });

    // Close button
    const closeBtn = document.getElementById('appBannerCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        clearTimeout(timer);
        banner.classList.remove('visible');
        document.body.classList.remove('has-app-banner');
        try {
          localStorage.setItem('ad_app_banner_dismissed', Date.now().toString());
        } catch (err) {}
      });
    }

    // CTA button scroll to #app
    const ctaBtn = document.getElementById('appBannerCtaBtn');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const appSection = document.getElementById('app');
        if (appSection) {
          appSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }
})();
