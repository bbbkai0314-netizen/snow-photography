// GA4 is installed site-wide in head-meta.njk. Keep all conversion-event rules here so
// every desktop and mobile CTA uses the same classification and cannot double-count.
(() => {
  function fireGaEvent(name, parameters) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, parameters);
    }
  }

  function fireLineContact(source) {
    fireGaEvent('line_click', { source });
    fireGaEvent('generate_lead', { method: 'line', source });
    if (typeof fbq === 'function') {
      fbq('track', 'Lead', { content_name: source });
    }
    if (typeof window.gtag === 'function' && window.SS_GOOGLE_ADS_CONVERSION) {
      window.gtag('event', 'conversion', { send_to: window.SS_GOOGLE_ADS_CONVERSION });
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
  };

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
