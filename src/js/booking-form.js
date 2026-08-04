(() => {
  const wizard = document.getElementById('bookingWizard');
  if (!wizard) return;

  const FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSd1bNngQi1ztOpuoW9Mk3zKWkXT8FHnejBEoTYy5PoH8Av6nQ/formResponse';
  const LINE_OA_ID = '@762uixsj';

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
    price: '',
    date: '',
    location: '',
    people: '1',
    notes: '',
    name: '',
    email: '',
    line: '',
  };

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

  function updateSummary() {
    const set = (key, val) => {
      const el = wizard.querySelector(`[data-summary="${key}"]`);
      if (el) el.textContent = val;
    };
    set('plan', state.planLabel || '尚未選擇');
    set('date', state.date || '尚未選擇');
    set('location', state.location || '尚未選擇');
    set('people', state.people ? `${state.people} 人` : '—');
    set('name', state.name || '—');

    const priceRow = wizard.querySelector('[data-summary-price]');
    if (priceRow) {
      if (state.price) {
        priceRow.hidden = false;
        const priceEl = wizard.querySelector('[data-summary="price"]');
        if (priceEl) priceEl.textContent = `NT$${Number(state.price).toLocaleString('en-US')}`;
      } else {
        priceRow.hidden = true;
      }
    }
  }

  // ---------- Step 1: plan selection ----------
  const planOptions = Array.from(wizard.querySelectorAll('.booking-plan-option'));
  planOptions.forEach((btn) => {
    btn.addEventListener('click', () => {
      planOptions.forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      state.planLabel = btn.querySelector('.booking-plan-option__title').textContent.trim();
      state.serviceValue = btn.dataset.serviceValue;
      state.price = btn.dataset.price || '';
      showError(1, '');
      updateSummary();
    });
  });

  // ---------- Step 2: date / location / people / notes ----------
  const dateInput = document.getElementById('bookingDate');
  const peopleInput = document.getElementById('bookingPeople');
  const notesInput = document.getElementById('bookingNotes');
  const locationPills = Array.from(wizard.querySelectorAll('.booking-pill'));

  dateInput?.addEventListener('change', () => {
    state.date = dateInput.value;
    updateSummary();
  });
  peopleInput?.addEventListener('input', () => {
    state.people = peopleInput.value;
    updateSummary();
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
      updateSummary();
    });
  });

  // ---------- Step 3: contact ----------
  const nameInput = document.getElementById('bookingName');
  const emailInput = document.getElementById('bookingEmail');
  const lineInput = document.getElementById('bookingLine');

  nameInput?.addEventListener('input', () => {
    state.name = nameInput.value;
    updateSummary();
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
    if (state.notes.trim()) data.append(ENTRY.otherService, state.notes.trim());

    try {
      await fetch(FORM_ACTION, { method: 'POST', mode: 'no-cors', body: data });

      panels.forEach((p) => p.classList.remove('is-active'));
      form.hidden = true;
      wizard.querySelector('.booking-wizard__stepper').hidden = true;
      confirmPanel.hidden = false;

      const lineLink = document.getElementById('bookingLineLink');
      if (lineLink) {
        lineLink.href = `https://line.me/R/oaMessage/${LINE_OA_ID}/${encodeURIComponent('已填寫')}`;
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
  updateSummary();
})();
