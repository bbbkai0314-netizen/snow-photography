# 任務累積記錄

Append-only。每完成一項重要任務加一筆，用 `task-completion-template.md` 的欄位濃縮成一行。這是 `DASHBOARD.md`「團隊規模」統計的唯一數字來源——手動記錄、誠實可核對，不是自動假統計。

## 格式

```
| 日期 | 任務 | 使用部門／Agent | 產生的新知識（有回寫才填） |
```

## 記錄

| 日期 | 任務 | 使用部門／Agent | 產生的新知識 |
| --- | --- | --- | --- |
| 2026-08-31 | 整理 SnowSurfStudio 專案資料夾，修正 DASHBOARD／SOP 裡的 Agent 名單使其對應真實存在的 12 個 Agent，建立知識庫骨架與 AI HR 招募流程 | AI 主管（主線）；無需外部部門 Agent | `12_Brand_Knowledge/30_Agent_Roster/*`（12 張名冊卡）、`13_SOP_Workflows/ai-hr-capability-gap.md`（含 `legal-risk-agent` 待核准提案） |
| 2026-08-31 | 清理根目錄散落檔案與重複舊 clone；確認 `上班族探索感Landing` 是真實獨立專案（非重複），非重複 | AI 主管（主線）；無需外部部門 Agent | 更新 `10_Skills/README.md` 說明知識文件與 Claude Code skill 的差異 |
| 2026-08-31 | 把 DASHBOARD.md 做成圖示化網頁版，方便 Ellie 閱讀與使用 | AI 主管（主線）；無需外部部門 Agent | 發布 Artifact：SnowSurfStudio 作業儀表板 |
| 2026-08-31 | 收錄 Ellie 提供的固定文章寫作規格（MODE A／B／C），存入 Skills 並接上路由，以後產文章自動套用 | AI 主管（主線）；未來由 `content-agent` 使用 | `10_Skills/Article_Writing_Spec/SKILL.md`；更新 `AGENTS.md`、`10_Skills/README.md`、`content-agent` 名冊卡 |
| 2026-08-31 | 盤點並規劃 6 個 Connector：確認 Cloudflare 已連線（唯讀，找到 `snowsurf-cms-auth` Worker）、確認 Gmail 帳號、規劃 LINE Messaging API 真正串接（尚待 Ellie 部署） | AI 主管（主線）；無需外部部門 Agent | `automation/LINE_SETUP.md`、`automation/gas/line-webhook.gs`；`12_Brand_Knowledge/20_Decisions/20260831-gmail-not-public.md`；更新 3 份 Connector 登錄與 DASHBOARD |
| 2026-08-31 | 確認並接上 Notion（5 個資料庫／頁面，含客戶名單）與 Google Drive（2 個資料夾，含 CRM）範圍；發現 Canva 連線異常需 Ellie 重新授權 | AI 主管（主線）；無需外部部門 Agent | 更新 `Notion.md`、`Google_Drive.md`、`Canva.md`、DASHBOARD |
| 2026-08-31 | 接上 Gmail：確認既有標籤「SnowSurfStudio／待回覆」，排除考試證書／滑雪教練課程／Instagram 帳號異動等誤判內容，並從一批自動預約通知信中用信箱與姓名模式判斷出 1 筆真實客戶（joywu18@gmail.com），連同平台合作信共貼上 2 封；其餘判斷為 Ellie 自我測試表單留下的紀錄，未收入 | AI 主管（主線）；無需外部部門 Agent | 更新 `Gmail.md`、DASHBOARD、Dashboard Artifact |
| 2026-08-31 | 接上 Canva：發現帳號混著接案客戶作品（雪宿民宿、MAIKO、WHITESPACE 等），新建專屬 `SnowSurfStudio` 資料夾並搬入 1 個確認的既有設計，避免關鍵字搜尋碰到其他客戶內容 | AI 主管（主線）；無需外部部門 Agent | 更新 `Canva.md`、DASHBOARD、Dashboard Artifact |
| 2026-08-31 | 查證 Cloudflare Bot Fight Mode／WAF 需求：確認 `snowsurfstudio.net` 註冊商／Nameserver 已是 Cloudflare 但 DNS 未 Proxy，且 Claude 目前串接的是 Developer Platform 工具（Workers/D1/R2/KV），沒有 Zone／DNS／Security API 權限，無法直接開關；已提供操作步驟給 Ellie | AI 主管（主線）；無需外部部門 Agent | 更新 `Cloudflare.md` |
| 2026-08-31 | 帶著 Ellie 在 Cloudflare 後台手動完成：5 筆 DNS 記錄切為 Proxied、確認 SSL 為 Full、開啟 Bot Fight Mode，`snowsurfstudio.net` 正式套用 Cloudflare 邊緣防護 | Ellie 手動操作，AI 主管（主線）逐步引導確認 | 更新 `Cloudflare.md`、DASHBOARD |
| 2026-08-31 | Cloudflare 政策放寬：Developer Platform 資源（Workers/D1/R2/KV）改為可直接讀寫，不用每次先問；付費／升級類操作仍一律要 Ellie 核准；DNS/SSL/WAF/Bot 等 Zone 設定因工具限制維持引導 Ellie 手動操作 | AI 主管（主線） | `12_Brand_Knowledge/20_Decisions/20260831-cloudflare-write-access.md`；更新 `Cloudflare.md` |
| 2026-08-31 | 澄清 LINE webhook 架構誤解（「dashboard 後端」不存在，Dashboard 只是靜態頁面），確認維持 Google Apps Script 方案；在 `LINE_SETUP.md` 加註 Channel Secret 已於對話中曝光，上線前需重發 Channel Access Token，金鑰只透過 Apps Script 輸入框輸入 | AI 主管（主線） | 更新 `LINE_SETUP.md`、`LINE.md` |
| 2026-08-31 | 用 Google Drive 工具直接建立 LINE 詢問記錄 Sheet 並把 ID 填入 `line-webhook.gs`；Ellie 完成 Apps Script 貼碼，更新 Dashboard 反映部署進度（還差 setupProperties_() 與部署兩步） | AI 主管（主線）＋ Ellie | 建立 Google Sheet；更新 `LINE.md`、DASHBOARD、Dashboard Artifact |
| 2026-08-31 | 發現 `line-webhook.gs` 被另一個 AI 工具改過（webhook_key 驗證方式合理但漏產生 key，會導致驗證永遠失敗）；修好 `setupProperties_()` 補上 key 產生與提示，更新 `LINE_SETUP.md` 步驟 5-6 | AI 主管（主線） | 修正 `line-webhook.gs`、`LINE_SETUP.md`、`LINE.md` |
| 2026-09-03 | 網站拍攝方案卡片重排：新增「人生轉場攝影方案」並排第一，改名「滑雪教練＋攝影方案」「一條龍服務方案」，移除「攝影方案」；依 Ellie 回饋兩輪修訂人生轉場文案（拿掉雪地比喻與分手／離婚等負面框架）。另外解答 LINE 後台關鍵字自動回應無反應的原因（Webhook 開啟後與內建自動回應互斥），在 `line-webhook.gs` 加上「1」「2」兩組固定關鍵字自動回覆，作為「不自動回覆」規則的明確例外 | AI 主管（主線）＋ `website-agent` 範疇的程式修改 | 新增 `src/plans/life-transition.md`；更新 `index.njk`、3 份既有 plan 檔；`line-webhook.gs` 加入 `AUTO_REPLY`；`12_Brand_Knowledge/20_Decisions/20260903-line-keyword-autoreply-exception.md`；更新 `LINE.md` |
| 2026-09-05 | 依 Ellie 指示拿掉整個 LINE 自動化串接：移除 `automation/gas/line-webhook.gs`（關鍵字「1」「2」自動回覆＋Google Sheet 詢問記錄）與 `11_MCP_Connectors/LINE.md` Connector 登錄；LINE 訊息回到全人工處理。網站上的 LINE 連結（懸浮按鈕、聯絡圖示、預約完成導向）與預約表單的 LINE ID 欄位依 Ellie 決定保留 | AI 主管（主線） | 刪除 `line-webhook.gs`、`LINE.md`；`20260903-line-keyword-autoreply-exception.md` 註記例外失效；`approval-queue.md` SSS-20260831-002／003 改為 REVOKED |
