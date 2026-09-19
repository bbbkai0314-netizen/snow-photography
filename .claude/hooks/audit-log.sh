#!/usr/bin/env bash
# SnowSurfStudio — PostToolUse 稽核留痕
#
# 每次工具實際執行後追加一行 JSON 到 .claude/logs/audit-YYYY-MM.jsonl，
# 留下「誰、何時、用什麼工具、做了什麼」的可追溯紀錄。
#
# 設計上刻意只記摘要不記全文：檔案內容、郵件內文、API 回應都可能含
# 個資或金鑰，因此每個欄位截斷至 300 字元，且只取已知的識別性欄位。
# 這份紀錄留在本機、不進版控（見 .gitignore）。

set -uo pipefail

root="${CLAUDE_PROJECT_DIR:-.}"
dir="$root/.claude/logs"
mkdir -p "$dir" 2>/dev/null || exit 0

jq -c \
  --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg session "${CLAUDE_SESSION_ID:-}" \
  '{
     ts: $ts,
     session: (if $session == "" then (.session_id // null) else $session end),
     tool: .tool_name,
     target: (
       .tool_input.command
       // .tool_input.file_path
       // .tool_input.url
       // .tool_input.pattern
       // .tool_input.pullNumber
       // .tool_input.query
       // null
     ),
     ok: (.tool_response.success // (if (.tool_response | type) == "object" then true else null end))
   }
   | .target = (if (.target | type) == "string" then (.target | gsub("[\n\r]"; " ") | .[0:300]) else .target end)' \
  >> "$dir/audit-$(date -u +%Y-%m).jsonl" 2>/dev/null || true

exit 0
