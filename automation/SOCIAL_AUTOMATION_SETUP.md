# 自動發布到 FB / IG — 一次性設定教學

這份設定不依賴 Make.com 或任何第三方服務，全部是官方 Facebook/Instagram Graph API + 一組長效 token。
設定完之後，token 基本上不會過期，之後發布有兩種方式：

- **在 admin 後台的「自動化」頁面**：上傳圖片、寫文案、按發布——這是網頁介面，實際發文動作
  是觸發一個 GitHub Actions workflow（`.github/workflows/social-publish.yml`）在 GitHub 的伺服器上執行，
  token 存成 **GitHub Actions Secrets**，不會出現在瀏覽器裡（推薦日常使用這個）
- **本機終端機**：`python3 automation/ig_content_pipeline.py`，token 存在 `automation/.env`（跟你的 GitHub PAT 一樣的模式）

因為只授權給你自己（不會有其他人用這個 App 登入），全程停留在 Facebook App 的「Development 模式」
就可以無限期使用，不需要送審、不需要商業驗證。

## 步驟 1：建立 Facebook App

1. 前往 https://developers.facebook.com/apps ，登入你平常管理粉專的那個 FB 帳號
2. 「建立應用程式」→ 類型選 **Business**
3. 應用程式名稱隨便取（例如 `snowsurfstudio-automation`），不用填聯絡信箱以外的東西
4. 建立完成後，記下左上角的 **App ID** 和「設定 → 基本資料」裡的 **App 密鑰**（App Secret，要按「顯示」）

## 步驟 2：用 Graph API Explorer 拿使用者權杖

1. 前往 https://developers.facebook.com/tools/explorer/
2. 右上角「Meta App」選你剛建立的 App
3. 「使用者或頁面」選 **取得使用者存取權杖**，勾選以下權限：
   - `pages_show_list`
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`
4. 按「產生存取權杖」，跳出視窗選你自己、勾同意，會拿到一組**短效**（1小時）User Token，先複製起來

## 步驟 3：換成長效 User Token（60 天）

在終端機執行（把 `{app-id}` `{app-secret}` `{短效token}` 換成你實際的值）：

```bash
curl -s "https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id={app-id}&client_secret={app-secret}&fb_exchange_token={短效token}"
```

回傳的 `access_token` 就是長效 User Token，可以用 60 天。

## 步驟 4：換出「永久有效」的粉專 Page Access Token

用長效 User Token 換粉專清單：

```bash
curl -s "https://graph.facebook.com/v20.0/me/accounts?access_token={長效User Token}"
```

回傳會列出你管理的所有粉專，每個粉專物件裡有：
- `id` → 這是 `FB_PAGE_ID`
- `access_token` → 這是 `FB_PAGE_ACCESS_TOKEN`（用長效 User Token 換出來的 Page Token，只要你不撤銷授權、不改密碼，**不會過期**）

## 步驟 5：拿 IG 商業帳號 ID

```bash
curl -s "https://graph.facebook.com/v20.0/{FB_PAGE_ID}?fields=instagram_business_account&access_token={FB_PAGE_ACCESS_TOKEN}"
```

回傳的 `instagram_business_account.id` 就是 `IG_BUSINESS_ACCOUNT_ID`。

## 步驟 6a：要用 admin 後台「自動化」頁面 → 存成 GitHub Actions Secrets

到 repo 的 **Settings → Secrets and variables → Actions → New repository secret**，新增以下 5 組
（名稱要完全一致）：

```
FB_PAGE_ID
FB_PAGE_ACCESS_TOKEN
IG_BUSINESS_ACCOUNT_ID
NOTION_TOKEN            （選用）
NOTION_DATABASE_ID      （選用）
```

如果電腦上有裝 `gh` CLI 且已登入，也可以直接在終端機做（會用互動方式安全輸入，不會顯示在螢幕或指令紀錄裡）：

```bash
gh secret set FB_PAGE_ID
gh secret set FB_PAGE_ACCESS_TOKEN
gh secret set IG_BUSINESS_ACCOUNT_ID
```

設定好之後，打開 admin 後台的「自動化」頁面即可使用（如果你的登入權杖是舊的、沒有 Actions 權限，
會在按發布時跳出提示——照提示到 GitHub 權杖設定頁把「Actions」權限改成 Read and write 即可）。

## 步驟 6b：要用本機終端機 → 填進 `automation/.env`

```
FB_PAGE_ID=xxxxxxxxxx
FB_PAGE_ACCESS_TOKEN=xxxxxxxxxx
IG_BUSINESS_ACCOUNT_ID=xxxxxxxxxx
```

（`NOTION_TOKEN` / `NOTION_DATABASE_ID` 沿用原本的，`MAKE_WEBHOOK_URL` 可以刪掉不用了。）

```bash
python3 automation/ig_content_pipeline.py <圖片路徑> [文案txt路徑]
```

會依序：push 圖片到 GitHub 拿公開網址 → 發布到 FB 粉專 → 發布到 IG → （如果有設定 Notion）寫一筆紀錄。
想跳過某個平台可以加參數，例如只發 FB 不發 IG：

```bash
python3 automation/ig_content_pipeline.py <圖片路徑> --skip-ig
```

## Token 什麼時候會失效

- 如果你在 FB 帳號設定裡「移除」這個 App 的授權
- 如果你改了 FB 密碼（部分情況會讓長效 token 失效）
- Meta 偶爾會做安全性相關的強制重新驗證

失效的話症狀是腳本回報 `access token` 相關錯誤，回到步驟 2 重新走一次即可（步驟 1 的 App 不用重建）。
