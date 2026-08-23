// Assembles every screen of the admin SPA (login, dashboard, and the 4 content sections),
// wiring AdminForms widgets / the AdminEditor canvas / the AdminShare panel to AdminApi reads+writes.

const AdminViews = (() => {
  const { el, textField, textareaField, linesField, selectField, checkboxField, imageField, repeatableList, section } = AdminForms;

  const SECTIONS = [
    { key: "homepage", label: "封面", hash: "#/homepage" },
    { key: "gallery", label: "作品集", hash: "#/gallery" },
    { key: "plans", label: "拍攝方案", hash: "#/plans" },
    { key: "posts", label: "部落格文章", hash: "#/posts" },
    { key: "automation", label: "自動化", hash: "#/automation" },
  ];

  function parseFrontmatter(raw) {
    const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw || "");
    if (!m) return { data: {}, body: "" };
    return { data: jsyaml.load(m[1]) || {}, body: m[2] || "" };
  }

  function stringifyFrontmatter(data, body) {
    return `---\n${jsyaml.dump(data, { lineWidth: -1 })}---\n${body || ""}`;
  }

  // Some existing posts have unquoted YAML dates (e.g. `date: 2026-08-05T00:00:00.000Z`),
  // which js-yaml parses as a native Date object instead of a string. Normalize to
  // "YYYY-MM-DD" wherever a post/plan date is read, so string methods (.localeCompare,
  // date input values) never blow up on those files.
  function toDateString(value) {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return value || "";
  }

  function renderTopbar(activeSection) {
    return el("header", { className: "admin-topbar glass" }, [
      el("a", { className: "admin-topbar__logo", href: "#/" }, "SnowSurfStudio 後台"),
      el(
        "nav",
        { className: "admin-topbar__nav" },
        SECTIONS.map((s) =>
          el(
            "a",
            { href: s.hash, className: "admin-topbar__link" + (activeSection === s.key ? " is-active" : "") },
            s.label
          )
        )
      ),
      el(
        "button",
        {
          type: "button",
          className: "admin-btn admin-btn--ghost",
          onclick: () => {
            if (confirm("確定要登出嗎？")) {
              AdminApi.clearToken();
              location.hash = "";
              location.reload();
            }
          },
        },
        "登出"
      ),
    ]);
  }

  function shell(activeSection, children) {
    return el("div", { className: "admin-shell" }, [renderTopbar(activeSection), el("main", { className: "admin-main" }, children)]);
  }

  function saveBar({ onSave, backHash, extra }) {
    const status = el("span", { className: "admin-savebar__status" }, "");
    const btn = el(
      "button",
      {
        type: "button",
        className: "admin-btn admin-btn--primary",
        onclick: async () => {
          btn.disabled = true;
          status.textContent = "儲存中…";
          try {
            await onSave();
            status.textContent = "已儲存 ✓";
          } catch (err) {
            status.textContent = "";
            alert(err.message || "儲存失敗");
          } finally {
            btn.disabled = false;
          }
        },
      },
      "儲存"
    );
    return el("div", { className: "admin-savebar" }, [
      backHash ? el("a", { className: "admin-btn admin-btn--ghost", href: backHash }, "← 返回列表") : null,
      extra || null,
      btn,
      status,
    ]);
  }

  // ---------------- Login ----------------

  const TOKEN_CREATE_URL =
    "https://github.com/settings/personal-access-tokens/new?" +
    "target_name=bbbkai0314-netizen&name=SnowSurfStudio-Admin&" +
    "description=" + encodeURIComponent("後台存檔用") +
    "&contents=write&actions=write&expires_in=none";

  function renderLogin(onSuccess) {
    const error = el("p", { className: "admin-error" }, "");
    const input = el("input", { type: "password", className: "admin-input", placeholder: "貼上 GitHub Personal Access Token" });
    const btn = el(
      "button",
      {
        type: "button",
        className: "admin-btn admin-btn--primary",
        onclick: async () => {
          const token = input.value.trim();
          if (!token) return;
          btn.disabled = true;
          error.textContent = "";
          try {
            await AdminApi.validateToken(token);
            AdminApi.setToken(token);
            location.hash = "#/";
            onSuccess();
          } catch (err) {
            error.textContent = err.message;
          } finally {
            btn.disabled = false;
          }
        },
      },
      "登入"
    );
    return el("div", { className: "admin-login" }, [
      el("div", { className: "admin-login__card glass" }, [
        el("h1", {}, "SnowSurfStudio 後台"),
        el(
          "a",
          { className: "admin-btn admin-btn--primary", href: TOKEN_CREATE_URL, target: "_blank", rel: "noopener" },
          "前往 GitHub 產生登入權杖 →"
        ),
        el(
          "p",
          { className: "admin-field__hint" },
          "只有第一次要做這步：開啟後選好「Only select repositories → snow-photography」，往下捲到底按 Generate token，複製產生的字串貼在下面。之後這台電腦、這個瀏覽器都不用再貼一次。（這個連結已經預先勾好「內容讀寫」和「Actions 讀寫」權限，後者是「自動化」頁面觸發發文用的。舊的權杖沒有 Actions 權限的話，到 GitHub 權杖設定頁面把它加上即可，不用整組重辦。）"
        ),
        input,
        error,
        btn,
      ]),
    ]);
  }

  // ---------------- 自動化 ----------------

  async function renderAutomation() {
    return shell("automation", el("div", {}, [section("自動化發布", [AdminAutomation.renderPanel()])]));
  }

  // ---------------- Dashboard ----------------

  async function renderDashboard() {
    return shell(
      null,
      el(
        "div",
        { className: "admin-dashboard" },
        SECTIONS.map((s) =>
          el("a", { className: "admin-dashboard__card glass", href: s.hash }, [
            el("h2", {}, s.label),
          ])
        )
      )
    );
  }

  // ---------------- 封面 (site.json) ----------------

  async function renderHomepage() {
    const file = await AdminApi.getFile("src/_data/site.json");
    const data = JSON.parse(file.content);
    data.socialLinks = data.socialLinks || { facebook: "", instagram: "", threads: "", line: "" };
    data.seo = data.seo || {};
    data.newsItems = data.newsItems || [];

    const form = el("div", {}, [
      section("封面", [
        textField({ label: "地區文字", value: data.heroLocationLine, onChange: (v) => (data.heroLocationLine = v) }),
        imageField({ label: "封面圖片", value: data.heroImage, onChange: (v) => (data.heroImage = v) }),
        textField({ label: "封面圖片 Alt 文字", value: data.heroImageAlt, onChange: (v) => (data.heroImageAlt = v) }),
        textareaField({ label: "關於我們段落", value: data.aboutBody, rows: 6, onChange: (v) => (data.aboutBody = v) }),
      ]),
      section("社群連結", [
        textField({ label: "Facebook 網址", value: data.socialLinks.facebook, onChange: (v) => (data.socialLinks.facebook = v), hint: "留空則不顯示這個圖示" }),
        textField({ label: "Instagram 網址", value: data.socialLinks.instagram, onChange: (v) => (data.socialLinks.instagram = v), hint: "留空則不顯示這個圖示" }),
        textField({ label: "脆 (Threads) 網址", value: data.socialLinks.threads, onChange: (v) => (data.socialLinks.threads = v), hint: "留空則不顯示這個圖示" }),
        textField({ label: "LINE 網址", value: data.socialLinks.line, onChange: (v) => (data.socialLinks.line = v), hint: "留空則不顯示這個圖示" }),
      ]),
      section("SEO", [
        textField({ label: "網站標題", value: data.seo.title, onChange: (v) => (data.seo.title = v) }),
        textareaField({ label: "網站描述", value: data.seo.description, rows: 3, onChange: (v) => (data.seo.description = v) }),
        textField({ label: "關鍵字（逗號分隔）", value: data.seo.keywords, onChange: (v) => (data.seo.keywords = v) }),
        imageField({ label: "分享圖片 (OG Image)", value: data.seo.ogImage, onChange: (v) => (data.seo.ogImage = v) }),
      ]),
    ]);

    const newsSection = section("最新消息", [
      repeatableList({
        items: data.newsItems,
        addLabel: "新增消息",
        emptyLabel: "尚未新增消息",
        newItem: () => ({ active: false, title: "", copy: [], buttonLabel: "查看預約方式 →" }),
        renderItem: (item) => [
          checkboxField({ label: "顯示於首頁", checked: item.active, onChange: (v) => (item.active = v) }),
          textField({ label: "標題", value: item.title, onChange: (v) => (item.title = v) }),
          linesField({ label: "內文（每行一段）", values: item.copy, onChange: (v) => (item.copy = v) }),
          textField({ label: "按鈕文字", value: item.buttonLabel, onChange: (v) => (item.buttonLabel = v) }),
        ],
      }),
    ]);
    form.appendChild(newsSection);

    form.appendChild(
      saveBar({
        onSave: () => AdminApi.putFile("src/_data/site.json", JSON.stringify(data, null, 2) + "\n", "更新封面設定", file.sha),
      })
    );

    return shell("homepage", form);
  }

  // ---------------- 作品集 (gallery.json) ----------------

  async function renderGalleryList() {
    const file = await AdminApi.getFile("src/_data/gallery.json");
    const items = JSON.parse(file.content);

    const list = repeatableList({
      items,
      addLabel: "新增照片",
      emptyLabel: "尚未新增照片",
      newItem: () => ({ id: "photo-" + Date.now(), image: "", alt: "", caption: "", tag: "", orientation: "landscape" }),
      renderItem: (item) => [
        imageField({ label: "照片", value: item.image, onChange: (v) => (item.image = v) }),
        textField({ label: "Alt 文字", value: item.alt, onChange: (v) => (item.alt = v) }),
        textField({ label: "說明文字 (caption)", value: item.caption, onChange: (v) => (item.caption = v) }),
        textField({ label: "分類標籤 (tag)", value: item.tag, onChange: (v) => (item.tag = v) }),
        selectField({
          label: "方向",
          value: item.orientation,
          options: [{ value: "landscape", label: "橫向" }, { value: "portrait", label: "直向" }],
          onChange: (v) => (item.orientation = v),
        }),
      ],
    });

    const wrap = el("div", {}, [section("作品集", [list])]);
    wrap.appendChild(
      saveBar({
        onSave: () => {
          items.forEach((item) => {
            if (!item.id) item.id = "photo-" + Date.now() + Math.random().toString(36).slice(2, 6);
          });
          return AdminApi.putFile("src/_data/gallery.json", JSON.stringify(items, null, 2) + "\n", "更新作品集", file.sha);
        },
      })
    );
    return shell("gallery", wrap);
  }

  // ---------------- 拍攝方案 (src/plans/*.md) ----------------

  async function listMarkdownFiles(dir, excludeJson) {
    const entries = await AdminApi.listDir(dir);
    return entries.filter((e) => e.type === "file" && e.name.endsWith(".md") && (!excludeJson || e.name !== excludeJson));
  }

  async function renderPlansList() {
    const files = await listMarkdownFiles("src/plans");
    const rows = await Promise.all(
      files.map(async (f) => {
        const content = await AdminApi.getFile(f.path);
        const { data } = parseFrontmatter(content.content);
        const slug = f.name.replace(/\.md$/, "");
        return { slug, title: data.title || slug, order: data.order || 0 };
      })
    );
    rows.sort((a, b) => a.order - b.order);

    const list = el(
      "div",
      { className: "admin-list" },
      rows.map((r) =>
        el("a", { className: "admin-list__item glass", href: `#/plans/edit/${r.slug}` }, [
          el("span", {}, r.title),
          el("span", { className: "admin-field__hint" }, r.slug),
        ])
      )
    );

    const wrap = el("div", {}, [
      section("拍攝方案", [
        el("a", { className: "admin-btn admin-btn--primary", href: "#/plans/new" }, "+ 新增方案"),
        list,
      ]),
    ]);
    return shell("plans", wrap);
  }

  function planForm(data, onSlugChange, isNew) {
    data.sections = data.sections || [];
    data.groups = data.groups || [];
    data.seo = data.seo || {};

    const fields = [
      isNew ? textField({ label: "網址代稱 (slug，英文/數字/破折號)", value: "", onChange: onSlugChange, hint: "例如 photography，決定檔名與網址" }) : null,
      textField({ label: "標題", value: data.title, onChange: (v) => (data.title = v) }),
      textField({ label: "英文副標", value: data.subtitleEn, onChange: (v) => (data.subtitleEn = v) }),
      textField({ label: "編號 (eyebrowNumber)", value: data.eyebrowNumber, onChange: (v) => (data.eyebrowNumber = v) }),
      textField({ label: "標籤文字 (eyebrowLabel，選填)", value: data.eyebrowLabel, onChange: (v) => (data.eyebrowLabel = v) }),
      textField({ label: "服務類型 (serviceType)", value: data.serviceType, onChange: (v) => (data.serviceType = v) }),
      imageField({ label: "封面圖片", value: data.heroImage, onChange: (v) => (data.heroImage = v) }),
      textField({ label: "封面圖片 Alt", value: data.heroImageAlt, onChange: (v) => (data.heroImageAlt = v) }),
      textareaField({ label: "導言 (leadParagraph)", value: data.leadParagraph, rows: 3, onChange: (v) => (data.leadParagraph = v) }),
      textareaField({ label: "預覽描述 (previewDescription)", value: data.previewDescription, rows: 2, onChange: (v) => (data.previewDescription = v) }),
      textField({ label: "排序 (order，數字)", value: String(data.order ?? ""), onChange: (v) => (data.order = Number(v) || 0) }),
      textField({ label: "按鈕文字 (ctaText)", value: data.ctaText, onChange: (v) => (data.ctaText = v) }),
    ].filter(Boolean);

    const sectionsList = repeatableList({
      items: data.sections,
      addLabel: "新增內容區塊",
      newItem: () => ({ heading: "", items: [] }),
      renderItem: (item) => [
        textField({ label: "小標題", value: item.heading, onChange: (v) => (item.heading = v) }),
        linesField({ label: "條列內容（每行一項）", values: item.items, onChange: (v) => (item.items = v) }),
      ],
    });

    const groupsList = repeatableList({
      items: data.groups,
      addLabel: "新增群組",
      newItem: () => ({ icon: "", title: "", items: [] }),
      renderItem: (item) => [
        textField({ label: "Icon（emoji 或文字）", value: item.icon, onChange: (v) => (item.icon = v) }),
        textField({ label: "群組標題", value: item.title, onChange: (v) => (item.title = v) }),
        linesField({ label: "條列內容（每行一項）", values: item.items, onChange: (v) => (item.items = v) }),
      ],
    });

    return el("div", {}, [
      section("方案內容", fields),
      section("內容區塊 (sections)", [sectionsList]),
      section("進階群組 (groups，選填，高階方案用)", [
        textField({ label: "群組標題 (groupsHeading)", value: data.groupsHeading, onChange: (v) => (data.groupsHeading = v) }),
        groupsList,
      ]),
      section("SEO", [
        textField({ label: "SEO 標題（選填）", value: data.seo.title, onChange: (v) => (data.seo.title = v) }),
        textareaField({ label: "SEO 描述", value: data.seo.description, rows: 3, onChange: (v) => (data.seo.description = v) }),
        textField({ label: "SEO 關鍵字", value: data.seo.keywords, onChange: (v) => (data.seo.keywords = v) }),
      ]),
    ]);
  }

  async function renderPlanEdit(slug) {
    const isNew = !slug;
    let fileSha = null;
    let slugValue = slug || "";
    let parsedData = {
      layout: "plan",
      title: "",
      subtitleEn: "",
      eyebrowNumber: "",
      serviceType: "",
      heroImage: "",
      heroImageAlt: "",
      leadParagraph: "",
      previewDescription: "",
      order: 0,
      ctaText: "查看方案 →",
      sections: [],
      seo: {},
    };

    if (!isNew) {
      const file = await AdminApi.getFile(`src/plans/${slug}.md`);
      fileSha = file.sha;
      parsedData = parseFrontmatter(file.content).data;
    }

    const form = planForm(parsedData, (v) => (slugValue = v.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-")), isNew);
    const wrap = el("div", {}, [form]);

    wrap.appendChild(
      saveBar({
        backHash: "#/plans",
        extra: !isNew
          ? el(
              "button",
              {
                type: "button",
                className: "admin-btn admin-btn--danger",
                onclick: async () => {
                  if (!confirm(`確定要刪除方案「${parsedData.title || slug}」嗎？`)) return;
                  await AdminApi.deleteFile(`src/plans/${slug}.md`, `刪除方案：${slug}`, fileSha);
                  location.hash = "#/plans";
                },
              },
              "刪除"
            )
          : null,
        onSave: async () => {
          if (!slugValue) throw new Error("請輸入網址代稱 (slug)");
          parsedData.layout = "plan";
          const raw = stringifyFrontmatter(parsedData, "");
          await AdminApi.putFile(`src/plans/${slugValue}.md`, raw, `${isNew ? "新增" : "更新"}方案：${slugValue}`, isNew ? undefined : fileSha);
          if (isNew) location.hash = `#/plans/edit/${slugValue}`;
        },
      })
    );

    return shell("plans", wrap);
  }

  // ---------------- 部落格文章 (src/posts/*.md) ----------------

  async function renderPostsList() {
    const files = await listMarkdownFiles("src/posts");
    const rows = await Promise.all(
      files.map(async (f) => {
        const content = await AdminApi.getFile(f.path);
        const { data } = parseFrontmatter(content.content);
        const slug = f.name.replace(/\.md$/, "");
        return { slug, title: data.title || slug, date: toDateString(data.date) };
      })
    );
    rows.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    const list = el(
      "div",
      { className: "admin-list" },
      rows.map((r) =>
        el("a", { className: "admin-list__item glass", href: `#/posts/edit/${r.slug}` }, [
          el("span", {}, r.title),
          el("span", { className: "admin-field__hint" }, r.date),
        ])
      )
    );

    const wrap = el("div", {}, [
      section("部落格文章", [
        el("a", { className: "admin-btn admin-btn--primary", href: "#/posts/new" }, "+ 新增文章"),
        list,
      ]),
    ]);
    return shell("posts", wrap);
  }

  async function renderPostEdit(slug) {
    const isNew = !slug;
    let fileSha = null;
    let slugValue = slug || "";
    let parsedData = {
      layout: "article",
      title: "",
      tag: "",
      metaLine: "SnowSurfStudio Journal",
      heroImage: "",
      heroImageAlt: "",
      previewImage: "",
      previewImageAlt: "",
      leadParagraph: "",
      date: new Date().toISOString().slice(0, 10),
      dateModified: new Date().toISOString().slice(0, 10),
      previewDescription: "",
      seo: {},
      contentBlocks: [],
    };

    if (!isNew) {
      const file = await AdminApi.getFile(`src/posts/${slug}.md`);
      fileSha = file.sha;
      parsedData = parseFrontmatter(file.content).data;
      parsedData.seo = parsedData.seo || {};
      parsedData.contentBlocks = parsedData.contentBlocks || [];
      parsedData.date = toDateString(parsedData.date);
      parsedData.dateModified = toDateString(parsedData.dateModified);
    }

    const metaFields = [
      isNew ? textField({ label: "網址代稱 (slug，英文/數字/破折號)", value: "", onChange: (v) => (slugValue = v.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-")), hint: "決定檔名與網址，例如 my-post-title" }) : null,
      textField({ label: "標題", value: parsedData.title, onChange: (v) => (parsedData.title = v) }),
      textField({ label: "標籤 (tag)", value: parsedData.tag, onChange: (v) => (parsedData.tag = v) }),
      textField({ label: "副標題文字 (metaLine)", value: parsedData.metaLine, onChange: (v) => (parsedData.metaLine = v) }),
      imageField({ label: "主圖 (heroImage)", value: parsedData.heroImage, onChange: (v) => (parsedData.heroImage = v) }),
      textField({ label: "主圖 Alt", value: parsedData.heroImageAlt, onChange: (v) => (parsedData.heroImageAlt = v) }),
      imageField({ label: "列表預覽圖 (previewImage)", value: parsedData.previewImage, onChange: (v) => (parsedData.previewImage = v) }),
      textField({ label: "列表預覽圖 Alt", value: parsedData.previewImageAlt, onChange: (v) => (parsedData.previewImageAlt = v) }),
      textareaField({ label: "導言 (leadParagraph)", value: parsedData.leadParagraph, rows: 3, onChange: (v) => (parsedData.leadParagraph = v) }),
      el("div", { className: "admin-field-row" }, [
        (() => {
          const input = el("input", { type: "date", className: "admin-input", value: parsedData.date, oninput: (e) => (parsedData.date = e.target.value) });
          return el("label", { className: "admin-field" }, [el("span", { className: "admin-field__label" }, "發布日期"), input]);
        })(),
        (() => {
          const input = el("input", { type: "date", className: "admin-input", value: parsedData.dateModified, oninput: (e) => (parsedData.dateModified = e.target.value) });
          return el("label", { className: "admin-field" }, [el("span", { className: "admin-field__label" }, "修改日期"), input]);
        })(),
      ]),
      textareaField({ label: "預覽描述 (previewDescription)", value: parsedData.previewDescription, rows: 2, onChange: (v) => (parsedData.previewDescription = v) }),
    ].filter(Boolean);

    const seoFields = [
      textareaField({ label: "SEO 描述", value: parsedData.seo.description, rows: 3, onChange: (v) => (parsedData.seo.description = v) }),
      textField({ label: "SEO 關鍵字", value: parsedData.seo.keywords, onChange: (v) => (parsedData.seo.keywords = v) }),
    ];

    const canvasContainer = el("div", { className: "admin-gjs" }, [
      el("div", { className: "admin-gjs-toolbar" }, [
        el("div", { className: "admin-gjs-panel-switcher" }),
        el("div", { className: "admin-gjs-panel-actions" }),
      ]),
      el("div", { className: "admin-gjs-canvas" }),
    ]);

    const wrap = el("div", {}, [
      section("文章資訊", metaFields),
      section("SEO", seoFields),
      section("內文（拖曳左側區塊到畫布中編輯）", [canvasContainer]),
    ]);

    if (!isNew) {
      wrap.appendChild(section("分享", [AdminShare.renderPanel({ slug, title: parsedData.title, previewDescription: parsedData.previewDescription, leadParagraph: parsedData.leadParagraph })]));
    }

    let gjsHandle = null;

    wrap.appendChild(
      saveBar({
        backHash: "#/posts",
        extra: !isNew
          ? el(
              "button",
              {
                type: "button",
                className: "admin-btn admin-btn--danger",
                onclick: async () => {
                  if (!confirm(`確定要刪除文章「${parsedData.title || slug}」嗎？`)) return;
                  await AdminApi.deleteFile(`src/posts/${slug}.md`, `刪除文章：${slug}`, fileSha);
                  location.hash = "#/posts";
                },
              },
              "刪除"
            )
          : null,
        onSave: async () => {
          if (!slugValue) throw new Error("請輸入網址代稱 (slug)");
          parsedData.layout = "article";
          parsedData.contentBlocks = gjsHandle.getContentBlocks();
          const raw = stringifyFrontmatter(parsedData, "");
          await AdminApi.putFile(`src/posts/${slugValue}.md`, raw, `${isNew ? "新增" : "更新"}文章：${slugValue}`, isNew ? undefined : fileSha);
          if (isNew) location.hash = `#/posts/edit/${slugValue}`;
        },
      })
    );

    // Mount GrapesJS after the container is attached to the DOM.
    setTimeout(() => {
      gjsHandle = AdminEditor.init(canvasContainer.querySelector(".admin-gjs-canvas"), {
        initialBlocks: parsedData.contentBlocks,
      });
    }, 0);

    return shell("posts", wrap);
  }

  return {
    renderTopbar,
    renderLogin,
    renderDashboard,
    renderHomepage,
    renderGalleryList,
    renderPlansList,
    renderPlanEdit,
    renderPostsList,
    renderPostEdit,
    renderAutomation,
  };
})();
