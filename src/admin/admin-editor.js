// GrapesJS-based visual canvas for editing a blog post's `contentBlocks`.
//
// Scope is intentionally narrow: rather than a free-form page builder, the canvas only
// understands the 3 block shapes that src/_includes/article.njk actually renders
// (plain text / image+text / raw-html escape hatch). The canvas iframe loads the site's
// real ../css/style.css, so what you see while editing IS what article.njk will render —
// there is no separate hand-maintained "preview" copy of the rendering logic to drift out
// of sync. Reading a post's HTML back out of the canvas is done by parsing the same DOM
// shape article.njk expects (article-section / article-block / h2 / p / ul>li), not by a
// custom GrapesJS data model — so the round trip stays honest to the real template.

const AdminEditor = (() => {
  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
  }

  // contentBlocks item -> HTML string matching article.njk's rendering exactly.
  function buildBlockHtml(block) {
    const paragraphs = (block.paragraphs || []).map((p) => `<p>${escapeHtml(p)}</p>`).join("");
    const trailing = (block.trailingParagraphs || []).map((p) => `<p>${escapeHtml(p)}</p>`).join("");
    const items =
      block.items && block.items.length
        ? `<ul>${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`
        : "";

    if (block.type === "html") {
      return `<div class="article-section" data-block-type="html">${block.html || ""}</div>`;
    }

    if (block.image) {
      const reverse = block.imagePosition === "right" ? " article-block--reverse" : "";
      return `<div class="article-block${reverse}" data-block-type="image-text" data-image="${escapeAttr(
        block.image
      )}" data-image-alt="${escapeAttr(block.imageAlt || "")}" data-image-position="${
        block.imagePosition === "right" ? "right" : "left"
      }">
        <div class="article-block__media"><img src="../${escapeAttr(block.image)}" alt="${escapeAttr(
        block.imageAlt || ""
      )}"></div>
        <div class="article-block__text"><h2>${escapeHtml(block.heading || "")}</h2>${paragraphs}${items}${trailing}</div>
      </div>`;
    }

    return `<div class="article-section" data-block-type="text"><h2>${escapeHtml(
      block.heading || ""
    )}</h2>${paragraphs}${items}${trailing}</div>`;
  }

  // Canvas HTML string -> contentBlocks array, parsing the same shape article.njk emits.
  function parseCanvasToContentBlocks(htmlString) {
    const doc = new DOMParser().parseFromString(`<div id="admin-root">${htmlString}</div>`, "text/html");
    const root = doc.getElementById("admin-root");
    if (!root) return [];

    return Array.from(root.children)
      .filter((elNode) => elNode.hasAttribute && elNode.hasAttribute("data-block-type"))
      .map((elNode) => {
        const type = elNode.getAttribute("data-block-type");

        if (type === "html") {
          return { type: "html", html: elNode.innerHTML.trim() };
        }

        const textContainer = type === "image-text" ? elNode.querySelector(".article-block__text") : elNode;
        const heading = (textContainer.querySelector("h2") || {}).textContent?.trim() || "";
        const ul = textContainer.querySelector("ul");
        const items = ul ? Array.from(ul.querySelectorAll("li")).map((li) => li.textContent.trim()) : [];
        const allP = Array.from(textContainer.querySelectorAll(":scope > p"));
        const children = Array.from(textContainer.children);
        const ulIndex = ul ? children.indexOf(ul) : -1;
        const paragraphs = ul ? allP.filter((p) => children.indexOf(p) < ulIndex) : allP;
        const trailingParagraphs = ul ? allP.filter((p) => children.indexOf(p) > ulIndex) : [];

        const block = {
          heading,
          paragraphs: paragraphs.map((p) => p.textContent.trim()).filter(Boolean),
        };
        if (items.length) block.items = items;
        if (trailingParagraphs.length) {
          block.trailingParagraphs = trailingParagraphs.map((p) => p.textContent.trim()).filter(Boolean);
        }
        if (type === "image-text") {
          block.image = elNode.getAttribute("data-image") || "";
          block.imageAlt = elNode.getAttribute("data-image-alt") || "";
          block.imagePosition = elNode.classList.contains("article-block--reverse") ? "right" : "left";
        }
        return block;
      });
  }

  function init(container, { initialBlocks = [] } = {}) {
    const editor = grapesjs.init({
      container,
      height: "620px",
      width: "auto",
      fromElement: false,
      storageManager: false,
      dragMode: "absolute",
      blockManager: { appendOnClick: false },
      canvas: {
        styles: ["../css/style.css"],
      },
      panels: {
        defaults: [
          {
            id: "panel-switcher",
            el: ".admin-gjs-panel-switcher",
            buttons: [
              { id: "show-blocks", command: "open-blocks", active: true, label: "區塊" },
              { id: "show-layers", command: "open-layers", label: "結構" },
              { id: "show-traits", command: "open-tm", label: "設定" },
            ],
          },
          {
            id: "panel-actions",
            el: ".admin-gjs-panel-actions",
            buttons: [
              { id: "undo", command: "core:undo", label: "↺" },
              { id: "redo", command: "core:redo", label: "↻" },
            ],
          },
        ],
      },
    });

    // --- Custom component types matching article.njk's 3 block shapes ---

    editor.Components.addType("block-html", {
      isComponent: (el) => el.tagName === "DIV" && el.getAttribute?.("data-block-type") === "html",
      model: {
        defaults: {
          name: "HTML 自訂區塊",
          traits: [{ type: "button", text: "編輯 HTML", full: true, command: "edit-html-block" }],
        },
      },
    });

    editor.Components.addType("block-text", {
      isComponent: (el) => el.tagName === "DIV" && el.getAttribute?.("data-block-type") === "text",
      model: {
        defaults: {
          name: "文字段落",
          traits: [{ type: "button", text: "新增一段文字", full: true, command: "add-paragraph" }],
        },
      },
    });

    editor.Components.addType("block-image-text", {
      isComponent: (el) => el.tagName === "DIV" && el.getAttribute?.("data-block-type") === "image-text",
      model: {
        defaults: {
          name: "圖文區塊",
          traits: [
            {
              type: "select",
              name: "data-image-position",
              label: "圖片位置",
              options: [
                { id: "left", name: "左側" },
                { id: "right", name: "右側" },
              ],
            },
            { type: "text", name: "data-image-alt", label: "圖片說明 (alt)" },
            { type: "button", text: "更換圖片", full: true, command: "open-image-picker" },
            { type: "button", text: "新增一段文字", full: true, command: "add-paragraph" },
          ],
        },
        init() {
          this.on("change:attributes", this.syncPositionClass);
        },
        syncPositionClass() {
          const pos = this.getAttributes()["data-image-position"];
          this.removeClass("article-block--reverse");
          if (pos === "right") this.addClass("article-block--reverse");
        },
      },
    });

    // --- Commands driving the trait buttons above ---

    editor.Commands.add("add-paragraph", {
      run(ed) {
        const selected = ed.getSelected();
        if (!selected) return;
        const textWrap = selected.getAttributes()["data-block-type"] === "image-text"
          ? selected.find(".article-block__text")[0] || selected
          : selected;
        textWrap.append('<p contenteditable="true">新的一段文字…</p>');
      },
    });

    editor.Commands.add("edit-html-block", {
      run(ed) {
        const selected = ed.getSelected();
        if (!selected) return;
        const current = selected.getEl().innerHTML;
        const next = prompt("編輯這個區塊的 HTML：", current);
        if (next == null) return;
        selected.components(next);
      },
    });

    editor.Commands.add("open-image-picker", {
      async run(ed) {
        const selected = ed.getSelected();
        if (!selected) return;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
          const file = input.files[0];
          if (!file) return;
          try {
            const path = await AdminApi.uploadImage(file);
            selected.addAttributes({ "data-image": path });
            const img = selected.find("img")[0];
            if (img) img.addAttributes({ src: "../" + path });
          } catch (err) {
            alert(err.message || "圖片上傳失敗");
          }
        };
        input.click();
      },
    });

    // --- Block manager: the 3 draggable block types ---

    editor.Blocks.add("text-block", {
      label: "文字段落",
      category: "文章區塊",
      content: buildBlockHtml({ heading: "新標題", paragraphs: ["在這裡輸入內文…"] }),
    });

    editor.Blocks.add("image-text-block", {
      label: "圖文區塊",
      category: "文章區塊",
      content: buildBlockHtml({
        heading: "新標題",
        paragraphs: ["在這裡輸入內文…"],
        image: "images/snowboard-air-grab-滑雪攝影.jpg",
        imageAlt: "",
        imagePosition: "left",
      }),
    });

    editor.Blocks.add("html-block", {
      label: "HTML 自訂",
      category: "文章區塊",
      content: buildBlockHtml({ type: "html", html: "<h2>自訂內容</h2><p>直接編輯 HTML…</p>" }),
    });

    editor.on("load", () => {
      const body = editor.Canvas.getBody();
      body.classList.add("article-body", "article-body--admin-canvas");
      const doc = editor.Canvas.getDocument();
      const style = doc.createElement("style");
      style.textContent = `
        body.article-body--admin-canvas { background: var(--navy-deep); padding: 40px 60px; }
        body.article-body--admin-canvas .article-block,
        body.article-body--admin-canvas .article-section { max-width: 760px; margin: 0 auto 32px; }
      `;
      doc.head.appendChild(style);
    });

    editor.setComponents(initialBlocks.map(buildBlockHtml).join(""));

    return {
      editor,
      getContentBlocks: () => parseCanvasToContentBlocks(editor.getHtml()),
    };
  }

  return { init, buildBlockHtml, parseCanvasToContentBlocks };
})();
