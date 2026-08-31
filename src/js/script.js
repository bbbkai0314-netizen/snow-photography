(() => {
  const chapters = Array.from(document.querySelectorAll('.chapter'));
  const glowA = document.getElementById('glowA');
  const glowB = document.getElementById('glowB');
  const nav = document.getElementById('nav');
  const sideDotsWrap = document.getElementById('sideDots');
  const sideLabel = document.getElementById('sideLabel');

  // Build side-nav dots (only present on pages with scrolly chapters)
  if (sideDotsWrap) {
    chapters.forEach((ch, i) => {
      const dot = document.createElement('span');
      dot.dataset.index = i;
      sideDotsWrap.appendChild(dot);
    });
  }
  const dots = sideDotsWrap ? Array.from(sideDotsWrap.children) : [];

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function chapterProgress(chapter) {
    const rect = chapter.getBoundingClientRect();
    const vh = window.innerHeight;
    const holdRange = rect.height - vh;
    if (holdRange <= 0) {
      return clamp(-rect.top / vh, 0, 1);
    }
    return clamp(-rect.top / holdRange, 0, 1);
  }

  function isPinned(chapter) {
    const rect = chapter.getBoundingClientRect();
    return rect.top <= 1 && rect.bottom >= window.innerHeight - 1;
  }

  function update() {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;

    // Ambient glow parallax
    glowA.style.transform = `translate3d(0, ${scrollY * 0.08}px, 0)`;
    glowB.style.transform = `translate3d(0, ${-scrollY * 0.06}px, 0)`;

    // Nav glass intensify
    nav.classList.toggle('nav--scrolled', scrollY > 40);

    let activeIndex = 0;

    chapters.forEach((chapter, i) => {
      const media = chapter.querySelector('.chapter__media');
      const content = chapter.querySelector('.chapter__content');
      const isHero = chapter.classList.contains('chapter') && content.classList.contains('chapter__content--hero');

      if (isPinned(chapter) || chapter.getBoundingClientRect().top <= 1) {
        activeIndex = i;
      }

      if (isHero) {
        const heroProgress = clamp(scrollY / vh, 0, 1);
        media.style.transform = `scale(${1.03 + heroProgress * 0.05}) translateY(${scrollY * 0.25}px)`;
        content.style.opacity = String(clamp(1 - heroProgress * 1.6, 0, 1));
        content.style.transform = `translateY(${-40 + heroProgress * -20}%)`;
        return;
      }

      const progress = chapterProgress(chapter);

      // Media: gentle zoom-out + slight vertical drift (kept subtle so subjects near
      // the frame edge, e.g. raised hands/heads, don't get clipped by the scale)
      const scale = 1.06 - progress * 0.06;
      const shiftY = -16 * progress;
      media.style.transform = `scale(${scale}) translateY(${shiftY}px)`;

      // Content: fade/slide in, hold, fade/slide out
      const fadeIn = clamp(progress / 0.14, 0, 1);
      const fadeOut = clamp((1 - progress) / 0.14, 0, 1);
      const opacity = Math.min(fadeIn, fadeOut);
      content.style.opacity = String(opacity);
      content.style.transform = `translateY(${28 * (1 - opacity)}px)`;
    });

    // Side dots + label
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === activeIndex));
    if (sideLabel) {
      const tag = chapters[activeIndex]?.dataset.tag || '';
      sideLabel.textContent = tag;
    }
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
  // Re-sync after the browser settles any #hash anchor scroll on load,
  // since that can happen after our initial update() runs at scrollY 0.
  window.addEventListener('load', update);

  // ---------- Mobile nav toggle ----------
  const navToggle = document.getElementById('navToggle');
  const navLinksEl = document.getElementById('navLinks');
  if (navToggle && navLinksEl) {
    const closeMobileNav = () => {
      nav.classList.remove('is-mobile-open');
      navToggle.setAttribute('aria-expanded', 'false');
    };
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !nav.classList.contains('is-mobile-open');
      nav.classList.toggle('is-mobile-open', willOpen);
      navToggle.setAttribute('aria-expanded', String(willOpen));
    });
    navLinksEl.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMobileNav);
    });
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target)) closeMobileNav();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileNav();
    });
  }

  // ---------- Nav dropdowns ----------
  const dropdowns = Array.from(document.querySelectorAll('[data-nav-dropdown]'));
  if (dropdowns.length) {
    const closeAll = () => {
      dropdowns.forEach((d) => {
        d.classList.remove('is-open');
        d.querySelector('.nav__dropdown-trigger').setAttribute('aria-expanded', 'false');
      });
    };
    dropdowns.forEach((dropdown) => {
      const trigger = dropdown.querySelector('.nav__dropdown-trigger');
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = !dropdown.classList.contains('is-open');
        closeAll();
        dropdown.classList.toggle('is-open', willOpen);
        trigger.setAttribute('aria-expanded', String(willOpen));
      });
      dropdown.querySelectorAll('.nav__dropdown-menu a').forEach((link) => {
        link.addEventListener('click', closeAll);
      });
    });
    document.addEventListener('click', (e) => {
      if (!dropdowns.some((d) => d.contains(e.target))) closeAll();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll();
    });
  }

  // ---------- Lightbox ----------
  const items = Array.from(document.querySelectorAll('.gcard'));
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTag = document.getElementById('lightboxTag');
  const lightboxCount = document.getElementById('lightboxCount');
  const btnClose = document.getElementById('lightboxClose');
  const btnPrev = document.getElementById('lightboxPrev');
  const btnNext = document.getElementById('lightboxNext');

  let index = 0;

  function open(i) {
    index = i;
    render();
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  function render() {
    const item = items[index];
    lightboxImg.src = item.dataset.full;
    lightboxImg.alt = item.querySelector('img').alt;
    lightboxTag.textContent = item.dataset.tag;
    lightboxCount.textContent = `${index + 1} / ${items.length}`;
  }
  function next() { index = (index + 1) % items.length; render(); }
  function prev() { index = (index - 1 + items.length) % items.length; render(); }

  if (lightbox) {
    items.forEach((item, i) => item.addEventListener('click', () => open(i)));
    btnClose.addEventListener('click', close);
    btnNext.addEventListener('click', next);
    btnPrev.addEventListener('click', prev);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });
  }
})();

