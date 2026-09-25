// GTM is installed site-wide in head-meta.njk (container GTM-M5MVCP2M). Keep all
// conversion-event rules here so every desktop and mobile CTA uses the same
// classification and cannot double-count. Each event is still pushed to
// window.dataLayer for GTM, but the container has no triggers for these custom events,
// so the ones that matter are also sent straight to GA4 (and the LINE conversion to
// Google Ads) through the gtag() shim defined in head-meta.njk.
(() => {
  const GA4_ID = 'G-H578W2CXH6';
  const ADS_LINE_CONVERSION = 'AW-18359584407/xG5WCKHCsO0cEJeNxLJE';

  // Only the event's own parameters go to GA4: GA4 already attributes the session from
  // the landing URL's UTM tags, so re-sending utm_* would only add noise.
  function sendGa4(name, parameters) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, { ...parameters, send_to: GA4_ID });
  }

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

  // A single tap can reach this twice (e.g. a ghost click on mobile, or a double tap), so
  // clicks within this window count once.
  const LINE_DEDUPE_MS = 800;
  // Longest a same-tab LINE link waits for GA4 before navigating anyway.
  const LINE_NAVIGATE_TIMEOUT_MS = 300;
  let lastLineContactAt = 0;

  // GA4 gets this as click_line (renamed from line_click, so the two are never both sent).
  // The dataLayer event, Google Ads conversion and Meta Lead keep their names so Meta's
  // Add_To_Line and the Ads conversion action don't change. onSent runs once GA4 has
  // the event, or after LINE_NAVIGATE_TIMEOUT_MS if GA4 is slow or blocked.
  function fireLineContact(source, linkUrl, onSent) {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (typeof onSent === 'function') onSent();
    };

    const now = Date.now();
    if (now - lastLineContactAt < LINE_DEDUPE_MS) {
      finish();
      return;
    }
    lastLineContactAt = now;
    if (typeof onSent === 'function') window.setTimeout(finish, LINE_NAVIGATE_TIMEOUT_MS);

    const url = linkUrl || '';
    fireGaEvent('line_click', { source, link_url: url });
    if (typeof window.gtag === 'function') {
      // "source" is renamed for GA4 so it can't be read as a traffic-source field.
      window.gtag('event', 'click_line', {
        link_url: url,
        page_path: window.location.pathname,
        page_title: document.title,
        cta_source: source,
        send_to: GA4_ID,
        event_callback: finish,
      });
      window.gtag('event', 'conversion', { send_to: ADS_LINE_CONVERSION });
    } else {
      finish();
    }
    if (typeof fbq === 'function') {
      fbq('track', 'Lead', { content_name: source });
    }
  }

  function fireSelectPlan(planName, serviceValue) {
    fireGaEvent('select_plan', { plan_name: planName, service_value: serviceValue });
    sendGa4('select_plan', { plan_name: planName, service_value: serviceValue });
    if (typeof fbq === 'function') {
      fbq('track', 'ViewContent', { content_name: planName });
    }
  }

  function fireBookingClick(source) {
    fireGaEvent('booking_click', { source });
    sendGa4('booking_click', { cta_source: source });
  }

  // GA4 gets this conversion as booking_submit from booking-form.js, so only the
  // dataLayer push and the Meta Pixel happen here (sending both would double-count).
  function fireBookingComplete() {
    fireGaEvent('booking_complete');
    if (typeof fbq === 'function') {
      fbq('track', 'Schedule');
    }
  }

  // Fired by script.js whenever the section under the viewport (tracked by the
  // side-label widget) changes. GA4 silently drops event names with non-ASCII
  // characters, so the event name itself must stay English/snake_case (same
  // convention as booking_click, view_article, etc.); the section's Chinese label rides along as a parameter so it's still
  // readable once you open the row in GA4 or Tag Assistant.
  const SECTION_LABELS = {
    HERO: '首頁',
    CHAPTERS: '人生章節',
    GALLERY: '完整作品',
    PLANS: '拍攝方案',
    JOURNAL: '滑雪日誌',
    PARTNERS: '合作夥伴',
    NEWS: '最新消息',
    BOOKING: '我要預約',
  };

  // GA4 gets one view_section event name with the section as a parameter (instead of a
  // separate event name per section), once per section per page load.
  const sectionsSentToGa4 = new Set();

  function fireSectionView(sectionTag) {
    const label = SECTION_LABELS[sectionTag] || sectionTag;
    fireGaEvent(`view_section_${sectionTag.toLowerCase()}`, { section_label: label });
    if (!sectionsSentToGa4.has(sectionTag)) {
      sectionsSentToGa4.add(sectionTag);
      sendGa4('view_section', { section: sectionTag.toLowerCase(), section_label: label });
    }
  }

  function fireContentView(name, category) {
    fireGaEvent('view_article', { content_name: name, content_category: category });
    sendGa4('view_article', { content_name: name, content_category: category });
    if (typeof fbq === 'function') {
      fbq('track', 'ViewContent', { content_name: name, content_category: category });
    }
  }

  // Fire once per threshold per page load, in order, so a fast scroll to the bottom
  // still reports every milestone passed rather than jumping straight to 90.
  // Not sent to GA4: the GTM container already sends GA4's own "scroll" event.
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

  // LINE's short links (lin.ee), line.me / liff.line.me pages and line:// app links.
  function isLineLink(link) {
    return link.protocol === 'line:' || /(^|\.)(lin\.ee|line\.me)$/i.test(link.hostname);
  }

  // Only a plain left click on a link that replaces this page needs to wait for GA4;
  // new tabs, modified clicks and downloads leave the page (and its pending hits) alive.
  function navigatesThisPage(e, link) {
    const target = (link.getAttribute('target') || '').toLowerCase();
    return !e.defaultPrevented &&
      e.button === 0 &&
      !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey &&
      !link.hasAttribute('download') &&
      (target === '' || target === '_self');
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
    ga4: sendGa4,
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
      const url = link.href;
      if (navigatesThisPage(e, link)) {
        e.preventDefault();
        fireLineContact(getLineSource(link), url, () => window.location.assign(url));
      } else {
        fireLineContact(getLineSource(link), url);
      }
      return;
    }

    if (isBookingLink(link)) {
      fireBookingClick(getBookingSource(link));
    }
  });
})();
