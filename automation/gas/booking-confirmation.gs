/**
 * SnowSurfStudio 白馬滑雪攝影 - 預約表單自動化
 *
 * 對應表單: https://docs.google.com/forms/d/1djU-idA5iD1SHu1DL9rTkoGg9QnlIYiqMZxS_XRW2Vk
 * 表單欄位: 姓名 / 人數 / 日期 / 地點 / email / line / 想預約的服務 / 其他服務
 *
 * 部署方式:
 * 1. 打開表單回覆的 Google Sheet -> 擴充功能 -> Apps Script
 * 2. 把這個檔案的內容貼到編輯器裡（新建一個 .gs 檔）
 * 3. 依需求修改下方 CONFIG
 * 4. 執行一次 createFormSubmitTrigger()，並依畫面指示授權權限
 *    (需要授權 Gmail、Calendar、Sheets)
 * 5. 執行一次 createEditTrigger()（用於訂金/尾款收款自動通知，見下方說明）
 * 6. 執行一次 createSweepTrigger()（每 10 分鐘自動補寄漏掉的收款通知信）
 * 7. 之後表單每次送出，都會自動跑 onFormSubmit()
 *
 * 手動測試: 執行 testWithLatestRow()，會用試算表最後一列資料模擬跑一次流程，
 * 不需要真的送出表單。
 *
 * 訂金/尾款收款通知設定:
 * 1. Sheet 裡已建好四欄：L「DepositReceived」(核取方塊=訂金已收款)、
 *    M「FinalPaymentReceived」(核取方塊=尾款已收款)、
 *    N「PaymentLast5」(匯款帳號後五碼)、O「PaymentAmount」(匯款金額)
 * 2. 收到匯款、確認無誤後，先把該筆資料的 PaymentLast5、PaymentAmount 填好，
 *    再把 DepositReceived 核取方塊打勾
 * 3. 打勾當下會自動寄出訂金收訖信給客人（內含姓名、匯款金額、匯款帳號後五碼），
 *    並在「訂金信已寄送」欄位（程式會自動新增）標記寄送時間，避免重複寄送
 * 4. 尾款流程相同，勾 FinalPaymentReceived 即可
 *
 * LINE 訊息通知設定（預約完成後，除了 email，也主動發一則 LINE 訊息給客人）:
 * 1. 到 LINE Developers Console（developers.line.biz）建立 Provider，並在底下建立一個
 *    「Messaging API」channel（如果你的 LINE 官方帳號還沒有對應的 channel，也可以直接從
 *    LINE Official Account Manager 的「設定 -> Messaging API」頁面開通，會自動建好）
 * 2. 在該 channel 的「Messaging API」頁籤，找到「Channel access token」，點「Issue」核發一組
 *    長效權杖，複製起來（等一下要貼）
 * 3. 回到這支 Apps Script 專案，執行一次 setLineChannelAccessToken()，會跳出一個輸入框，
 *    把剛剛複製的權杖貼進去。這組權杖只會存在這個 Apps Script 專案的設定裡，不會出現在程式碼中
 * 4. 上方選單「部署 -> 新增部署作業」，類型選「網頁應用程式」，執行身份選「我」，
 *    誰可以存取選「任何人」，部署後複製網址（結尾是 /exec），這是接下來要用的 Webhook 網址
 * 5. 回到同一個 Messaging API channel，往下找到「LIFF」區塊，新增一個 LIFF app：
 *    Endpoint URL 填你的網站首頁完整網址（例如 https://你的網域/）、Size 選「Full」、
 *    Scope 勾選「profile」，建立後複製 LIFF ID（格式像 1234567890-AbcdEfgh）
 * 6. 打開網站原始碼的 src/js/booking-form.js，把最上面的 LIFF_ID 填上第 5 步的 LIFF ID、
 *    LINE_BIND_WEBHOOK_URL 填上第 4 步的網頁應用程式網址，存檔後 push 上去、等網站部署完成
 * 7. 完成以上步驟後：客人送出預約表單、被導去 LINE 時，會自動幫他當下這筆預約跟他的
 *    LINE 帳號綁定，這支 Apps Script 就會主動發一則 LINE 訊息給他（跟確認信內容大同小異）。
 *    Sheet 會自動新增「LineUserId」「LineDisplayName」「LINE訊息狀態」三欄可以看綁定與寄送狀況。
 *    在完成第 6 步之前，網站行為不會有任何改變（客人一樣會被導去 LINE 官方帳號，只是不會自動綁定）。
 * 8. 手動測試：先確認 Sheet 最後一列的「LINE訊息狀態」欄位是空的（不是空的就先手動清空），
 *    到程式碼裡把 testSendLineToLatestRow() 裡的 testUserId 填一個測試用的 userId
 *    （例如你自己帳號的 userId），再執行這個函式——會用最後一列資料模擬送一則 LINE 訊息
 */

