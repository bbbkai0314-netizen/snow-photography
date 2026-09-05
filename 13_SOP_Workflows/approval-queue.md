# Owner Approval Queue

> 所有正式發布、寄信、廣告、報價、收款、調價、網站上線、合約、權限異動與刪除，先在此建立項目。不得用「已產草稿」視為已核准。

| ID | 類型 | 摘要／版本 | 風險檢查 | 狀態 | Ellie 核准紀錄 | 執行結果 |
| --- | --- | --- | --- | --- | --- | --- |
| SSS-20260829-001 | Website | 「給每天努力生活的你」一頁式行銷網站 v1 | Brand / Risk / CTA / SEO 已完成草稿 QA；無價格、無預約或對外連結 | WAITING FOR OWNER APPROVAL | — | 尚未部署 |
| SSS-20260831-002 | LINE / Access | `SnowSurfStudio｜LINE 詢問 Webhook` Web App v1 | 只記錄文字訊息；Channel Secret、Access Token 與專屬 webhook key 均為指令碼屬性；公開端點要求 webhook key | REVOKED | 2026-08-31：Ellie 核准以 Ellie 身分、任何人可存取公開部署。2026-09-05：Ellie 指示拿掉整個 LINE 自動化串接。 | 2026-09-05 已撤除：`automation/gas/line-webhook.gs` 自專案移除；Apps Script Web App 與 LINE Webhook 待 Ellie 於後台停用。 |
| SSS-20260831-003 | LINE / Access | `snowsurf-line-webhook-proxy` Cloudflare Worker v1 | 公開 Worker 驗證 LINE 簽章、轉送至既有 Apps Script，並直接回應 200；機密設定為 Worker secrets | REVOKED | 2026-08-31：Ellie 明確指示「你幫我用」，同意建立、公開部署、回填、Verify 與開啟此 LINE Webhook proxy。2026-09-05：Ellie 指示拿掉整個 LINE 自動化串接。 | 2026-09-05 已撤除：轉送目標已不存在；Worker 與其 secrets 待 Ellie 於 Cloudflare 後台刪除。 |
| SSS-20260901-004 | Website | 首頁 LIFE CHAPTERS 圖文更新＋〈情侶滑雪不吵架攻略〉 | Brand / CTA / SEO / 手機段落排版已完成；無價格、無表單規則異動 | APPROVED | 2026-09-01：Ellie 明確指示「commit部署吧」。 | 待執行 |
| SSS-20260901-005 | Website | 〈情侶滑雪不吵架攻略〉精簡開頭版 | Brand / CTA / SEO 已沿用已上線版本；刪除 3 段導言，無價格、無表單規則異動 | APPROVED | 2026-09-01：Ellie 明確指示「部署吧。上線吧」。 | 待執行 |

ID: SSS-20260829-001
類型: Website
商業目標與 KPI: 將「上班族重新找回探索感」內容轉換為 SnowSurfStudio 的情緒型入口頁；後續可觀察 CTA 點擊與諮詢轉換。
版本／素材連結: `09_Automation_Tech/Repositories/上班族探索感Landing`；僅使用 Ellie 提供的「上班族輪播貼文」圖片與文案來源。
影響範圍與不可逆性: 正式網站部署與公開可見。
Brand / Risk / CTA / SEO QA: 全繁中；沿用深藍／雪青／日出暖色；無價格、無表單／追蹤器；網站 metadata 已建立。CTA 目前為草稿用途，正式寄信入口需於核准時一併確認。
狀態: WAITING FOR OWNER APPROVAL
Ellie 核准: [日期、明確核准的版本與範圍]
執行結果與數據: 尚未部署。
Knowledge 回寫判斷: 待上線與數據累積後再評估。

---

ID: SSS-20260831-002
類型: LINE / Access
商業目標與 KPI: 將 SnowSurfStudio LINE 官方帳號的文字詢問安全記錄到指定 Google Sheet；驗收為 LINE Verify 成功且測試訊息新增一列。
版本／素材連結: Apps Script `SnowSurfStudio｜LINE 詢問 Webhook`（ID: `1gCfKVpZBKbDfabRlHxiTHScBozCTnQK-Iy-KorwselPzSgayWce5m8Au`）；程式來源 `automation/gas/line-webhook.gs`。
影響範圍與不可逆性: 建立公開可存取的 Apps Script Web App；Webhook URL 將回填 LINE Developers Console。
Brand / Risk / CTA / SEO QA: 僅記錄文字訊息，不自動回覆或已讀。Access Token、Channel Secret 與 `LINE_WEBHOOK_KEY` 存於指令碼屬性；URL 必須包含 webhook key。
狀態: REVOKED（2026-09-05 Ellie 指示拿掉整個 LINE 自動化串接）
Ellie 核准: 2026-08-31，明確核准「以 Ellie 身分、任何人可存取公開部署」。
執行結果與數據: 已確認既有 Web App URL；2026-08-31 已輪替 `LINE_WEBHOOK_KEY`（新值僅用於受控設定，不記錄於本檔）。LINE Verify 已成功。手機測試已新增一列到 `LINE 詢問`；暱稱欄回退為 LINE user ID，表示 GAS 的 Channel Access Token 仍未成功取得 Profile，待重新核對／寫入新 token 後複測。 2026-09-05 已撤除：`automation/gas/line-webhook.gs` 自專案移除；待 Ellie 停用 Apps Script Web App 部署、撤銷 LINE Channel Access Token，Google Sheet「LINE 詢問記錄」保留為歷史資料。
Knowledge 回寫判斷: 待驗收後評估。