// ---------- Pain points carousel (Apple-style horizontal swipe/snap) ----------
// Uses native scroll-snap for touch/trackpad swipe, plus arrow buttons and dot
// indicators (built dynamically like the side-nav dots above) for mouse/keyboard.
// Controls auto-hide when every card already fits without scrolling.
(() => {
  const track = document.getElementById('painPointsTrack');
  const dotsWrap = document.getElementById('painPointsDots');
  if (!track || !dotsWrap) return;

  const slides = Array.from(track.children);
  const prevBtn = document.querySelector('.pain-points__arrow--prev');
  const nextBtn = document.querySelector('.pain-points__arrow--next');

  slides.forEach((slide, i) => {
    const dot = document.createElement('span');
    dot.dataset.index = String(i);
    dot.setAttribute('role', 'tab');
    dot.setAttribute('tabindex', '0');
    dot.setAttribute('aria-label', `第 ${i + 1} 個困擾`);
    const goTo = () => slide.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    dot.addEventListener('click', goTo);
    dot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(); }
    });
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function setActive(i) {
    dots.forEach((dot, di) => dot.classList.toggle('is-active', di === i));
  }

  // Track each slide's visible fraction and keep the most-visible one active, rather
  // than whichever slide's threshold crossing was reported last (which picks the wrong
  // card when two slides straddle the viewport edge at once).
  const ratios = new Map(slides.map((slide) => [slide, 0]));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => ratios.set(entry.target, entry.intersectionRatio));
    let bestSlide = slides[0];
    let bestRatio = -1;
    slides.forEach((slide) => {
      const ratio = ratios.get(slide) || 0;
      if (ratio > bestRatio) { bestRatio = ratio; bestSlide = slide; }
    });
    setActive(slides.indexOf(bestSlide));
  }, { root: track, threshold: [0, 0.25, 0.5, 0.75, 1] });
  slides.forEach((slide) => observer.observe(slide));

  function updateControls() {
    const scrollable = track.scrollWidth > track.clientWidth + 2;
    if (prevBtn && nextBtn) {
      prevBtn.hidden = !scrollable;
      nextBtn.hidden = !scrollable;
      prevBtn.disabled = track.scrollLeft <= 2;
      nextBtn.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    }
    dotsWrap.hidden = !scrollable;
  }

  function scrollByDir(dir) {
    const amount = (slides[0]?.getBoundingClientRect().width || track.clientWidth) + 16;
    track.scrollBy({ left: amount * dir, behavior: 'smooth' });
  }

  [prevBtn, nextBtn].forEach((btn) => {
    if (!btn) return;
    btn.addEventListener('click', () => scrollByDir(Number(btn.dataset.dir)));
  });

  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollByDir(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); scrollByDir(-1); }
  });

  let carouselTicking = false;
  track.addEventListener('scroll', () => {
    if (!carouselTicking) {
      requestAnimationFrame(() => { updateControls(); carouselTicking = false; });
      carouselTicking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', updateControls);
  updateControls();
  setActive(0);
})();

// ---------- UTM capture (conversion sprint P0/P1) ----------
// Reads utm_* params from the landing URL, remembers them for the session, and exposes
// window.ssfUTM() so tracking.js / booking-form.js can attach the same source data to
// every conversion event without each having to re-implement the storage logic.
(() => {
  const UTM_KEY = 'ssf_utm';
  const UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

  function readStoredUTM() {
    try { return JSON.parse(sessionStorage.getItem(UTM_KEY) || '{}'); } catch (e) { return {}; }
  }

  const fromUrl = {};
  const params = new URLSearchParams(window.location.search);
  UTM_FIELDS.forEach((key) => {
    const value = params.get(key);
    if (value) fromUrl[key] = value;
  });
  if (Object.keys(fromUrl).length) {
    try { sessionStorage.setItem(UTM_KEY, JSON.stringify(fromUrl)); } catch (e) {}
  }

  window.ssfUTM = () => (Object.keys(fromUrl).length ? fromUrl : readStoredUTM());
})();

// ---------- Session path tracking ----------
// Gives every browser session a stable ID and keeps the ordered list of pages visited
// in sessionStorage, then reports both to GA4 on every page load. This lets tracking.js
// stamp the same session_id on conversion events (LINE click, booking, etc.) so a
// customer's whole journey — which pages they saw before they converted — can be read
// straight off the "session_path_step" event's path_so_far parameter in GA4, without
// having to reconstruct it from raw page_view hits.
(() => {
  const SESSION_ID_KEY = 'ssf_session_id';
  const PATH_KEY = 'ssf_session_path';
  const MAX_STEPS = 25; // caps sessionStorage growth for an unusually long browsing session

  function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  let sessionId;
  try { sessionId = sessionStorage.getItem(SESSION_ID_KEY); } catch (e) {}
  if (!sessionId) {
    sessionId = makeId();
    try { sessionStorage.setItem(SESSION_ID_KEY, sessionId); } catch (e) {}
  }

  let path = [];
  try { path = JSON.parse(sessionStorage.getItem(PATH_KEY) || '[]'); } catch (e) {}
  const isEntryPage = path.length === 0;
  const page = window.location.pathname;

  // Skip logging a repeat entry for the same page (e.g. a hash-only navigation).
  if (path[path.length - 1] !== page) {
    path.push(page);
    if (path.length > MAX_STEPS) path = path.slice(path.length - MAX_STEPS);
    try { sessionStorage.setItem(PATH_KEY, JSON.stringify(path)); } catch (e) {}
  }

  window.ssfSessionId = sessionId;
  window.ssfSessionPath = () => path;

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'session_path_step', {
      session_id: sessionId,
      step: path.length,
      page_path: page,
      is_entry_page: isEntryPage,
      entry_referrer: isEntryPage ? (document.referrer || '(direct)') : '(n/a)',
      path_so_far: path.join(' > ').slice(0, 100),
    });
  }
})();
