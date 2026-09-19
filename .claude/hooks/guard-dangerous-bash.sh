#!/usr/bin/env bash
# SnowSurfStudio — PreToolUse 關卡（Bash）
#
# 對照儀表板「今日總覽」的三級權限，把其中「不得自動執行」與部分
# 「等待 Ellie 核准」的危險指令，變成真正擋得住的程式關卡。
#
# 輸入：Claude Code 由 stdin 傳入的 JSON（含 tool_input.command）
# 輸出：需要攔截時印出 permissionDecision JSON；放行則不輸出任何東西
# 結束碼一律 0 —— 決定權透過 JSON 傳達，不用 exit code
#
# 兩層防誤判（2026-09-19 首次實戰就踩到，因此加上）：
#   1. 先剝掉 heredoc 內容。commit 訊息與文件內文常會「提到」危險指令，
#      那是資料不是指令，不該被攔下來。
#   2. 每條規則都錨定在指令起始位置（行首，或 ; & | 之後），
#      避免與字串中間的內容巧合比對。

set -uo pipefail

payload="$(cat)"
cmd="$(printf '%s' "$payload" | jq -r '.tool_input.command // ""' 2>/dev/null)"
[ -z "$cmd" ] && exit 0

# 剝除 heredoc 內容，只留下真正會被 shell 當成指令執行的部分
scan="$(printf '%s\n' "$cmd" | awk '
  BEGIN { skip = 0; term = "" }
  {
    if (skip == 1) {
      t = $0
      sub(/^[ \t]+/, "", t); sub(/[ \t]+$/, "", t)
      if (t == term) { skip = 0 }
      next
    }
    print
    if (match($0, /<<-?[ \t]*(\047[^\047]+\047|"[^"]+"|[A-Za-z_][A-Za-z0-9_]*)/)) {
      m = substr($0, RSTART, RLENGTH)
      sub(/^<<-?[ \t]*/, "", m)
      gsub(/\047|"/, "", m)
      term = m; skip = 1
    }
  }')"

decide() {  # $1=allow|deny|ask  $2=理由
  jq -nc --arg d "$1" --arg r "$2" \
    '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:$d,permissionDecisionReason:$r}}'
  exit 0
}

hit() { printf '%s' "$scan" | grep -Eq "$1"; }

# 指令起始位置：行首，或 ; & | 之後
B='(^|[;&|])[[:space:]]*'
G="${B}git[[:space:]]+"

# ── 不得自動執行 ────────────────────────────────────────────────

# 直接推送 main：會觸發 deploy.yml，等於未經核准就把網站推上線
if hit "${G}push([[:space:]]+[^[:space:];&|]+)*[[:space:]]+main([[:space:]]|$)"; then
  decide deny "直接推送 main 會觸發正式網站部署。請改走「分支 → PR」流程，由 Ellie 決定合併與上線時機。"
fi

# 強制推送：覆寫遠端歷史
if hit "${G}push[[:space:]]+([^;&|]*[[:space:]]+)?(--force([[:space:]]|=|$)|-f([[:space:]]|$))"; then
  decide deny "強制推送會覆寫遠端歷史，可能讓其他人的 checkout 失效。需要重寫歷史時請 Ellie 親自處理。"
fi

# 遞迴刪除
if hit "${B}rm[[:space:]]+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)([[:space:]]|$)"; then
  decide ask "這會遞迴刪除檔案，屬於不可逆操作。請確認刪除範圍正確再放行。"
fi

# ── 等待核准 ───────────────────────────────────────────────────

# 丟棄本機未提交的修改
if hit "${G}(reset[[:space:]]+--hard|clean[[:space:]]+-[a-zA-Z]*f)"; then
  decide ask "這會丟棄尚未提交的修改，無法復原。確認沒有要保留的東西再放行。"
fi

# 對外送出資料
if hit "${B}curl[[:space:]][^;&|]*(-X[[:space:]]*(POST|PUT|PATCH|DELETE)|--data|[[:space:]]-d[[:space:]])"; then
  decide ask "這會把資料送到外部服務，屬於對外動作。請確認送出的內容與對象。"
fi

exit 0