const CONFIG = {
  RESPONSE_SHEET_ID: '1SwPaYObdIvF0D-C4wGY1WSqXyiOcTlEKbLTDbJd57y4', // 表單回覆試算表 ID
  CALENDAR_ID: 'primary', // 用預設 Google 日曆；要改成共用日曆就把 ID 貼在這
  STUDIO_NAME: 'SnowSurfStudio 白馬滑雪攝影',
  REPLY_TO: 'bbbkai0314@gmail.com',
  LINE_URL: 'https://lin.ee/xcqRIdT',
  IG_URL: '', // 有 IG 連結的話填在這裡，會出現在信件簽名檔
  DEPOSIT_INFO: '為保留檔期，訂金為 NT$3000，請於收到本信後 3 日內完成匯款，帳號將由專人另行通知。',
  DEPOSIT_RECEIVED_BODY: '感謝您的付款！檔期已為您保留，尾款請於拍攝日前 60 天完成付款，詳細金額與帳號將由專人另行通知。',
  FINAL_PAYMENT_RECEIVED_BODY: '我們已收到您的尾款，感謝您的付款！所有款項皆已結清，期待與您相見。',
  NOTICE: '請自備禦寒衣物與雪具，其他拍攝日相關細節將由專人另行通知。',
  REFUND_POLICY: [
    '❄️ SnowSurfStudio｜滑雪攝影退款規則',
    '',
    '【訂金】',
    '預約時需支付訂金（依方案收取）。',
    '',
    '【尾款】',
    '拍攝日前 60 天需付清尾款。',
    '若預約時距離拍攝日不足 60 天，確認預約後須一次付清全額。',
    '',
    '【取消與退款】',
    '・拍攝日前 90 天（含）以前：全額退款，僅酌收 NT$100 匯款／行政手續費。',
    '・拍攝日前 89～61 天：訂金不予退還；已支付的尾款全額退還。',
    '・拍攝日前 60 天內：恕不退款。',
    '',
    '【其他規定】',
    '・拍攝日前 60 天仍未收到尾款，視同放棄預約，訂單將自動取消，已支付之訂金不予退還。',
    '・因天災、雪場停業或其他不可抗力因素，雙方可協議改期或依實際情況另行處理。',
  ].join('\n'),
};

const FIELD = {
  NAME: '姓名',
  PEOPLE: '人數',
  DATE: '日期',
  LOCATION: '地點',
  EMAIL: 'email',
  LINE: 'line',
  SERVICE: '想預約的服務',
  OTHER_SERVICE: '其他服務',
};

const STATUS_COLUMNS = {
  CALENDAR: '行事曆狀態',
  EMAIL: '確認信狀態',
};

// 這兩欄已經在 Sheet 裡建好、設成核取方塊了（欄名用英文是因為瀏覽器自動化
// 打不出中文，不影響使用——你只需要打勾，不用打字）。
// L 欄 DepositReceived = 訂金已收款；M 欄 FinalPaymentReceived = 尾款已收款
const MARKER_COLUMNS = {
  DEPOSIT_RECEIVED: 'DepositReceived',
  FINAL_PAYMENT_RECEIVED: 'FinalPaymentReceived',
};

const NOTIFY_STATUS_COLUMNS = {
  DEPOSIT_EMAIL: '訂金信已寄送',
  FINAL_EMAIL: '尾款信已寄送',
};

