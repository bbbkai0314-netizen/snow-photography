# 首頁 Hero 改版「Life in Transition」— 交接紀錄

更新日期：2026-09-01
交接對象：Codex（接手同一份 GitHub repo 繼續處理）

## 本次完成（全部已 commit 並 push 到 `origin/main`，GitHub Pages 已自動部署上線）

依序的 commit（由舊到新）：

1. `b529141` Redesign homepage hero as Life in Transition cover
2. `22c5e7a` Restore original SnowSurfStudio hero, add Life in Transition as second slide
3. `41a8728` Widen nav pill to enclose icons, trim Life in Transition hero copy
4. `e9afa37` Speed up hero crossfade to 2s and trim Life in Transition lead copy
5. `485646b` Slow hero crossfade to 6s hold / 2s fade per feedback
6. `9c0a4c6` Adjust hero crossfade to 4s hold / 2s fade ← 目前線上版本

改動的檔案：

- `src/index.njk` — 首頁 HERO 區塊（`data-tag="HERO"` 那個 `<section>`）
- `src/css/style.css` — 新增 `.hero-fade` / `.hero-fade--a` / `.hero-fade--b`、`.chapter__scrim--hero-left` / `--right`、`.chapter__content--nowrap`；調整 `.nav` 寬度
- `src/js/script.js` — 首頁 scroll 淡出邏輯改成同時處理兩個 `.chapter__content`
- `src/_data/site.json` — 新增 `heroImageSecondary` / `heroImageSecondaryAlt`
- `src/images/life-in-transition-hero.jpg` — 新增的夏天素材（原始檔是 Ellie 桌面的「人生攝影師.png」，已壓縮成 JPG）

## 現在首頁 Hero 長什麼樣子

首頁最上面的滿版區塊，現在是**兩組完整內容**（背景圖＋文字）用 CSS 動畫自動交叉淡入淡出，不是單純換圖：

- **冬天／原本的 SnowSurfStudio**：文字在左邊，內容完全沒動過（品牌名、滑雪攝影服務、日本滑雪寫真、原本的介紹文）
- **夏天／Life in Transition**：文字在右邊，小標「人生轉場攝影師 · Life in Transition」、標題「Life in Transition」（沒有 `>`、單行不換行）、徽章「人生轉場記錄者」（沒有滑雪攝影、沒有地點行）、介紹文只留「人生很多轉折...我們陪你走進人生正在翻篇的那一刻，把「正在轉變中的自己」好好留下來。」（已拿掉「冬天...其他季節」那句）、沒有年份／IG 帳號那行

背景圖：`site.heroImage`（原本滑雪照）↔ `site.heroImageSecondary`（新的夏天路上拖行李箱照片），透過 `.hero-fade` 系列 class 用同一組 `@keyframes heroCrossfade` 同步驅動 img、scrim、文字 wrapper 三種元素一起淡入淡出。

**目前節奏**：每張停留 4 秒，中間淡入淡出轉場 2 秒，一輪冬夏來回共 12 秒（`animation:heroCrossfade 12s`，第二組 `animation-delay:-6s`）。這個數字被使用者調整了好幾次（24s → 4s → 16s → 12s），如果之後還要再調，直接改 `src/css/style.css` 裡 `.hero-fade` 的 `animation` duration，`hero-fade--b` 的 `animation-delay` 永遠設成 duration 的一半即可，`@keyframes heroCrossfade` 裡的百分比（`0%, 33.33%` / `50%, 83.33%`）維持 hold:fade = 2:1 的比例不用動。

## 已知問題：Cloudflare CDN 快取延遲（尚未解決，需要 Ellie 手動處理）

`snowsurfstudio.net` 是走 Cloudflare Proxy，`style.css` 的 response header 是 `cache-control: max-age=14400`（4 小時）。每次改完 CSS 部署後，Cloudflare 邊緣節點還會繼續吐舊版 CSS 一段時間，使用者（包含 Ellie 自己）直接訪問會看到舊的動畫秒數，要用 cache-busting query string（例如 `?v=時間戳記`）或無痕視窗才能立刻看到最新版本。

**我這邊沒有清除 Cloudflare 快取的工具**——現有接進來的 Cloudflare MCP 工具只有 Developer Platform 資源（Workers／D1／R2／KV／Hyperdrive），Zone 層級設定（DNS／SSL／WAF／Bot／**Cache**）完全沒有對應 API，這點在 `12_Brand_Knowledge/20_Decisions/20260831-cloudflare-write-access.md` 裡已經記錄過同樣的限制（那份記的是 DNS/SSL/Bot，Cache 是同一類）。

若 Codex 這邊有辦法接 Cloudflare API（例如有 API Token 可以呼叫 `POST /zones/{zone_id}/purge_cache`），可以考慮直接幫 Ellie 做掉；否則要請 Ellie 自己到 Cloudflare Dashboard → Caching → Configuration → **Purge Everything**（或指定 purge `https://snowsurfstudio.net/css/style.css`）。

## 給 Codex 的注意事項

1. **部署方式**：這個 repo 用 `.github/workflows/deploy.yml`，push 到 `main` 就會自動 build（Eleventy）＋ 部署到 GitHub Pages，不需要手動操作。改完直接 commit + push 即可上線，不用額外下部署指令。
2. **不要動的東西**：repo 裡還有一堆跟這次網站改版無關、目前是 untracked 的資料夾／檔案（`02_Marketing/`、`03_Sales/`、`12_Brand_Knowledge/`、`13_SOP_Workflows/`、`AGENTS.md`、`DASHBOARD.md` 等等）——這是 Ellie 另外在跑的一套「AI 公司知識庫／SOP」系統，跟這次的 hero 改版完全無關，我這次的每個 commit 都刻意只 `git add` 網站相關檔案，沒有動到這些。Codex 接手時也建議維持這個界線，不要把它們一起 commit 進去，除非 Ellie 明確要求。
3. **本地預覽**：`npm run serve`（`eleventy --serve`）本機起 server；本次開發過程中用 Playwright（`npx playwright install chromium` 後跑 headless screenshot）來驗證兩個交叉淡入淡出的畫面、nav 排版、手機寬度，沒有安裝任何專案依賴（是暫時裝在 scratchpad 資料夾，不影響這個 repo 本身）。
4. **秒數/文案還可能再改**：這次過程中 Ellie 對轉場秒數跟文案改了很多次（很正常），如果她再提出調整，直接照上面「目前節奏」那段的方法改 CSS 數字即可，不需要重新設計結構。

## 待確認 / 待辦

- [ ] Cloudflare 快取清除（見上方「已知問題」）
- [ ] 確認 Ellie 對目前的秒數（4 秒停留／2 秒轉場）跟文案已經滿意，沒有再要求微調
