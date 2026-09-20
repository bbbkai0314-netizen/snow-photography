# Owner Approval Queue

> 所有正式發布、寄信、廣告、報價、收款、調價、網站上線、合約、權限異動與刪除，先在此建立項目。不得用「已產草稿」視為已核准。

| ID | 類型 | 摘要／版本 | 風險檢查 | 狀態 | Ellie 核准紀錄 | 執行結果 |
| --- | --- | --- | --- | --- | --- | --- |
| SSS-20260920-041 | Website | 9/21 B2 長文〈一張好看的滑雪照，是怎麼拍出來的？拍攝前先安排好這五件事〉；網站稿 `src/posts/how-to-photograph-ski-action.md`，來源 `04_Content/drafts/2026-09-21-b2-ski-photo/article.md` SHA-256 `63256ee0bd2ded71a52683b4009696db5ed0b6b88cbe3e6e67c29e1cbd9375af`；僅網站文章，不含 FB／IG／Threads | Nikon 與 FIS 原始來源已核對；網站模板轉換、SEO、圖片載入與本機建置通過；採網站既有雪道照片，正文不宣稱品牌實拍案例；先前獨特性 8／10 的缺口仍存在，由 Ellie 決定先上線此版 | APPROVED | 2026-09-20 Ellie：「我改好了，你確認一下版本，就可以上線我的網站。」後補充「我重新更新了文章。以這個內容為主」。核准以上述最新檔案為準的網站文章上線，不含社群發布 | 待推送與正式頁面驗證 |
| SSS-20260919-034 | Website | P3 修正為板在前、人物跳起張手，攝影師抓拍離地瞬間；同步前言與清單 | 建置通過；保留原六張示意圖；補起跳與落地空間說明 | APPROVED | 2026-09-19 Ellie 在官網檢查時要求修正P3，明確說明需叫人跳起並由攝影師捕捉 | 執行中 |
| SSS-20260919-033 | Website | 六個新手滑雪拍照姿勢，第五版＋品牌SEO修正；六張白衣女性AI動作示意圖 | 已驗證建置、手機排版、圖片、SEO與來源；內部評分7.5／9／8.5，Ellie 明確要求先上線檢查 | APPROVED | 2026-09-19 Ellie：「你先把文章放到我的官網上面。然後圖片要用剛剛的示意圖。我先檢查一下。」核准目前版本先發布官網供檢查，不含社群發布。 | 執行中；頁面 /blog/ski-beginner-photo-tutorial-6-poses.html |
| SSS-20260829-001 | Website | 「給每天努力生活的你」一頁式行銷網站 v1 | Brand / Risk / CTA / SEO 已完成草稿 QA；無價格、無預約或對外連結 | CANCELLED | 2026-09-05：Ellie 表示這個案子不做了。 | 未部署即取消，草稿保留於原專案資料夾 |
| SSS-20260831-002 | LINE / Access | `SnowSurfStudio｜LINE 詢問 Webhook` Web App v1 | 只記錄文字訊息；Channel Secret、Access Token 與專屬 webhook key 均為指令碼屬性；公開端點要求 webhook key | REVOKED | 2026-08-31：Ellie 核准以 Ellie 身分、任何人可存取公開部署。2026-09-05：Ellie 指示拿掉整個 LINE 自動化串接。 | 2026-09-05 已撤除：`automation/gas/line-webhook.gs` 自專案移除；Apps Script Web App 與 LINE Webhook 待 Ellie 於後台停用。 |
| SSS-20260831-003 | LINE / Access | `snowsurf-line-webhook-proxy` Cloudflare Worker v1 | 公開 Worker 驗證 LINE 簽章、轉送至既有 Apps Script，並直接回應 200；機密設定為 Worker secrets | REVOKED | 2026-08-31：Ellie 明確指示「你幫我用」，同意建立、公開部署、回填、Verify 與開啟此 LINE Webhook proxy。2026-09-05：Ellie 指示拿掉整個 LINE 自動化串接。 | 2026-09-05 已撤除：轉送目標已不存在；Worker 與其 secrets 待 Ellie 於 Cloudflare 後台刪除。 |
| SSS-20260901-004 | Website | 首頁 LIFE CHAPTERS 圖文更新＋〈情侶滑雪不吵架攻略〉 | Brand / CTA / SEO / 手機段落排版已完成；無價格、無表單規則異動 | APPROVED | 2026-09-01：Ellie 明確指示「commit部署吧」。 | 待執行 |
| SSS-20260901-005 | Website | 〈情侶滑雪不吵架攻略〉精簡開頭版 | Brand / CTA / SEO 已沿用已上線版本；刪除 3 段導言，無價格、無表單規則異動 | APPROVED | 2026-09-01：Ellie 明確指示「部署吧。上線吧」。 | 待執行 |
| SSS-20260913-006 | Website App | AI 智慧計畫本 v0.1（今天＋週計畫）私人網頁版 | 全繁中、Mobile First；資料只存使用者裝置的 IndexedDB，不上傳、不跨裝置同步；無登入、付款、追蹤器或對外連結 | APPROVED | 2026-09-13：Ellie 明確指示「給我網址」，核准部署目前私人網頁版。 | 已完成私人部署：私人網址（不公開） |
| SSS-20260913-007 | Website App | SnowSurfStudio AI 工作排程 v0.2 | 新增內容／行銷／自動化工作收件、流程拆解、截止日排程與「現在可以做什麼」；Local First；AI 對話尚未連線且有明確標示；保留今天與週計畫 | APPROVED | 2026-09-13：Ellie 檢視本機預覽後明確指示「直接覆蓋」，核准覆蓋既有私人網站。 | 已完成私人部署：私人網址（不公開） |
| SSS-20260913-008 | Website App | AI 工作排程 v0.3（雙圖片入口＋首頁標題） | 工作輸入框與助理區新增圖片選擇、格式／10 MB 大小檢查、預覽與移除；標題改為「今天要完成的工作是什麼？」；不啟用 AI 或社群發布 | APPROVED | 2026-09-13：Ellie 指定既有網址並明確要求兩處加入圖片上傳及修改標題。 | 已完成私人部署：私人網址（不公開） |
| SSS-20260913-009 | Website App | AI 工作排程 v0.4（最近任務＋月份行程） | 移除今天導覽；首頁改為最近的任務；週計畫替換為同色系月份行程表；新增一週／一個月排程週期 | APPROVED | 2026-09-13：Ellie 明確指定移除今天、改最近任務與月份行程表，並要求工作排成一週或一個月。 | 已完成私人部署：私人網址（不公開） |
| SSS-20260913-010 | Website App | AI 工作排程 v0.5（精簡成果任務） | 每個計畫由 10 個細項縮成 5 個成果節點；聚焦完成貼文、活動主題／篇數、發布、廣告上下線與成效；舊計畫自動精簡並保留約略進度 | APPROVED | 2026-09-13：Ellie 明確表示分得太細，指定改為完成哪篇貼文、活動內容／篇數及廣告時間等大項。 | 已完成私人部署：私人網址（不公開） |
| SSS-20260913-011 | Website App | AI 工作排程 v0.6（建立後立即顯示排程） | 修正建立後停在原頁、右側按鈕無作用；上方與右側送出皆立即進月份行程；補做完整操作與重新整理保存測試 | WAITING FOR OWNER APPROVAL | — | 本機測試完成，尚未覆蓋線上版本 |
| SSS-20260913-012 | Website App | AI 工作排程 v0.7（完整內容企劃格式＋10/7 講座排程） | 規劃結果改為策略路線、核心目標、日期／內容／平台／目的表格、內容比例、講座大綱、廣告波段及轉換路徑；合併 v0.6 建立流程修正；未連接外部 AI 或自動發布 | APPROVED | 2026-09-13：Ellie 檢視本機預覽後明確指示「直接覆蓋」。 | 已完成私人部署：私人網址（不公開） |
| SSS-20260913-013 | Website App | AI 工作排程 v0.8（每日 3 件主任務＋一週固定節奏） | 首頁新增今日核心、3 件可分類主任務、完成勾選、彈性時間選項、明天接續與週一至週日工作節奏；全部 Local First 自動保存 | SUPERSEDED | 2026-09-13：Ellie 認為版面太亂，改採單一月份表格。 | 未部署，已由 v0.9 取代 |
| SSS-20260913-014 | Website App | AI 工作排程 v0.9（單一月份內容行銷表格） | 首頁只顯示月份表格；9/13～10/12 每天一項，涵蓋 20 題發文矩陣、10/7 講座內容、兩波廣告與講座後轉換；點日期顯示當日詳情 | APPROVED | 2026-09-13：Ellie 檢視本機預覽後明確指示「直接覆蓋」。 | 已完成私人部署：私人網址（不公開） |
| SSS-20260913-015 | Website App | AI 工作排程 v1.0（可點開的完整每日執行內容） | 9/13～10/12 共 30 天皆補齊主題摘要、3 個依序步驟與完成標準；內容貼文另含開頭與 CTA，廣告另含受眾與投放準備，10/7 含完整講座流程；未啟用 AI、發文或廣告投放 | APPROVED | 2026-09-13：Ellie 檢視本機版本後明確指示「直接覆蓋」。 | 已完成私人部署：私人網址（不公開） |
| SSS-20260913-016 | Website App | AI 智慧計畫本 v1.1（原月曆增加 9 月內容行銷排程） | 原有 29 項貼文／講座／廣告節點留在月份行程格內，再加入 9/14～9/30 新主線；同日合計最多 3 件，超量的 P3 自動順延；任務含品牌、日期、四階段、類型、工時、優先級、狀態、CTA、KPI；Local First，不會自動發文或對外回覆 | WAITING FOR OWNER APPROVAL | 等待 Ellie 檢視「在原月曆增加內容」版本後，明確核准更新私人網站。 | 本機預覽完成，尚未部署 |
| SSS-20260914-017 | Website | 「戶外活動攝影／A Life in Moments」方案頁 v1 | 完整方案、拍攝畫面、適用活動、流程、CTA 與 SEO 已完成；無價格、付款或預約規則異動；本機建置通過 | APPROVED | 2026-09-14：Ellie 在檢視內容頁後明確指示「部署上線」。 | 已完成；正式頁面回傳 200 |
| SSS-20260914-018 | Website | 戶外活動攝影方案去重與原頁替換修正版 | 將原「人生轉場攝影方案」頁面及預約選項改為戶外活動攝影，刪除誤新增的重複頁；文案與 SEO 沿用 Ellie 指定版本 | APPROVED | 2026-09-14：Ellie 明確更正只保留一個戶外活動攝影，並指定將人生轉場攝影方案改掉。 | 已完成；主頁 200、重複頁 404 |
| SSS-20260914-019 | Website | 戶外活動攝影海景封面修正 | 將方案卡與內容頁的夕陽道路圖替換為既有 `a-life-in-moments-beach.jpg` 海景原檔 | APPROVED | 2026-09-14：Ellie 明確指定「照片要改大海封面的那張照片」。 | 已完成；正式頁已驗證載入海景原檔 |
| SSS-20260914-020 | Website | 戶外活動攝影首圖指定素材修正 | 將內容頁第一張夕陽道路圖替換為 Ellie 提供的 `IMG_5139.heic`，轉為全新檔名 JPG 避免舊圖快取 | APPROVED | 2026-09-14：Ellie 明確指定第一張圖改成附件第二張 `IMG_5139.heic`。 | 已完成；正式頁與圖片均回傳 200 |
| SSS-20260914-021 | Website | 戶外活動攝影頁底部標題移除 | 移除「讓這次出發，成為以後還能回看的故事」，保留 CTA 說明與預約按鈕 | APPROVED | 2026-09-14：Ellie 明確指定「這句去掉」。 | 已完成；正式頁重新載入後確認文字不存在 |
| SSS-20260914-022 | Website | 首頁戶外攝影封面文案精簡 | 刪除「不管是一個人、兩個人……都替你留下真正投入戶外、享受當下的樣子」兩行，其餘文案不變 | APPROVED | 2026-09-14：Ellie 明確指定移除此段。 | 已完成；正式首頁已驗證指定文字不存在 |
| SSS-20260914-023 | Website | 首頁海景方案卡標題修正 | 將海景方案卡標題由 `A Life in Moments` 改為「戶外活動攝影師」；內頁英文副標與其他文字不變 | APPROVED | 2026-09-14：Ellie 明確指定此處標題改為「戶外活動攝影師」。 | 已完成；正式首頁重新載入後確認卡片標題正確 |
| SSS-20260914-024 | Website | 首頁海景方案卡標題用詞修正 | 將「戶外活動攝影師」修正為「戶外活動攝影」 | APPROVED | 2026-09-14：Ellie 明確更正正確標題。 | 已完成；正式首頁重新載入後確認標題正確 |
| SSS-20260919-025 | Dashboard Artifact | 移除 AI 指令中控台（對話框、圖片區、Claude／Codex 選項） | 僅更新原 Claude Artifact；保留其餘儀表板內容與私人存取權限；關閉未合併的 PR #32，不部署正式網站 | APPROVED | 2026-09-19：Ellie 指定刪除無法直接執行的對話框，並於確認精確範圍後回覆「執行」。 | 已完成：原 Artifact 更新至 v15，線上已確認指令區消失、其餘區塊保留；PR #32 已關閉，定期複查已取消。正式網站未部署。 |
| SSS-20260919-026 | Dashboard / GitHub | Dashboard 五部門路由與行銷 Skill 版，PR #34 | 12 個現有角色完整保留；移除無內容的舊 Skill 清單；兩個保留的 Skill 均有完整文件；390px 手機版無橫向溢出；未更動價格、預約或對外發信 | APPROVED | 2026-09-19：Ellie 指示同步並發布 Dashboard 至 GitHub 與行動端，並要求刪除空白或只有一兩行的內容。 | PR #34 已合併；GitHub Pages 建置成功。2026-09-19 Claude 已重新發布原 Artifact（Version 18），確認連結顯示五部門版本。 |
| SSS-20260919-027 | Dashboard / GitHub | 部門派工實裝與儀表板部門分組，PR #36 | 角色卡片歸入 CEO 入口／HR／行銷／客服／數據分析／財務；新增 `CLAUDE.md` 讓 Claude 開工自動載入部門派工規則；私人計畫本網址已遮蔽；未更動網站內容、價格、預約或對外發信 | APPROVED | 2026-09-19：Ellie 明確指示「幫我commit上線」，核准合併 PR #36。 | 儀表板 Artifact 已發布 Version 19；PR #36 合併後 GitHub 上的紀錄與儀表板原始碼同步。 |
| SSS-20260919-028 | Dashboard / GitHub | 移除 HR 部門與品牌／SEO 兩個 Agent | HR 工作併入 CEO 入口；`marketing-brand-agent`、`seo-agent` 停止派工，改由主線用 Skill；Agent 檔案未刪（MWC 仍在用）；未更動網站內容、價格、預約或對外發信 | APPROVED | 2026-09-19：Ellie 明確指示「部署上線」，核准合併 PR #37。 | 儀表板 Artifact 已發布 Version 20；PR #37 合併後 GitHub 上的派工規則與儀表板原始碼同步。 |
| SSS-20260919-029 | Dashboard / GitHub | 行銷 Skill 併入長文（content-agent）卡片 | 移除獨立的行銷 Skill 面板，4 項 Skill 改列在 content-agent 卡片；`CLAUDE.md` 寫明派長文時主線先跑品牌／SEO Skill、再要 content-agent 讀 `10_Skills` 規格；未更動網站內容、價格、預約或對外發信 | APPROVED | 2026-09-19：Ellie 明確指示「部署上線」，核准合併 PR #38。 | 儀表板 Artifact 已發布 Version 21；PR #38 合併後 GitHub 上的派工規則與儀表板原始碼同步。 |
| SSS-20260919-030 | Dashboard / GitHub | 移除事實查證與網站實作兩個 Agent；`CLAUDE.md` 加入文案標準流程（主題→文章→FB／IG／Threads→三維評分） | `market-evidence-agent`、`website-agent` 停止派工，改由主線直接做（查證維持兩個獨立來源＋一個官方或有研究方法來源的門檻；改網站、合併、部署仍須 Ellie 核准）；派工中的 Agent 變成 8 個且全部唯讀，移除篩選按鈕；Agent 檔案未刪（MWC 仍在用）；未更動網站內容、價格、預約或對外發信 | APPROVED | 2026-09-19：Ellie 明確指示「部署上線」，核准合併 PR #39（含文案標準流程）。 | 儀表板 Artifact 已發布 Version 22；PR #39 已合併（移除兩個 Agent）；文案標準流程在 #39 合併後才推上，改由 PR #40 補上。 |
| SSS-20260919-031 | Dashboard / GitHub | 社群加入 IG 輪播「互動／選項型」產圖規格 | social-agent 卡片列出使用的 Skill；`CLAUDE.md` 文案流程第二步加入產圖（social-agent 寫每頁文字，主線跑 `10_Skills/Brand_System/scripts/render_options.py`）；背景只用 Ellie 實拍照；未更動網站內容、價格、預約或對外發信 | APPROVED | 2026-09-19：Ellie 明確指示「可以。部署上線」，核准合併 PR #41。 | 儀表板 Artifact 已發布 Version 23；範例背景改用實拍照 `src/images/town-02.jpg`；PR #41 合併後 GitHub 上的社群流程與儀表板原始碼同步。 |
| SSS-20260919-032 | Website / Dashboard | 儀表板搬到網站 `/ops/dashboard.html`，讓 Codex 也能維護 | `.eleventy.js` 把 `13_SOP_Workflows/dashboard.html` 複製到 `_site/ops/`；頁面加 noindex、robots.txt 擋 `/ops/`、不進 sitemap、網站不放連結；本機建置已確認產出；知道網址的人看得到（repo 本身已公開）；不更動網站其他內容、價格、預約或對外發信 | WAITING FOR OWNER APPROVAL | 2026-09-19：Ellie 選擇「先放上網站，不公開連結」，因之後改由 Codex 維護。 | GitHub 待 Ellie 核准合併 |

