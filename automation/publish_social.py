#!/usr/bin/env python3
"""
給 GitHub Actions 用的發布腳本 —— 圖片網址已經是公開的（已經 push 到網站 repo 裡），
只呼叫 FB / IG / Notion API，不做任何 git 操作。

所有參數走環境變數（而不是 argv），這樣 admin 後台傳進來的文案內容
就不會被當成 shell 指令解析，避免 GitHub Actions 常見的 script injection 問題。

環境變數:
  IMAGE_URL     圖片公開網址（必填）
  CAPTION       文案（必填）
  SKIP_FB       "true" 就跳過 Facebook
  SKIP_IG       "true" 就跳過 Instagram
  SKIP_NOTION   "true" 就跳過 Notion

  FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN / IG_BUSINESS_ACCOUNT_ID / NOTION_TOKEN / NOTION_DATABASE_ID
  （由 GitHub Actions Secrets 注入，見 .github/workflows/social-publish.yml）
"""

from __future__ import annotations

import os
import sys

from social_api import log_to_notion, post_to_facebook, post_to_instagram


def is_true(value: str | None) -> bool:
    return (value or "").strip().lower() == "true"


def main():
    image_url = os.environ.get("IMAGE_URL", "").strip()
    caption = os.environ.get("CAPTION", "").strip()
    if not image_url or not caption:
        sys.exit("缺少 IMAGE_URL 或 CAPTION 環境變數")

    title = caption.splitlines()[0][:60] if caption else image_url

    fb_post_id = None
    ig_media_id = None

    if not is_true(os.environ.get("SKIP_FB")):
        print("發布到 Facebook …")
        fb_post_id = post_to_facebook(image_url, caption)
    else:
        print("已跳過 Facebook")

    if not is_true(os.environ.get("SKIP_IG")):
        print("發布到 Instagram …")
        ig_media_id = post_to_instagram(image_url, caption)
    else:
        print("已跳過 Instagram")

    if not is_true(os.environ.get("SKIP_NOTION")):
        log_to_notion(title, image_url, caption, fb_post_id, ig_media_id)

    print("完成！")


if __name__ == "__main__":
    main()