// N 欄 PaymentLast5 = 匯款帳號後五碼；O 欄 PaymentAmount = 匯款金額
// 勾「DepositReceived」之前，先把這兩欄填好（每筆客人的匯款資訊不同，
// 程式沒辦法自動知道，要人工填入）。
const PAYMENT_FIELDS = {
  LAST5: 'PaymentLast5',
  AMOUNT: 'PaymentAmount',
};

// 網站的 LIFF 綁定流程（見 src/js/booking-form.js）送過來的欄位，程式會自動新增這三欄。
const LINE_BIND_COLUMNS = {
  USER_ID: 'LineUserId',
  DISPLAY_NAME: 'LineDisplayName',
  MESSAGE_STATUS: 'LINE訊息狀態',
};

const LINE_CHANNEL_TOKEN_PROPERTY = 'LINE_CHANNEL_ACCESS_TOKEN';

function onSheetEdit(e) {
  const row = e.range.getRow();
  const col = e.range.getColumn();
  if (row === 1) return; // 編輯到標題列，不用理

  const sheet = e.range.getSheet();
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const editedHeader = headerRow[col - 1];

  if (editedHeader === MARKER_COLUMNS.DEPOSIT_RECEIVED) {
    handleMarkerEdit_(sheet, row, headerRow, MARKER_COLUMNS.DEPOSIT_RECEIVED, NOTIFY_STATUS_COLUMNS.DEPOSIT_EMAIL, sendDepositReceivedEmail_);
  } else if (editedHeader === MARKER_COLUMNS.FINAL_PAYMENT_RECEIVED) {
    handleMarkerEdit_(sheet, row, headerRow, MARKER_COLUMNS.FINAL_PAYMENT_RECEIVED, NOTIFY_STATUS_COLUMNS.FINAL_EMAIL, sendFinalPaymentReceivedEmail_);
  }
}

// 保險機制：onEdit 觸發器在短時間內連續編輯時可能會漏接事件，
// 這個函式會整張表掃過一次，把「已打勾但還沒寄信」的都補寄。
// 建議用 createSweepTrigger() 設成每幾分鐘自動跑一次。
function sendPendingPaymentEmails() {
  const sheet = SpreadsheetApp.openById(CONFIG.RESPONSE_SHEET_ID).getSheets()[0];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return;

  const headerRow = values[0];

  for (let i = 1; i < values.length; i++) {
    const row = i + 1;
    handleMarkerEdit_(sheet, row, headerRow, MARKER_COLUMNS.DEPOSIT_RECEIVED, NOTIFY_STATUS_COLUMNS.DEPOSIT_EMAIL, sendDepositReceivedEmail_);
    handleMarkerEdit_(sheet, row, headerRow, MARKER_COLUMNS.FINAL_PAYMENT_RECEIVED, NOTIFY_STATUS_COLUMNS.FINAL_EMAIL, sendFinalPaymentReceivedEmail_);
  }
}

function handleMarkerEdit_(sheet, row, headerRow, markerLabel, statusLabel, sendFn) {
  const markerCol = headerRow.indexOf(markerLabel) + 1;
  const markerValue = sheet.getRange(row, markerCol).getValue();
  const isMarked = markerValue === true || markerValue === 'V' || markerValue === 'v' || markerValue === '是';
  if (!isMarked) return;

  const statusCol = headerRow.indexOf(statusLabel) + 1;
  if (statusCol > 0) {
    const alreadySent = sheet.getRange(row, statusCol).getValue();
    if (alreadySent) return; // 已經寄過了，避免重複寄送
  }

  const rowValues = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const namedValues = {};
  headerRow.forEach((header, i) => {
    namedValues[header] = rowValues[i];
  });

  const name = (namedValues[FIELD.NAME] || '').toString().trim();
  const email = (namedValues[FIELD.EMAIL] || '').toString().trim();
  if (!email) {
    Logger.log('沒有 email，無法寄送: ' + markerLabel + ' row ' + row);
    return;
  }

  try {
    sendFn(name, email, namedValues);
    setStatusCell_(sheet, row, statusLabel, '已寄送 ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm'));
  } catch (err) {
    Logger.log('寄送失敗(' + statusLabel + '): ' + err.message);
    setStatusCell_(sheet, row, statusLabel, '寄送失敗: ' + err.message);
  }
}

