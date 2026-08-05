# 後台上線設定指南

網站的程式碼部分已經完成，剩下這幾個步驟需要用**你自己的帳號**登入操作，我沒辦法代勞。跟著做，大約 15–20 分鐘可以完成。完成後，後台網址會是：

```
https://bbbkai0314-netizen.github.io/snow-photography/admin/
```

---

## 步驟 1：建立 GitHub OAuth App

1. 登入 GitHub，前往 <https://github.com/settings/developers>
2. 點「OAuth Apps」→「New OAuth App」
3. 填寫：
   - **Application name**：SnowSurfStudio CMS（隨意）
   - **Homepage URL**：`https://bbbkai0314-netizen.github.io/snow-photography/`
   - **Authorization callback URL**：先隨便填 `https://example.com/callback`，**步驟 2 完成後回來改成正確的網址**
4. 點「Register application」
5. 記下這兩個值，等一下會用到：
   - **Client ID**（頁面上直接看得到）
   - **Client Secret**（點「Generate a new client secret」才會出現，只會顯示一次，記得先複製存起來）

---

## 步驟 2：部署 Cloudflare Worker（OAuth 中介）

1. 前往 <https://dash.cloudflare.com/>，沒有帳號就免費註冊一個（不用信用卡）
2. 左側選單找「Workers & Pages」→「Create」→「Create Worker」
3. 幫這個 Worker 取名，例如 `snowsurf-cms-auth`，建立後會拿到一個網址，長得像：
   `https://snowsurf-cms-auth.你的帳號.workers.dev`
   **把這個網址記下來**，下一步和步驟 3 都會用到
4. 點「Edit code」，把整個編輯器內容清空，貼上 [cloudflare-worker/worker.js](cloudflare-worker/worker.js) 這個檔案的內容，然後按「Deploy」
5. 回到 Worker 的設定頁，找「Settings」→「Variables and Secrets」，新增兩個 **Secret**（不是一般 Variable，選 Secret 才會加密）：
   - `GITHUB_CLIENT_ID` = 步驟 1 拿到的 Client ID
   - `GITHUB_CLIENT_SECRET` = 步驟 1 拿到的 Client Secret
6. 存檔

---

## 步驟 3：把兩邊網址串起來

1. 回到 GitHub OAuth App 設定頁（步驟 1 建立的那個），把 **Authorization callback URL** 改成：
   `https://snowsurf-cms-auth.你的帳號.workers.dev/callback`
   （記得換成你自己步驟 2 拿到的實際網址）存檔
2. 打開專案裡的 [src/admin/config.yml](src/admin/config.yml)，找到這一行：
   ```yaml
   base_url: "https://REPLACE-WITH-YOUR-WORKER-URL.workers.dev"
   ```
   把它改成你步驟 2 拿到的 Worker 網址（**不要加 `/callback`**，只要網址本身），存檔後告訴我，我幫你 commit 推上去。

---

## 步驟 4：開通 GitHub Pages 的「GitHub Actions」部署來源

這一步我可以直接幫你在 repo 設定裡切換（會先跟你確認一次），或你也可以自己動手：

1. 前往 <https://github.com/bbbkai0314-netizen/snow-photography/settings/pages>
2. 「Build and deployment」→「Source」，從「Deploy from a branch」改成「**GitHub Actions**」

---

## 步驟 5：測試登入

1. 打開 `https://bbbkai0314-netizen.github.io/snow-photography/admin/`
2. 點「使用你的 GitHub 帳號來進行登入」
3. 跳出 GitHub 授權畫面，同意後應該會自動關閉彈窗、回到後台，看到「部落格文章」「拍攝方案」「首頁文字內容」三個項目

如果卡在某一步，把看到的畫面或錯誤訊息貼給我，我幫你排查。

---

## 之後要換最新消息時

不用改程式碼，直接在後台「首頁文字內容」→「最新消息」裡新增一則、把它的「顯示這則消息」打開，並把舊的那則關掉，按發布即可。
