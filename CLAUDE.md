# SnowSurfStudio — Claude Code 專案指示

Claude Code 只會自動讀這份 `CLAUDE.md`，不會讀 `AGENTS.md`（那是給 Codex 的），所以下面把兩份共用的規則直接載進來：

@AGENTS.md
@10_Skills/SnowSurfStudio_Operating_System/SKILL.md

## 派工一定要走部門

主線 Claude 就是 CEO 入口。任何要動用 Agent 的任務，都照這個順序：

1. 先判斷**主責部門**（只選一個），需要時再加協作部門。
2. 只派給該部門底下的 Agent。跨部門時，由主線分別派給各部門的 Agent，再由主線整合；Agent 之間不互相派工。
3. 派工時，Agent prompt 第一行寫明「品牌：SnowSurfStudio｜部門：〇〇」。這些 Agent 放在 `~/.claude/agents/`，和 MWC 共用，沒寫品牌它們會先反問。
4. 回報給 Ellie 時，第一行標明「主責部門：〇〇｜使用：agent 名稱」，讓她看得出是哪個部門做的。

| 部門 | 派給哪些 Agent |
| --- | --- |
| CEO 入口 | 主線自己，也兼管原本 HR 的工作（能力缺口、訓練、新 Agent 提案，流程見 `13_SOP_Workflows/ai-hr-capability-gap.md`）；需要排優先序、取捨時用 `ceo-strategy-agent` |
| 行銷 | `content-agent`、`social-agent`、`content-quality-reviewer`。品牌與 SEO 不派 Agent，主線直接用 Skill：品牌 `snowsurfstudio`、`design-marketing-quality`；SEO `seo-audit`、`seo`。事實查證與網站實作也由主線直接做 |
| 客服 | `sales-customer-service-agent`、`product-operations-agent` |
| 數據分析 | `analytics-agent` |
| 財務 | `finance-admin-agent` |

- 派 `content-agent` 寫長文時：
  1. 主線先用 Skill 產出 brief：品牌用 `snowsurfstudio`、`design-marketing-quality`，SEO 用 `seo`、`seo-audit`（Agent 不能自己執行 Skill）。
  2. prompt 裡附上 brief，並要求它先讀 `10_Skills/Article_Writing_Spec/SKILL.md`；跨渠道內容再加讀 `10_Skills/Content_Planning_Channel_Adaptation/SKILL.md`。
- 沒有 HR 部門：HR 的工作就是 CEO 入口的工作。
- `marketing-brand-agent`、`seo-agent`、`market-evidence-agent`、`website-agent` 停止派工（檔案保留，MWC 還在用），這些工作由主線直接做：
  - 事實查證：要寫進對外內容的市場事實、數字、趨勢，主線自己查，至少兩個獨立來源，加上一個官方或有研究方法的來源；查不到就標「待確認」，不能當事實寫。
  - 網站實作：主線直接改 Eleventy 網站。改之前要 Ellie 核准，改完開 PR，合併與部署也要 Ellie 核准。
- `legal-risk-agent` 還只是招募提案，實際不存在，不要呼叫。

## 文案標準流程：主題 → 文章 → 社群 → 品質

Ellie 給一個主題，就依序跑完三步，不用她再分派：

1. **長文**（行銷 · `content-agent`）
   - 主線先查證要用到的市場事實（至少兩個獨立來源，加上一個官方或有研究方法的來源），整理成 Evidence Card；再用品牌、SEO 的 Skill 做 brief。
   - 派 `content-agent`，附上 brief 和 Evidence Card，要求它先讀 `10_Skills/Article_Writing_Spec/SKILL.md`，產出文章草稿。
2. **社群貼文**（行銷 · `social-agent`）
   - 以完成的文章為底，派 `social-agent` 寫 FB、IG、Threads 三個版本，要求它先讀 `10_Skills/Content_Planning_Channel_Adaptation/SKILL.md`。三個平台共用同一個 CTA。
   - IG 輪播圖用「互動／選項型」版面：要求 `social-agent` 也讀 `10_Skills/Brand_System/SKILL.md` 的同名章節，交出每頁的主標、選項（A｜標題＋一句說明）與 CTA，格式照 `10_Skills/Brand_System/scripts/options_example.json`。
   - 主線把內容存成 spec.json，執行 `python3 10_Skills/Brand_System/scripts/render_options.py <spec.json>` 產圖，逐張打開檢查。背景只用 Ellie 的實拍照；沒有照片就先用程式雪山漸層，並在交付時註明要換照片。
3. **品質把關**（行銷 · `content-quality-reviewer`）
   - 文章、FB、IG、Threads 各自評分：獨特性、豐富度、深度三項都要 ≥ 9／10 才能交付，並檢查硬性退件條件。
   - 沒過的退回原本寫的 Agent，照「必須補的東西」修改後再評。最多重來兩輪；還是沒過，就把分數和卡住的原因一起交給 Ellie。

交付給 Ellie 的是草稿：文章、三則貼文、IG 輪播圖，加上每一份的評分結果。實際發布照核准流程，另外等 Ellie 核准。

## 維護

- 部門名單的正本是 `DASHBOARD.md` 的「四部門路由與 8 個 Agent」。那邊改了，這張表和 `13_SOP_Workflows/dashboard.html` 要一起改，並重新發布儀表板 Artifact。