function onFormSubmit(e) {
  if (!e || !e.namedValues) {
    throw new Error('找不到表單送出資料，請透過表單送出觸發，或用 testWithLatestRow() 測試。');
  }
  processSubmission_(e.namedValues, e.range);
}

function testWithLatestRow() {
  const sheet = SpreadsheetApp.openById(CONFIG.RESPONSE_SHEET_ID).getSheets()[0];
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const emailCol = headers.indexOf(FIELD.EMAIL);

  // 從下往上找最後一列「真的有填 email」的資料，跳過核取方塊欄位造成的空白列
  // (勾選欄套用到空白列時，Sheets 會把它填成 FALSE，讓那一列看起來像有資料)。
  let lastDataRow = -1;
  for (let i = values.length - 1; i >= 1; i--) {
    if (values[i][emailCol]) {
      lastDataRow = i;
      break;
    }
  }

  if (lastDataRow === -1) {
    Logger.log('Sheet 裡還沒有任何表單回覆資料，請先送一筆表單再測試。');
    return;
  }

  const namedValues = {};
  headers.forEach((header, i) => {
    namedValues[header] = [values[lastDataRow][i]];
  });

  processSubmission_(namedValues, sheet.getRange(lastDataRow + 1, 1));
}

// 網站的 LIFF 綁定流程呼叫的 Webhook：客人送出預約表單、被導去 LINE 時，瀏覽器會把他的
// LINE userId 連同姓名/email 一起 POST 過來，這裡負責把 userId 寫回對應的那一列，
// 並主動發一則 LINE 訊息給他。部署方式見檔案最上方「LINE 訊息通知設定」。
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput('missing body');
    }
    const body = JSON.parse(e.postData.contents);
    const email = (body.email || '').toString().trim();
    const userId = (body.userId || '').toString().trim();
    const displayName = (body.displayName || '').toString().trim();

    if (!email || !userId) {
      return ContentService.createTextOutput('missing email or userId');
    }

    const match = findRowForLineBind_(email);
    if (!match) {
      Logger.log('LINE 綁定找不到對應預約列，email: ' + email);
      return ContentService.createTextOutput('no matching booking row');
    }

    setStatusCell_(match.sheet, match.rowNum, LINE_BIND_COLUMNS.USER_ID, userId);
    if (displayName) {
      setStatusCell_(match.sheet, match.rowNum, LINE_BIND_COLUMNS.DISPLAY_NAME, displayName);
    }
    sendLineBookingConfirmation_(match.sheet, match.rowNum, userId);

    return ContentService.createTextOutput('ok');
  } catch (err) {
    Logger.log('doPost 綁定失敗: ' + err.message);
    return ContentService.createTextOutput('error: ' + err.message);
  }
}

// 找最近一筆「email 相符、還沒綁定過 LineUserId」的資料列。
// 客人送出表單到瀏覽器完成 LIFF 登入導回來會有一點時間差，所以這裡會重試幾次，
// 給 Google 表單把資料寫進 Sheet 的時間。
function findRowForLineBind_(email) {
  const sheet = SpreadsheetApp.openById(CONFIG.RESPONSE_SHEET_ID).getSheets()[0];
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const values = sheet.getDataRange().getValues();
    if (values.length >= 2) {
      const headerRow = values[0];
      const emailCol = headerRow.indexOf(FIELD.EMAIL);
      const userIdCol = headerRow.indexOf(LINE_BIND_COLUMNS.USER_ID);
      for (let i = values.length - 1; i >= 1; i -= 1) {
        const rowEmail = (values[i][emailCol] || '').toString().trim();
        const alreadyBound = userIdCol >= 0 && values[i][userIdCol];
        if (rowEmail === email && !alreadyBound) {
          return { sheet: sheet, rowNum: i + 1 };
        }
      }
    }
    if (attempt < 3) Utilities.sleep(2000);
  }
  return null;
}

