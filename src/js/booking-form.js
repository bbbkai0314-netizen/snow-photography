(() => {
  const wizard = document.getElementById('bookingWizard');
  if (!wizard) return;

  const FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSd1bNngQi1ztOpuoW9Mk3zKWkXT8FHnejBEoTYy5PoH8Av6nQ/formResponse';

  const ENTRY = {
    name: 'entry.1799987061',
    people: 'entry.1023712422',
    dateYear: 'entry.632418750_year',
    dateMonth: 'entry.632418750_month',
    dateDay: 'entry.632418750_day',
    location: 'entry.1520974665',
    email: 'entry.898697416',
    line: 'entry.541308620',
    service: 'entry.1872802401',
    otherService: 'entry.759497433',
  };

  const form = document.getElementById('bookingForm');
  const steps = Array.from(wizard.querySelectorAll('.booking-wizard__step'));
  const panels = Array.from(wizard.querySelectorAll('.booking-wizard__panel'));
  const confirmPanel = wizard.querySelector('[data-panel="confirm"]');
  const errorBanner = wizard.querySelector('[data-panel="submit-error"]');

  const state = {
    step: 1,
    planLabel: '',
    serviceValue: '',
    date: '',
    location: '',
    people: '1',
    notes: '',
    name: '',
    email: '',
    line: '',
  };

  let hasFiredBookingStart = false;
  function trackEvent(name, params) {
    if (typeof gtag !== 'function') return;
    const utm = typeof window.ssfUTM === 'function' ? window.ssfUTM() : {};
    gtag('event', name, { ...params, ...utm });
  }

  function setStep(n) {
    state.step = n;
    panels.forEach((p) => p.classList.toggle('is-active', Number(p.dataset.panel) === n));
    steps.forEach((s) => {
      const stepNum = Number(s.dataset.step);
      s.classList.toggle('is-active', stepNum === n);
      s.classList.toggle('is-done', stepNum < n);
    });
  }

  function showError(step, message) {
    const el = wizard.querySelector(`[data-error-for="${step}"]`);
    if (el) el.textContent = message || '';
  }

  // ---------- Step 1: plan selection ----------
  const planOptions = Array.from(wizard.querySelectorAll('.booking-plan-option'));
  planOptions.forEach((btn) => {
    btn.addEventListener('click', () => {
      planOptions.forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      state.planLabel = btn.querySelector('.booking-plan-option__title').textContent.trim();
      state.serviceValue = btn.dataset.serviceValue;
      showError(1, '');

      if (!hasFiredBookingStart) {
        hasFiredBookingStart = true;
        trackEvent('booking_start', { plan: state.planLabel });
      }
    });
  });

  // ---------- Step 2: date / location / people / notes ----------
  const dateInput = document.getElementById('bookingDate');
  const peopleInput = document.getElementById('bookingPeople');
  const notesInput = document.getElementById('bookingNotes');
  const locationPills = Array.from(wizard.querySelectorAll('.booking-pill'));

  dateInput?.addEventListener('change', () => {
    state.date = dateInput.value;
  });
  peopleInput?.addEventListener('input', () => {
    state.people = peopleInput.value;
  });
  notesInput?.addEventListener('input', () => {
    state.notes = notesInput.value;
  });
  locationPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      locationPills.forEach((p) => p.classList.remove('is-selected'));
      pill.classList.add('is-selected');
      state.location = pill.dataset.value;
      showError(2, '');
    });
  });

  // ---------- Step 3: contact ----------
  const nameInput = document.getElementById('bookingName');
  const emailInput = document.getElementById('bookingEmail');
  const lineInput = document.getElementById('bookingLine');

  nameInput?.addEventListener('input', () => {
    state.name = nameInput.value;
  });
  emailInput?.addEventListener('input', () => { state.email = emailInput.value; });
  lineInput?.addEventListener('input', () => { state.line = lineInput.value; });

  // ---------- Navigation ----------
  function validateStep(n) {
    if (n === 1) {
      if (!state.serviceValue) {
        showError(1, '請先選擇一個方案');
        return false;
      }
    }
    if (n === 2) {
      if (!state.date) { showError(2, '請選擇拍攝日期'); return false; }
      if (!state.location) { showError(2, '請選擇雪場地點'); return false; }
      if (!state.people || Number(state.people) < 1) { showError(2, '請填寫正確人數'); return false; }
    }
    if (n === 3) {
      if (!state.name.trim()) { showError(3, '請填寫姓名'); return false; }
      if (!/^\S+@\S+\.\S+$/.test(state.email.trim())) { showError(3, '請填寫正確的 email'); return false; }
      if (!state.line.trim()) { showError(3, '請填寫 LINE ID'); return false; }
    }
    return true;
  }

  wizard.querySelectorAll('[data-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!validateStep(state.step)) return;
      setStep(Math.min(state.step + 1, 3));
    });
  });
  wizard.querySelectorAll('[data-prev]').forEach((btn) => {
    btn.addEventListener('click', () => setStep(Math.max(state.step - 1, 1)));
  });

  // ---------- Submit ----------
  const lineLink = confirmPanel.querySelector('.booking-wizard__line-link');
  const LINE_URL = lineLink ? lineLink.href : '';

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;

    const submitBtn = form.querySelector('.booking-wizard__btn--submit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '送出中…';
    }

    const [year, month, day] = state.date.split('-');
    const data = new FormData();
    data.append(ENTRY.name, state.name.trim());
    data.append(ENTRY.people, state.people);
    data.append(ENTRY.dateYear, year);
    data.append(ENTRY.dateMonth, String(Number(month)));
    data.append(ENTRY.dateDay, String(Number(day)));
    data.append(ENTRY.location, state.location);
    data.append(ENTRY.email, state.email.trim());
    data.append(ENTRY.line, state.line.trim());
    data.append(ENTRY.service, state.serviceValue);

    const utm = typeof window.ssfUTM === 'function' ? window.ssfUTM() : {};
    const utmNote = Object.keys(utm).length
      ? `[來源] ${utm.utm_source || '-'}/${utm.utm_medium || '-'} campaign=${utm.utm_campaign || '-'} content=${utm.utm_content || '-'}`
      : '';
    const combinedNotes = [state.notes.trim(), utmNote].filter(Boolean).join('\n');
    if (combinedNotes) data.append(ENTRY.otherService, combinedNotes);

    try {
      await fetch(FORM_ACTION, { method: 'POST', mode: 'no-cors', body: data });

      trackEvent('booking_submit', {
        plan: state.planLabel,
        location: state.location,
        people: Number(state.people) || undefined,
      });

      panels.forEach((p) => p.classList.remove('is-active'));
      form.hidden = true;
      wizard.querySelector('.booking-wizard__stepper').hidden = true;
      confirmPanel.hidden = false;

      if (LINE_URL) {
        window.location.href = LINE_URL;
      }
    } catch (err) {
      errorBanner.hidden = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '送出預約';
      }
    }
  });

  setStep(1);
})();
