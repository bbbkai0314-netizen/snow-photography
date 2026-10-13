# GTM 容器修復清單（GTM-M5MVCP2M）

> 2026-09-09 診斷。網站程式碼沒有問題，問題全部在 GTM 後台容器裡。
> 本文是「要在 GTM 後台補回什麼」的完整規格，照著建即可，不需要改網站。

## 診斷結果

抓取線上已發布的容器（`https://www.googletagmanager.com/gtm.js?id=GTM-M5MVCP2M`，版本 8）解析後：

| 項目 | 狀況 |
| --- | --- |
| 網站是否載入 GTM | ✅ 全站每一頁都有（首頁、about、gallery、booking、faq、news、partners、policies、life-chapters、blog、文章、5 個方案頁） |
| GA4 設定標記（G-H578W2CXH6） | ✅ 容器內存在，在 `gtm.js` 觸發 |
| Google Ads 設定標記（AW-18359584407） | ✅ 容器內存在 |
| **自訂事件觸發條件** | ❌ **一個都沒有** |
| **自訂事件的 GA4 事件標記** | ❌ **一個都沒有** |
| **自訂參數的資料層變數** | ❌ **一個都沒有** |

容器裡目前只有 6 條規則，全部建立在 GTM 內建監聽（`gtm.js` / `gtm.init` / `gtm.load` / `gtm.linkClick` / `gtm.scrollDepth`）之上，沒有任何一條比對 `line_click`、`booking_click` 這類自訂事件名稱。

### 為什麼資料會「不見」

`#18`（`e085fdc` Replace direct GA4/Google Ads gtag.js with Google Tag Manager）把網站從 gtag.js 直送 GA4 改成走 GTM。改完之後：

- 網站端照舊把事件推進 `window.dataLayer`（`src/js/tracking.js`、`script.js`、`booking-form.js`）；
- 但容器裡沒有人接這些事件 → **GA4 一筆都收不到**。

也就是說事件不是壞掉，是推進 dataLayer 之後停在那裡沒有標記把它送出去。在 GTM 預覽模式看得到事件在左側時間軸跳出來，但每個都是「No tags fired」。

### 另外兩個容器內的既有問題

1. **事件名稱用了 `{{Click Text}}`**：容器裡唯一那個 GA4 事件標記，事件名稱欄位直接綁 Click Text 變數，實際送出的名稱會是「LINE ↗」。GA4 不接受含空格與非 ASCII 字元的事件名稱，這個事件在 GA4 幾乎必定被丟掉。`src/js/tracking.js` 的註解已經記錄過同一個坑（中文事件名被 GA4 靜默丟棄，`276a168` 為此改回英文），GTM 裡要用同一套規則：**事件名稱一律寫死英文 snake_case**。
2. **捲動可能重複計算**：容器啟用了 GTM 內建捲動監聽並送 `scroll` 事件，而網站 `tracking.js` 也自己推 `scroll_depth`。兩邊都接會變成雙倍。建議二選一，下方清單採用網站端的 `scroll_depth`（它有 25/50/75/90 的補跳邏輯），並停用容器內建那顆。

---

## 要補的東西（照這個順序建）

### 1. 資料層變數（Variables → New → Data Layer Variable）

版本一律選 Version 2，變數名稱建議加 `DLV -` 前綴。

| 資料層變數名稱 | 用途 |
| --- | --- |
| `source` | LINE／預約按鈕的位置來源 |
| `plan_name` | 方案名稱（select_plan） |
| `service_value` | 方案對應的價值 |
| `plan` | 方案名稱（booking_start / booking_submit） |
| `content_name` | 文章／方案頁名稱 |
| `content_category` | 內容分類 |
| `section_label` | 首頁區塊中文標籤 |
| `percent` | 捲動百分比 |
| `location` | 預約地點 |
| `people` | 預約人數 |
| `session_id` | 瀏覽階段 ID |
| `step` | 階段內第幾頁 |
| `page_path` | 當前路徑 |
| `is_entry_page` | 是否為進站頁 |
| `entry_referrer` | 進站來源 |
| `path_so_far` | 到目前為止的瀏覽路徑 |
| `utm_source` | 來源 |
| `utm_medium` | 媒介 |
| `utm_campaign` | 活動 |
| `utm_content` | 素材 |

### 2. 觸發條件（Triggers → New → Custom Event）

事件名稱要**完全比對**，不要用「包含」（`view_section_` 那條除外）。