// 組出跟確認信同樣資訊的 LINE 文字訊息並推送，寄送狀態寫回 Sheet 避免重複發送。
function sendLineBookingConfirmation_(sheet, rowNum, userId) {
  const statusCol = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].indexOf(LINE_BIND_COLUMNS.MESSAGE_STATUS) + 1;
  if (statusCol > 0 && sheet.getRange(rowNum, statusCol).getValue()) {
    return; // 已經寄過了
  }

  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowValues = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];
  const namedValues = {};
  headerRow.forEach((header, i) => { namedValues[header] = rowValues[i]; });

  const name = (namedValues[FIELD.NAME] || '').toString().trim();
  const dateRaw = (namedValues[FIELD.DATE] || '').toString().trim();
  const location = (namedValues[FIELD.LOCATION] || '').toString().trim();
  const service = (namedValues[FIELD.SERVICE] || '').toString().trim();
  const otherService = (namedValues[FIELD.OTHER_SERVICE] || '').toString().trim();
  const people = (namedValues[FIELD.PEOPLE] || '').toString().trim();
  const serviceLabel = service === '其他' && otherService ? `其他服務（${otherService}）` : service;
  const shootDate = parseDate_(dateRaw);
  const dateLabel = shootDate ? formatDateForDisplay_(shootDate) : dateRaw;

  const text = [
    `${name} 您好，這裡是 ${CONFIG.STUDIO_NAME}！`,
    '已收到您的預約需求：',
    `拍攝日期：${dateLabel}`,
    `地點：${location}`,
    `人數：${people}`,
    `服務項目：${serviceLabel}`,
    '',
    CONFIG.DEPOSIT_INFO,
    '',
    '確認信也已經寄到您填寫的 email，有任何問題都可以直接在這裡回覆我們。',
  ].join('\n');

  try {
    pushLineMessage_(userId, text);
    setStatusCell_(sheet, rowNum, LINE_BIND_COLUMNS.MESSAGE_STATUS, '已寄送 ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm'));
  } catch (err) {
    Logger.log('LINE 訊息寄送失敗: ' + err.message);
    setStatusCell_(sheet, rowNum, LINE_BIND_COLUMNS.MESSAGE_STATUS, '寄送失敗: ' + err.message);
  }
}

// 呼叫 LINE Messaging API 的 push 端點，發一則純文字訊息給指定的 userId。
function pushLineMessage_(userId, text) {
  const token = PropertiesService.getScriptProperties().getProperty(LINE_CHANNEL_TOKEN_PROPERTY);
  if (!token) {
    throw new Error('尚未設定 LINE Channel Access Token，請先執行 setLineChannelAccessToken()。');
  }
  if (!userId) {
    throw new Error('缺少 LINE userId，無法推送訊息。');
  }

  const res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({
      to: userId,
      messages: [{ type: 'text', text: text.slice(0, 5000) }],
    }),
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('LINE 推送失敗（HTTP ' + code + '）：' + res.getContentText());
  }
}

// 執行一次，貼上 LINE Messaging API 的 Channel Access Token（見檔案最上方設定步驟 1-3）。
function setLineChannelAccessToken() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt('設定 LINE Channel Access Token', '貼上剛剛在 LINE Developers Console 核發的 Channel Access Token：', ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() !== ui.Button.OK) {
    Logger.log('已取消。');
    return;
  }
  const token = result.getResponseText().trim();
  if (!token) {
    Logger.log('沒有輸入內容，未儲存。');
    return;
  }
  PropertiesService.getScriptProperties().setProperty(LINE_CHANNEL_TOKEN_PROPERTY, token);
  Logger.log('已儲存 Channel Access Token。');
}

// 手動測試用：拿 Sheet 最後一列資料模擬發一則 LINE 訊息，userId 要自己填一個真的可以測試的帳號
// （例如你自己的 LINE userId，可以先加你的官方帳號好友，再用官方帳號後台的「一對一聊天」查看）。
function testSendLineToLatestRow() {
  const testUserId = ''; // 貼上一個測試用的 userId 再執行
  if (!testUserId) {
    Logger.log('請先在這個函式裡填一個測試用的 userId 再執行。');
    return;
  }
  const sheet = SpreadsheetApp.openById(CONFIG.RESPONSE_SHEET_ID).getSheets()[0];
  const lastRow = sheet.getLastRow();
  sendLineBookingConfirmation_(sheet, lastRow, testUserId);
}

