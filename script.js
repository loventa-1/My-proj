/* LOVENTA — Wedding Invitation
   Vanilla JS: Preloader, Lenis smooth scroll, Reveal-on-scroll,
   Countdown, Schedule/FAQ accordions, Gallery lightbox,
   Timeline rail fill, RSVP form. */

(() => {
  const WEDDING_DATE = new Date('2026-11-14T17:00:00+03:00');
  const $  = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

  /* ---------- Preloader ---------- */
  const preloader = $('#preloader');
  const preVideo  = $('#preloaderVideo');
  const prePoster = $('#preloaderPoster');
  const site      = $('#site');
  let preloaderTimeout;

  function revealSite() {
    document.body.classList.remove('locked');
    site.classList.add('visible');
    const heroVideo = $('#heroVideo');
    if (heroVideo) heroVideo.play().catch(() => {});
    initLenis();
    initHeroReveal();
  }

  function endPreloader() {
    if (!preloader || preloader.classList.contains('fade-out')) return;
    preloader.classList.add('whiteout');
    setTimeout(() => {
      revealSite();
      preloader.classList.add('fade-out');
      setTimeout(() => preloader.classList.add('hidden'), 1000);
    }, 500);
  }

  if (prePoster && preVideo) {
    prePoster.addEventListener('click', () => {
      prePoster.classList.add('hidden');
      preVideo.play().catch(() => endPreloader());
      // Safety: if video never ends, reveal after 9s from click
      preloaderTimeout = setTimeout(endPreloader, 9000);
    });
    preVideo.addEventListener('ended', () => {
      clearTimeout(preloaderTimeout);
      endPreloader();
    });
  } else if (preVideo) {
    preVideo.addEventListener('ended', endPreloader);
    preVideo.play().catch(() => endPreloader());
    setTimeout(endPreloader, 9000);
  } else {
    setTimeout(endPreloader, 1000);
  }

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  function initLenis() {
    if (typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.2,
    });
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);

    // Smooth anchor links
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length > 1) {
          const target = document.querySelector(id);
          if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: 0, duration: 1.6 }); }
        }
      });
    });
  }

  /* ---------- Hero staggered reveal ---------- */
  function initHeroReveal() {
    $$('.hero .reveal, .hero .reveal-mask').forEach(el => {
      const delay = parseInt(el.dataset.delay || '0', 10);
      setTimeout(() => el.classList.add('is-in'), delay);
    });
  }

  /* ---------- IntersectionObserver reveals ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '-10% 0px -10% 0px', threshold: 0.05 });

  $$('.scroll-reveal').forEach(el => io.observe(el));

  /* ---------- Countdown ---------- */
  function tickCountdown() {
    const diff = Math.max(0, WEDDING_DATE.getTime() - Date.now());
    const days    = Math.floor(diff / 86_400_000);
    const hours   = Math.floor((diff / 3_600_000) % 24);
    const minutes = Math.floor((diff / 60_000) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    const pad = (n) => String(n).padStart(2, '0');
    $$('[data-countdown]').forEach(cd => {
      const d = cd.querySelector('[data-d]'); if (d) d.textContent = pad(days);
      const h = cd.querySelector('[data-h]'); if (h) h.textContent = pad(hours);
      const m = cd.querySelector('[data-m]'); if (m) m.textContent = pad(minutes);
      const s = cd.querySelector('[data-s]'); if (s) s.textContent = pad(seconds);
    });
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ---------- Schedule / FAQ accordions ---------- */
  function bindAccordion(rootSel, itemSel) {
    const root = $(rootSel);
    if (!root) return;
    root.addEventListener('click', (e) => {
      const head = e.target.closest('button');
      if (!head) return;
      const item = head.closest(itemSel);
      if (!item) return;
      const wasOpen = item.classList.contains('open');
      $$(itemSel, root).forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  }
  bindAccordion('#faq', '.faq__item');

  /* ---------- Gallery lightbox ---------- */
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  $$('.masonry__item').forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.dataset.src;
      if (!src) return;
      lightboxImg.src = src;
      lightbox.hidden = false;
      requestAnimationFrame(() => lightbox.classList.add('visible'));
      if (lenis) lenis.stop();
    });
  });
  function closeLightbox() {
    lightbox.classList.remove('visible');
    setTimeout(() => {
      lightbox.hidden = true;
      lightboxImg.src = '';
      if (lenis) lenis.start();
    }, 400);
  }
  lightbox.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });

  /* ---------- Timeline rail fill on scroll ---------- */
  const fill = $('#timelineFill');
  const timeline = $('.timeline');
  if (fill && timeline) {
    const updateRail = () => {
      const rect = timeline.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height + vh * 0.5;
      const progressed = Math.min(Math.max(vh - rect.top, 0), total);
      const pct = Math.max(0, Math.min(1, progressed / total));
      fill.style.height = (pct * 100) + '%';
    };
    window.addEventListener('scroll', updateRail, { passive: true });
    window.addEventListener('resize', updateRail);
    updateRail();
  }

  /* ---------- Schedule route fill on scroll ---------- */
  const schedFill = $('#schedFill');
  const schedRoute = $('.sched-route');
  if (schedFill && schedRoute) {
    const updateSchedRail = () => {
      const rect = schedRoute.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height + vh * 0.4;
      const progressed = Math.min(Math.max(vh * 0.7 - rect.top, 0), total);
      const pct = Math.max(0, Math.min(1, progressed / total));
      schedFill.style.height = (pct * 100) + '%';
      // highlight dots as they are passed
      $$('.sched-route__item').forEach(item => {
        const iRect = item.getBoundingClientRect();
        if (iRect.top < vh * 0.75) {
          item.querySelector('.sched-route__dot').style.background = 'var(--accent)';
        }
      });
    };
    window.addEventListener('scroll', updateSchedRail, { passive: true });
    window.addEventListener('resize', updateSchedRail);
    updateSchedRail();
  }

  /* ---------- RSVP form ---------- */
  const form = $('#rsvpForm');
  const success = $('#rsvpSuccess');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.style.transition = 'opacity .6s';
      form.style.opacity = '0';
      setTimeout(() => {
        form.hidden = true;
        success.hidden = false;
      }, 600);
    });
  }

  /* ---------- Background Music ---------- */
  const bgMusic = $('#bgMusic');
  const musicToggle = $('#musicToggle');
  if (bgMusic && musicToggle) {
    const iconPlay = $('.icon-play', musicToggle);
    const iconPause = $('.icon-pause', musicToggle);
    let musicStarted = false;

    const playMusic = () => {
      return bgMusic.play().then(() => {
        iconPlay.style.display = 'none';
        iconPause.style.display = 'block';
      });
    };

    const pauseMusic = () => {
      bgMusic.pause();
      iconPlay.style.display = 'block';
      iconPause.style.display = 'none';
    };

    const onFirstInteraction = () => {
      if (!musicStarted) {
        bgMusic.volume = 0.5;
        playMusic().then(() => {
          musicStarted = true;
          ['click', 'touchstart'].forEach(evt => {
            document.removeEventListener(evt, onFirstInteraction);
          });
        }).catch(() => {
          // Browser blocked autoplay (e.g. from an untrusted event), keep listening
        });
      }
    };

    // 'scroll' is not a valid user gesture for audio autoplay, so we only listen to clicks/touches
    ['click', 'touchstart'].forEach(evt => {
      document.addEventListener(evt, onFirstInteraction, { passive: true });
    });

    musicToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!musicStarted) {
        // If it hasn't started yet, clicking the button itself acts as the first interaction
        bgMusic.volume = 0.5;
        playMusic().then(() => {
          musicStarted = true;
        }).catch(()=>{});
        return;
      }
      if (bgMusic.paused) {
        playMusic().catch(()=>{});
      } else {
        pauseMusic();
      }
    });
  }
})();
