// "One-click share" panel for a blog post — no OAuth, no backend, no API keys.
// We can't post on the user's behalf (that would require a Meta developer app,
// review, and a server to hold refresh tokens), so instead we prepare the caption
// and open each platform's own share/compose screen for the user to press send.

const SITE_BASE_URL = "https://bbbkai0314-netizen.github.io/snow-photography/";

const AdminShare = (() => {
  function buildCaption(post) {
    const url = SITE_BASE_URL + "blog/" + (post.slug || "") + ".html";
    const excerpt = post.previewDescription || post.leadParagraph || "";
    const hashtags = "#SnowSurfStudio #日本滑雪攝影 #滑雪寫真";
    return [post.title || "", excerpt, url, hashtags].filter(Boolean).join("\n\n");
  }

  function renderPanel(post) {
    const { el } = AdminForms;
    let caption = buildCaption(post);
    const url = SITE_BASE_URL + "blog/" + (post.slug || "") + ".html";

    const status = el("span", { className: "admin-share__status" }, "");
    const setStatus = (msg) => {
      status.textContent = msg;
      setTimeout(() => (status.textContent = ""), 3000);
    };

    const textarea = el("textarea", {
      className: "admin-input admin-input--textarea",
      rows: 5,
      value: caption,
      oninput: (e) => (caption = e.target.value),
    });

    async function copyCaption() {
      try {
        await navigator.clipboard.writeText(caption);
        setStatus("文字已複製 ✓");
      } catch {
        setStatus("複製失敗，請手動選取文字複製");
      }
    }

    const copyBtn = el(
      "button",
      { type: "button", className: "admin-btn", onclick: copyCaption },
      "複製文字"
    );

    const threadsBtn = el(
      "button",
      {
        type: "button",
        className: "admin-btn admin-btn--ghost",
        onclick: () => {
          window.open(
            "https://www.threads.net/intent/post?text=" + encodeURIComponent(caption),
            "_blank",
            "noopener"
          );
        },
      },
      "分享到脆"
    );

    const fbBtn = el(
      "button",
      {
        type: "button",
        className: "admin-btn admin-btn--ghost",
        onclick: async () => {
          await copyCaption();
          window.open(
            "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url),
            "_blank",
            "noopener"
          );
        },
      },
      "分享到 Facebook"
    );

    const igBtn = el(
      "button",
      {
        type: "button",
        className: "admin-btn admin-btn--ghost",
        onclick: async () => {
          await copyCaption();
          window.open("https://www.instagram.com", "_blank", "noopener");
        },
      },
      "複製並開啟 Instagram"
    );

    return el("div", { className: "admin-share" }, [
      el("p", { className: "admin-field__hint" }, "文字先產生好，按下按鈕開啟該平台後自行貼上、確認送出即可。"),
      textarea,
      el("div", { className: "admin-share__actions" }, [copyBtn, threadsBtn, fbBtn, igBtn, status]),
      el(
        "p",
        { className: "admin-field__hint" },
        "備註：Facebook 只能帶連結，Instagram 網頁版沒有預填文字的分享入口，這兩個都會先複製文字，開啟後手動貼上即可。"
      ),
    ]);
  }

  return { buildCaption, renderPanel };
})();
