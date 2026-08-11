// Lead-source tracking: fires on every LINE contact point and every plan selection.
// GA4 (gtag) is already installed site-wide so those events fire today. Meta Pixel and
// Google Ads conversion calls are guarded so they safely no-op until those are installed —
// see head-meta.njk for where to add the Meta Pixel base snippet and set
// window.SS_GOOGLE_ADS_CONVERSION once those IDs are available.
(() => {
  function fireLineContact(source) {
    if (typeof gtag === 'function') {
      gtag('event', 'generate_lead', { method: 'line', source });
    }
    if (typeof fbq === 'function') {
      fbq('track', 'Lead', { content_name: source });
    }
    if (typeof gtag === 'function' && window.SS_GOOGLE_ADS_CONVERSION) {
      gtag('event', 'conversion', { send_to: window.SS_GOOGLE_ADS_CONVERSION });
    }
  }

  function fireSelectPlan(planName, serviceValue) {
    if (typeof gtag === 'function') {
      gtag('event', 'select_plan', { plan_name: planName, service_value: serviceValue });
    }
    if (typeof fbq === 'function') {
      fbq('track', 'ViewContent', { content_name: planName });
    }
  }

  window.ssTrack = { lineContact: fireLineContact, selectPlan: fireSelectPlan };

  document.addEventListener('click', (e) => {
    const lineLink = e.target.closest('a[href*="lin.ee"]');
    if (lineLink) {
      fireLineContact(lineLink.classList.contains('line-float') ? 'floating_button' : 'icon_link');
      return;
    }
    const planBtn = e.target.closest('.booking-plan-option');
    if (planBtn) {
      const title = planBtn.querySelector('.booking-plan-option__title');
      fireSelectPlan(title ? title.textContent.trim() : '', planBtn.dataset.serviceValue || '');
    }
  });
})();