ID: SSS-20260829-001
類型: Website
商業目標與 KPI: 將「上班族重新找回探索感」內容轉換為 SnowSurfStudio 的情緒型入口頁；後續可觀察 CTA 點擊與諮詢轉換。
版本／素材連結: `09_Automation_Tech/Repositories/上班族探索感Landing`；僅使用 Ellie 提供的「上班族輪播貼文」圖片與文案來源。
影響範圍與不可逆性: 正式網站部署與公開可見。
Brand / Risk / CTA / SEO QA: 全繁中；沿用深藍／雪青／日出暖色；無價格、無表單／追蹤器；網站 metadata 已建立。CTA 目前為草稿用途，正式寄信入口需於核准時一併確認。
狀態: CANCELLED（2026-09-05 Ellie 表示這個案子不做了）
Ellie 核准: 未核准即取消。2026-09-05 Ellie 明確表示不做這個案子。
執行結果與數據: 未部署即取消；草稿保留於原專案資料夾，未對外發布過。
Knowledge 回寫判斷: 案子取消，無數據可回寫。

---

ID: SSS-20260913-006
類型: Website App
商業目標與 KPI: 提供 Ellie 可直接以瀏覽器使用的 AI 智慧計畫本；本版驗收為私人網址可開啟、今天與週計畫可操作、重新整理後同一裝置資料仍存在。
版本／素材連結: `09_Automation_Tech/Repositories/AI智慧計畫本`；目前功能為「今天」與「週計畫」，以 2026-09-13 已通過建置與手機回歸測試的版本為準。
影響範圍與不可逆性: 建立並部署一個私人、僅擁有者可存取的網站版本。使用者待辦存於瀏覽器 IndexedDB；清除瀏覽器資料、換瀏覽器或換裝置時不會自動帶入。
Brand / Risk / CTA / SEO QA: 介面使用繁體中文（台灣用語）；Mobile First；無登入、付款、廣告、分析追蹤器、個資蒐集或對外連結。部署不包含 Ellie 現有瀏覽器內的測試待辦資料。
狀態: APPROVED
Ellie 核准: 2026-09-13，明確指示「給我網址」，核准部署目前「今天＋週計畫」私人網頁版。
執行結果與數據: 2026-09-13 已完成私人部署，網址：私人網址（不公開）。部署狀態 succeeded；版本 1。
Knowledge 回寫判斷: 待使用回饋後再評估。

