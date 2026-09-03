# LINE Connector 登錄

| 欄位 | 設定 |
| --- | --- |
| 狀態 | 部署中（2026-08-31）。Sheet 已建好（[`SnowSurfStudio LINE 詢問記錄`](https://docs.google.com/spreadsheets/d/14yA8x5v2RaY025A7jB4-ErlEmwhDFhiE8RGGEtYseJE/edit)），程式碼已貼上。**過程中 `automation/gas/line-webhook.gs` 被另一個 AI 工具直接改過**（改用 `webhook_key` 網址參數驗證，取代讀不到的 LINE 簽章表頭——方向合理，但漏了在 `setupProperties_()` 產生這組 key，會導致 webhook 永遠驗證失敗）；Claude 已補上這段程式碼並更新 `LINE_SETUP.md`。還差最後兩步：① 執行 `setupProperties_()`（會跳出視窗顯示 `webhook_key`，要記下來）② 部署成網頁應用程式，把「網址＋`?webhook_key=...`」回填到 LINE Webhook URL。**待確認 Ellie 是否同時用其他 AI 工具編輯這個專案**，避免後續改動互相衝突。目前完全沒有可呼叫的 LINE API 工具，全程由 Ellie 操作、Claude 引導。 |
| 用途 | LINE 詢問分流、需求蒐集、預約引導、follow-up 與售後服務。 |
| 資料來源／目的地 | 僅 SnowSurfStudio LINE Official Account；不得使用 MWC 帳號、聊天或名單。 |
| 可讀範圍 | 已明確授權的 SnowSurfStudio 客戶對話與預約資訊。 |
| 可寫範圍 | 回覆草稿、標籤／CRM 建議；正式訊息、報價、預約確認一律不得自動送出。**例外**（2026-09-03 Ellie 核准）：`automation/gas/line-webhook.gs` 的 `AUTO_REPLY` 會對客人傳送的固定關鍵字「1」「2」自動回覆固定罐頭文字（預約表單連結／方案列表），僅限這兩組固定文字，不得擴充為 AI 生成內容。 |
| 預設模式 | 草稿。 |
| Owner 核准 | 外發訊息、報價、預約承諾、推播、名單匯出、權限變更與刪除。 |
| 撤銷方式 | LINE Developers / LINE Official Account Manager 移除 Channel Access Token 或撤銷整合權限。 |

敏感資料：姓名、聯絡方式、旅遊日期、同行者與付款相關資訊；只在完成服務所需範圍使用。