function processSubmission_(namedValues, range) {
  const get = (key) => (namedValues[key] && namedValues[key][0] || '').toString().trim();

  const name = get(FIELD.NAME);
  const email = get(FIELD.EMAIL);
  const lineId = get(FIELD.LINE);
  const people = get(FIELD.PEOPLE);
  const location = get(FIELD.LOCATION);
  const service = get(FIELD.SERVICE);
  const otherService = get(FIELD.OTHER_SERVICE);
  const dateRaw = get(FIELD.DATE);

  if (!email) {
    Logger.log('沒有 email，跳過此筆：' + name);
    return;
  }

  const shootDate = parseDate_(dateRaw);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let calendarStatus = '未建立';
  if (!shootDate) {
    calendarStatus = '日期格式無法辨識，請人工建立（原始輸入："' + dateRaw + '"）';
  } else if (shootDate < today) {
    calendarStatus = '日期是過去的日子，可能填錯年份，請人工確認（原始輸入："' + dateRaw + '"）';
  } else {
    try {
      createCalendarEvent_(name, shootDate, location, service, otherService, people, lineId, email);
      calendarStatus = '已建立';
    } catch (err) {
      calendarStatus = '建立失敗: ' + err.message;
      Logger.log(calendarStatus);
    }
  }

  let emailStatus = '未寄送';
  try {
    sendConfirmationEmail_(name, email, dateRaw, shootDate, location, service, otherService, people);
    emailStatus = '已寄送';
  } catch (err) {
    emailStatus = '寄送失敗: ' + err.message;
    Logger.log(emailStatus);
  }

  try {
    sendOwnerNotification_(name, email, lineId, dateRaw, shootDate, location, service, otherService, people, calendarStatus);
  } catch (err) {
    Logger.log('寄給工作室的通知信失敗: ' + err.message);
  }

  if (range) {
    writeStatusBack_(range, calendarStatus, emailStatus);
  }
}

function createCalendarEvent_(name, shootDate, location, service, otherService, people, lineId, email) {
  const calendar = CONFIG.CALENDAR_ID === 'primary'
    ? CalendarApp.getDefaultCalendar()
    : CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);

  const serviceLabel = service === '其他' && otherService ? `其他(${otherService})` : service;
  const title = `[滑雪攝影預約] ${name} - ${serviceLabel} x${people}人 @${location}`;

  const description = [
    `姓名：${name}`,
    `人數：${people}`,
    `地點：${location}`,
    `服務項目：${serviceLabel}`,
    `Email：${email}`,
    `LINE：${lineId}`,
  ].join('\n');

  calendar.createAllDayEvent(title, shootDate, {
    location: location,
    description: description,
  });
}

function sendConfirmationEmail_(name, email, dateRaw, shootDate, location, service, otherService, people) {
  const serviceLabel = service === '其他' && otherService ? `其他服務（${otherService}）` : service;
  const dateLabel = shootDate ? formatDateForDisplay_(shootDate) : dateRaw;

  const subject = `【${CONFIG.STUDIO_NAME}】預約確認 - ${dateLabel}`;

  const signatureLines = [
    CONFIG.STUDIO_NAME,
    `LINE 官方帳號：${CONFIG.LINE_URL}`,
  ];
  if (CONFIG.IG_URL) signatureLines.push(`Instagram：${CONFIG.IG_URL}`);

  const plainBody = [
    `${name} 您好，`,
    '',
    '感謝您填寫預約表單，以下是您的預約資訊，我們已收到並登記：',
    '',
    `拍攝日期：${dateLabel}`,
    `地點：${location}`,
    `人數：${people}`,
    `服務項目：${serviceLabel}`,
    '',
    '【訂金與付款】',
    CONFIG.DEPOSIT_INFO,
    '',
    '【注意事項】',
    CONFIG.NOTICE,
    '',
    CONFIG.REFUND_POLICY,
    '',
    '若表單資訊有誤或需要調整檔期，歡迎直接透過 LINE 與我們聯繫。',
    '',
    '--',
    ...signatureLines,
  ].join('\n');

  const htmlBody = `
    <div style="font-family: -apple-system, 'PingFang TC', 'Microsoft JhengHei', sans-serif; color:#222; line-height:1.7;">
      <p>${escapeHtml_(name)} 您好，</p>
      <p>感謝您填寫預約表單，以下是您的預約資訊，我們已收到並登記：</p>
      <table style="border-collapse:collapse; margin:12px 0;">
        <tr><td style="padding:4px 12px 4px 0; color:#666;">拍攝日期</td><td><strong>${escapeHtml_(dateLabel)}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#666;">地點</td><td>${escapeHtml_(location)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#666;">人數</td><td>${escapeHtml_(people)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#666;">服務項目</td><td>${escapeHtml_(serviceLabel)}</td></tr>
      </table>
      <p><strong>訂金與付款</strong><br>${escapeHtml_(CONFIG.DEPOSIT_INFO)}</p>
      <p><strong>注意事項</strong><br>${escapeHtml_(CONFIG.NOTICE)}</p>
      <p style="white-space:pre-line; background:#f7f7f7; padding:12px 16px; border-radius:8px;">${escapeHtml_(CONFIG.REFUND_POLICY)}</p>
      <p>若表單資訊有誤或需要調整檔期，歡迎直接透過 LINE 與我們聯繫。</p>
      <p style="color:#666; margin-top:24px;">
        --<br>
        ${escapeHtml_(CONFIG.STUDIO_NAME)}<br>
        LINE 官方帳號：<a href="${CONFIG.LINE_URL}">${CONFIG.LINE_URL}</a>
        ${CONFIG.IG_URL ? `<br>Instagram：<a href="${CONFIG.IG_URL}">${CONFIG.IG_URL}</a>` : ''}
      </p>
    </div>
  `;

  GmailApp.sendEmail(email, subject, plainBody, {
    htmlBody: htmlBody,
    replyTo: CONFIG.REPLY_TO,
    name: CONFIG.STUDIO_NAME,
  });
}