---

ID: SSS-20260913-007
類型: Website App
商業目標與 KPI: 將產品核心由一般待辦改為 SnowSurfStudio 內容、行銷與自動化工作的拆解及排程；驗收為可新增工作、依期限產生細節、顯示當下可做事項，且重新整理後保留資料。
版本／素材連結: `09_Automation_Tech/Repositories/AI智慧計畫本`；以 2026-09-13 通過建置、11 項自動測試與本機互動測試的新版工作台為準。
影響範圍與不可逆性: 覆蓋既有私人 Sites 網站目前線上版本；存取範圍維持僅擁有者。既有「今天／週計畫」路由及資料層保留。
Brand / Risk / CTA / SEO QA: SnowSurfStudio 深藍、冰雪淡藍及柔和色塊；全繁中、Mobile First；工作計畫存於瀏覽器 Local Storage。AI 對話區尚未連線並清楚標示，不會傳送資料；無付款、廣告實際投放、分析追蹤或對外訊息。
狀態: APPROVED
Ellie 核准: 2026-09-13，檢視本機預覽後明確指示「直接覆蓋」，核准將新版 SnowSurfStudio AI 工作排程部署至既有私人網址。
執行結果與數據: 2026-09-13 已完成私人部署，版本 2，網址：私人網址（不公開）；部署狀態 succeeded。
Knowledge 回寫判斷: 待實際使用回饋與 AI 後端規格確認後再評估。

