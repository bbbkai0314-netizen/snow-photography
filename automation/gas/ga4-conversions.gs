/**
 * SnowSurfStudio｜收款後把「成交」回傳 GA4（Measurement Protocol）
 *
 * 這個檔案要貼進「跟 booking-confirmation.gs 同一個」Apps Script 專案，因為它沿用那邊的
 * CONFIG、MARKER_COLUMNS、PAYMENT_FIELDS、FIELD 與 setStatusCell_()。
 *
 * 做什麼：
 * - 勾「DepositReceived」→ 送 booking_confirmed（成交數）＋ purchase（訂金金額）
 * - 勾「FinalPaymentReceived」→ 送 purchase（尾款金額）
 *   兩筆 purchase 的 transaction_id 不同，所以 GA4 的總收益 = 訂金＋尾款。
 * - 金額取 PaymentAmount 欄（跟寄收款信一樣，勾選前先填好）。
 * - 只送 GA Client ID 與金額、方案名稱，不送姓名、email、LINE 等個資。
 * - 只處理有「GA Client ID」的預約（網站 2026-09 修正後送出的預約才會有）。送過的會在
 *   「GA4 訂金已回傳」「GA4 尾款已回傳」欄位記下時間，不會重複送。
 *
 * 一次性設定：
 * 1. GA4 → 管理 → 資料串流 → 點網站串流 → 「Measurement Protocol API 密鑰」→ 建立，
 *    複製「密鑰值」。
 * 2. Apps Script → 專案設定（齒輪）→ 指令碼屬性 → 新增 GA4_API_SECRET ＝ 剛剛的密鑰值。
 *    密鑰只放在這裡，不要貼進程式碼或聊天。
 * 3. 不用新增觸發器：booking-confirmation.gs 每 10 分鐘跑的 sendPendingPaymentEmails()
 *    會順便呼叫 sendPendingGa4Conversions()。想立刻測試可以手動執行它。
 *
 * 歸因說明：收款通常在網站預約好幾天之後，GA4 只會把 72 小時內的事件併回原本那次造訪，
 * 所以這些事件是用「這位使用者第一次從哪裡來」（首次使用者來源／媒介／廣告活動）歸因。
 */

const GA4 = {
  MEASUREMENT_ID: 'G-H578W2CXH6',
  CLIENT_ID_COLUMN: 'GA Client ID',
  CURRENCY: 'TWD',
  DEPOSIT_STATUS: 'GA4 訂金已回傳',
  FINAL_STATUS: 'GA4 尾款已回傳',
};

function sendPendingGa4Conversions() {
  const secret = PropertiesService.getScriptProperties().getProperty('GA4_API_SECRET');
  if (!secret) return; // 還沒設定密鑰就先不送，不影響寄信流程

  const sheet = SpreadsheetApp.openById(CONFIG.RESPONSE_SHEET_ID).getSheets()[0];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return;

  const headerRow = values[0];
  if (headerRow.indexOf(GA4.CLIENT_ID_COLUMN) === -1) {
    Logger.log('找不到「' + GA4.CLIENT_ID_COLUMN + '」欄，請確認 Google 表單有這一題。');
    return;
  }

  for (let i = 1; i < values.length; i++) {
    const named = {};
    headerRow.forEach((header, col) => { named[header] = values[i][col]; });
    const row = i + 1;
    sendGa4Payment_(sheet, row, named, secret, MARKER_COLUMNS.DEPOSIT_RECEIVED, GA4.DEPOSIT_STATUS, 'deposit');
    sendGa4Payment_(sheet, row, named, secret, MARKER_COLUMNS.FINAL_PAYMENT_RECEIVED, GA4.FINAL_STATUS, 'final');
  }
}

function sendGa4Payment_(sheet, row, named, secret, markerLabel, statusLabel, paymentType) {
  const marker = named[markerLabel];
  const isMarked = marker === true || marker === 'V' || marker === 'v' || marker === '是';
  if (!isMarked || named[statusLabel]) return;

  const clientId = String(named[GA4.CLIENT_ID_COLUMN] || '').trim();
  if (!clientId) {
    // 修正前送出的預約沒有 Client ID，GA4 無法對應到當初的造訪，直接標記略過。
    setStatusCell_(sheet, row, statusLabel, '略過：沒有 GA Client ID');
    return;
  }

  const amount = Number(String(named[PAYMENT_FIELDS.AMOUNT] || '').replace(/[^\d.]/g, '')) || 0;
  const service = String(named[FIELD.SERVICE] || '').trim() || '預約';
  const bookingId = bookingIdFromTimestamp_(named, row);

  const events = [];
  if (paymentType === 'deposit') {
    events.push({ name: 'booking_confirmed', params: { plan_name: service, engagement_time_msec: 1 } });
  }
  if (amount > 0) {
    events.push({
      name: 'purchase',
      params: {
        transaction_id: bookingId + '-' + paymentType,
        value: amount,
        currency: GA4.CURRENCY,
        payment_type: paymentType,
        engagement_time_msec: 1,
        items: [{ item_id: service, item_name: service, price: amount, quantity: 1 }],
      },
    });
  }
  if (!events.length) return; // 尾款沒填金額就沒有可以送的東西，下次補填後再送

  const url = 'https://www.google-analytics.com/mp/collect?measurement_id=' + GA4.MEASUREMENT_ID +
    '&api_secret=' + encodeURIComponent(secret);
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ client_id: clientId, events: events }),
    muteHttpExceptions: true,
  });

  const code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    // 不寫狀態，下一輪（10 分鐘後）會自動重試。
    Logger.log('GA4 回傳失敗 row ' + row + '（' + paymentType + '）：HTTP ' + code);
    return;
  }
  const when = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Taipei', 'yyyy/MM/dd HH:mm');
  setStatusCell_(sheet, row, statusLabel, '已回傳 ' + when + (amount > 0 ? '（NT$' + amount + '）' : '（沒有金額）'));
}

// 用表單的時間戳記（第一欄）當訂單編號：刪除其他列後列號會變，時間戳記不會。
function bookingIdFromTimestamp_(named, row) {
  const firstHeader = Object.keys(named)[0];
  const stamp = named[firstHeader];
  if (stamp instanceof Date) {
    return 'SSS-' + Utilities.formatDate(stamp, 'Asia/Taipei', 'yyyyMMddHHmmss');
  }
  return 'SSS-row' + row;
}
