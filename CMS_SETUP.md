# 後台上線設定指南

網站的程式碼部分已經完成，剩下這幾個步驟需要用**你自己的 GitHub 帳號**操作，我沒辦法代勞。跟著做，大約 5 分鐘可以完成。完成後，後台網址會是：

```
https://bbbkai0314-netizen.github.io/snow-photography/admin/
```

後台登入用的是 GitHub 的「個人存取權杖」（Personal Access Token），不需要 Cloudflare、不需要架設任何中介服務——單純產生一組權杖貼到後台登入畫面即可。

---

## 步驟 1：產生一組 GitHub 權杖

1. 登入 GitHub，前往 <https://github.com/settings/personal-access-tokens/new>（這是「Fine-grained tokens」頁面，比舊版的權杖更安全，可以只授權單一個 repo）
2. 填寫：
   - **Token name**：SnowSurfStudio 後台（隨意）
   - **Expiration**：建議選 90 天或自訂一年，到期後回來重新產生一組即可
   - **Repository access**：選「**Only select repositories**」，選擇 `bbbkai0314-netizen/snow-photography`
3. 展開「**Repository permissions**」，把「**Contents**」這一項改成「**Read and write**」（其他保持預設不動即可）
4. 點最下面「Generate token」
5. 產生後畫面上會顯示一長串以 `github_pat_` 開頭的字串——**這是唯一一次會顯示完整內容，先複製起來存好**（例如存到密碼管理工具）

---

## 步驟 2：開通 GitHub Pages 的「GitHub Actions」部署來源

這一步我可以直接幫你在 repo 設定裡切換（會先跟你確認一次），或你也可以自己動手：

1. 前往 <https://github.com/bbbkai0314-netizen/snow-photography/settings/pages>
2. 「Build and deployment」→「Source」，從「Deploy from a branch」改成「**GitHub Actions**」

---

## 步驟 3：登入後台

1. 打開 `https://bbbkai0314-netizen.github.io/snow-photography/admin/`
2. 把步驟 1 複製的權杖貼到「GitHub 個人存取權杖」欄位，按「登入」
3. 成功的話會看到「封面」「作品集」「拍攝方案」「部落格文章」四張卡片

權杖會存在瀏覽器本機（localStorage），下次打開後台不用重貼；如果在別台電腦或換瀏覽器，就要重新貼一次。

如果卡在某一步，把看到的畫面或錯誤訊息貼給我，我幫你排查。

---

## 之後要換最新消息時

不用改程式碼，直接在後台「封面」→「最新消息」裡新增一則、把它的「顯示這則消息」打開，並把舊的那則關掉，按儲存即可。

---

## 後台介面說明

後台外觀是自己刻的網頁（不是 Decap CMS），排版跟前台一致，直接用你貼上的權杖呼叫 GitHub API 存檔，資料都直接進你的 GitHub repo，跟任何第三方服務無關。

`cloudflare-worker/` 資料夾是舊版（OAuth 彈出視窗登入）留下的檔案，現在的登入方式已經不會用到它，可以留著不管、或之後想清理的話直接刪掉都沒關係，不影響網站或後台運作。