---

ID: SSS-20260913-008
類型: Website App
商業目標與 KPI: 讓 Ellie 能在建立工作或使用助理時選擇貼文圖片，並讓首頁問題更直接對應每日執行。
版本／素材連結: `09_Automation_Tech/Repositories/AI智慧計畫本`；新增共用圖片選擇元件，配置於工作輸入框下方與助理區。
影響範圍與不可逆性: 覆蓋既有私人 Sites 網站目前線上版本；存取範圍維持僅擁有者。本版只提供裝置端圖片選擇與預覽，未上傳雲端、未觸發社群發布。
Brand / Risk / CTA / SEO QA: 維持 SnowSurfStudio 工作台風格及 Mobile First；支援 JPG、PNG、WebP，限制 10 MB，錯誤訊息為繁中；圖片僅在目前操作中預覽。
狀態: APPROVED
Ellie 核准: 2026-09-13，指定 私人網址（不公開），明確要求工作框下方及旁邊助理加入圖片上傳，並修改首頁標題。
執行結果與數據: 2026-09-13 已完成私人部署，版本 3，網址：私人網址（不公開）；部署狀態 succeeded。
Knowledge 回寫判斷: 等待正式貼文儲存與發布後端完成後再評估。

---

ID: SSS-20260913-009
類型: Website App
商業目標與 KPI: 將執行視角由單日待辦改為 SnowSurfStudio 最近任務與月份行程，讓內容、行銷及自動化工作能依一週或一個月合理分散。
版本／素材連結: `09_Automation_Tech/Repositories/AI智慧計畫本`；首頁規劃週期選項與 `/week` 月份行程表。
影響範圍與不可逆性: 覆蓋既有私人 Sites 網站目前版本；今天導覽與今天頁入口移除，既有本機任務資料未刪除。
Brand / Risk / CTA / SEO QA: 月份行程沿用 SnowSurfStudio 深藍、冰藍、淡綠與淡粉分類色；手機支援月份表格橫向查看；未啟用 AI 或對外社群發布。
狀態: APPROVED
Ellie 核准: 2026-09-13，明確指定「今天的可以拿掉」、「週計畫幫我用月份的行程表格」、「用最近的任務」，並要求工作排成一週或一個月。
執行結果與數據: 2026-09-13 已完成私人部署，版本 4，網址：私人網址（不公開）；部署狀態 succeeded。
Knowledge 回寫判斷: 這是產品介面修正，暫不回寫品牌知識。

