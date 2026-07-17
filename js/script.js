(() => {
  const chapters = Array.from(document.querySelectorAll('.chapter'));
  const glowA = document.getElementById('glowA');
  const glowB = document.getElementById('glowB');
  const nav = document.getElementById('nav');
  const sideDotsWrap = document.getElementById('sideDots');
  const sideLabel = document.getElementById('sideLabel');

  // Build side-nav dots
  chapters.forEach((ch, i) => {
    const dot = document.createElement('span');
    dot.dataset.index = i;
    sideDotsWrap.appendChild(dot);
  });
  const dots = Array.from(sideDotsWrap.children);

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
    const tag = chapters[activeIndex]?.dataset.tag || '';
    sideLabel.textContent = tag;
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

  // ---------- Appointment month tabs ----------
  const monthTabs = document.querySelectorAll('.month-tab');
  const appointmentCaption = document.getElementById('appointmentCaption');
  monthTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      monthTabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      if (appointmentCaption) {
        appointmentCaption.textContent = `查看 ${tab.dataset.month} 月滑雪拍攝可預約時段`;
      }
    });
  });

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
})();
