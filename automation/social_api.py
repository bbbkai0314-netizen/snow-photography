"""
共用的 FB / IG / Notion 官方 API 呼叫邏輯。
被兩個地方 import：
  - ig_content_pipeline.py（本機終端機手動跑，含 git push 圖片的步驟）
  - publish_social.py（GitHub Actions 用，圖片網址已經是公開的，不做任何 git 操作）
"""

from __future__ import annotations

import os
import sys
import time

import requests

GRAPH_API_VERSION = "v20.0"
GRAPH_API_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"

# Notion 資料庫的屬性名稱 —— 如果你的資料庫欄位名稱不同，改這裡就好。
NOTION_PROPS = {
    "title": "標題",       # type: title
    "image_url": "圖片網址",  # type: url
    "caption": "文案",      # type: rich_text
    "fb_post_id": "FB Post ID",  # type: rich_text
    "ig_media_id": "IG Media ID",  # type: rich_text
}


def require_env(*names: str) -> dict[str, str]:
    values = {}
    missing = []
    for name in names:
        value = os.environ.get(name)
        if not value:
            missing.append(name)
        else:
            values[name] = value
    if missing:
        sys.exit(
            "缺少環境變數: " + ", ".join(missing) +
            "\n請參考 automation/SOCIAL_AUTOMATION_SETUP.md 設定"
        )
    return values


def graph_error(resp: requests.Response) -> str:
    try:
        err = resp.json().get("error", {})
        return f"{err.get('message', resp.text)} (code={err.get('code')}, type={err.get('type')})"
    except Exception:
        return resp.text


def post_to_facebook(image_url: str, caption: str) -> str:
    env = require_env("FB_PAGE_ID", "FB_PAGE_ACCESS_TOKEN")
    url = f"{GRAPH_API_BASE}/{env['FB_PAGE_ID']}/photos"
    resp = requests.post(url, data={
        "url": image_url,
        "caption": caption,
        "access_token": env["FB_PAGE_ACCESS_TOKEN"],
    }, timeout=30)
    if resp.status_code >= 300:
        sys.exit(f"Facebook 發文失敗: {graph_error(resp)}")
    post_id = resp.json().get("post_id") or resp.json().get("id")
    print(f"已發布到 Facebook 粉專 (post id: {post_id})")
    return post_id


def post_to_instagram(image_url: str, caption: str) -> str:
    env = require_env("IG_BUSINESS_ACCOUNT_ID", "FB_PAGE_ACCESS_TOKEN")
    ig_id = env["IG_BUSINESS_ACCOUNT_ID"]
    token = env["FB_PAGE_ACCESS_TOKEN"]

    container_resp = requests.post(f"{GRAPH_API_BASE}/{ig_id}/media", data={
        "image_url": image_url,
        "caption": caption,
        "access_token": token,
    }, timeout=30)
    if container_resp.status_code >= 300:
        sys.exit(f"Instagram 建立媒體容器失敗: {graph_error(container_resp)}")
    creation_id = container_resp.json()["id"]

    for _ in range(15):
        status_resp = requests.get(f"{GRAPH_API_BASE}/{creation_id}", params={
            "fields": "status_code",
            "access_token": token,
        }, timeout=15)
        status = status_resp.json().get("status_code")
        if status == "FINISHED":
            break
        if status == "ERROR":
            sys.exit("Instagram 處理媒體容器失敗（status_code=ERROR），請確認圖片網址可公開存取")
        time.sleep(2)

    publish_resp = requests.post(f"{GRAPH_API_BASE}/{ig_id}/media_publish", data={
        "creation_id": creation_id,
        "access_token": token,
    }, timeout=30)
    if publish_resp.status_code >= 300:
        sys.exit(f"Instagram 發布失敗: {graph_error(publish_resp)}")
    media_id = publish_resp.json().get("id")
    print(f"已發布到 Instagram (media id: {media_id})")
    return media_id


def log_to_notion(title: str, image_url: str, caption: str, fb_post_id: str | None, ig_media_id: str | None):
    token = os.environ.get("NOTION_TOKEN")
    database_id = os.environ.get("NOTION_DATABASE_ID")
    if not token or not database_id:
        print("未設定 NOTION_TOKEN / NOTION_DATABASE_ID，略過 Notion 紀錄")
        return

    properties = {
        NOTION_PROPS["title"]: {"title": [{"text": {"content": title}}]},
        NOTION_PROPS["image_url"]: {"url": image_url},
        NOTION_PROPS["caption"]: {"rich_text": [{"text": {"content": caption[:2000]}}]},
    }
    if fb_post_id:
        properties[NOTION_PROPS["fb_post_id"]] = {"rich_text": [{"text": {"content": fb_post_id}}]}
    if ig_media_id:
        properties[NOTION_PROPS["ig_media_id"]] = {"rich_text": [{"text": {"content": ig_media_id}}]}

    resp = requests.post(
        "https://api.notion.com/v1/pages",
        headers={
            "Authorization": f"Bearer {token}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
        },
        json={"parent": {"database_id": database_id}, "properties": properties},
        timeout=30,
    )
    if resp.status_code >= 300:
        # Notion 寫入失敗不擋整個流程（可能是欄位名稱跟 NOTION_PROPS 對不上），只提醒
        print(f"Notion 紀錄寫入失敗（不影響已發布的貼文）: {resp.text}")
    else:
        print("已寫入 Notion 紀錄")
