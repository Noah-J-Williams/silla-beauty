(() => {
  const body = document.body;

  const closeDesktopMenus = () => {
    document.querySelectorAll('.sb-header__nav-item details[open]').forEach((details) => {
      details.open = false;
    });
  };

  const initDesktopMenus = () => {
    const menus = [...document.querySelectorAll('.sb-header__nav-item details')];
    if (!menus.length) return;

    menus.forEach((details) => {
      details.addEventListener('toggle', () => {
        if (!details.open) return;
        menus.forEach((other) => {
          if (other !== details) other.open = false;
        });
      });
    });

    document.addEventListener('click', (event) => {
      menus.forEach((details) => {
        if (details.open && !details.contains(event.target)) {
          details.open = false;
        }
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeDesktopMenus();
      }
    });
  };

  const initMobileDrawer = () => {
    const drawer = document.querySelector('[data-sb-drawer]');
    const openButton = document.querySelector('[data-sb-drawer-open]');
    const headerBar = document.querySelector('[data-sb-header-bar]');
    if (!drawer || !openButton || !headerBar) return;

    const closeButtons = drawer.querySelectorAll('[data-sb-drawer-close]');

    const syncDrawerOffset = () => {
      const rect = headerBar.getBoundingClientRect();
      drawer.style.setProperty('--sb-mobile-drawer-top', `${Math.max(rect.bottom, 0)}px`);
    };

    const closeDrawer = () => {
      drawer.classList.remove('is-open');
      body.classList.remove('sb-drawer-open');
      openButton.setAttribute('aria-expanded', 'false');
    };

    const openDrawer = () => {
      syncDrawerOffset();
      drawer.classList.add('is-open');
      body.classList.add('sb-drawer-open');
      openButton.setAttribute('aria-expanded', 'true');
    };

    openButton.addEventListener('click', () => {
      if (drawer.classList.contains('is-open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    closeButtons.forEach((button) => {
      button.addEventListener('click', closeDrawer);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeDrawer();
      }
    });

    window.addEventListener('resize', syncDrawerOffset);
    window.addEventListener('scroll', () => {
      if (drawer.classList.contains('is-open')) {
        syncDrawerOffset();
      }
    }, { passive: true });

    const desktopMedia = window.matchMedia('(min-width: 990px)');
    desktopMedia.addEventListener('change', (event) => {
      if (event.matches) {
        closeDrawer();
      } else {
        syncDrawerOffset();
      }
    });

    syncDrawerOffset();
  };

  const initSlideshows = () => {
    document.querySelectorAll('[data-sb-slideshow]').forEach((slideshow) => {
      if (slideshow.dataset.sbReady === 'true') return;
      slideshow.dataset.sbReady = 'true';

      const slides = [...slideshow.querySelectorAll('[data-sb-slide]')];
      const dots = [...slideshow.querySelectorAll('[data-sb-dot]')];
      const prev = slideshow.querySelector('[data-sb-prev]');
      const next = slideshow.querySelector('[data-sb-next]');
      const autoplay = slideshow.dataset.autoplay === 'true';
      const speed = (parseInt(slideshow.dataset.speed, 10) || 6) * 1000;

      if (!slides.length) return;

      let activeIndex = slides.findIndex((slide) => slide.classList.contains('is-active'));
      if (activeIndex < 0) activeIndex = 0;
      let timer = null;

      const setActive = (newIndex) => {
        activeIndex = (newIndex + slides.length) % slides.length;

        slides.forEach((slide, index) => {
          const isActive = index === activeIndex;
          slide.classList.toggle('is-active', isActive);
          slide.setAttribute('aria-hidden', String(!isActive));
        });

        dots.forEach((dot, index) => {
          const isActive = index === activeIndex;
          dot.classList.toggle('is-active', isActive);
          dot.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
      };

      const stop = () => {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
      };

      const start = () => {
        if (!autoplay || slides.length < 2) return;
        stop();
        timer = window.setInterval(() => {
          setActive(activeIndex + 1);
        }, speed);
      };

      prev?.addEventListener('click', () => {
        setActive(activeIndex - 1);
        start();
      });

      next?.addEventListener('click', () => {
        setActive(activeIndex + 1);
        start();
      });

      dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          setActive(index);
          start();
        });
      });

      slideshow.addEventListener('mouseenter', stop);
      slideshow.addEventListener('mouseleave', start);
      slideshow.addEventListener('focusin', stop);
      slideshow.addEventListener('focusout', start);

      setActive(activeIndex);
      start();
    });
  };

  const initScrollFeatures = () => {
    document.querySelectorAll('[data-sb-scroll-feature]').forEach((feature) => {
      if (feature.dataset.sbScrollReady === 'true') return;
      feature.dataset.sbScrollReady = 'true';

      const viewport = feature.querySelector('[data-sb-scroll-viewport]');
      const track = feature.querySelector('[data-sb-scroll-track]');
      const controls = feature.querySelector('[data-sb-scroll-controls]');
      const prev = feature.querySelector('[data-sb-scroll-prev]');
      const next = feature.querySelector('[data-sb-scroll-next]');

      if (!viewport || !track || !controls || !prev || !next) return;

      const getScrollStep = () => {
        const card = track.querySelector('.sb-product-card') || track.firstElementChild;
        const styles = window.getComputedStyle(track);
        const gap = parseFloat(styles.columnGap || styles.gap) || 0;
        const cardWidth = card?.getBoundingClientRect().width || viewport.clientWidth * 0.8;

        return Math.max(cardWidth + gap, 1);
      };

      const syncControls = () => {
        const maxScroll = viewport.scrollWidth - viewport.clientWidth;
        const canScroll = maxScroll > 1;

        controls.hidden = !canScroll;
        prev.disabled = !canScroll || viewport.scrollLeft <= 1;
        next.disabled = !canScroll || viewport.scrollLeft >= maxScroll - 1;
      };

      const scrollByDirection = (direction) => {
        viewport.scrollBy({
          left: getScrollStep() * direction,
          behavior: 'smooth',
        });

        window.setTimeout(syncControls, 350);
      };

      let syncFrame = null;
      const requestSync = () => {
        if (syncFrame) return;

        syncFrame = window.requestAnimationFrame(() => {
          syncFrame = null;
          syncControls();
        });
      };

      prev.addEventListener('click', () => scrollByDirection(-1));
      next.addEventListener('click', () => scrollByDirection(1));
      viewport.addEventListener('scroll', requestSync, { passive: true });
      window.addEventListener('resize', requestSync);

      requestSync();
      window.setTimeout(syncControls, 250);
    });
  };

  const init = () => {
    initDesktopMenus();
    initMobileDrawer();
    initSlideshows();
    initScrollFeatures();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', () => {
    initSlideshows();
    initScrollFeatures();
  });
})();

