// "LINE 廣告數據" panel — pulls ad performance from the LINE Ads Platform (LAP) Online
// Reports API directly in the browser, the same trust model as the Meta panel: the user
// pastes their own LAP Access Key + Secret Key, they're stored in localStorage, and every
// request goes straight from the browser to ads.line.me. No backend, no server-side secret.
//
// LAP auth is not a simple bearer token like Meta's Graph API — every request needs a
// per-request JWS token (HS256), signed client-side with Web Crypto from the secret key.
// LAP's API is built for server-to-server ad-tech integrations, so there is a real chance
// ads.line.me does not send CORS headers back to a browser origin; if so, every call below
// will fail with a generic "Failed to fetch" and the only fix is routing through a proxy
// server instead of calling ads.line.me directly. The exact JSON field names for the
// Online Reports response also aren't independently verified against a live account, so
// results are parsed defensively (several candidate key names per metric) and the raw
// response is always shown too, so nothing is silently lost if a field name guess is wrong.

const AdminLineInsights = (() => {
  const { el, selectField } = AdminForms;

  const ACCESS_KEY_KEY = "line_lap_access_key";
  const SECRET_KEY_KEY = "line_lap_secret_key";
  const ACCOUNT_KEY = "line_lap_ad_account_id";
  const API_HOST = "https://ads.line.me";

  const DATE_PRESETS = [
    { value: "today", label: "今天" },
    { value: "yesterday", label: "昨天" },
    { value: "last_7d", label: "過去 7 天" },
    { value: "last_30d", label: "過去 30 天" },
  ];

  const METRIC_FIELDS = [
    { key: "cost", label: "花費", candidates: ["cost", "spend"], format: "currency" },
    { key: "impressions", label: "曝光次數", candidates: ["impression", "impressions"], format: "number" },
    { key: "clicks", label: "點擊次數", candidates: ["click", "clicks"], format: "number" },
    { key: "conversions", label: "轉換數", candidates: ["conversion", "conversions", "cv"], format: "number" },
  ];

  function getSaved(key) {
    return localStorage.getItem(key) || "";
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

  function fmtDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function dateRangeFor(preset) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    if (preset === "yesterday") {
      start.setDate(start.getDate() - 1);
      return [fmtDate(start), fmtDate(start)];
    }
    if (preset === "last_7d") start.setDate(start.getDate() - 6);
    else if (preset === "last_30d") start.setDate(start.getDate() - 29);
    return [fmtDate(start), fmtDate(today)];
  }

  // ---- JWS (HS256) request signing --------------------------------------------------

  function bytesToBase64Url(bytes) {
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function utf8ToBase64Url(str) {
    return bytesToBase64Url(new TextEncoder().encode(str));
  }

  async function sha256Hex(str) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Builds the Date + Authorization headers LAP expects: a JWS whose payload binds the
  // request body hash, content type, date (YYYYMMDD, UTC), and the canonical URI path.
  async function buildAuthHeaders(accessKey, secretKey, path, contentType, bodyStr) {
    const now = new Date();
    const dateHeader = now.toUTCString(); // RFC 1123, e.g. "Fri, 30 Aug 2026 07:00:00 GMT"
    const dateYYYYMMDD = dateHeader.replace(/^\w+, (\d{2}) (\w+) (\d{4}).*$/, (_, d, mon, y) => {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${y}${String(months.indexOf(mon) + 1).padStart(2, "0")}${d}`;
    });

    const bodyHash = await sha256Hex(bodyStr || "");
    const payload = [bodyHash, contentType || "", dateYYYYMMDD, path].join("\n");

    const header = { alg: "HS256", kid: accessKey, typ: "text/plain" };
    const signingInput = `${utf8ToBase64Url(JSON.stringify(header))}.${utf8ToBase64Url(payload)}`;

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secretKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(signingInput));
    const token = `${signingInput}.${bytesToBase64Url(new Uint8Array(signature))}`;

    return { Date: dateHeader, Authorization: `Bearer ${token}` };
  }

  async function fetchOnlineReport(accessKey, secretKey, adAccountId, since, until) {
    const path = `/api/v3/adaccounts/${adAccountId}/reports/online/campaign`;
    const query = `?since=${since}&until=${until}&size=100`;
    let headers;
    try {
      headers = await buildAuthHeaders(accessKey, secretKey, path, "", "");
    } catch (err) {
      throw new Error("這台瀏覽器無法產生簽章（需要支援 Web Crypto 的瀏覽器），請改用電腦版 Chrome 或 Safari 再試一次。");
    }

    let res;
    try {
      res = await fetch(API_HOST + path + query, { headers });
    } catch (err) {
      throw new Error(
        "瀏覽器擋下了這個請求，很可能是 LINE Ads Platform 的 API 沒有開放讓瀏覽器跨網域直接呼叫（沒有 CORS 設定）。" +
        "這種 API 是設計給企業伺服器對伺服器串接用的，若一直卡在這個錯誤，代表沒辦法只在前端呼叫，得改成透過中介伺服器（例如 Cloudflare Worker）轉發請求才行。"
      );
    }

    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (err) {
      // fall through with json = null; raw text still shown to the user below
    }

    if (!res.ok) {
      const msg = (json && (json.message || json.error)) || text || `HTTP ${res.status}`;
      throw new Error(`LINE API 回傳錯誤（HTTP ${res.status}）：${msg}`);
    }
    return json ?? {};
  }

  // The exact top-level key holding the row array isn't independently verified, so this
  // looks for common names first, then falls back to the first array-of-objects found.
  function findRows(json) {
    if (Array.isArray(json)) return json;
    if (!json || typeof json !== "object") return [];
    for (const key of ["datas", "data", "rows", "list", "items", "results"]) {
      if (Array.isArray(json[key])) return json[key];
    }
    for (const value of Object.values(json)) {
      if (Array.isArray(value) && value.length && typeof value[0] === "object") return value;
    }
    return [];
  }

  function sumField(rows, candidates) {
    let sum = 0;
    let found = false;
    rows.forEach((row) => {
      for (const key of candidates) {
        if (row[key] !== undefined && row[key] !== null) {
          sum += Number(row[key]) || 0;
          found = true;
          break;
        }
      }
    });
    return found ? sum : null;
  }

  // ---- panel --------------------------------------------------------------------------

  function renderPanel() {
    let accessKey = getSaved(ACCESS_KEY_KEY);
    let secretKey = getSaved(SECRET_KEY_KEY);
    let accountId = getSaved(ACCOUNT_KEY);
    let datePreset = "last_7d";

    const status = el("p", { className: "admin-insights__status" }, "");
    const resultsBox = el("div", { className: "admin-insights__results" }, "");

    const settingsHint = el(
      "p",
      { className: "admin-field__hint" },
      "LINE Ads Platform 的 API 要先在 LAP 廣告管理員的「群組設定」頁申請開通，系統會核發一組 Access Key／Secret Key。" +
      "這兩組金鑰只會存在你這台電腦的瀏覽器裡，直接送去 ads.line.me，不會經過我們的網站伺服器。" +
      "廣告帳戶 ID 是純數字，在廣告管理員網址列或帳戶設定可以找到。" +
      "提醒：這支 API 主要是設計給企業做伺服器對伺服器串接的，如果讀取一直失敗並顯示「瀏覽器擋下請求」，代表 LINE 沒有開放瀏覽器直接呼叫，需要改用中介伺服器才能用。"
    );

    const accessKeyInput = el("input", {
      type: "password",
      className: "admin-input",
      placeholder: "貼上 LAP Access Key",
      value: accessKey,
      oninput: (e) => (accessKey = e.target.value.trim()),
    });

    const secretKeyInput = el("input", {
      type: "password",
      className: "admin-input",
      placeholder: "貼上 LAP Secret Key",
      value: secretKey,
      oninput: (e) => (secretKey = e.target.value.trim()),
    });

    const accountInput = el("input", {
      type: "text",
      className: "admin-input",
      placeholder: "廣告帳戶 ID，純數字",
      value: accountId,
      oninput: (e) => (accountId = e.target.value.trim()),
    });

    const saveBtn = el(
      "button",
      {
        type: "button",
        className: "admin-btn",
        onclick: () => {
          localStorage.setItem(ACCESS_KEY_KEY, accessKey);
          localStorage.setItem(SECRET_KEY_KEY, secretKey);
          localStorage.setItem(ACCOUNT_KEY, accountId);
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
          if (!accessKey || !secretKey || !accountId) {
            status.textContent = "";
            alert("請先填入 Access Key、Secret Key 和廣告帳戶 ID");
            return;
          }
          loadBtn.disabled = true;
          status.textContent = "讀取中…";
          resultsBox.innerHTML = "";
          try {
            const [since, until] = dateRangeFor(datePreset);
            const json = await fetchOnlineReport(accessKey, secretKey, accountId, since, until);
            status.textContent = "";
            renderResults(json);
          } catch (err) {
            status.textContent = "";
            resultsBox.innerHTML = "";
            resultsBox.appendChild(el("p", { className: "admin-error" }, err.message || "讀取失敗"));
          } finally {
            loadBtn.disabled = false;
          }
        },
      },
      "讀取廣告數據"
    );

    function renderResults(json) {
      const rows = findRows(json);

      if (!rows.length) {
        resultsBox.appendChild(
          el("p", { className: "admin-field__hint" }, "這個時間範圍內沒有任何廣告成效資料（或回傳格式無法辨識，請展開下方原始回應確認）。")
        );
      } else {
        const stats = METRIC_FIELDS.map((m) => {
          const sum = sumField(rows, m.candidates);
          const value = sum === null ? "—" : m.format === "currency" ? formatCurrency(sum) : formatNumber(sum);
          return statCard(m.label, value);
        });

        const impressions = sumField(rows, METRIC_FIELDS[1].candidates);
        const clicks = sumField(rows, METRIC_FIELDS[2].candidates);
        const cost = sumField(rows, METRIC_FIELDS[0].candidates);
        stats.push(statCard("點擊率 (CTR)", impressions ? ((clicks || 0) / impressions * 100).toFixed(2) + "%" : "—"));
        stats.push(statCard("平均點擊成本 (CPC)", clicks ? formatCurrency((cost || 0) / clicks) : "—"));

        resultsBox.appendChild(el("div", { className: "admin-insights__stats" }, stats));
      }

      const rawDetails = el("details", { className: "admin-insights__raw" }, [
        el("summary", {}, "查看原始回應（欄位對應如果看起來不對，可以從這裡確認實際資料）"),
        el("pre", { className: "admin-insights__raw-pre" }, JSON.stringify(json, null, 2)),
      ]);
      resultsBox.appendChild(rawDetails);
    }

    return el("div", { className: "admin-insights" }, [
      settingsHint,
      el("div", { className: "admin-field-row" }, [accessKeyInput, secretKeyInput]),
      accountInput,
      el("div", { className: "admin-insights__toolbar" }, [saveBtn]),
      presetSelect,
      loadBtn,
      status,
      resultsBox,
    ]);
  }

  return { renderPanel };
})();