---

ID: SSS-20260913-010
類型: Website App
商業目標與 KPI: 降低排程顆粒度，讓月份行程一眼看出本週／本月真正需要交付的貼文、活動與廣告節點。
版本／素材連結: `09_Automation_Tech/Repositories/AI智慧計畫本`；精簡 `plannerTemplates` 並加入舊計畫轉換。
影響範圍與不可逆性: 覆蓋既有私人網站版本；裝置上的舊 10 步驟計畫載入後會整理為 5 個成果任務，專案名稱、期限與約略完成比例保留。
Brand / Risk / CTA / SEO QA: 不改視覺風格；不啟用 AI、對外發布或廣告花費；僅調整排程內容顆粒度。
狀態: APPROVED
Ellie 核准: 2026-09-13，明確表示「分得太細」，並指定改為完成哪篇貼文、活動內容與篇數、何時下廣告等成果型任務。
執行結果與數據: 2026-09-13 已完成私人部署，版本 5，網址：私人網址（不公開）；部署狀態 succeeded。
Knowledge 回寫判斷: 產品偏好已落實於程式模板，暫不另建品牌知識。

---

ID: SSS-20260913-011
類型: Website App
商業目標與 KPI: 修正 Ellie 輸入工作後看不到排程的斷裂流程；驗收為上方及右側兩個入口皆能建立一週排程、自動開啟月份行程，且重新整理後資料仍存在。
版本／素材連結: `09_Automation_Tech/Repositories/AI智慧計畫本`；PlannerPage 與 usePlanningProjects 的本機修正版。
影響範圍與不可逆性: 核准後覆蓋既有私人 Sites 網站；不變更存取範圍、不啟用外部 AI 或社群發布。
Brand / Risk / CTA / SEO QA: 維持現有版面；右側改稱「本機排程模式」，避免假裝已接 AI；手機仍可輸入並送出。
狀態: WAITING FOR OWNER APPROVAL
Ellie 核准: [等待 Ellie 明確核准覆蓋此修正版]
執行結果與數據: 本機建置成功，11 項單元測試通過；實際操作驗證上方輸入、自動進月曆、右側輸入、重新整理保存皆成功。
Knowledge 回寫判斷: 此為產品流程修正，暫不回寫品牌知識。

