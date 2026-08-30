// "行銷數據" panel — pulls real ad performance from the Meta Marketing API directly in the
// browser, the same trust model as AdminApi's GitHub PAT: the user pastes their own Meta
// access token, it's stored in localStorage, and every request goes straight from the
// browser to graph.facebook.com. No backend, no server-side secret.

const AdminMetaInsights = (() => {
  const { el, textField, selectField } = AdminForms;

  const TOKEN_KEY = "meta_access_token";
  const ACCOUNT_KEY = "meta_ad_account_id";
  const GRAPH_VERSION = "v21.0";

  const DATE_PRESETS = [
    { value: "today", label: "今天" },
    { value: "yesterday", label: "昨天" },
    { value: "last_7d", label: "過去 7 天" },
    { value: "last_30d", label: "過去 30 天" },
  ];

  // Standard Meta action_type keys we know how to label nicely. Anything else still
  // shows up in the list, just with its raw action_type as the label, so a result never
  // silently disappears just because we didn't anticipate its name.
  const ACTION_LABELS = {
    lead: "名單開發 (Lead)",
    "onsite_conversion.lead_grouped": "名單開發 (Lead)",
    "offsite_conversion.fb_pixel_lead": "名單開發 (Lead)",
    view_content: "內容瀏覽 (ViewContent)",
    "offsite_conversion.fb_pixel_view_content": "內容瀏覽 (ViewContent)",
    link_click: "連結點擊",
    landing_page_view: "到達頁瀏覽",
    page_engagement: "粉專互動",
    post_engagement: "貼文互動",
  };

  function getSavedToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }
  function getSavedAccount() {
    return localStorage.getItem(ACCOUNT_KEY) || "";
  }

  function normalizeAccountId(raw) {
    const v = (raw || "").trim();
    if (!v) return "";
    return v.startsWith("act_") ? v : "act_" + v;
  }

  function formatNumber(n) {
    const num = Number(n);
    if (Number.isNaN(num)) return "—";
    return num.toLocaleString("zh-Hant-TW", { maximumFractionDigits: 2 });
  }

  function formatCurrency(n) {
    const num = Number(n);
    if (Number.isNaN(num)) return "—";
    return "NT$ " + num.toLocaleString("zh-Hant-TW", { maximumFractionDigits: 0 });
  }

  function statCard(label, value) {
    return el("div", { className: "admin-insights__stat glass" }, [
      el("span", { className: "admin-insights__stat-label" }, label),
      el("span", { className: "admin-insights__stat-value" }, value),
    ]);
  }

  async function fetchInsights(token, accountId, datePreset) {
    const fields = "spend,impressions,reach,clicks,cpc,ctr,actions";
    const url =
      `https://graph.facebook.com/${GRAPH_VERSION}/${accountId}/insights` +
      `?fields=${fields}&date_preset=${datePreset}&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.error) {
      throw new Error(json.error.message || "Meta API 回傳錯誤");
    }
    return (json.data && json.data[0]) || null;
  }

  function renderPanel() {
    let token = getSavedToken();
    let accountId = getSavedAccount();
    let datePreset = "last_7d";

    const status = el("p", { className: "admin-insights__status" }, "");
    const resultsBox = el("div", { className: "admin-insights__results" }, "");

    const settingsHint = el(
      "p",
      { className: "admin-field__hint" },
      "第一次使用要先到 Meta Business 設定 → 系統使用者，建立一個只有「ads_read」權限的長效權杖，再到廣告管理員網址列或帳戶設定找到廣告帳戶 ID(act_ 開頭的那串數字)。這組權杖只會存在你這台電腦的瀏覽器裡，直接送去 Meta，不會經過我們的網站伺服器。"
    );

    const tokenInput = el("input", {
      type: "password",
      className: "admin-input",
      placeholder: "貼上 Meta Access Token",
      value: token,
      oninput: (e) => (token = e.target.value.trim()),
    });

    const accountInput = el("input", {
      type: "text",
      className: "admin-input",
      placeholder: "廣告帳戶 ID，例如 act_1234567890",
      value: accountId,
      oninput: (e) => (accountId = e.target.value.trim()),
    });

    const saveBtn = el(
      "button",
      {
        type: "button",
        className: "admin-btn",
        onclick: () => {
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem(ACCOUNT_KEY, normalizeAccountId(accountId));
          accountId = normalizeAccountId(accountId);
          accountInput.value = accountId;
          status.textContent = "已儲存這台裝置的設定 ✓";
        },
      },
      "儲存設定"
    );

    const presetSelect = selectField({
      label: "時間範圍",
      value: datePreset,
      options: DATE_PRESETS,
      onChange: (v) => (datePreset = v),
    });

    const loadBtn = el(
      "button",
      {
        type: "button",
        className: "admin-btn admin-btn--primary",
        onclick: async () => {
          const acct = normalizeAccountId(accountId);
          if (!token || !acct) {
            status.textContent = "";
            alert("請先填入 Access Token 和廣告帳戶 ID");
            return;
          }
          loadBtn.disabled = true;
          status.textContent = "讀取中…";
          resultsBox.innerHTML = "";
          try {
            const data = await fetchInsights(token, acct, datePreset);
            status.textContent = "";
            renderResults(data);
          } catch (err) {
            status.textContent = "";
            resultsBox.innerHTML = "";
            resultsBox.appendChild(
              el("p", { className: "admin-error" }, err.message || "讀取失敗")
            );
          } finally {
            loadBtn.disabled = false;
          }
        },
      },
      "讀取廣告數據"
    );

    function renderResults(data) {
      if (!data) {
        resultsBox.appendChild(
          el("p", { className: "admin-field__hint" }, "這個時間範圍內沒有任何廣告成效資料。")
        );
        return;
      }

      const actions = data.actions || [];

      resultsBox.appendChild(
        el("div", { className: "admin-insights__stats" }, [
          statCard("花費", formatCurrency(data.spend)),
          statCard("曝光次數", formatNumber(data.impressions)),
          statCard("觸及人數", formatNumber(data.reach)),
          statCard("點擊次數", formatNumber(data.clicks)),
          statCard("平均點擊成本 (CPC)", data.cpc ? formatCurrency(data.cpc) : "—"),
          statCard("點擊率 (CTR)", data.ctr ? Number(data.ctr).toFixed(2) + "%" : "—"),
        ])
      );

      if (actions.length) {
        resultsBox.appendChild(
          el("div", { className: "admin-insights__actions" }, [
            el("h3", { className: "admin-insights__actions-title" }, "成效事件"),
            el(
              "div",
              { className: "admin-insights__actions-list" },
              actions.map((a) =>
                el("div", { className: "admin-insights__action-row" }, [
                  el("span", {}, ACTION_LABELS[a.action_type] || a.action_type),
                  el("span", { className: "admin-insights__action-value" }, formatNumber(a.value)),
                ])
              )
            ),
          ])
        );
      }
    }

    return el("div", { className: "admin-insights" }, [
      settingsHint,
      el("div", { className: "admin-field-row" }, [tokenInput, accountInput]),
      el("div", { className: "admin-insights__toolbar" }, [saveBtn]),
      presetSelect,
      loadBtn,
      status,
      resultsBox,
    ]);
  }

  return { renderPanel };
})();
