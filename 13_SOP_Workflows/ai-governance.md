# AI 治理規則（Permissions ＋ Hooks）

儀表板「今日總覽」的三級權限原本只是文字約定。這份文件記錄它如何被翻譯成
`.claude/settings.json` 與 `.claude/hooks/` 裡真正會執行的規則，以及**哪些部分
仍然擋不住**。

建立日期：2026-09-19

---

## 檔案位置

| 檔案 | 作用 | 進版控？ |
| --- | --- | --- |
| `.claude/settings.json` | allow／ask／deny 權限規則、hook 註冊 | 是 |
| `.claude/hooks/guard-dangerous-bash.sh` | PreToolUse 關卡，攔截危險指令 | 是 |
| `.claude/hooks/audit-log.sh` | PostToolUse 稽核留痕 | 是 |
| `.claude/logs/audit-YYYY-MM.jsonl` | 稽核紀錄本體 | 否（已 gitignore） |

---

## 三級權限如何對應到規則

### 🟢 可自動完成 → `permissions.allow`

研究、拆解、分析、草稿、建置——不需要每次詢問。

`Read`、`Grep`、`Glob`、`WebFetch`、`WebSearch`；唯讀的 git 指令
（`status`／`diff`／`log`／`show`／`branch`／`fetch`）；`npm run build` 與相依套件安裝；
以及 `src/`、`automation/`、`12_Brand_Knowledge/`、`13_SOP_Workflows/` 四個目錄的檔案編輯。

> 編輯網站原始碼屬於綠燈，是因為**上線的關卡在部署那一步**，不在編輯這一步。
> 改壞了可以用 git 還原；真正不可逆的是推上 main 之後的自動部署。

### 🟡 等待 Ellie 核准 → `permissions.ask`

對外送出、寫入外部系統、讓網站上線——每次都會跳出確認。

- **上線**：`mcp__github__merge_pull_request`（合併即觸發 `deploy.yml`）、`git merge`
- **寄信**：Gmail 的 `send_message`／`reply`／`forward`／`create_draft`
- **行事曆**：`create_event`／`update_event`／`delete_event`
- **外部文件**：Notion 建立與更新頁面、Google Drive 建立／更新／分享檔案
- **繞過 PR 直接寫 GitHub**：`create_or_update_file`、`push_files`

### 🔴 不得自動執行 → `permissions.deny`

技術上直接封死，在工作階段中無法臨時放行。

- **金鑰**：讀寫任何 `.env`、`.env.*`、`*credentials*.json`
- **改寫歷史**：`git push --force`、`git push -f`
- **刪除資料**：Gmail 丟進垃圾桶、Google Drive 丟進垃圾桶、GitHub 刪檔

---

## Hook 關卡

### PreToolUse — `guard-dangerous-bash.sh`

權限規則是比對工具與參數前綴，遇到「同一個指令要看上下文才知道危不危險」
就不夠用。這支 hook 補上那一段，每次執行 Bash 前檢查：

| 指令樣態 | 判定 | 理由 |
| --- | --- | --- |
| `git push ... main` | **deny** | 會觸發 `deploy.yml`，等於未經核准就讓網站上線。要走分支＋PR。 |
| `git push --force` / `-f` | **deny** | 覆寫遠端歷史，會讓別人的 checkout 失效。 |
| `rm -rf` | **ask** | 遞迴刪除不可逆，確認範圍再放行。 |
| `git reset --hard` / `git clean -f` | **ask** | 丟棄未提交的修改，無法復原。 |
| `curl -X POST/PUT/PATCH/DELETE`、`curl --data` | **ask** | 把資料送到外部服務，屬於對外動作。 |

其餘指令一律放行，不輸出任何東西。

**防誤判**：這支 hook 首次上線就踩到一個誤判——commit 訊息裡「提到」`git push --force`
這幾個字，整個指令就被當成強制推送擋下來。因此加上兩層保護：

1. **剝除 heredoc 內容**再比對。commit 訊息、文件內文提到危險指令時，那是資料不是指令。
2. **每條規則錨定在指令起始位置**（行首，或 `;` `&` `|` 之後），避免字串中間巧合比對。

測試涵蓋 21 個案例（6 擋、5 詢問、8 放行，另加 heredoc 提到危險指令要放行、
heredoc 結束後的危險指令仍要擋下兩個情境），全部通過。修改 hook 後請重跑：

```
bash .claude/hooks/guard-dangerous-bash.sh < <(jq -nc '{tool_name:"Bash",tool_input:{command:"git push origin main"}}')
```

### PostToolUse — `audit-log.sh`

每次工具執行後追加一行 JSON 到 `.claude/logs/audit-YYYY-MM.jsonl`：

```json
{"ts":"2026-09-19T02:31:47Z","session":"sess_abc","tool":"Bash","target":"npm run build","ok":true}
```

只記**摘要**，不記全文：檔案內容、郵件內文、API 回應都可能含個資或金鑰，
所以只取工具名稱與一個識別性欄位（指令／檔案路徑／網址／PR 編號），並截斷至
300 字元。紀錄留在本機、不進版控。

查看最近 20 筆：

```
tail -20 .claude/logs/audit-$(date -u +%Y-%m).jsonl | jq .
```

查某一天動過哪些檔案：

```
jq -r 'select(.ts | startswith("2026-09-19")) | select(.tool=="Edit" or .tool=="Write") | .target' \
  .claude/logs/audit-2026-09.jsonl | sort -u
```

---

## 啟用方式

這些設定是**專案層級**的，跟著 repo 走。在本機 `git pull` 之後：

1. 在該專案開一個新的 Claude Code 工作階段（或在現有階段開啟一次 `/hooks` 選單重新載入設定）
2. `/hooks` 可以檢視、編輯或停用這些 hook

設定檔在工作階段啟動時就不存在的話，設定監看器不會監看該目錄——
所以**建立當下的那個工作階段不會生效**，要重新啟動。

---

## 這套規則擋不住什麼

寫清楚比假裝完整重要：

1. **只在 Claude Code 讀得到這個 repo 時有效。** 在別的目錄、別的工具、或直接
   在終端機手動下指令，這些規則一概不適用。
2. **不是資安邊界。** 這是作業流程的護欄，防的是「AI 誤判」與「手滑」，
   不是防惡意攻擊。真正的金鑰保護仍然靠 Google／Cloudflare／GitHub 各自的權限設定。
3. **角色的工具白名單仍未技術化。** 儀表板上 12 個角色卡的「不能做」，目前
   還是靠遵守，不是靠程式限制——那需要 `.claude/agents/` 的子代理定義，尚未建立。
4. **稽核紀錄可以被刪除。** `.claude/logs/` 是本機檔案，沒有防竄改機制。
   它的用途是事後回溯，不是舉證。

---

## 修改規則

- 權限：直接改 `.claude/settings.json` 的 `allow`／`ask`／`deny` 陣列
- Hook 判斷邏輯：改 `.claude/hooks/*.sh`，改完用管道測試驗證：

```
echo '{"tool_name":"Bash","tool_input":{"command":"git push origin main"}}' \
  | bash .claude/hooks/guard-dangerous-bash.sh
```

應該輸出 `permissionDecision: "deny"`。