---

ID: SSS-20260913-012
類型: Website App
商業目標與 KPI: 讓 Ellie 輸入 SnowSurfStudio 工作後，看到的是可直接執行的完整內容與轉換企劃，而不是過細的製作步驟；本版以 10/7 滑雪分享會為固定活動日倒推內容、招生與廣告節奏。
版本／素材連結: `09_Automation_Tech/Repositories/AI智慧計畫本`；新增完整企劃文件元件與含平台、目的的月份排程資料。
影響範圍與不可逆性: 核准後覆蓋既有私人 Sites 網站；合併尚未上線的 v0.6 操作流程修正。既有本機計畫載入時會轉換成新版排程格式；不變更網站存取範圍。
Brand / Risk / CTA / SEO QA: 延續既有 SnowSurfStudio 深藍、冰藍、淡綠與大量留白；規劃含策略路線、3 項核心目標、內容比例、日期／內容／平台／目的排程、10/7 講座架構、三波廣告與內容轉換路徑。僅建立規劃草稿，不連接外部 AI、不發布貼文、不投放廣告。
狀態: APPROVED
Ellie 核准: 2026-09-13，檢視本機預覽後明確指示「直接覆蓋」，核准將完整內容企劃格式與 10/7 講座排程部署至既有私人網址。
執行結果與數據: 本機建置成功，11 項單元測試通過；實際建立一個月計畫後確認 10/7 講座、前後內容與廣告節點正確出現在月份行程，勾選狀態於重新整理後仍保留。已完成私人部署，版本 6，網址：私人網址（不公開）；部署狀態 succeeded。
Knowledge 回寫判斷: Ellie 對規劃輸出深度與固定講座日的修正已落實於產品模板；待核准上線後再更新正式結果。

