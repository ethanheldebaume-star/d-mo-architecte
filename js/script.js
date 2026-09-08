(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const body = document.body;

  const setHeaderState = () => {
    const header = document.querySelector('[data-header]');
    if (!header) return;

    let ticking = false;
    const updateHeader = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 48);
      ticking = false;
    };

    updateHeader();
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });
  };

  const setIntro = () => {
    const intro = document.querySelector('[data-intro]');
    if (!intro) return;

    const finishIntro = () => {
      intro.classList.add('is-leaving');
      body.classList.remove('is-intro-active');
      window.setTimeout(() => intro.remove(), 450);
    };

    const skip = intro.querySelector('[data-intro-skip]');
    const hasSeenIntro = (() => {
      try {
        return window.sessionStorage.getItem('atelier-nord-intro') === 'seen';
      } catch {
        return false;
      }
    })();

    if (hasSeenIntro || reducedMotion.matches) {
      intro.remove();
      return;
    }

    body.classList.add('is-intro-active');
    skip?.addEventListener('click', finishIntro, { once: true });

    window.setTimeout(() => {
      try {
        window.sessionStorage.setItem('atelier-nord-intro', 'seen');
      } catch {
        // The page can still work when session storage is unavailable.
      }
      finishIntro();
    }, 1050);
  };

  const setHeroVideo = () => {
    const video = document.querySelector('[data-hero-video]');
    if (!video) return;

    const updateVideo = () => {
      if (reducedMotion.matches) {
        video.pause();
        return;
      }

      video.play().catch(() => {
        // The poster image remains visible if autoplay is blocked by the browser.
      });
    };

    updateVideo();

    if (typeof reducedMotion.addEventListener === 'function') {
      reducedMotion.addEventListener('change', updateVideo);
    } else {
      reducedMotion.addListener(updateVideo);
    }
  };

  const setMobileMenu = () => {
    const toggle = document.querySelector('[data-menu-toggle]');
    const menu = document.querySelector('[data-mobile-menu]');
    const closeButton = document.querySelector('[data-menu-close]');
    if (!toggle || !menu) return;

    let lastFocusedElement = null;

    const menuFocusableElements = () => Array.from(
      menu.querySelectorAll('a[href], button:not([disabled])')
    );

    const closeMenu = () => {
      if (!body.classList.contains('is-menu-open')) return;
      body.classList.remove('is-menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Ouvrir le menu');
      menu.setAttribute('aria-hidden', 'true');
      lastFocusedElement?.focus();
    };

    const openMenu = () => {
      lastFocusedElement = document.activeElement;
      body.classList.add('is-menu-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Fermer le menu');
      menu.setAttribute('aria-hidden', 'false');
      window.setTimeout(() => closeButton?.focus(), 40);
    };

    toggle.addEventListener('click', () => {
      if (body.classList.contains('is-menu-open')) closeMenu();
      else openMenu();
    });

    closeButton?.addEventListener('click', closeMenu);
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

    document.addEventListener('keydown', (event) => {
      if (!body.classList.contains('is-menu-open')) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      }

      if (event.key === 'Tab') {
        const focusable = menuFocusableElements();
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  };

  const setReveals = () => {
    const revealElements = document.querySelectorAll('[data-reveal]');
    if (!revealElements.length) return;

    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      revealElements.forEach((element) => element.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

    revealElements.forEach((element) => observer.observe(element));
  };

  const setComparisons = () => {
    document.querySelectorAll('[data-comparison]').forEach((comparison) => {
      const range = comparison.querySelector('[data-comparison-range]');
      if (!range) return;

      let activePointerId = null;

      const updateComparison = () => {
        const value = Number(range.value);
        comparison.style.setProperty('--position', `${value}%`);
        range.setAttribute('aria-valuetext', `Avant ${value} %, après ${100 - value} %`);
      };

      const updateFromPointer = (event) => {
        const bounds = comparison.getBoundingClientRect();
        const position = Math.round(((event.clientX - bounds.left) / bounds.width) * 100);
        range.value = String(Math.min(100, Math.max(0, position)));
        updateComparison();
      };

      const finishPointer = (event) => {
        if (event.pointerId !== activePointerId) return;
        comparison.releasePointerCapture?.(event.pointerId);
        activePointerId = null;
      };

      range.addEventListener('input', updateComparison);
      comparison.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        activePointerId = event.pointerId;
        comparison.setPointerCapture?.(event.pointerId);
        updateFromPointer(event);
      });
      comparison.addEventListener('pointermove', (event) => {
        if (event.pointerId === activePointerId) updateFromPointer(event);
      });
      comparison.addEventListener('pointerup', finishPointer);
      comparison.addEventListener('pointercancel', finishPointer);
      updateComparison();
    });
  };

  setHeaderState();
  setIntro();
  setHeroVideo();
  setMobileMenu();
  setReveals();
  setComparisons();
})();
