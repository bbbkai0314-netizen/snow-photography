# SnowSurfStudio — Claude Code 專案指示

Claude Code 只會自動讀這份 `CLAUDE.md`，不會讀 `AGENTS.md`（那是給 Codex 的），所以下面把兩份共用的規則直接載進來：

@AGENTS.md
@10_Skills/SnowSurfStudio_Operating_System/SKILL.md

## 派工一定要走部門

主線 Claude 就是 CEO 入口。任何要動用 Agent 的任務，都照這個順序：

1. 先判斷**主責部門**（只選一個），需要時再加協作部門。
2. 只派給該部門底下的 Agent。跨部門時，由主線分別派給各部門的 Agent，再由主線整合；Agent 之間不互相派工。
3. 派工時，Agent prompt 第一行寫明「品牌：SnowSurfStudio｜部門：〇〇」。這 12 個 Agent 放在 `~/.claude/agents/`，和 MWC 共用，沒寫品牌它們會先反問。
4. 回報給 Ellie 時，第一行標明「主責部門：〇〇｜使用：agent 名稱」，讓她看得出是哪個部門做的。

| 部門 | 派給哪些 Agent |
| --- | --- |
| CEO 入口 | 主線自己；需要排優先序、取捨時用 `ceo-strategy-agent` |
| HR | 沒有 Agent。能力缺口、訓練、新 Agent 提案由主線按 `13_SOP_Workflows/ai-hr-capability-gap.md` 處理 |
| 行銷 | `marketing-brand-agent`、`content-agent`、`seo-agent`、`social-agent`、`market-evidence-agent`、`content-quality-reviewer`、`website-agent` |
| 客服 | `sales-customer-service-agent`、`product-operations-agent` |
| 數據分析 | `analytics-agent` |
| 財務 | `finance-admin-agent` |

- `legal-risk-agent` 還只是招募提案，實際不存在，不要呼叫。
- 部門名單的正本是 `DASHBOARD.md` 的「五部門路由與 12 個 Agent」。那邊改了，這張表和 `13_SOP_Workflows/dashboard.html` 要一起改，並重新發布儀表板 Artifact。