---

ID: SSS-20260913-013
類型: Website App
商業目標與 KPI: 讓 Ellie 每天不用重新思考要做什麼，只抓最能推進 SnowSurfStudio 的 3 件主任務，並依固定一週節奏執行內容、轉換、成長、系統與學習工作。
版本／素材連結: `09_Automation_Tech/Repositories/AI智慧計畫本`；首頁每日焦點與一週節奏元件。
影響範圍與不可逆性: 核准後覆蓋既有私人 Sites 網站；每日欄位只存目前瀏覽器 Local Storage，不傳送到外部服務。
Brand / Risk / CTA / SEO QA: 延續現有 SnowSurfStudio 視覺；每日區含今日最重要的一件事、3 件可編輯／分類／勾選主任務、30 分鐘／1 小時／最低限度選項及明天接續；一週節奏以手機橫向滑動呈現。NT$300 僅為廣告任務範例，不會實際投放或付款。
狀態: SUPERSEDED
Ellie 核准: 2026-09-13，Ellie 檢視後認為版面太亂，要求改成單一月份表格；此版未核准上線。
執行結果與數據: 未部署，已由 SSS-20260913-014 取代。
Knowledge 回寫判斷: Ellie 的每日工作框架與固定週節奏已落實於產品，待核准上線後更新結果。

---

ID: SSS-20260913-014
類型: Website App
商業目標與 KPI: 讓 Ellie 打開網站就直接看到 SnowSurfStudio 月份內容行銷表格，且 9/13～10/12 每一天都有明確事項，不必在多個區塊間尋找。
版本／素材連結: `09_Automation_Tech/Repositories/AI智慧計畫本`；單一月份行程首頁與固定活動月曆。
影響範圍與不可逆性: 核准後覆蓋既有私人 Sites 網站；首頁改為月份表格，先前的每日三任務預覽版不部署。完成勾選仍只存目前瀏覽器 Local Storage。
Brand / Risk / CTA / SEO QA: 沿用現有 SnowSurfStudio 色彩與留白；9/13～10/12 共 30 天、每天一項，使用 Ellie 提供的 A1～D5 共 20 題內容矩陣，加入 10/7 滑雪分享會、暖場內容、第一波廣告、第二波再行銷、講座花絮與攝影轉換。廣告僅為排程，不會實際投放或付款。
狀態: APPROVED
Ellie 核准: 2026-09-13，檢視本機預覽後明確指示「直接覆蓋」，核准將單一月份內容行銷表格部署至既有私人網址。
執行結果與數據: 本機建置成功，12 項單元測試通過；確認 30 個不同日期皆有一項安排、10/7 講座日期正確、點日期可顯示當日詳情，手機版月份表格可橫向滑動。已完成私人部署，版本 7，網址：私人網址（不公開）；部署狀態 succeeded。
Knowledge 回寫判斷: Ellie 偏好單一月份表格而非多區塊首頁，已落實於產品；待核准上線後更新結果。

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

