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

// ---------- Pain points story overlay (對應文章 → 加LINE) ----------
// The card itself already states the pain point, so clicking it opens straight onto
// the article page instead of repeating that text; swiping right once more reveals the
// LINE page. Both pages are cloned from <template data-role="article"|"line"> children
// of the card, so all copy stays authored in index.njk rather than duplicated here.
// Clicking a card without JS (or opening it in a new tab) still follows its real href.
(() => {
  const story = document.getElementById('story');
  const cards = Array.from(document.querySelectorAll('[data-story-card]'));
  if (!story || !cards.length) return;

  const storyType = document.getElementById('storyType');
  const storyTrack = document.getElementById('storyTrack');
  const storyClose = document.getElementById('storyClose');
  const storySegs = Array.from(document.querySelectorAll('#storyProgress .story__seg'));
  const navPrev = document.getElementById('storyNavPrev');
  const navNext = document.getElementById('storyNavNext');

  let slides = [];
  let observer = null;

  function panelMarkup(source) {
    const panel = document.createElement('div');
    panel.className = 'story__panel';
    const inner = document.createElement('div');
    inner.className = 'story__panel-inner';
    inner.append(source);
    panel.appendChild(inner);
    return panel;
  }

  function openStory(card) {
    const type = card.querySelector('.pain-point__type')?.textContent || '';
    storyType.textContent = type;
    storyTrack.innerHTML = '';

    ['article', 'line'].forEach((role) => {
      const tpl = card.querySelector(`template[data-role="${role}"]`);
      if (tpl) storyTrack.appendChild(panelMarkup(tpl.content.cloneNode(true)));
    });

    slides = Array.from(storyTrack.children);

    if (observer) observer.disconnect();
    const ratios = new Map(slides.map((s) => [s, 0]));
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => ratios.set(entry.target, entry.intersectionRatio));
      let best = 0;
      let bestRatio = -1;
      slides.forEach((s, si) => {
        const r = ratios.get(s) || 0;
        if (r > bestRatio) { bestRatio = r; best = si; }
      });
      storySegs.forEach((seg, si) => {
        seg.classList.toggle('is-current', si === best);
        seg.classList.toggle('is-done', si < best);
      });
      navPrev.disabled = best === 0;
      navNext.disabled = best === slides.length - 1;
    }, { root: storyTrack, threshold: [0, 0.25, 0.5, 0.75, 1] });
    slides.forEach((s) => observer.observe(s));

    storyTrack.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(btn.dataset.copy);
          btn.textContent = '已複製';
          btn.classList.add('is-copied');
          setTimeout(() => { btn.textContent = '複製'; btn.classList.remove('is-copied'); }, 1600);
        } catch (e) { /* clipboard unavailable in this context */ }
      });
    });

    storySegs.forEach((seg, si) => {
      seg.classList.toggle('is-current', si === 0);
      seg.classList.toggle('is-done', false);
    });
    story.classList.add('is-open');
    story.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    storyTrack.scrollLeft = 0;
    navPrev.disabled = true;
    navNext.disabled = slides.length <= 1;
  }

  function closeStory() {
    story.classList.remove('is-open');
    story.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function scrollByDir(dir) {
    const amount = slides[0]?.getBoundingClientRect().width || storyTrack.clientWidth;
    storyTrack.scrollBy({ left: amount * dir, behavior: 'smooth' });
  }

  cards.forEach((card) => {
    const link = card.querySelector('.pain-point__link');
    if (!link) return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openStory(card);
    });
  });

  storyClose.addEventListener('click', closeStory);
  navPrev.addEventListener('click', () => scrollByDir(-1));
  navNext.addEventListener('click', () => scrollByDir(1));
  document.addEventListener('keydown', (e) => {
    if (!story.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeStory();
    if (e.key === 'ArrowRight') scrollByDir(1);
    if (e.key === 'ArrowLeft') scrollByDir(-1);
  });
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
