/**
 * SnowSurfStudio 預約管理 API（給後台「預約管理」頁面用）
 *
 * 這個檔案要貼進「跟 booking-confirmation.gs 同一個」Apps Script 專案（同一個表單回覆
 * 試算表的 Apps Script），因為它直接沿用該檔案已經定義好的 CONFIG.RESPONSE_SHEET_ID。
 *
 * 功能：讓網站後台的「預約管理」頁面可以列出、編輯（例如勾選訂金/尾款已收款、填入匯款
 * 後五碼與金額）、刪除試算表裡的預約列——不需要打開 Google 試算表。
 *
 * 部署方式：
 * 1. 在 Apps Script 編輯器左側「檔案」旁的「+」新增一個指令碼檔案，貼上這份內容
 * 2. 上方選單「專案設定」（齒輪圖示）→ 捲到「指令碼屬性」→ 新增屬性：
 *    - 屬性：BOOKING_ADMIN_SECRET
 *    - 值：自己想一組不容易猜到的英數字串（例如一串亂碼），這組字串等一下要貼到網站後台
 * 3. 上方「部署」→「新增部署作業」→ 類型選「網頁應用程式」
 *    - 執行身分：我 (你自己的帳號)
 *    - 誰可以存取：任何人
 *    - 按「部署」，第一次會要求授權，跟著畫面指示允許即可
 * 4. 部署完成後會給一個網址（結尾是 /exec），把這個網址和步驟 2 設定的字串一起貼到
 *    網站後台「預約管理」頁面的設定欄位
 *
 * 之後如果又修改了這個檔案的程式碼，要「部署」→「管理部署作業」→ 編輯現有部署 →
 * 版本選「新版本」→ 部署，網址才會套用新程式碼（單純建立新部署作業會產生新網址）。
 */

function doGet(e) {
  try {
    checkSecret_(e);
    const sheet = SpreadsheetApp.openById(CONFIG.RESPONSE_SHEET_ID).getSheets()[0];
    return jsonOutput_({ ok: true, rows: readAllRows_(sheet) });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    checkSecret_({ parameter: { secret: body.secret } });
    const sheet = SpreadsheetApp.openById(CONFIG.RESPONSE_SHEET_ID).getSheets()[0];

    if (body.action === "update") {
      updateRow_(sheet, body.row, body.values || {});
      return jsonOutput_({ ok: true, rows: readAllRows_(sheet) });
    }
    if (body.action === "delete") {
      sheet.deleteRow(body.row);
      return jsonOutput_({ ok: true, rows: readAllRows_(sheet) });
    }
    return jsonOutput_({ ok: false, error: "未知的 action：" + body.action });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err.message || err) });
  }
}

function checkSecret_(e) {
  const expected = PropertiesService.getScriptProperties().getProperty("BOOKING_ADMIN_SECRET");
  const given = e && e.parameter && e.parameter.secret;
  if (!expected) throw new Error("尚未設定 BOOKING_ADMIN_SECRET，請先到專案設定 → 指令碼屬性新增。");
  if (given !== expected) throw new Error("密鑰錯誤，請確認後台設定的密鑰跟指令碼屬性一致。");
}

// 回傳所有資料列，依標題列的欄名組成物件陣列，並附上這一列在試算表中的實際列號（row），
// 之後編輯/刪除都是用這個列號指定要動哪一筆。
function readAllRows_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map((rowValues, i) => {
    const obj = { row: i + 2 };
    headers.forEach((h, col) => {
      if (!h) return;
      const v = rowValues[col];
      obj[h] = v instanceof Date ? formatDate_(v) : v;
    });
    return obj;
  });
}

function updateRow_(sheet, row, values) {
  if (!row || row < 2) throw new Error("列號不正確");
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  Object.keys(values).forEach((key) => {
    const col = headers.indexOf(key) + 1;
    if (col > 0) sheet.getRange(row, col).setValue(values[key]);
  });
}

function formatDate_(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone() || "Asia/Taipei", "yyyy-MM-dd");
}

// 用 text/plain 輸出（不是 application/json）是刻意的：瀏覽器對 Apps Script 網頁應用程式
// 送 fetch 請求時，如果用 application/json 會觸發 CORS 預檢請求（preflight），而 Apps Script
// 的網頁應用程式不會正確回應預檢請求，導致瀏覽器直接擋下請求。改用 text/plain 不會觸發預檢，
// 內容仍然是合法 JSON 字串，前端收到後自行 JSON.parse 即可。
function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
