#!/usr/bin/env python3
"""
網站/FB/IG 內容發布管線（本機終端機用）—— 不透過 Make.com 或任何第三方服務，直接呼叫官方 Graph API。

流程：
  1. 把圖片放進 repo 的 content-queue/，git push 到 GitHub，取得公開網址
  2. 直接呼叫 Facebook Graph API，發布到粉專
  3. 直接呼叫 Instagram Graph API（Content Publishing），發布到 IG 商業帳號
  4. 直接呼叫 Notion API，寫入一筆內容紀錄（選用，沒設定 NOTION_TOKEN 就跳過）

第一次使用前，先看 automation/SOCIAL_AUTOMATION_SETUP.md 設定 token。
（如果你是從 admin 後台的「自動化」頁面觸發，走的是 .github/workflows/social-publish.yml
  + publish_social.py，不是這支腳本——這支是給本機終端機手動跑的版本。）

用法:
  python3 automation/ig_content_pipeline.py <圖片路徑> [文案txt路徑] [--skip-fb] [--skip-ig] [--skip-notion]

沒給文案檔的話會進入互動模式，貼上文案後另起一行輸入 END 結束。

需要的環境變數（寫在 automation/.env，程式會自動讀取）:
  FB_PAGE_ID              Facebook 粉專 ID
  FB_PAGE_ACCESS_TOKEN    粉專的 Page Access Token（長效不過期）
  IG_BUSINESS_ACCOUNT_ID  連結該粉專的 IG 商業帳號 ID
  NOTION_TOKEN            Notion Internal Integration Token（選用）
  NOTION_DATABASE_ID      Notion 資料庫 ID（選用，需搭配 NOTION_TOKEN）
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
import time
import unicodedata
import uuid
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import requests
except ImportError:
    sys.exit("缺少 requests 套件，先執行：pip3 install -r automation/requirements.txt")

from social_api import log_to_notion, post_to_facebook, post_to_instagram

REPO_ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = REPO_ROOT / "content-queue"


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


def run(cmd, cwd=REPO_ROOT):
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        sys.exit(f"指令失敗: {' '.join(cmd)}\n{result.stderr}")
    return result.stdout.strip()


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE).strip().lower()
    text = re.sub(r"[\s_-]+", "-", text)
    return text[:40] or uuid.uuid4().hex[:8]


def read_caption(caption_arg: str | None) -> str:
    if caption_arg:
        path = Path(caption_arg)
        if not path.exists():
            sys.exit(f"找不到文案檔案: {caption_arg}")
        return path.read_text(encoding="utf-8").strip()

    print("貼上文案，貼完後另起一行輸入 END 並按 Enter：")
    lines = []
    for line in sys.stdin:
        if line.strip() == "END":
            break
        lines.append(line.rstrip("\n"))
    caption = "\n".join(lines).strip()
    if not caption:
        sys.exit("文案不能是空的")
    return caption


def push_image_to_github(image_path: Path, slug: str) -> str:
    if not image_path.exists():
        sys.exit(f"找不到圖片: {image_path}")

    CONTENT_DIR.mkdir(exist_ok=True)
    today = date.today().isoformat()
    dest_name = f"{today}-{slug}{image_path.suffix.lower()}"
    dest_path = CONTENT_DIR / dest_name
    dest_path.write_bytes(image_path.read_bytes())

    run(["git", "add", str(dest_path.relative_to(REPO_ROOT))])
    status = run(["git", "status", "--porcelain"])
    if status:
        run(["git", "commit", "-m", f"Add content queue image: {dest_name}"])
        run(["git", "push"])
        print(f"已 push 圖片: {dest_name}")
        # GitHub raw CDN 剛 push 完偶爾要幾秒才會生效，等一下避免 FB/IG 抓圖失敗
        time.sleep(4)
    else:
        print("圖片內容跟已存在的檔案相同，略過 commit")

    remote_url = run(["git", "config", "--get", "remote.origin.url"])
    branch = run(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    owner_repo = remote_url.rstrip(".git").split("github.com")[-1].strip(":/")
    raw_url = f"https://raw.githubusercontent.com/{owner_repo}/{branch}/content-queue/{dest_name}"
    return raw_url


def main():
    parser = argparse.ArgumentParser(description="發布圖片+文案到 FB / IG，並選擇性寫入 Notion")
    parser.add_argument("image_path", help="圖片路徑")
    parser.add_argument("caption_path", nargs="?", default=None, help="文案 txt 路徑（不給則互動輸入）")
    parser.add_argument("--skip-fb", action="store_true", help="不發布到 Facebook")
    parser.add_argument("--skip-ig", action="store_true", help="不發布到 Instagram")
    parser.add_argument("--skip-notion", action="store_true", help="不寫入 Notion")
    args = parser.parse_args()

    load_env_file()

    image_path = Path(args.image_path).expanduser().resolve()
    caption = read_caption(args.caption_path)

    title = caption.splitlines()[0][:60] if caption else image_path.stem
    slug = slugify(title)

    print("1/3 上傳圖片到 GitHub …")
    image_url = push_image_to_github(image_path, slug)
    print(f"圖片網址: {image_url}")

    fb_post_id = None
    ig_media_id = None

    if not args.skip_fb:
        print("2/3 發布到 Facebook …")
        fb_post_id = post_to_facebook(image_url, caption)
    else:
        print("2/3 已跳過 Facebook")

    if not args.skip_ig:
        print("3/3 發布到 Instagram …")
        ig_media_id = post_to_instagram(image_url, caption)
    else:
        print("3/3 已跳過 Instagram")

    if not args.skip_notion:
        log_to_notion(title, image_url, caption, fb_post_id, ig_media_id)

    print("\n完成！")


if __name__ == "__main__":
    main()