function sendOwnerNotification_(name, email, lineId, dateRaw, shootDate, location, service, otherService, people, calendarStatus) {
  const serviceLabel = service === '其他' && otherService ? `其他服務（${otherService}）` : service;
  const dateLabel = shootDate ? formatDateForDisplay_(shootDate) : dateRaw;

  const subject = `【新預約通知】${name} - ${dateLabel}`;

  const body = [
    '有新的預約表單送出：',
    '',
    `姓名：${name}`,
    `拍攝日期：${dateLabel}`,
    `地點：${location}`,
    `人數：${people}`,
    `服務項目：${serviceLabel}`,
    `Email：${email}`,
    `LINE：${lineId}`,
    `行事曆狀態：${calendarStatus}`,
  ].join('\n');

  GmailApp.sendEmail(CONFIG.REPLY_TO, subject, body);
}

function sendDepositReceivedEmail_(name, email, namedValues) {
  const amount = (namedValues[PAYMENT_FIELDS.AMOUNT] || '').toString().trim();
  const last5 = (namedValues[PAYMENT_FIELDS.LAST5] || '').toString().trim();

  const subject = `【${CONFIG.STUDIO_NAME}】訂金收訖通知`;
  const body = [
    `${name} 您好，`,
    '',
    '我們已收到您的訂金匯款，確認資訊如下：',
    '',
    `預約姓名：${name}`,
    `匯款金額：${amount}`,
    `匯款帳號後五碼：${last5}`,
    '',
    CONFIG.DEPOSIT_RECEIVED_BODY,
    '',
    '若有任何問題，歡迎直接透過 LINE 與我們聯繫。',
    '',
    '--',
    CONFIG.STUDIO_NAME,
    `LINE 官方帳號：${CONFIG.LINE_URL}`,
  ].join('\n');

  GmailApp.sendEmail(email, subject, body, { replyTo: CONFIG.REPLY_TO, name: CONFIG.STUDIO_NAME });
}

function sendFinalPaymentReceivedEmail_(name, email, namedValues) {
  const amount = (namedValues[PAYMENT_FIELDS.AMOUNT] || '').toString().trim();
  const last5 = (namedValues[PAYMENT_FIELDS.LAST5] || '').toString().trim();

  const subject = `【${CONFIG.STUDIO_NAME}】尾款收訖通知`;
  const body = [
    `${name} 您好，`,
    '',
    '我們已收到您的尾款匯款，確認資訊如下：',
    '',
    `預約姓名：${name}`,
    `匯款金額：${amount}`,
    `匯款帳號後五碼：${last5}`,
    '',
    CONFIG.FINAL_PAYMENT_RECEIVED_BODY,
    '',
    '若有任何問題，歡迎直接透過 LINE 與我們聯繫。',
    '',
    '--',
    CONFIG.STUDIO_NAME,
    `LINE 官方帳號：${CONFIG.LINE_URL}`,
  ].join('\n');

  GmailApp.sendEmail(email, subject, body, { replyTo: CONFIG.REPLY_TO, name: CONFIG.STUDIO_NAME });
}