| 觸發條件名稱 | 類型 | 事件名稱 |
| --- | --- | --- |
| CE - line_click | Custom Event | `line_click` |
| CE - booking_click | Custom Event | `booking_click` |
| CE - select_plan | Custom Event | `select_plan` |
| CE - booking_start | Custom Event | `booking_start` |
| CE - booking_submit | Custom Event | `booking_submit` |
| CE - booking_complete | Custom Event | `booking_complete` |
| CE - view_article | Custom Event | `view_article` |
| CE - scroll_depth | Custom Event | `scroll_depth` |
| CE - session_path_step | Custom Event | `session_path_step` |
| CE - view_section | Custom Event（使用規則運算式比對） | `^view_section_` |

### 3. GA4 事件標記（Tags → New → Google Analytics: GA4 Event）

每個標記的 Measurement ID 都選既有的 `G-H578W2CXH6` 設定標記。事件名稱欄位**手動輸入英文字串，不要綁變數**。

| 標記名稱 | 事件名稱 | 事件參數 | 觸發條件 |
| --- | --- | --- | --- |
| GA4 - line_click | `line_click` | source | CE - line_click |
| GA4 - booking_click | `booking_click` | source | CE - booking_click |
| GA4 - select_plan | `select_plan` | plan_name, service_value | CE - select_plan |
| GA4 - booking_start | `booking_start` | plan | CE - booking_start |
| GA4 - booking_submit | `booking_submit` | plan, location, people | CE - booking_submit |
| GA4 - booking_complete | `booking_complete` | （無） | CE - booking_complete |
| GA4 - view_article | `view_article` | content_name, content_category | CE - view_article |
| GA4 - scroll_depth | `scroll_depth` | percent | CE - scroll_depth |
| GA4 - session_path_step | `session_path_step` | session_id, step, page_path, is_entry_page, entry_referrer, path_so_far | CE - session_path_step |
| GA4 - view_section | `{{Event}}`（此處綁事件名變數是安全的，因為名稱本身已是英文 snake_case） | section_label | CE - view_section |

**所有標記都額外加上這 5 個共同參數**：`utm_source`、`utm_medium`、`utm_campaign`、`utm_content`、`session_id`。網站每一次 push 都會帶這些欄位（見 `src/js/tracking.js` 的 `fireGaEvent()`），沒接就等於丟掉廣告歸因。

### 4. Google Ads 轉換標記

`#18` 把原本寫死在 JS 裡的 Google Ads 轉換拿掉了（`src/js/tracking.js` 第 20-22 行的註解有記錄），改由 GTM 負責：

- 標記類型：Google Ads Conversion Tracking
- Conversion ID / Label：`AW-18359584407` / `xG5WCKHCsO0cEJeNxLJE`
- 觸發條件：**CE - line_click**（不要用現有那條靠 Click URL 含 `lin` 的連結點擊觸發，`tracking.js` 已經做完 LINE vs 預約的優先序判斷，用它才不會重複計算）

### 5. 收尾

1. 停用容器內建的捲動深度監聽與那顆送 `scroll` 的 GA4 標記（避免與 `scroll_depth` 重複）。
2. 把事件名稱綁 `{{Click Text}}` 的舊 GA4 標記停用或刪除。
3. 用「預覽」模式跑一次：首頁捲到底、點浮動 LINE 按鈕、點方案、走完預約流程，確認每個事件都有標記 fired。
4. 發布容器，並在 GA4「即時」報表確認事件進來。
5. GA4 → 管理 → 自訂定義，把 `source`、`plan_name`、`section_label`、`content_name`、`percent`、`path_so_far`、`utm_*` 註冊成自訂維度，否則參數收得到但報表上看不到。

## 待辦（需 Ellie 在 GTM／GA4 後台操作）

以上全部無法由程式碼完成，也無法由 Claude 代為操作（沒有 GTM／GA4 API 權限）。網站端要做的只有一項，已在本次修改完成：方案頁補上 GTM noscript iframe。

## 附註：預約表單的 client_id

`src/js/booking-form.js` 的 `getGaClientId()` 靠 `gtag('get', 'G-H578W2CXH6', 'client_id')` 讀取 GA4 client_id，寫進預約表單，供 Apps Script 之後用 Measurement Protocol 回送 `booking_confirmed` / `purchase`。GTM 的 Google 代碼載入後會自己掛上 `window.gtag`，所以只要 GA4 設定標記正常觸發就會有值；目前設定標記是有的，這條應該正常。修完上面清單後，順手確認一次表單送出的 client_id 欄位不是空字串。
