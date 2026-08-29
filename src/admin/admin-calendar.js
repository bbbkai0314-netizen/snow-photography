// "預約行事曆" panel — a Google Calendar-style month grid for marking dates as
// "已被預約走". This is deliberately not tied to real bookings: it exists so Ellie can
// manually block out dates from the admin panel to create scarcity ("飢餓行銷") on the
// public booking calendar (src/js/booking-form.js reads the same src/_data/blockedDates.json
// file). Saved through the same GitHub-backed AdminApi as the rest of the CMS.

const AdminCalendar = (() => {
  const { el } = AdminForms;
  const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

  function toDateStr(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // `dates` is mutated in place (add/remove); `onChange` is called with the sorted array
  // after every toggle so the caller can stash it for the save button.
  function renderPanel(dates, onChange) {
    const blocked = new Set(dates);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let year = today.getFullYear();
    let month = today.getMonth();

    const title = el("span", { className: "admin-calendar__title" }, "");
    const grid = el("div", { className: "admin-calendar__grid" });
    const countLabel = el("p", { className: "admin-field__hint" }, "");

    const prevBtn = el(
      "button",
      {
        type: "button",
        className: "admin-btn admin-btn--icon",
        onclick: () => {
          month -= 1;
          if (month < 0) { month = 11; year -= 1; }
          draw();
        },
      },
      "‹"
    );
    const nextBtn = el(
      "button",
      {
        type: "button",
        className: "admin-btn admin-btn--icon",
        onclick: () => {
          month += 1;
          if (month > 11) { month = 0; year += 1; }
          draw();
        },
      },
      "›"
    );

    function draw() {
      title.textContent = `${year}年${month + 1}月`;
      grid.innerHTML = "";
      WEEKDAY_LABELS.forEach((w) => grid.appendChild(el("span", { className: "admin-calendar__weekday" }, w)));

      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 0; i < firstDay; i += 1) {
        grid.appendChild(el("span", { className: "admin-calendar__cell admin-calendar__cell--empty" }, ""));
      }

      let blockedInMonth = 0;
      for (let d = 1; d <= daysInMonth; d += 1) {
        const dateStr = toDateStr(year, month, d);
        const isBlocked = blocked.has(dateStr);
        const isPast = new Date(year, month, d) < today;
        if (isBlocked) blockedInMonth += 1;

        const cell = el(
          "button",
          {
            type: "button",
            className: "admin-calendar__cell" + (isBlocked ? " is-blocked" : "") + (isPast ? " is-past" : ""),
            title: isBlocked ? "點擊解除封鎖（開放預約）" : "點擊標記為已被預約",
            onclick: () => {
              if (isBlocked) blocked.delete(dateStr);
              else blocked.add(dateStr);
              onChange(Array.from(blocked).sort());
              draw();
            },
          },
          String(d)
        );
        grid.appendChild(cell);
      }

      countLabel.textContent = blockedInMonth
        ? `本月已封鎖 ${blockedInMonth} 天（網站上會顯示為已被預約）`
        : "本月尚未封鎖任何日期";
    }

    draw();

    return el("div", { className: "admin-calendar" }, [
      el(
        "p",
        { className: "admin-field__hint" },
        "點一下日期就會標記成「已被預約走」（紅色），網站上的預約行事曆會顯示那天已額滿、不能選——用來營造搶手熱度，不需要真的有人預約。想重新開放就再點一次那個日期取消封鎖。改動要按下面的「儲存」才會真的發布到網站。"
      ),
      el("div", { className: "admin-calendar__head" }, [prevBtn, title, nextBtn]),
      grid,
      countLabel,
    ]);
  }

  return { renderPanel };
})();