---

ID: SSS-20260913-015
類型: Website App
商業目標與 KPI: 讓 Ellie 在月份表格點開任一天時，直接看到當天完整主題、先後執行步驟與明確完成標準，不必再自行猜測要做什麼。
版本／素材連結: `09_Automation_Tech/Repositories/AI智慧計畫本`；新增 30 天逐日詳情資料與月份表格側邊詳情面板。
影響範圍與不可逆性: 核准後將覆蓋既有私人 Sites 網站目前線上版本；存取範圍維持僅擁有者。既有月份排程與完成狀態儲存方式不變。
Brand / Risk / CTA / SEO QA: 維持現有 SnowSurfStudio 視覺；桌機為右側面板、手機為全寬可捲動詳情。30 天皆有摘要、至少 3 個依序步驟及完成標準；內容貼文含完整主題、開頭與 CTA；廣告含目的、受眾與準備步驟；10/7 講座含完整段落順序。未連接外部 AI、未發布貼文、未實際投放廣告。
狀態: APPROVED
Ellie 核准: 2026-09-13，檢視本機版本後明確指示「直接覆蓋」，核准將可點開完整每日執行內容的版本部署至既有私人網址。
執行結果與數據: 本機已通過 13 項自動測試、正式建置、內容日／廣告日／10/7 講座點開測試與 390×844 手機版操作測試；已完成私人部署，版本 8，網址：私人網址（不公開）。
Knowledge 回寫判斷: 這是產品呈現修正，暫不回寫品牌知識。

## 建立項目格式

ID: SSS-20260914-017
類型: Website
商業目標與 KPI: 新增戶外活動攝影服務入口，讓登山、露營、旅行、運動活動與品牌企劃客群理解服務範圍並導向預約；後續觀察方案頁瀏覽與預約 CTA 點擊。
版本／素材連結: `src/plans/outdoor-activity-photography.md`；以 2026-09-14 已通過 Eleventy 建置的版本為準。
影響範圍與不可逆性: 推送至 `main` 後由 GitHub Pages 公開部署；首頁方案區將自動增加卡片並連到 `/plans/outdoor-activity-photography.html`。
Brand / Risk / CTA / SEO QA: 繁體中文；英文副標為 `A Life in Moments`；沿用網站既有方案頁版型與戶外風景素材；CTA 導向既有預約區；無價格、付款、合約、表單欄位或預約規則異動。
狀態: APPROVED
Ellie 核准: 2026-09-14，檢視新增內容後明確指示「部署上線」，核准目前版本公開部署。
執行結果與數據: 2026-09-14 已推送 commit `b9f5e38` 至 `main`；GitHub Pages workflow `34815073699` 建置與部署成功。正式頁面 `https://snowsurfstudio.net/plans/outdoor-activity-photography.html` 回傳 HTTP 200，頁面標題、方案內容與 SEO metadata 均已驗證。
Knowledge 回寫判斷: 本次為單一服務頁內容新增，暫不回寫品牌知識；待累積流量與詢問後再評估。

---

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
## SSS-20260919-035｜文章 P3、P4 圖片與拍攝清單修正

狀態: APPROVED
Ellie 核准: 2026-09-19「對。沒錯。幫我放進文章」，並指定拍攝清單改框線表格、移除末尾參考資料與示意範圍。
範圍: ski-beginner-photo-tutorial-6-poses 文章，P3 低板女生、P4 抬臀離地新版圖片，相關圖文對齊與清單排版；其他文章不變。
QA: Eleventy 建置成功；桌機及手機六列表格、框線、無頁面水平溢出及兩张新版圖片載入通過。
執行: 核准公開部署本次修改。
## SSS-20260919-036｜P4 側拍固定器修正

狀態: APPROVED
Ellie 核准: 2026-09-19「對這樣。幫我換上這張」。
範圍: P4 換成已確認的側拍、雙腳分別固定在同一雪板、臀部離地圖片；同步修正該動作一句說明，其他圖片與排版不變。
素材: 04-side-bound-boots-v4.webp。
