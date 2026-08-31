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

  const GA_CLIENT_ID_ENTRY = 'entry.255043109'; // Form 裡「GA Client ID」那一題

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
    isSubmitting: false,
    submissionCompleted: false,
  };

  let hasFiredBookingStart = false;
  function trackEvent(name, params) {
    if (typeof gtag !== 'function') return;
    const utm = typeof window.ssfUTM === 'function' ? window.ssfUTM() : {};
    const sessionId = window.ssfSessionId;
    gtag('event', name, { ...params, ...utm, ...(sessionId ? { session_id: sessionId } : {}) });
  }

  // Reads GA4's client_id so it can ride along in the Form submission. Apps Script later
  // uses the same client_id to send booking_confirmed/purchase via Measurement Protocol,
  // which is the only way those two events can still be attributed to the original
  // marketing source even though they fire from the admin panel, not a browser.
  const GA4_MEASUREMENT_ID = 'G-H578W2CXH6';
  function getGaClientId() {
    return new Promise((resolve) => {
      if (typeof gtag !== 'function') { resolve(''); return; }
      let settled = false;
      const done = (id) => { if (!settled) { settled = true; resolve(id || ''); } };
      try {
        gtag('get', GA4_MEASUREMENT_ID, 'client_id', done);
      } catch (e) { done(''); }
      setTimeout(() => done(''), 1000);
    });
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

  // ---------- Step 2: plan selection ----------
  const planOptions = Array.from(wizard.querySelectorAll('.booking-plan-option'));
  planOptions.forEach((btn) => {
    btn.addEventListener('click', () => {
      planOptions.forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      state.planLabel = btn.querySelector('.booking-plan-option__title').textContent.trim();
      state.serviceValue = btn.dataset.serviceValue;
      showError(2, '');

      if (!hasFiredBookingStart) {
        hasFiredBookingStart = true;
        trackEvent('booking_start', { plan: state.planLabel });
      }
    });
  });

  // ---------- Step 1: date / location / people / notes ----------
  // The date picker is a hand-rolled month-grid calendar (Google Calendar style) rather than
  // a plain <input type="date">, so dates in `window.SSF_BLOCKED_DATES` (set by Ellie from the
  // admin panel — see src/admin/admin-calendar.js) can render as "已被預約" and be unselectable.
  // This is scarcity marketing: a date being marked blocked does not mean it was actually
  // booked, it just needs to look sold-out on the page.
  const blockedDates = new Set(Array.isArray(window.SSF_BLOCKED_DATES) ? window.SSF_BLOCKED_DATES : []);
  const calendarEl = document.getElementById('bookingCalendar');
  const calGrid = calendarEl?.querySelector('[data-cal-grid]');
  const calTitle = calendarEl?.querySelector('[data-cal-title]');
  const calHint = calendarEl?.querySelector('[data-cal-hint]');
  const calSelected = calendarEl?.querySelector('[data-cal-selected]');
  const calPrevBtn = calendarEl?.querySelector('[data-cal-prev]');
  const calNextBtn = calendarEl?.querySelector('[data-cal-next]');

  const CAL_WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
  // SnowSurfStudio only shoots during ski season (November–April) — the calendar should
  // never default to, or let visitors browse into, the snowless months.
  const SEASON_START_MONTH = 10; // November (0-indexed)
  const SEASON_END_MONTH = 3; // April (0-indexed)
  const calToday = new Date();
  calToday.setHours(0, 0, 0, 0);

  function seasonWindow(date) {
    const y = date.getFullYear();
    const m = date.getMonth();
    let startYear;
    if (m >= SEASON_START_MONTH) startYear = y; // Nov/Dec: this season already started
    else if (m <= SEASON_END_MONTH) startYear = y - 1; // Jan-Apr: season started last year
    else startYear = y; // May-Oct (off-season): next season starts this coming November
    return { startYear, startMonth: SEASON_START_MONTH, endYear: startYear + 1, endMonth: SEASON_END_MONTH };
  }

  const calSeason = seasonWindow(calToday);
  const calSeasonStart = new Date(calSeason.startYear, calSeason.startMonth, 1);
  const calInSeason = calToday >= calSeasonStart;
  const CAL_MIN_YEAR = calInSeason ? calToday.getFullYear() : calSeason.startYear;
  const CAL_MIN_MONTH = calInSeason ? calToday.getMonth() : calSeason.startMonth;
  const CAL_MAX_YEAR = calSeason.endYear;
  const CAL_MAX_MONTH = calSeason.endMonth;

  let calYear = CAL_MIN_YEAR;
  let calMonth = CAL_MIN_MONTH;

  function calDateStr(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function calSelectedLabel(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dow = CAL_WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()];
    return `已選擇：${y}年${m}月${d}日（週${dow}）`;
  }

  function selectCalDate(dateStr, cellEl) {
    state.date = dateStr;
    calGrid.querySelectorAll('.booking-calendar__cell.is-selected').forEach((c) => c.classList.remove('is-selected'));
    cellEl.classList.add('is-selected');
    calSelected.textContent = calSelectedLabel(dateStr);
    showError(1, '');
  }

  function renderCalendar() {
    if (!calGrid) return;
    calTitle.textContent = `${calYear}年${calMonth + 1}月`;
    calGrid.innerHTML = '';

    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i += 1) {
      const empty = document.createElement('span');
      empty.className = 'booking-calendar__cell booking-calendar__cell--empty';
      calGrid.appendChild(empty);
    }

    let blockedInMonth = 0;
    for (let d = 1; d <= daysInMonth; d += 1) {
      const dateStr = calDateStr(calYear, calMonth, d);
      const isPast = new Date(calYear, calMonth, d) < calToday;
      const isBlocked = blockedDates.has(dateStr);
      if (isBlocked) blockedInMonth += 1;

      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'booking-calendar__cell';
      cell.textContent = String(d);

      if (isBlocked) {
        cell.classList.add('is-full');
        cell.disabled = true;
        cell.title = '已被預約';
      } else if (isPast) {
        cell.classList.add('is-disabled');
        cell.disabled = true;
      } else {
        cell.classList.add('is-open');
        cell.addEventListener('click', () => selectCalDate(dateStr, cell));
      }

      if (state.date === dateStr) cell.classList.add('is-selected');
      calGrid.appendChild(cell);
    }

    if (calHint) {
      if (blockedInMonth > 0) {
        calHint.textContent = `本月已有 ${blockedInMonth} 天被搶先預約，手刀把握還開放的日期！`;
        calHint.hidden = false;
      } else {
        calHint.hidden = true;
      }
    }

    if (calPrevBtn) calPrevBtn.disabled = calYear === CAL_MIN_YEAR && calMonth === CAL_MIN_MONTH;
    if (calNextBtn) calNextBtn.disabled = calYear === CAL_MAX_YEAR && calMonth === CAL_MAX_MONTH;
  }

  calPrevBtn?.addEventListener('click', () => {
    calMonth -= 1;
    if (calMonth < 0) { calMonth = 11; calYear -= 1; }
    renderCalendar();
  });
  calNextBtn?.addEventListener('click', () => {
    calMonth += 1;
    if (calMonth > 11) { calMonth = 0; calYear += 1; }
    renderCalendar();
  });

  renderCalendar();

  const peopleInput = document.getElementById('bookingPeople');
  const notesInput = document.getElementById('bookingNotes');
  const locationPills = Array.from(wizard.querySelectorAll('.booking-pill'));

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
      showError(1, '');
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
      if (!state.date) { showError(1, '請選擇拍攝日期'); return false; }
      if (!state.location) { showError(1, '請選擇雪場地點'); return false; }
      if (!state.people || Number(state.people) < 1) { showError(1, '請填寫正確人數'); return false; }
    }
    if (n === 2) {
      if (!state.serviceValue) {
        showError(2, '請先選擇一個方案');
        return false;
      }
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
    if (state.isSubmitting || state.submissionCompleted || !validateStep(3)) return;
    state.isSubmitting = true;

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

    if (GA_CLIENT_ID_ENTRY) {
      const gaClientId = await getGaClientId();
      if (gaClientId) data.append(GA_CLIENT_ID_ENTRY, gaClientId);
    }

    try {
      await fetch(FORM_ACTION, { method: 'POST', mode: 'no-cors', body: data });

      // Only record a conversion after the Google Form submission request resolves.
      // Failed requests take the catch path below and are never counted.
      state.submissionCompleted = true;
      window.ssTrack && window.ssTrack.bookingComplete();
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
      state.isSubmitting = false;
      errorBanner.hidden = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '送出預約';
      }
    }
  });

  setStep(1);
})();
