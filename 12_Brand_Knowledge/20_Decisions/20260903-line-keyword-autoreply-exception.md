---
date: 2026-09-03
related_approval: —
---

# LINE Webhook 開放兩組固定關鍵字自動回覆，作為「不自動回覆」規則的明確例外

**情境**：Ellie 在 LINE 官方帳號後台設定關鍵字自動回應時發現沒有反應。原因是 `automation/LINE_SETUP.md` 步驟 3 要求開啟 Messaging API Webhook 後關閉 LINE 內建的「自動回應訊息」，因為 LINE 平台一旦開啟 Webhook，兩套系統無法並存。Ellie 確認目前只需要「1」「2」兩組關鍵字自動回覆。

**Ellie 的判斷／修正**：不切回 LINE 內建自動回應（那樣會停用 Webhook，Google Sheet 詢問記錄與 `sales-customer-service-agent` 的分類草稿流程就會失效）。改為直接在 `automation/gas/line-webhook.gs` 裡用 `AUTO_REPLY` 這個固定對照表實作：客人傳「1」回覆預約表單連結，傳「2」回覆四個方案列表。這是對 `11_MCP_Connectors/LINE.md`「正式訊息一律不得自動送出」規則的明確例外核准。

**可重用規則**：這個例外**只涵蓋這兩組寫死在 `AUTO_REPLY` 裡的固定文字**，不代表「LINE 自動回覆」整體解禁。之後如果要新增關鍵字或改成 AI 動態生成回覆內容，都要回來跟 Ellie 確認，不能由 AI 自行擴充 `AUTO_REPLY` 的範圍或邏輯。如果之後需求變複雜（例如很多組關鍵字、需要判斷語意而非完全比對），代表已經超出「固定罐頭訊息」的範疇，應該重新走一次核准，而不是直接加大 `AUTO_REPLY`。

**適用範圍**：只適用 SnowSurfStudio 的 LINE 官方帳號 Webhook（`automation/gas/line-webhook.gs`）。不影響 MWC 或其他任何品牌的訊息串接規則。

---

**2026-09-05 更新：本例外已失效。** Ellie 決定拿掉整個 LINE 自動化串接，`automation/gas/line-webhook.gs` 已從專案移除，`AUTO_REPLY` 的「1」「2」關鍵字自動回覆隨之停止。LINE 訊息回到全人工處理：Ellie 直接在 LINE 上看、自己回，不再有任何自動回覆或 Google Sheet 自動記錄。這份決策保留為歷史紀錄；日後若要重新做 LINE 自動化，要當成全新提案重走一次核准，不能直接沿用這裡的例外。
