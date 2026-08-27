#!/usr/bin/env python3
"""
Meta 廣告唯讀報表查詢（Ads Insights API）—— 給 analytics-agent 用，拉即時廣告花費／成效數字。

用法:
  python3 automation/meta_ads_report.py --days 7
  python3 automation/meta_ads_report.py --days 30 --level campaign
  python3 automation/meta_ads_report.py --days 7 --fields spend,impressions,clicks,actions

第一次使用前，先看 automation/META_ADS_SETUP.md 設定 token。

需要的環境變數（寫在 automation/.env，程式會自動讀取）:
  META_AD_ACCOUNT_ID   廣告帳號 ID（有沒有 act_ 前綴都可以）
  META_ACCESS_TOKEN    有 ads_read 權限的存取權杖

只呼叫 Graph API 的 /insights 端點讀資料，不會動到廣告本身的任何設定。

需要先安裝: pip3 install -r automation/requirements.txt
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("缺少 requests 套件，先執行：pip3 install -r automation/requirements.txt")

GRAPH_API_VERSION = "v20.0"
GRAPH_API_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"

DEFAULT_FIELDS = [
    "spend",
    "impressions",
    "reach",
    "clicks",
    "cpc",
    "cpm",
    "ctr",
    "actions",
    "cost_per_action_type",
]

LEVEL_NAME_FIELD = {
    "campaign": "campaign_name",
    "adset": "adset_name",
    "ad": "ad_name",
}


def load_env_file():
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def main():
    load_env_file()

    parser = argparse.ArgumentParser(description="Meta 廣告唯讀報表查詢")
    parser.add_argument("--days", type=int, default=30, help="回溯天數（預設 30）")
    parser.add_argument(
        "--level",
        default="account",
        choices=["account", "campaign", "adset", "ad"],
        help="彙總層級（預設 account）",
    )
    parser.add_argument("--fields", default=",".join(DEFAULT_FIELDS), help="逗號分隔的欄位")
    args = parser.parse_args()

    account_id = os.environ.get("META_AD_ACCOUNT_ID")
    access_token = os.environ.get("META_ACCESS_TOKEN")

    if not account_id or not access_token:
        sys.exit(
            "缺少 META_AD_ACCOUNT_ID 或 META_ACCESS_TOKEN。\n"
            "請照 automation/META_ADS_SETUP.md 設定好之後填進 automation/.env。"
        )

    if not account_id.startswith("act_"):
        account_id = f"act_{account_id}"

    fields = args.fields
    name_field = LEVEL_NAME_FIELD.get(args.level)
    if name_field and name_field not in fields:
        fields = f"{name_field},{fields}"

    params = {
        "level": args.level,
        "fields": fields,
        "time_range": json.dumps(
            {
                "since": (date.today() - timedelta(days=args.days)).isoformat(),
                "until": date.today().isoformat(),
            }
        ),
        "access_token": access_token,
    }

    resp = requests.get(f"{GRAPH_API_BASE}/{account_id}/insights", params=params)
    data = resp.json()

    if "error" in data:
        err = data["error"]
        sys.exit(
            f"Meta API 錯誤：{err.get('message')}"
            f"（code {err.get('code')}, type {err.get('type')}）\n"
            "常見原因：token 沒有 ads_read 權限、或這個 App／系統使用者沒被加進廣告帳號的檢視名單。"
            "詳見 automation/META_ADS_SETUP.md。"
        )

    rows = data.get("data", [])
    if not rows:
        print(f"近 {args.days} 天沒有廣告花費資料。")
        return

    for row in rows:
        print(json.dumps(row, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
