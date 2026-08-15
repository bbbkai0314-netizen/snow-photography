# 後台上線設定指南

後台網址：

```
https://bbbkai0314-netizen.github.io/snow-photography/admin/
```

登入用的是 GitHub 的「個人存取權杖」（Personal Access Token），不需要 Cloudflare、不需要架設任何中介服務——單純產生一組權杖貼到後台登入畫面即可，改動內容會直接變成 GitHub 上的一次 commit。

## 步驟 1：產生一組 GitHub 權杖

後台登入畫面上有「前往 GitHub 產生登入權杖 →」按鈕，點下去會開 GitHub 官方頁面，並且已經幫你把權杖名稱、用途說明、「內容讀寫」權限都填好了，你只需要：

1. 確認頁面上「Repository access」選「Only select repositories」，選 `bbbkai0314-netizen/snow-photography`
2. 往下捲到最下面，點「Generate token」
3. 畫面上會顯示一長串以 `github_pat_` 開頭的字串——**這是唯一一次會顯示完整內容**，複製起來

## 步驟 2：登入後台

1. 打開 `https://bbbkai0314-netizen.github.io/snow-photography/admin/`
2. 把剛剛複製的權杖貼到登入畫面欄位，按「登入」
3. 成功的話會看到「封面」「作品集」「拍攝方案」「部落格文章」「自動化」五個入口

權杖會存在瀏覽器本機（localStorage），下次打開後台不用重貼；如果在別台電腦或換瀏覽器，就要重新貼一次。

## 後台介面說明

- **封面**：首頁地區文字、封面圖、關於我們段落、社群連結（Facebook / Instagram / 脆 Threads / LINE，留空就不會顯示該圖示）、SEO 設定、首頁最新消息。
- **作品集**：新增/刪除/排序照片。
- **拍攝方案**：每個方案是一個獨立頁面，可編輯內容區塊、進階群組、SEO。
- **部落格文章**：文章基本資料用表單填寫；內文用視覺化畫布編輯（拖曳「文字段落」「圖文區塊」「HTML 自訂」三種區塊到畫布中，直接點擊文字修改，畫布套用網站真正的樣式，看到的就是發布後的樣子）。文章編輯頁下方有「分享」面板，可以一鍵複製貼文文字、開啟脆/Facebook 的分享頁面貼上發布，Instagram 因為官方沒有提供網頁版預填文字的分享入口，會複製文字後開啟 Instagram 讓你自己貼上。

脆（Threads）沒有串接自動發文 API——官方沒有提供這類串接管道，所以維持「幫你把內容準備好、一鍵開啟分享頁」，實際送出由你自己按。

Facebook 粉專跟 Instagram 商業帳號則有串接：後台多了一個「自動化」頁面，上傳圖片＋填文案按發布，會直接呼叫 Meta 官方 Graph API 發文，不需要每次手動貼。這不是透過 Make.com 或其他第三方服務，而是觸發一個 GitHub Actions workflow 在 GitHub 自己的伺服器上執行，授權金鑰存成 GitHub Actions Secrets，不會出現在瀏覽器或原始碼裡。第一次使用前的設定步驟在 [automation/SOCIAL_AUTOMATION_SETUP.md](automation/SOCIAL_AUTOMATION_SETUP.md)。

如果卡在某一步，把看到的畫面或錯誤訊息貼給我，我幫你排查。
