/**
 * SnowSurfStudio - LINE 詢問記錄 Webhook（記錄 + 兩組固定關鍵字自動回覆）
 *
 * 這支程式做的事：LINE 官方帳號收到訊息 → 記進一個 Google Sheet，方便 Ellie／Claude
 * 之後一起看、判斷分類、寫回覆草稿。除了下面 AUTO_REPLY 定義的「1」「2」兩組固定關鍵字
 * 會自動回覆固定內容之外，其他訊息「不會」自動回覆、不會已讀、不會做任何對外動作——
 * SnowSurfStudio 的規則是：LINE 正式（非固定罐頭訊息的）回覆一律由 Ellie 本人在 LINE
 * 上親自發送，AI 只負責整理與草擬。這兩組關鍵字自動回覆是 2026-09-03 經 Ellie 明確
 * 核准的例外，只能回覆 AUTO_REPLY 裡列出的固定文字，不能擴充成其他自動生成的內容。
 *
 * 部署方式：
 * 1. 建立一個新的 Google Sheet（例如「SnowSurfStudio LINE 詢問記錄」），複製它的 ID。
 * 2. 開啟該 Sheet -> 擴充功能 -> Apps Script，把這個檔案內容貼進去（新建一個 .gs 檔）。
 * 3. 依需求修改下方 CONFIG.SHEET_ID。
 * 4. 執行一次 setupProperties_()（會跳出對話框讓你貼 Channel Secret / Channel Access
 *    Token，存進 Script Properties，不會出現在程式碼或版本控制裡）。
 * 5. 部署 -> 新增部署作業 -> 類型選「網頁應用程式」-> 執行身分「我」、誰能存取「任何人」。
 *    部署完成會拿到一個 Web App URL。
 * 6. 把這個 URL 貼到 LINE Developers Console -> Messaging API -> Webhook URL，按「Verify」。
 * 7. 在 LINE Official Account Manager 的「回應設定」，把「Webhook」打開，
 *    「聊天」「加入好友歡迎訊息」等內建自動回應關閉，避免兩邊互相干擾。
 * 8. 傳一則測試訊息給官方帳號，確認這個 Sheet 有新增一列。
 *
 * 手動測試：執行 testDoPost_() 會用假資料模擬一次事件，不需要真的傳 LINE 訊息。
 */

const CONFIG = {
  SHEET_ID: '14yA8x5v2RaY025A7jB4-ErlEmwhDFhiE8RGGEtYseJE', // SnowSurfStudio LINE 詢問記錄
  SHEET_TAB_NAME: 'LINE 詢問',
};

// 固定關鍵字自動回覆。key 是客人傳來的訊息內容（會先 trim 掉前後空白再比對），
// value 是要回傳的固定文字。要調整文案或新增關鍵字，直接改這裡即可。
const AUTO_REPLY = {
  '1': '我要預約拍攝\n請填寫需求表單，我們收到後會盡快與你確認拍攝日期與細節：\nhttps://forms.gle/sd9qTAxuh2A3K5FF9',
  '2': '目前五種拍攝方案：\nA 人生轉場攝影\nB 陪伴式滑雪 A（2 小時）\nC 陪伴式滑雪 B（5 小時陪滑）\nD 團體滑雪攝影（2–4 人）\nE 滑雪教練＋滑雪攝影\n\n想預約嗎？回覆「1」取得需求表單。',
};

function setupProperties_() {
  const ui = SpreadsheetApp.getUi();
  const secretResp = ui.prompt('貼上 LINE Channel Secret（Basic settings 頁面）：');
  const tokenResp = ui.prompt('貼上 LINE Channel Access Token（Messaging API 頁面，發長效版）：');
  const props = PropertiesService.getScriptProperties();
  props.setProperty('LINE_CHANNEL_SECRET', secretResp.getResponseText().trim());
  props.setProperty('LINE_CHANNEL_ACCESS_TOKEN', tokenResp.getResponseText().trim());

  // doPost(e) 讀不到 X-Line-Signature 表頭，改用網址帶一組高熵 key 驗證來源。
  // 之前這個 key 從沒被實際產生過，導致 verifySignature_() 永遠回傳 false。
  let webhookKey = props.getProperty('LINE_WEBHOOK_KEY');
  if (!webhookKey) {
    webhookKey = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    props.setProperty('LINE_WEBHOOK_KEY', webhookKey);
  }

  ui.alert(
    '設定完成。\n\n' +
    '部署成網頁應用程式、拿到網址之後，回填到 LINE 的 Webhook URL 時，請在網址最後加上：\n\n' +
    '?webhook_key=' + webhookKey + '\n\n' +
    '（這組 key 只會完整顯示這一次；之後要查可以到「專案設定 -> Script Properties」看 LINE_WEBHOOK_KEY。）'
  );
}

