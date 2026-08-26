#!/usr/bin/env python3
"""
GA4 唯讀報表查詢 —— 給 analytics-agent 用，拉即時流量／轉換數字。

用法:
  python3 automation/ga4_report.py snowsurfstudio --days 7
  python3 automation/ga4_report.py mwc --days 30 --dimension pagePath

服務帳戶金鑰: automation/ga4-service-account.json（已加進 .gitignore，不會進 git）。
這組服務帳戶（ga4-reader@snowsurfstudio.iam.gserviceaccount.com）在兩個品牌的
GA4 Property 都只有「檢視者」權限，改不了任何設定，只能讀報表。

需要先安裝: pip3 install --user google-analytics-data
"""

from __future__ import annotations

import argparse
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_PATH = os.path.join(SCRIPT_DIR, "ga4-service-account.json")

PROPERTIES = {
    "snowsurfstudio": "548886744",
    "mwc": "549916080",
}

DEFAULT_METRICS = ["activeUsers", "screenPageViews", "conversions"]


def main():
    parser = argparse.ArgumentParser(description="GA4 唯讀報表查詢")
    parser.add_argument("brand", choices=PROPERTIES.keys(), help="snowsurfstudio 或 mwc")
    parser.add_argument("--days", type=int, default=7, help="回溯天數（預設 7）")
    parser.add_argument("--dimension", default="date", help="維度，例如 date／pagePath／sessionDefaultChannelGroup")
    parser.add_argument("--metrics", default=",".join(DEFAULT_METRICS), help="逗號分隔的指標")
    args = parser.parse_args()

    if not os.path.exists(KEY_PATH):
        sys.exit(f"找不到服務帳戶金鑰: {KEY_PATH}\n請確認 automation/ga4-service-account.json 存在。")

    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = KEY_PATH

    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric

    client = BetaAnalyticsDataClient()
    metric_names = [m.strip() for m in args.metrics.split(",")]

    request = RunReportRequest(
        property=f"properties/{PROPERTIES[args.brand]}",
        dimensions=[Dimension(name=args.dimension)],
        metrics=[Metric(name=m) for m in metric_names],
        date_ranges=[DateRange(start_date=f"{args.days}daysAgo", end_date="today")],
    )
    response = client.run_report(request)

    header = args.dimension + "\t" + "\t".join(metric_names)
    print(header)
    for row in response.rows:
        dim = row.dimension_values[0].value
        values = [mv.value for mv in row.metric_values]
        print(dim + "\t" + "\t".join(values))


if __name__ == "__main__":
    main()
