// GTM is installed site-wide in head-meta.njk (container GTM-M5MVCP2M). Keep all
// conversion-event rules here so every desktop and mobile CTA uses the same
// classification and cannot double-count. Events are pushed to window.dataLayer;
// the corresponding GA4 / Google Ads tags and triggers are configured inside the
// GTM container, not in this file.
(() => {
  function fireGaEvent(name, parameters) {
    window.dataLayer = window.dataLayer || [];
    const utm = typeof window.ssfUTM === 'function' ? window.ssfUTM() : {};
    const sessionId = window.ssfSessionId;
    window.dataLayer.push({
      event: name,
      ...parameters,
      ...utm,
      ...(sessionId ? { session_id: sessionId } : {}),
    });
  }

  function fireLineContact(source) {
    // The Google Ads conversion (AW-18359584407/xG5WCKHCsO0cEJeNxLJE) now fires from
    // a GTM tag triggered on this same "line_click" dataLayer event, instead of being
    // pushed directly from here.
    fireGaEvent('line_click', { source });
    if (typeof fbq === 'function') {
      fbq('track', 'Lead', { content_name: source });
    }
  }

  function fireSelectPlan(planName, serviceValue) {
    fireGaEvent('select_plan', { plan_name: planName, service_value: serviceValue });
    if (typeof fbq === 'function') {
      fbq('track', 'ViewContent', { content_name: planName });
    }
  }

  function fireBookingClick(source) {
    fireGaEvent('booking_click', { source });
  }

  function fireBookingComplete() {
    fireGaEvent('booking_complete');
  }

  // Fired by script.js whenever the section under the viewport (tracked by the
  // side-label widget) changes. Each section gets its own event name (rather
  // than one shared name + parameter) so it reads directly in Tag Assistant's
  // event list without having to open each row to check a parameter.
  function fireSectionView(sectionTag) {
    fireGaEvent(`view_section_${sectionTag.toLowerCase()}`, { section_name: sectionTag });
  }

  function fireContentView(name, category) {
    fireGaEvent('view_article', { content_name: name, content_category: category });
    if (typeof fbq === 'function') {
      fbq('track', 'ViewContent', { content_name: name, content_category: category });
    }
  }

  // Fire once per threshold per page load, in order, so a fast scroll to the bottom
  // still reports every milestone passed rather than jumping straight to 90.
  const SCROLL_THRESHOLDS = [25, 50, 75, 90];
  let scrollThresholdIndex = 0;
  let scrollTicking = false;

  function checkScrollDepth() {
    scrollTicking = false;
    if (scrollThresholdIndex >= SCROLL_THRESHOLDS.length) return;

    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    const percent = scrollable > 0 ? ((window.scrollY / scrollable) * 100) : 100;

    while (
      scrollThresholdIndex < SCROLL_THRESHOLDS.length &&
      percent >= SCROLL_THRESHOLDS[scrollThresholdIndex]
    ) {
      const threshold = SCROLL_THRESHOLDS[scrollThresholdIndex];
      fireGaEvent('scroll_depth', { percent: threshold });
      if (typeof fbq === 'function') {
        fbq('trackCustom', 'ScrollDepth', { percent: threshold });
      }
      scrollThresholdIndex += 1;
    }
  }

  function onScrollDepthCheck() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(checkScrollDepth);
  }

  function isLineLink(link) {
    return /(^|\.)lin\.ee$/i.test(link.hostname);
  }

  function isBookingLink(link) {
    return link.hash === '#booking';
  }

  function getLineSource(link) {
    if (link.classList.contains('line-float')) return 'floating_button';
    if (link.classList.contains('booking-wizard__line-link')) return 'booking_confirmation';
    if (link.getAttribute('aria-label') === 'LINE 詢價') return 'contact_icon';
    return 'line_link';
  }

  function getBookingSource(link) {
    if (link.classList.contains('article-cta__btn')) return 'article_cta';
    if (link.classList.contains('news-banner__btn')) return 'news_banner';
    if (link.closest('.nav__dropdown-menu')) return 'navigation';
    return 'booking_link';
  }

  window.ssTrack = {
    lineContact: fireLineContact,
    selectPlan: fireSelectPlan,
    bookingComplete: fireBookingComplete,
    sectionView: fireSectionView,
  };

  const contentName = document.body.dataset.contentName;
  const contentType = document.body.dataset.contentType;
  if (contentName && contentType) {
    fireContentView(contentName, contentType);
  }

  window.addEventListener('scroll', onScrollDepthCheck, { passive: true });
  checkScrollDepth();

  document.addEventListener('click', (e) => {
    const planBtn = e.target.closest('.booking-plan-option');
    if (planBtn) {
      const title = planBtn.querySelector('.booking-plan-option__title');
      fireSelectPlan(title ? title.textContent.trim() : '', planBtn.dataset.serviceValue || '');
      return;
    }

    const link = e.target.closest('a[href]');
    if (!link) return;

    // LINE takes precedence over booking. A LINE destination is never counted as a
    // booking CTA, even if its surrounding UI is part of the booking section.
    if (isLineLink(link)) {
      fireLineContact(getLineSource(link));
      return;
    }

    if (isBookingLink(link)) {
      fireBookingClick(getBookingSource(link));
    }
  });
})();
