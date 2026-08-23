// "自動化" panel — trigger the social-publish GitHub Actions workflow directly from the browser.
// No Make.com, no separate backend server: the browser calls GitHub's own Actions API with the
// same PAT used everywhere else in this admin. GitHub Actions Secrets hold the real FB/IG/Notion
// tokens — they never touch the browser or this repo's source.

const AdminAutomation = (() => {
  const { el, checkboxField } = AdminForms;

  const WORKFLOW_FILE = "social-publish.yml";

  function renderPanel() {
    let imagePath = "";
    let caption = "";
    let skipFb = false;
    let skipIg = false;
    let skipNotion = false;

    const status = el("p", { className: "admin-automation__status" }, "");
    const runLink = el("div", { className: "admin-automation__runlink" }, "");

    const imgPreview = el("img", { className: "admin-image-preview", style: "display:none" });

    const fileInput = el("input", {
      type: "file",
      accept: "image/*",
      style: "display:none",
      onchange: async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        uploadBtn.disabled = true;
        uploadBtn.textContent = "上傳中…";
        try {
          imagePath = await AdminApi.uploadImage(file);
          imgPreview.src = "../" + imagePath;
          imgPreview.style.display = "";
          updatePublishState();
        } catch (err) {
          alert(err.message || "圖片上傳失敗");
        } finally {
          uploadBtn.disabled = false;
          uploadBtn.textContent = "選擇圖片上傳";
          fileInput.value = "";
        }
      },
    });

    const uploadBtn = el(
      "button",
      { type: "button", className: "admin-btn", onclick: () => fileInput.click() },
      "選擇圖片上傳"
    );

    const captionArea = el("textarea", {
      className: "admin-input admin-input--textarea",
      rows: 5,
      placeholder: "貼上要發布的文案（FB + IG 共用）",
      oninput: (e) => {
        caption = e.target.value;
        updatePublishState();
      },
    });

    const publishBtn = el(
      "button",
      {
        type: "button",
        className: "admin-btn admin-btn--primary",
        disabled: true,
        onclick: async () => {
          publishBtn.disabled = true;
          runLink.innerHTML = "";
          status.textContent = "觸發中…";
          try {
            const dispatchedAt = new Date();
            await AdminApi.dispatchWorkflow(WORKFLOW_FILE, {
              image_url: AdminApi.rawUrlFor(imagePath),
              caption,
              skip_fb: String(skipFb),
              skip_ig: String(skipIg),
              skip_notion: String(skipNotion),
            });
            status.textContent = "已觸發，等待 GitHub Actions 開始執行…";
            await pollRun(dispatchedAt);
          } catch (err) {
            status.textContent = "";
            alert(err.message || "觸發失敗");
          } finally {
            updatePublishState();
          }
        },
      },
      "發布到 FB / IG"
    );

    function updatePublishState() {
      publishBtn.disabled = !imagePath || !caption.trim();
    }

    async function pollRun(dispatchedAt) {
      for (let i = 0; i < 40; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const run = await AdminApi.findRecentRun(WORKFLOW_FILE, dispatchedAt);
        if (!run) continue;
        status.textContent = "狀態：" + statusLabel(run);
        runLink.innerHTML = "";
        runLink.appendChild(el("a", { href: run.html_url, target: "_blank", rel: "noopener" }, "在 GitHub 查看執行紀錄 →"));
        if (run.status === "completed") return;
      }
    }

    function statusLabel(run) {
      if (run.status !== "completed") return run.status === "in_progress" ? "執行中…" : "排隊中…";
      return run.conclusion === "success" ? "完成 ✓" : "失敗（" + run.conclusion + "）";
    }

    return el("div", { className: "admin-automation" }, [
      el(
        "p",
        { className: "admin-field__hint" },
        "上傳圖片＋填文案，按下發布會觸發 GitHub Actions，由它呼叫 Facebook / Instagram / Notion 的官方 API 發文。金鑰只存在 GitHub Actions Secrets，不會出現在瀏覽器或原始碼裡。"
      ),
      el("div", { className: "admin-automation__upload" }, [uploadBtn, fileInput, imgPreview]),
      captionArea,
      el("div", { className: "admin-automation__skips" }, [
        checkboxField({ label: "不發布到 Facebook", checked: false, onChange: (v) => (skipFb = v) }),
        checkboxField({ label: "不發布到 Instagram", checked: false, onChange: (v) => (skipIg = v) }),
        checkboxField({ label: "不寫入 Notion", checked: false, onChange: (v) => (skipNotion = v) }),
      ]),
      publishBtn,
      status,
      runLink,
      el(
        "p",
        { className: "admin-field__hint" },
        "第一次使用前要先完成一次性設定（申請 token、寫入 GitHub Actions Secrets），步驟在 automation/SOCIAL_AUTOMATION_SETUP.md。"
      ),
    ]);
  }

  return { renderPanel };
})();
