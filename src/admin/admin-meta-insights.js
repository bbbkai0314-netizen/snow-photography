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
    schedule_total: "預約 (Schedule)",
    "offsite_conversion.fb_pixel_schedule": "預約 (Schedule)",
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

  // Link clicks (inline_link_*) rather than "all clicks": all clicks also counts likes,
  // expanding the caption, etc., which inflates CTR and hides a slow landing page.
  const METRIC_FIELDS =
    "spend,impressions,reach,frequency,cpm,inline_link_clicks,inline_link_click_ctr,cost_per_inline_link_click,actions";

  async function fetchInsights(token, accountId, datePreset, level) {
    const fields = level === "campaign" ? `campaign_name,objective,${METRIC_FIELDS}` : METRIC_FIELDS;
    const url =
      `https://graph.facebook.com/${GRAPH_VERSION}/${accountId}/insights` +
      `?fields=${fields}&date_preset=${datePreset}` +
      (level === "campaign" ? "&level=campaign&limit=50" : "") +
      `&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.error) {
      throw new Error(json.error.message || "Meta API 回傳錯誤");
    }
    return json.data || [];
  }

  // "lead" already includes the pixel's Lead, so the first match wins instead of summing
  // (summing would double-count).
  function actionCount(actions, types) {
    for (const type of types) {
      const hit = (actions || []).find((a) => a.action_type === type);
      if (hit) return Number(hit.value) || 0;
    }
    return 0;
  }
  const LEAD_TYPES = ["lead", "offsite_conversion.fb_pixel_lead", "onsite_conversion.lead_grouped"];
  const SCHEDULE_TYPES = ["schedule_total", "schedule_website", "offsite_conversion.fb_pixel_schedule"];

  // Landing page view rate = LPV ÷ link clicks: how many people who clicked actually waited
  // for the page to load. Thresholds from the CloudAD GA4 × Meta course (2026-07).
  function landingRate(lpv, linkClicks) {
    if (!linkClicks) return { text: "—" };
    const rate = (lpv / linkClicks) * 100;
    const light = rate >= 70 ? "🟢" : rate >= 40 ? "🟡" : "🔴";
    return { text: `${light} ${rate.toFixed(0)}%` };
  }

  function summarize(row) {
    const actions = row.actions || [];
    const spend = Number(row.spend) || 0;
    const linkClicks = Number(row.inline_link_clicks) || 0;
    const lpv = actionCount(actions, ["landing_page_view"]);
    const leads = actionCount(actions, LEAD_TYPES);
    const schedules = actionCount(actions, SCHEDULE_TYPES);
    const conversions = leads + schedules;
    return {
      spend,
      linkClicks,
      lpv,
      leads,
      schedules,
      conversions,
      landing: landingRate(lpv, linkClicks),
      cpa: conversions ? spend / conversions : null,
    };
  }

  const OBJECTIVE_GROUPS = {
    OUTCOME_AWARENESS: "認知",
    BRAND_AWARENESS: "認知",
    REACH: "認知",
    OUTCOME_TRAFFIC: "流量",
    LINK_CLICKS: "流量",
    OUTCOME_ENGAGEMENT: "互動",
    POST_ENGAGEMENT: "互動",
    OUTCOME_LEADS: "名單",
    LEAD_GENERATION: "名單",
    OUTCOME_SALES: "銷售",
    CONVERSIONS: "銷售",
  };

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
            const [account, campaigns] = await Promise.all([
              fetchInsights(token, acct, datePreset),
              fetchInsights(token, acct, datePreset, "campaign"),
            ]);
            status.textContent = "";
            renderResults(account[0] || null, campaigns);
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

    function renderResults(data, campaigns) {
      if (!data) {
        resultsBox.appendChild(
          el("p", { className: "admin-field__hint" }, "這個時間範圍內沒有任何廣告成效資料。")
        );
        return;
      }

      const actions = data.actions || [];
      const sum = summarize(data);
      const frequency = Number(data.frequency) || 0;

      resultsBox.appendChild(
        el("div", { className: "admin-insights__stats" }, [
          statCard("花費", formatCurrency(data.spend)),
          statCard("曝光次數", formatNumber(data.impressions)),
          statCard("觸及人數", formatNumber(data.reach)),
          statCard("頻率（新客建議 1.5–2）", frequency ? (frequency > 2 ? "⚠️ " : "") + frequency.toFixed(2) : "—"),
          statCard("每千次曝光成本 (CPM)", data.cpm ? formatCurrency(data.cpm) : "—"),
          statCard("連結點擊", formatNumber(sum.linkClicks)),
          statCard("連結點擊率 (CTR)", data.inline_link_click_ctr ? Number(data.inline_link_click_ctr).toFixed(2) + "%" : "—"),
          statCard("單次連結點擊成本 (CPC)", data.cost_per_inline_link_click ? formatCurrency(data.cost_per_inline_link_click) : "—"),
          statCard("到達頁瀏覽 (LPV)", formatNumber(sum.lpv)),
          statCard("網頁到達率（≥70% 健康）", sum.landing.text),
          statCard("名單 (Lead＝點 LINE)", formatNumber(sum.leads)),
          statCard("預約 (Schedule＝送出表單)", formatNumber(sum.schedules)),
          statCard("每筆轉換成本 (CPA)", sum.cpa != null ? formatCurrency(sum.cpa) : "—"),
        ])
      );

      if (campaigns && campaigns.length) {
        const header = ["廣告活動", "目標", "花費", "頻率", "CPM", "連結 CTR", "CPC", "到達率", "名單＋預約", "CPA"];
        const rows = campaigns.map((c) => {
          const cs = summarize(c);
          return [
            c.campaign_name || "—",
            OBJECTIVE_GROUPS[c.objective] || c.objective || "—",
            formatCurrency(c.spend),
            c.frequency ? Number(c.frequency).toFixed(2) : "—",
            c.cpm ? formatCurrency(c.cpm) : "—",
            c.inline_link_click_ctr ? Number(c.inline_link_click_ctr).toFixed(2) + "%" : "—",
            c.cost_per_inline_link_click ? formatCurrency(c.cost_per_inline_link_click) : "—",
            cs.landing.text,
            formatNumber(cs.conversions),
            cs.cpa != null ? formatCurrency(cs.cpa) : "—",
          ];
        });
        resultsBox.appendChild(
          el("div", { className: "admin-insights__campaigns" }, [
            el("h3", { className: "admin-insights__actions-title" }, "各廣告活動"),
            el(
              "p",
              { className: "admin-field__hint" },
              "依目標看重點：認知看觸及、頻率、CPM；流量看連結 CTR、CPC、到達率；名單／銷售看名單＋預約與 CPA。"
            ),
            el("div", { className: "admin-insights__table-wrap" }, [
              el("table", { className: "admin-insights__table" }, [
                el("thead", {}, [el("tr", {}, header.map((h) => el("th", {}, h)))]),
                el("tbody", {}, rows.map((r) => el("tr", {}, r.map((v) => el("td", {}, String(v)))))),
              ]),
            ]),
          ])
        );
      }

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