function writeStatusBack_(range, calendarStatus, emailStatus) {
  const sheet = range.getSheet();
  const row = range.getRow();

  setStatusCell_(sheet, row, STATUS_COLUMNS.CALENDAR, calendarStatus);
  setStatusCell_(sheet, row, STATUS_COLUMNS.EMAIL, emailStatus);
}

function setStatusCell_(sheet, row, label, value) {
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  let col = headerRow.indexOf(label) + 1;
  if (col === 0) {
    col = sheet.getLastColumn() + 1;
    sheet.getRange(1, col).setValue(label);
  }
  sheet.getRange(row, col).setValue(value);
}

function parseDate_(raw) {
  if (!raw) return null;

  // 原生「日期」題型回傳的是標準日期格式，JS 看得懂，直接解析即可。
  const direct = new Date(raw);
  if (!isNaN(direct.getTime())) return direct;

  // 舊資料／手打文字格式的容錯：轉換中文年月日、全形數字等。
  const fullWidthToHalf = raw.replace(/[０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0)
  );

  const normalized = fullWidthToHalf
    .trim()
    .replace(/[年.]/g, '-')
    .replace(/月/g, '-')
    .replace(/[日號]/g, '')
    .replace(/\s+/g, '');

  let candidate = normalized;
  if (/^\d{1,2}-\d{1,2}$/.test(normalized)) {
    const currentYear = new Date().getFullYear();
    candidate = `${currentYear}-${normalized}`;
  }

  const parsed = new Date(candidate);
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatDateForDisplay_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy/MM/dd (EEE)');
}

function escapeHtml_(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createFormSubmitTrigger() {
  const sheet = SpreadsheetApp.openById(CONFIG.RESPONSE_SHEET_ID);
  const existing = ScriptApp.getProjectTriggers().some(
    (t) => t.getHandlerFunction() === 'onFormSubmit'
  );
  if (existing) {
    Logger.log('觸發器已存在，不用重複建立。');
    return;
  }
  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(sheet)
    .onFormSubmit()
    .create();
  Logger.log('已建立 onFormSubmit 觸發器。');
}

function createEditTrigger() {
  const sheet = SpreadsheetApp.openById(CONFIG.RESPONSE_SHEET_ID);
  const existing = ScriptApp.getProjectTriggers().some(
    (t) => t.getHandlerFunction() === 'onSheetEdit'
  );
  if (existing) {
    Logger.log('觸發器已存在，不用重複建立。');
    return;
  }
  ScriptApp.newTrigger('onSheetEdit')
    .forSpreadsheet(sheet)
    .onEdit()
    .create();
  Logger.log('已建立 onSheetEdit 觸發器。');
}

function createSweepTrigger() {
  const existing = ScriptApp.getProjectTriggers().some(
    (t) => t.getHandlerFunction() === 'sendPendingPaymentEmails'
  );
  if (existing) {
    Logger.log('觸發器已存在，不用重複建立。');
    return;
  }
  ScriptApp.newTrigger('sendPendingPaymentEmails')
    .timeBased()
    .everyMinutes(10)
    .create();
  Logger.log('已建立 sendPendingPaymentEmails 定時觸發器（每 10 分鐘）。');
}

function checkAccount() {
  Logger.log('執行帳號: ' + Session.getEffectiveUser().getEmail());
  const cal = CalendarApp.getDefaultCalendar();
  Logger.log('預設日曆名稱: ' + cal.getName());
  Logger.log('預設日曆 ID: ' + cal.getId());

  const testEvent = cal.createAllDayEvent(
    '[測試事件-可刪除] booking script 帳號檢查',
    new Date()
  );
  Logger.log('已建立測試事件，日期: ' + testEvent.getStartTime());
}