---

ID: SSS-20260901-005
類型: Website
商業目標與 KPI: 以更精簡的文章開頭提升閱讀進入速度；維持 Journal 閱讀與拍攝方案 CTA 導流。
版本／素材連結: commit `e8d8d7b`（〈情侶滑雪不吵架攻略〉刪除開頭 3 段文字）。
影響範圍與不可逆性: Git commit 推送至 `main` 後，GitHub Pages 會自動公開部署網站。
Brand / Risk / CTA / SEO QA: 全繁中；保留已核准的文章標題、配圖、SEO metadata 與 CTA；僅精簡正文導言。
狀態: APPROVED
Ellie 核准: 2026-09-01，明確指示「部署吧。上線吧」。
執行結果與數據: 2026-09-01 已推送 commit `e8d8d7b`（文章精簡）與 `8289788`（核准紀錄）至 `main`；GitHub Pages workflow `33465447737` 已成功完成部署。
Knowledge 回寫判斷: 待部署驗收後評估。

---

ID: SSS-20260901-004
類型: Website
商業目標與 KPI: 以情侶滑雪相處攻略吸引自然搜尋與 Journal 閱讀，並透過拍照痛點與自然旅拍 CTA 引導預約頁；首頁同步維持 LIFE CHAPTERS 敘事入口。
版本／素材連結: `src/posts/couple-ski-trip-no-fighting.md`、`src/images/couple-ski-trip-memories.png`、文章標題換行版型 `src/_includes/article.njk`／`src/css/style.css`。
影響範圍與不可逆性: Git commit 推送至 `main` 後，GitHub Pages 會自動公開部署網站。
Brand / Risk / CTA / SEO QA: 全繁中；文章採情緒共鳴＋實用攻略排版；使用 Ellie 桌面 `伴侶/1.png` 素材；SEO 標題、描述、關鍵字及 article metadata 已建立；無價格、付款、預約規則異動。
狀態: APPROVED
Ellie 核准: 2026-09-01，明確指示「commit部署吧」。範圍為目前首頁圖文與新增文章版本。
執行結果與數據: 2026-09-01 已提交 `389a515`（`Add couple ski trip guide`）並推送至 `main`；GitHub Pages workflow `33464485930` 已成功完成部署。
Knowledge 回寫判斷: 已記錄長文手機段落規則；發布後待觀察文章流量、預約 CTA 點擊與相關詢問。

---

ID: SSS-20260831-003
類型: LINE / Access
商業目標與 KPI: 讓 LINE Webhook Verify 成功，並將文字詢問安全轉送至既有 Google Sheet 記錄流程；驗收為 Verify 200 與測試訊息新增一列。
版本／素材連結: `automation/line-webhook-worker.js`；名稱 `snowsurf-line-webhook-proxy`。
影響範圍與不可逆性: 新建公開 Cloudflare Worker、設定 Worker secrets、LINE Webhook URL 回填、Verify 與啟用。
Brand / Risk / CTA / SEO QA: Worker 僅處理 LINE Webhook；以 LINE 簽章驗證來源；Channel Secret、Apps Script URL、Apps Script webhook key 均作為 Cloudflare secrets，不寫入程式碼、Git 或文件。
狀態: REVOKED（2026-09-05 Ellie 指示拿掉整個 LINE 自動化串接）
Ellie 核准: 2026-08-31，明確指示「你幫我用」，同意建立、公開部署、回填、Verify 與開啟此 LINE Webhook proxy。
執行結果與數據: 2026-08-31 已移除 3 個明文變數，並以同名 Cloudflare Worker secrets 重新建立：`LINE_CHANNEL_SECRET`、`APPS_SCRIPT_URL`、`APPS_SCRIPT_WEBHOOK_KEY`；重新載入確認三者皆顯示為加密。LINE Webhook URL 已回填為 Worker URL、Verify 成功且 Use webhook 已啟用；Official Account 已改為手動聊天，加入好友歡迎訊息依 Ellie 最新指示維持啟用。手機實測已寫入 Sheet，但暱稱仍回退為 user ID，待修正 GAS Access Token 後複測。 2026-09-05 已撤除：轉送目標 Apps Script 已從專案移除，此 Worker 不再有用途；待 Ellie 於 Cloudflare 後台刪除 `snowsurf-line-webhook-proxy` 與其 secrets，並在 LINE Developers Console 關閉 Use webhook、清空 Webhook URL。
Knowledge 回寫判斷: 待驗收後評估。

## 建立項目格式

```text
ID: SSS-YYYYMMDD-001
類型: Website / IG / Facebook / Email / LINE / Ad / Quote / Payment / Price / Contract / Access / Deletion
商業目標與 KPI:
版本／素材連結:
影響範圍與不可逆性:
Brand / Risk / CTA / SEO QA:
狀態: WAITING FOR OWNER APPROVAL
Ellie 核准: [日期、明確核准的版本與範圍]
執行結果與數據:
Knowledge 回寫判斷:
```