function resetWebhookKey_() {
  // 專用於「金鑰已外洩，需要換一組新的」的情況——跟 setupProperties_() 不同，
  // 這個一定會覆蓋掉舊的 key，不會保留。換完之後，Cloudflare Worker 那邊的
  // APPS_SCRIPT_WEBHOOK_KEY 也要同步換成一樣的值，兩邊才對得上。
  const props = PropertiesService.getScriptProperties();
  const webhookKey = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  props.setProperty('LINE_WEBHOOK_KEY', webhookKey);
  SpreadsheetApp.getUi().alert(
    '已換發新的 webhook key（舊的已失效）：\n\n' + webhookKey +
    '\n\n記得同步更新：\n1. Cloudflare Worker 的 APPS_SCRIPT_WEBHOOK_KEY\n' +
    '2. LINE Webhook URL 網址最後的 ?webhook_key= 那一段（如果 LINE 直接指向這支 GAS）'
  );
}

function doPost(e) {
  const props = PropertiesService.getScriptProperties();
  const channelSecret = props.getProperty('LINE_CHANNEL_SECRET');

  if (!verifySignature_(e, channelSecret)) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'signature 驗證失敗' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const body = JSON.parse(e.postData.contents);
  const events = body.events || [];
  const sheet = getSheet_();

  const accessToken = props.getProperty('LINE_CHANNEL_ACCESS_TOKEN');

  events.forEach(function (event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
      return; // 現階段只記錄文字訊息；貼圖／圖片／位置先略過，不影響驗證
    }
    const userId = event.source && event.source.userId ? event.source.userId : '(未知)';
    const profile = fetchProfile_(userId, accessToken);
    const keyword = event.message.text.trim();
    const autoReply = AUTO_REPLY[keyword];

    if (autoReply && event.replyToken) {
      replyText_(event.replyToken, autoReply, accessToken);
    }

    sheet.appendRow([
      new Date(),
      profile.displayName || userId,
      userId,
      event.message.text,
      autoReply ? '已自動回覆（關鍵字「' + keyword + '」）' : '待處理', // 狀態欄，Ellie／Claude 手動改成「已回覆」等
      '', // 回覆草稿欄，留給 Claude 或 Ellie 填
    ]);
  });

  // LINE 平台要求 200 OK 即可，不需要在這裡回任何內容給使用者
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function verifySignature_(e, channelSecret) {
  // Google Apps Script Web App 的 doPost 事件物件不會提供 HTTP headers，
  // 因此無法安全地讀取 LINE 的 X-Line-Signature。改用 Webhook URL 專用的
  // 高熵 key；部署後 URL 必須保留 ?webhook_key=... 這個參數。
  const webhookKey = PropertiesService.getScriptProperties()
    .getProperty('LINE_WEBHOOK_KEY');
  const receivedKey = e && e.parameter && e.parameter.webhook_key;
  return !!channelSecret && !!e.postData && !!webhookKey && receivedKey === webhookKey;
}

function replyText_(replyToken, text, accessToken) {
  if (!accessToken) return;
  try {
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + accessToken },
      payload: JSON.stringify({
        replyToken: replyToken,
        messages: [{ type: 'text', text: text }],
      }),
      muteHttpExceptions: true,
    });
  } catch (err) {
    // 自動回覆失敗不應該擋住 Sheet 記錄，忽略錯誤即可；Ellie 仍可在 Sheet 看到這則訊息。
  }
}

function fetchProfile_(userId, accessToken) {
  if (!accessToken || userId === '(未知)') return {};
  try {
    const resp = UrlFetchApp.fetch('https://api.line.me/v2/bot/profile/' + userId, {
      headers: { Authorization: 'Bearer ' + accessToken },
      muteHttpExceptions: true,
    });
    if (resp.getResponseCode() !== 200) return {};
    return JSON.parse(resp.getContentText());
  } catch (err) {
    return {};
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_TAB_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_TAB_NAME);
    sheet.appendRow(['時間', '暱稱', 'LINE userId', '訊息內容', '狀態', 'AI 回覆草稿']);
  }
  return sheet;
}

function testDoPost_() {
  const fakeEvent = {
    postData: {
      contents: JSON.stringify({
        events: [
          {
            type: 'message',
            message: { type: 'text', text: '你好，想問白馬的滑雪攝影方案' },
            source: { userId: 'TEST_USER' },
          },
        ],
      }),
    },
    parameter: {},
  };
  const result = doPost(fakeEvent);
  Logger.log(result.getContent());
}
