# UTM 命名規範與現成連結

> 2026-09-19 建立。依 CloudAD〈GA4 × Meta 數據解讀與轉換策略〉講義 p.26–30 整理。
> 目的：每個放出去的網址都帶同一套標記，GA4 才分得出「是誰把客人帶來的」。

## 規則（只有四條）

1. **全部小寫、用底線連接**。GA4 分大小寫：`LineOA` 和 `lineoa` 會被拆成兩個來源。
2. **三個欄位一定要填**：`utm_source`（從哪個平台）、`utm_medium`（什麼類型）、`utm_campaign`（哪一檔活動）。漏掉 `utm_campaign`，報表就沒辦法比較活動。
3. **參數名稱不要自己打**，從下面的表複製。拼錯（例如 `utm_souce`）GA4 認不出來，會變成 direct。
4. **同一檔活動只用一個名字**，格式是「年份季節_主題」，例如 `2026winter_hakuba`。不要同時出現 `MothersDay`、`母親節`、`mothers_day`。

## 固定用字

| 欄位 | 可以用的值 |
| --- | --- |
| `utm_source` | `instagram`、`facebook`、`threads`、`line`、`google`、`print`、合作夥伴英文名（例 `hakuba47`） |
| `utm_medium` | `social`（自然貼文、個人檔案、LINE）、`paid_social`（Meta 廣告）、`organic`（Google 商家）、`qr`（印刷品）、`referral`（合作夥伴網站） |
| `utm_campaign` | 常駐入口用 `profile`、`richmenu`、`gbp_profile`、`namecard`；活動用 `年份季節_主題`，例 `2026winter_hakuba` |
| `utm_content` | 選填。同一檔活動裡區分素材，例 `carousel_a`、`reel_0921` |

## 現成連結（直接複製）

常駐入口，換上一次就好：

| 放在哪裡 | 連結 |
| --- | --- |
| IG 個人檔案連結 | `https://snowsurfstudio.net/?utm_source=instagram&utm_medium=social&utm_campaign=profile` |
| FB 粉專「查看網站」按鈕 | `https://snowsurfstudio.net/?utm_source=facebook&utm_medium=social&utm_campaign=profile` |
| Threads 個人檔案連結 | `https://snowsurfstudio.net/?utm_source=threads&utm_medium=social&utm_campaign=profile` |
| LINE 圖文選單 | `https://snowsurfstudio.net/booking.html?utm_source=line&utm_medium=social&utm_campaign=richmenu` |
| Google 商家「網站」 | `https://snowsurfstudio.net/?utm_source=google&utm_medium=organic&utm_campaign=gbp_profile` |
| 名片／傳單 QR code | `https://snowsurfstudio.net/?utm_source=print&utm_medium=qr&utm_campaign=namecard` |

每次發文或投廣告時套用：

| 用途 | 連結範本（把 `<>` 換掉） |
| --- | --- |
| IG 限時動態連結貼紙 | `https://snowsurfstudio.net/<頁面>?utm_source=instagram&utm_medium=social&utm_campaign=<活動>&utm_content=story_<日期>` |
| FB／Threads 貼文裡的連結 | `https://snowsurfstudio.net/<頁面>?utm_source=facebook&utm_medium=social&utm_campaign=<活動>&utm_content=post_<日期>`（Threads 把 `facebook` 換成 `threads`） |
| LINE 群發訊息 | `https://snowsurfstudio.net/<頁面>?utm_source=line&utm_medium=social&utm_campaign=<活動>&utm_content=broadcast_<日期>` |
| Meta 廣告 | 網址填頁面本身，「網址參數」欄填 `utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}`，廣告活動名稱照規則 4 取名 |

`<頁面>` 例如 `booking.html`、`blog/family-ski-trip.html`；首頁留空。其他情況用 Google 的 [Campaign URL Builder](https://ga-dev-tools.google/campaign-url-builder/) 產生，產完再對一次上面的固定用字。

## 網站已經會做的事

網站會記住進站時的 UTM，整個造訪期間都有效，所以客人從 IG 進來、逛了三頁才點 LINE，這次點擊仍然算 IG 的。GA4 的「流量開發」報表會直接用這些標記分來源，不需要另外設定。

印刷品 QR（`qr`）在 GA4 的「預設管道群組」會列為「未指派」，這是正常的；看「工作階段來源／媒介」就能看到 `print / qr`。
