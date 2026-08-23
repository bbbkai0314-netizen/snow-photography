// "預約管理" panel — talks to a small Apps Script Web App (automation/gas/booking-admin-api.gs)
// bound to the same Google Sheet the booking form writes to. Not the GitHub API: this is a
// second, separate credential (a shared secret, pasted once) because the booking data lives in
// Google Sheets, not in this repo. See automation/gas/booking-admin-api.gs for the server side.

const AdminBookings = (() => {
  const { el, textField, checkboxField, section } = AdminForms;

  const URL_KEY = "admin_booking_webapp_url";
  const SECRET_KEY = "admin_booking_secret";

  const EDITABLE_FIELDS = [
    { key: "姓名", label: "姓名" },
    { key: "人數", label: "人數" },
    { key: "日期", label: "日期" },
    { key: "地點", label: "地點" },
    { key: "email", label: "email" },
    { key: "line", label: "line" },
    { key: "想預約的服務", label: "想預約的服務" },
    { key: "其他服務", label: "其他服務" },
    { key: "PaymentLast5", label: "匯款帳號後五碼" },
    { key: "PaymentAmount", label: "匯款金額" },
  ];

  function getConfig() {
    return { url: localStorage.getItem(URL_KEY) || "", secret: localStorage.getItem(SECRET_KEY) || "" };
  }

  function setConfig(url, secret) {
    localStorage.setItem(URL_KEY, url);
    localStorage.setItem(SECRET_KEY, secret);
  }

  async function callApi(config, { method = "GET", body } = {}) {
    let res;
    if (method === "GET") {
      res = await fetch(`${config.url}?secret=${encodeURIComponent(config.secret)}`);
    } else {
      res = await fetch(config.url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ ...body, secret: config.secret }),
      });
    }
    if (!res.ok) throw new Error(`連線失敗（HTTP ${res.status}）`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "未知錯誤");
    return data.rows;
  }

  function settingsForm(onSaved) {
    const config = getConfig();
    let url = config.url;
    let secret = config.secret;
    const wrap = el("div", {}, [
      el("p", { className: "admin-field__hint" }, "第一次使用要先貼上 Apps Script 網頁應用程式網址與密鑰，設定步驟在 automation/gas/booking-admin-api.gs 檔案開頭的註解裡。設定只存在這台電腦的瀏覽器，不會出現在網站原始碼裡。"),
      textField({ label: "Apps Script 網頁應用程式網址", value: url, placeholder: "https://script.google.com/macros/s/xxxx/exec", onChange: (v) => (url = v) }),
      textField({ label: "密鑰 (Secret)", value: secret, onChange: (v) => (secret = v) }),
      el(
        "button",
        {
          type: "button",
          className: "admin-btn admin-btn--primary",
          onclick: () => {
            if (!url.trim() || !secret.trim()) return;
            setConfig(url.trim(), secret.trim());
            onSaved();
          },
        },
        "儲存設定"
      ),
    ]);
    return wrap;
  }

  function rowCard(row, config, onChanged) {
    const data = { ...row };
    const status = el("p", { className: "admin-field__hint" }, "");

    const fields = EDITABLE_FIELDS.map(({ key, label }) => textField({ label, value: data[key], onChange: (v) => (data[key] = v) }));

    const depositBox = checkboxField({ label: "訂金已收款（勾選會自動寄訂金收訖信給客人）", checked: data.DepositReceived, onChange: (v) => (data.DepositReceived = v) });
    const finalBox = checkboxField({ label: "尾款已收款（勾選會自動寄尾款收訖信給客人）", checked: data.FinalPaymentReceived, onChange: (v) => (data.FinalPaymentReceived = v) });

    const infoLine = el(
      "p",
      { className: "admin-field__hint" },
      `行事曆狀態：${row["行事曆狀態"] || "-"}　確認信狀態：${row["確認信狀態"] || "-"}　訂金信已寄送：${row["訂金信已寄送"] || "-"}　尾款信已寄送：${row["尾款信已寄送"] || "-"}`
    );

    const saveBtn = el(
      "button",
      {
        type: "button",
        className: "admin-btn admin-btn--primary",
        onclick: async () => {
          saveBtn.disabled = true;
          status.textContent = "儲存中…";
          try {
            const values = {};
            EDITABLE_FIELDS.forEach(({ key }) => (values[key] = data[key]));
            values.DepositReceived = !!data.DepositReceived;
            values.FinalPaymentReceived = !!data.FinalPaymentReceived;
            await callApi(config, { method: "POST", body: { action: "update", row: row.row, values } });
            status.textContent = "已儲存 ✓";
            onChanged();
          } catch (err) {
            status.textContent = "";
            alert(err.message || "儲存失敗");
          } finally {
            saveBtn.disabled = false;
          }
        },
      },
      "儲存"
    );

    const deleteBtn = el(
      "button",
      {
        type: "button",
        className: "admin-btn admin-btn--danger",
        onclick: async () => {
          if (!confirm(`確定要刪除「${row["姓名"] || ""}」這筆預約嗎？此動作無法復原。`)) return;
          deleteBtn.disabled = true;
          try {
            await callApi(config, { method: "POST", body: { action: "delete", row: row.row } });
            onChanged();
          } catch (err) {
            alert(err.message || "刪除失敗");
            deleteBtn.disabled = false;
          }
        },
      },
      "刪除"
    );

    return el("div", { className: "admin-repeatable__item glass" }, [
      el("div", { className: "admin-repeatable__body" }, [...fields, depositBox, finalBox, infoLine]),
      el("div", { className: "admin-repeatable__controls" }, [saveBtn, deleteBtn, status]),
    ]);
  }

  async function renderPanel() {
    const container = el("div", {}, [el("p", { className: "admin-loading" }, "載入中…")]);

    async function load() {
      container.innerHTML = "";
      const config = getConfig();
      if (!config.url || !config.secret) {
        container.appendChild(settingsForm(load));
        return;
      }
      try {
        const rows = await callApi(config);
        const list = el(
          "div",
          { className: "admin-repeatable" },
          rows.length ? rows.map((row) => rowCard(row, config, load)) : [el("p", { className: "admin-empty" }, "目前沒有預約資料")]
        );
        container.appendChild(
          el("div", { className: "admin-field-row" }, [
            el("button", { type: "button", className: "admin-btn", onclick: load }, "重新整理"),
            el(
              "button",
              {
                type: "button",
                className: "admin-btn admin-btn--ghost",
                onclick: () => {
                  setConfig("", "");
                  load();
                },
              },
              "變更連線設定"
            ),
          ])
        );
        container.appendChild(list);
      } catch (err) {
        const box = el("div", { className: "admin-error glass" }, err.message || "讀取失敗");
        container.appendChild(box);
        container.appendChild(
          el(
            "button",
            {
              type: "button",
              className: "admin-btn admin-btn--ghost",
              onclick: () => {
                setConfig("", "");
                load();
              },
            },
            "變更連線設定"
          )
        );
      }
    }

    await load();
    return container;
  }

  return { renderPanel };
})();
