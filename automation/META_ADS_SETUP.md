# Meta 廣告數據唯讀查詢 — 一次性設定教學

跟 GA4 那組服務帳戶同一個精神：設定一次、之後直接用終端機指令查即時廣告花費／成效，
不用每次到 Ads Manager 手動匯出。全部走官方 Marketing API，只讀不寫，不會動到任何廣告設定。

沿用你在 `SOCIAL_AUTOMATION_SETUP.md` 步驟 1 建立的那個 Facebook App
（例如 `snowsurfstudio-automation`），不用另外建立新 App。

## 步驟 1：確認你的廣告帳號在哪個 Business 底下

前往 https://business.facebook.com/settings/ad-accounts ，找到 SnowSurfStudio 在投放的廣告帳號，
記下網址列或列表裡的 **廣告帳號 ID**（格式像 `123456789012345`，有時會顯示成 `act_123456789012345`）。

## 步驟 2：判斷要走哪一種 token

- **有 Business Manager**（步驟 1 那個頁面看得到「系統使用者」設定）→ 走 **方法 A**，token 永久有效，設定一次不用再管。
- **沒有 Business Manager，只是個人廣告帳號** → 走 **方法 B**，token 60 天會過期，之後每 60 天要重新換一次（症狀：腳本回報 token 過期，回到方法 B 重做一次即可）。

---

## 方法 A：系統使用者 Token（推薦，永久有效）

1. 前往 https://business.facebook.com/settings/system-users
2. 「新增」→ 建立一個系統使用者，角色選 **管理員**，名稱隨便取（例如 `ads-readonly`）
3. 建立完成後，點這個系統使用者 →「新增資產」→ 選你的**廣告帳號**，權限勾 **檢視**
4. 再點「產生新的權杖」：
   - **App 一定要選 SnowSurfStudio 自己的那個（例如 `snowsurfstudio-automation`）**，不是 MWC 的
     `morningworkclub-automation`——兩品牌的 App／token 依 owner 規定要完全分開，選錯不會報錯，
     但等於違反這條隔離規則，日後也可能因為 MWC 那邊的 App 變動而牽連到 SnowSurfStudio 的廣告查詢
   - 權限勾 `ads_read`
   - 到期日選 **絕不過期**
5. 產生後立刻複製（只會顯示一次），這就是 `META_ACCESS_TOKEN`

## 方法 B：長效使用者 Token（60 天，需定期更新）

1. 前往 https://developers.facebook.com/tools/explorer/
2. 右上角「Meta App」選你的 App
3. 「使用者或頁面」選 **取得使用者存取權杖**，勾選 `ads_read`
4. 按「產生存取權杖」，跳出視窗選你自己、同意，拿到短效（1小時）token
5. 換成長效版（把 `{app-id}` `{app-secret}` `{短效token}` 換成實際值，App ID／Secret 在
   `SOCIAL_AUTOMATION_SETUP.md` 步驟 1 已經記過）：

```bash
curl -s "https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id={app-id}&client_secret={app-secret}&fb_exchange_token={短效token}"
```

回傳的 `access_token` 就是 `META_ACCESS_TOKEN`，可以用 60 天。

---

## 步驟 3：填進 `automation/.env`

```
META_AD_ACCOUNT_ID=act_123456789012345
META_ACCESS_TOKEN=xxxxxxxxxx
```

（`act_` 開頭可以不加，腳本會自動補上。）

## 步驟 4：測試

```bash
python3 automation/meta_ads_report.py --days 7
```

正常會印出這 7 天的花費、曝光、點擊、轉換等數字（JSON 格式，一個廣告帳號層級一筆）。
如果回報 `access token` 或 `permissions` 相關錯誤，通常是：

- token 貼錯或漏了 `ads_read` 權限 → 回步驟 2 重新產生
- 這個 App 或系統使用者沒有被加進廣告帳號的「檢視」名單 → 回方法 A 步驟 3 / 方法 B 步驟 3 確認

## Token 什麼時候會失效

- 方法 A（系統使用者，絕不過期）：只有你自己去 Business 設定裡撤銷這個系統使用者的資產存取權，或整個系統使用者被刪除
- 方法 B（長效使用者 token）：滿 60 天，或你改了 FB 密碼、移除 App 授權
