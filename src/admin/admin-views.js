/* 後台各頁面的畫面渲染邏輯。純手刻 DOM（無框架），外觀直接沿用前台 style.css 的 class。 */

var AdminViews = (function () {
  // ---------- small DOM helpers ----------
  function el(html) {
    var wrap = document.createElement("div");
    wrap.innerHTML = html.trim();
    return wrap.firstElementChild;
  }
  function qs(root, sel) {
    return root.querySelector(sel);
  }
  function qsa(root, sel) {
    return Array.prototype.slice.call(root.querySelectorAll(sel));
  }
  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---------- toast / loading ----------
  function toast(message, type) {
    var host = document.getElementById("admin-toast-host");
    var node = el('<div class="admin-toast admin-toast--' + (type || "info") + '">' + esc(message) + "</div>");
    host.appendChild(node);
    requestAnimationFrame(function () {
      node.classList.add("is-visible");
    });
    setTimeout(function () {
      node.classList.remove("is-visible");
      setTimeout(function () {
        node.remove();
      }, 300);
    }, 3200);
  }

  function withBusy(button, fn) {
    var originalText = button.textContent;
    button.disabled = true;
    button.classList.add("is-busy");
    return fn()
      .then(function (result) {
        button.disabled = false;
        button.classList.remove("is-busy");
        button.textContent = originalText;
        return result;
      })
      .catch(function (err) {
        button.disabled = false;
        button.classList.remove("is-busy");
        button.textContent = originalText;
        toast(err.message || String(err), "error");
        throw err;
      });
  }

  // ---------- shell ----------
  function shell(activeKey, innerHtml) {
    var nav = [
      { key: "dashboard", label: "總覽", href: "#/" },
      { key: "homepage", label: "封面", href: "#/homepage" },
      { key: "gallery", label: "作品集", href: "#/gallery" },
      { key: "plans", label: "拍攝方案", href: "#/plans" },
      { key: "posts", label: "部落格文章", href: "#/posts" },
    ]
      .map(function (item) {
        return (
          '<a class="admin-nav__link' +
          (item.key === activeKey ? " is-active" : "") +
          '" href="' +
          item.href +
          '">' +
          item.label +
          "</a>"
        );
      })
      .join("");

    return (
      '<div class="glow glow--a"></div><div class="glow glow--b"></div>' +
      '<header class="admin-topbar glass">' +
      '<a class="admin-topbar__brand" href="#/">SnowSurfStudio 後台</a>' +
      '<nav class="admin-nav">' +
      nav +
      "</nav>" +
      '<button class="admin-btn admin-btn--ghost" id="admin-logout-btn">登出</button>' +
      "</header>" +
      '<main class="admin-main">' +
      innerHtml +
      "</main>"
    );
  }

  function wireShellChrome(root) {
    var logoutBtn = qs(root, "#admin-logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        AdminAPI.logout();
        location.hash = "#/";
        location.reload();
      });
    }
  }

  // ---------- generic string-list editor (used for items / paragraphs / etc.) ----------
  // arr: plain JS array of strings (mutated in place). onStructureChange(): called after add/remove.
  function renderStringList(arr, label, placeholder) {
    var container = el('<div class="admin-stringlist" data-label="' + esc(label) + '"></div>');

    function draw() {
      container.innerHTML =
        '<div class="admin-field__label">' +
        esc(label) +
        "</div>" +
        arr
          .map(function (val, i) {
            return (
              '<div class="admin-stringlist__row" data-i="' +
              i +
              '">' +
              '<input type="text" value="' +
              esc(val) +
              '" placeholder="' +
              esc(placeholder || "") +
              '">' +
              '<button type="button" class="admin-btn admin-btn--icon" data-remove>×</button>' +
              "</div>"
            );
          })
          .join("") +
        '<button type="button" class="admin-btn admin-btn--small" data-add>+ 新增一行</button>';

      qsa(container, ".admin-stringlist__row input").forEach(function (input, i) {
        input.addEventListener("input", function () {
          arr[i] = input.value;
        });
      });
      qsa(container, "[data-remove]").forEach(function (btn, i) {
        btn.addEventListener("click", function () {
          arr.splice(i, 1);
          draw();
        });
      });
      qs(container, "[data-add]").addEventListener("click", function () {
        arr.push("");
        draw();
      });
    }
    draw();
    return container;
  }

  // ---------- generic object-list editor (sections / groups / contentBlocks / newsItems) ----------
  // arr: array of plain objects (mutated in place). fieldRenderer(item, bodyEl): draws sub-fields for one item.
  function renderObjectList(arr, label, addLabel, makeNew, fieldRenderer) {
    var container = el('<div class="admin-blocklist"></div>');

    function draw() {
      container.innerHTML =
        '<div class="admin-field__label">' +
        esc(label) +
        '</div><div class="admin-blocklist__items"></div>' +
        '<button type="button" class="admin-btn admin-btn--small" data-add>' +
        esc(addLabel) +
        "</button>";
      var itemsHost = qs(container, ".admin-blocklist__items");

      arr.forEach(function (item, i) {
        var card = el(
          '<div class="admin-blockcard glass" data-i="' +
            i +
            '"><div class="admin-blockcard__head"><span>#' +
            (i + 1) +
            '</span><div class="admin-blockcard__move">' +
            '<button type="button" data-up' +
            (i === 0 ? " disabled" : "") +
            ">↑</button>" +
            '<button type="button" data-down' +
            (i === arr.length - 1 ? " disabled" : "") +
            ">↓</button>" +
            '<button type="button" class="admin-btn--danger" data-remove>刪除</button>' +
            '</div></div><div class="admin-blockcard__body"></div></div>'
        );
        fieldRenderer(item, qs(card, ".admin-blockcard__body"));
        qs(card, "[data-up]").addEventListener("click", function () {
          if (i === 0) return;
          var t = arr[i - 1];
          arr[i - 1] = arr[i];
          arr[i] = t;
          draw();
        });
        qs(card, "[data-down]").addEventListener("click", function () {
          if (i === arr.length - 1) return;
          var t = arr[i + 1];
          arr[i + 1] = arr[i];
          arr[i] = t;
          draw();
        });
        qs(card, "[data-remove]").addEventListener("click", function () {
          arr.splice(i, 1);
          draw();
        });
        itemsHost.appendChild(card);
      });

      qs(container, "[data-add]").addEventListener("click", function () {
        arr.push(makeNew());
        draw();
      });
    }
    draw();
    return container;
  }

  // ---------- image upload field ----------
  function renderImageField(state, key, altKey, label) {
    var wrap = el(
      '<div class="admin-field">' +
        '<div class="admin-field__label">' +
        esc(label) +
        "</div>" +
        '<div class="admin-imagefield">' +
        '<div class="admin-imagefield__preview"></div>' +
        '<div class="admin-imagefield__controls">' +
        '<input type="file" accept="image/*">' +
        '<div class="admin-imagefield__path"></div>' +
        (altKey
          ? '<input type="text" class="admin-imagefield__alt" placeholder="替代文字（無障礙用）">'
          : "") +
        "</div></div></div>"
    );

    function updatePreview() {
      var previewEl = qs(wrap, ".admin-imagefield__preview");
      var pathEl = qs(wrap, ".admin-imagefield__path");
      previewEl.innerHTML = state[key]
        ? '<img src="' + esc(AdminAPI.rawUrl(state[key])) + '" alt="">'
        : '<div class="admin-imagefield__empty">尚未選擇圖片</div>';
      pathEl.textContent = state[key] || "";
    }

    qs(wrap, 'input[type="file"]').addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var btn = wrap;
      toast("圖片上傳中…", "info");
      AdminAPI.uploadImage(file)
        .then(function (path) {
          state[key] = path;
          updatePreview();
          toast("圖片上傳完成", "success");
        })
        .catch(function (err) {
          toast(err.message || String(err), "error");
        });
    });

    if (altKey) {
      var altInput = qs(wrap, ".admin-imagefield__alt");
      altInput.value = state[altKey] || "";
      altInput.addEventListener("input", function () {
        state[altKey] = altInput.value;
      });
    }

    updatePreview();
    return wrap;
  }

  // ---------- plain text / textarea field bound directly to state ----------
  function bindText(root, sel, state, key) {
    var input = qs(root, sel);
    input.value = state[key] || "";
    input.addEventListener("input", function () {
      state[key] = input.value;
    });
    return input;
  }

  // ---------- login ----------
  var TOKEN_CREATE_URL =
    "https://github.com/settings/personal-access-tokens/new?" +
    "target_name=bbbkai0314-netizen&name=SnowSurfStudio-Admin&" +
    "description=" + encodeURIComponent("後台存檔用") +
    "&contents=write&expires_in=none";

  function renderLogin(root) {
    root.innerHTML =
      '<div class="glow glow--a"></div><div class="glow glow--b"></div>' +
      '<div class="admin-login">' +
      '<div class="admin-login__card glass-panel">' +
      '<p class="admin-login__eyebrow">SNOWSURFSTUDIO</p>' +
      '<h1>後台管理</h1>' +
      '<a class="admin-btn admin-btn--primary" href="' +
      TOKEN_CREATE_URL +
      '" target="_blank" rel="noopener">前往 GitHub 產生登入權杖 →</a>' +
      '<p class="admin-login__hint">只有第一次要做這步，選好「只允許存取 snow-photography 這個 repo」後按 Generate token，把產生的字串複製回來貼在下面。之後這台電腦、這個瀏覽器都不用再貼一次。</p>' +
      '<form id="admin-login-form">' +
      '<div class="admin-field admin-field--left">' +
      '<div class="admin-field__label">貼上權杖</div>' +
      '<div class="admin-tokenfield">' +
      '<input type="password" id="admin-login-token" placeholder="ghp_ 或 github_pat_ 開頭" autocomplete="new-password" spellcheck="false">' +
      '<button type="button" class="admin-btn admin-btn--icon" id="admin-token-toggle">顯示</button>' +
      '</div></div>' +
      '<button type="submit" class="admin-btn admin-btn--primary">登入</button>' +
      '</form>' +
      '</div></div>';

    var form = qs(root, "#admin-login-form");
    var tokenInput = qs(root, "#admin-login-token");

    qs(root, "#admin-token-toggle").addEventListener("click", function (e) {
      var showing = tokenInput.type === "text";
      tokenInput.type = showing ? "password" : "text";
      e.target.textContent = showing ? "顯示" : "隱藏";
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = qs(form, 'button[type="submit"]');
      withBusy(btn, function () {
        return AdminAPI.login(tokenInput.value).then(function () {
          location.hash = "#/";
          location.reload();
        });
      });
    });
  }

  // ---------- dashboard ----------
  function renderDashboard(root) {
    var cards = [
      { href: "#/homepage", title: "封面", en: "Hero & Homepage", desc: "首頁一句話文案、關於我們、最新消息、SEO 設定" },
      { href: "#/gallery", title: "作品集", en: "Gallery", desc: "首頁「完整作品」的照片，新增／刪除／排序" },
      { href: "#/plans", title: "拍攝方案", en: "Photo Session", desc: "方案介紹頁內容" },
      { href: "#/posts", title: "部落格文章", en: "Journal", desc: "滑雪日誌文章，含圖文區塊" },
    ]
      .map(function (c) {
        return (
          '<a class="admin-card glass" href="' +
          c.href +
          '">' +
          '<span class="admin-card__en">' +
          c.en +
          "</span>" +
          "<h2>" +
          c.title +
          "</h2>" +
          "<p>" +
          c.desc +
          "</p>" +
          '<span class="admin-card__link">管理內容 →</span>' +
          "</a>"
        );
      })
      .join("");

    root.innerHTML = shell("dashboard", '<div class="admin-dashboard-grid">' + cards + "</div>");
    wireShellChrome(root);
  }

  // ---------- gallery ----------
  var GALLERY_PATH = "src/_data/gallery.json";
  var TAG_OPTIONS = ["ACTION", "TOWN", "LIFESTYLE", "PORTRAIT"];

  function renderGalleryList(root) {
    root.innerHTML = shell("gallery", '<div class="admin-loading">載入中…</div>');
    wireShellChrome(root);

    AdminAPI.getFile(GALLERY_PATH).then(function (file) {
      var items = file ? JSON.parse(file.content) : [];

      function draw() {
        var rows = items
          .map(function (item, i) {
            return (
              '<div class="admin-list-row glass" data-i="' +
              i +
              '">' +
              '<img class="admin-list-row__thumb" src="' +
              esc(AdminAPI.rawUrl(item.image)) +
              '" alt="">' +
              '<div class="admin-list-row__body">' +
              "<strong>" +
              esc(item.caption) +
              "</strong>" +
              '<span class="admin-list-row__meta">' +
              esc(item.tag) +
              " · " +
              (item.orientation === "portrait" ? "直式" : "橫式") +
              "</span></div>" +
              '<div class="admin-list-row__actions">' +
              '<button type="button" class="admin-btn admin-btn--icon" data-up' +
              (i === 0 ? " disabled" : "") +
              '">↑</button>' +
              '<button type="button" class="admin-btn admin-btn--icon" data-down' +
              (i === items.length - 1 ? " disabled" : "") +
              '">↓</button>' +
              '<button type="button" class="admin-btn admin-btn--small" data-edit>編輯</button>' +
              '<button type="button" class="admin-btn admin-btn--small admin-btn--danger" data-delete>刪除</button>' +
              "</div></div>"
            );
          })
          .join("");

        listEl.innerHTML = rows || '<p class="admin-empty">還沒有任何照片。</p>';

        qsa(listEl, "[data-edit]").forEach(function (btn, i) {
          btn.addEventListener("click", function () {
            location.hash = "#/gallery/edit/" + i;
          });
        });
        qsa(listEl, "[data-delete]").forEach(function (btn, i) {
          btn.addEventListener("click", function () {
            if (!confirm("確定要刪除「" + items[i].caption + "」嗎？")) return;
            withBusy(btn, function () {
              return AdminAPI.getFile(GALLERY_PATH).then(function (latest) {
                var arr = JSON.parse(latest.content);
                arr.splice(i, 1);
                return AdminAPI.putFile(
                  GALLERY_PATH,
                  JSON.stringify(arr, null, 2) + "\n",
                  "後台刪除作品集照片",
                  latest.sha
                ).then(function () {
                  toast("已刪除", "success");
                  renderGalleryList(root);
                });
              });
            });
          });
        });
        qsa(listEl, "[data-up]").forEach(function (btn, i) {
          btn.addEventListener("click", function () {
            if (i === 0) return;
            move(i, i - 1);
          });
        });
        qsa(listEl, "[data-down]").forEach(function (btn, i) {
          btn.addEventListener("click", function () {
            if (i === items.length - 1) return;
            move(i, i + 1);
          });
        });
      }

      function move(from, to) {
        withBusy(document.body, function () {
          return AdminAPI.getFile(GALLERY_PATH).then(function (latest) {
            var arr = JSON.parse(latest.content);
            var tmp = arr[from];
            arr[from] = arr[to];
            arr[to] = tmp;
            return AdminAPI.putFile(
              GALLERY_PATH,
              JSON.stringify(arr, null, 2) + "\n",
              "後台調整作品集照片順序",
              latest.sha
            ).then(function () {
              renderGalleryList(root);
            });
          });
        });
      }

      root.innerHTML = shell(
        "gallery",
        '<div class="admin-page-head"><h1>作品集</h1><a class="admin-btn admin-btn--primary" href="#/gallery/new">+ 新增照片</a></div>' +
          '<div class="admin-list" id="admin-gallery-list"></div>'
      );
      wireShellChrome(root);
      var listEl = qs(root, "#admin-gallery-list");
      draw();
    });
  }

  function renderGalleryForm(root, index) {
    var isNew = index == null;
    root.innerHTML = shell("gallery", '<div class="admin-loading">載入中…</div>');
    wireShellChrome(root);

    AdminAPI.getFile(GALLERY_PATH).then(function (file) {
      var arr = file ? JSON.parse(file.content) : [];
      var state = isNew
        ? { image: "", alt: "", caption: "", tag: "ACTION", orientation: "landscape" }
        : Object.assign({}, arr[index]);

      var body =
        '<div class="admin-page-head"><h1>' +
        (isNew ? "新增作品集照片" : "編輯作品集照片") +
        '</h1><a class="admin-btn admin-btn--ghost" href="#/gallery">← 返回列表</a></div>' +
        '<form class="admin-form glass-panel" id="admin-gallery-form">' +
        '<div id="admin-gallery-image"></div>' +
        '<div class="admin-field"><div class="admin-field__label">說明文字（Caption）</div><input type="text" id="f-caption"></div>' +
        '<div class="admin-field"><div class="admin-field__label">分類標籤</div><select id="f-tag">' +
        TAG_OPTIONS.map(function (t) {
          return '<option value="' + t + '">' + t + "</option>";
        }).join("") +
        "</select></div>" +
        '<div class="admin-field"><div class="admin-field__label">圖片方向</div>' +
        '<label class="admin-radio"><input type="radio" name="orientation" value="landscape"> 橫式</label>' +
        '<label class="admin-radio"><input type="radio" name="orientation" value="portrait"> 直式</label>' +
        "</div>" +
        '<button type="submit" class="admin-btn admin-btn--primary">儲存</button>' +
        "</form>";

      root.innerHTML = shell("gallery", body);
      wireShellChrome(root);
      var form = qs(root, "#admin-gallery-form");
      qs(form, "#admin-gallery-image").appendChild(renderImageField(state, "image", "alt", "照片"));
      bindText(form, "#f-caption", state, "caption");
      qs(form, "#f-tag").value = state.tag;
      qs(form, "#f-tag").addEventListener("change", function (e) {
        state.tag = e.target.value;
      });
      qsa(form, 'input[name="orientation"]').forEach(function (radio) {
        radio.checked = radio.value === state.orientation;
        radio.addEventListener("change", function () {
          state.orientation = radio.value;
        });
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!state.image) {
          toast("請先上傳照片", "error");
          return;
        }
        withBusy(qs(form, 'button[type="submit"]'), function () {
          return AdminAPI.getFile(GALLERY_PATH).then(function (latest) {
            var latestArr = JSON.parse(latest.content);
            if (isNew) {
              latestArr.push(state);
            } else {
              latestArr[index] = state;
            }
            return AdminAPI.putFile(
              GALLERY_PATH,
              JSON.stringify(latestArr, null, 2) + "\n",
              "後台更新作品集：" + state.caption,
              latest.sha
            ).then(function () {
              toast("已儲存", "success");
              location.hash = "#/gallery";
            });
          });
        });
      });
    });
  }

  // ---------- shared: live preview wiring ----------
  function wireLivePreview(form, previewEl, buildHtml) {
    function refresh() {
      previewEl.innerHTML = buildHtml();
    }
    form.addEventListener("input", refresh);
    form.addEventListener("change", refresh);
    form.addEventListener("click", function () {
      setTimeout(refresh, 0);
    });
    refresh();
  }

  function buildPlanPreviewHtml(state) {
    var heroImg = state.heroImage
      ? '<div class="article-hero__image"><img src="' +
        esc(AdminAPI.rawUrl(state.heroImage)) +
        '" alt="' +
        esc(state.heroImageAlt) +
        '"></div>'
      : "";
    var sectionsHtml = (state.sections || [])
      .map(function (s) {
        return (
          '<div class="article-section"><h2>' +
          esc(s.heading) +
          "</h2><ul>" +
          (s.items || [])
            .map(function (it) {
              return "<li>" + esc(it) + "</li>";
            })
            .join("") +
          "</ul></div>"
        );
      })
      .join("");
    var groupsHtml = "";
    if (state.groups && state.groups.length) {
      groupsHtml =
        '<div class="article-section"><h2>' +
        esc(state.groupsHeading || "方案內容") +
        '</h2><div class="plan-premium__groups">' +
        state.groups
          .map(function (g) {
            return (
              '<div class="plan-premium__group"><h4><span>' +
              esc(g.icon) +
              "</span> " +
              esc(g.title) +
              "</h4><ul>" +
              (g.items || [])
                .map(function (it) {
                  return "<li>" + esc(it) + "</li>";
                })
                .join("") +
              "</ul></div>"
            );
          })
          .join("") +
        "</div></div>";
    }
    return (
      '<div class="article-hero"><span class="article-hero__tag">' +
      esc(state.eyebrowNumber) +
      " · " +
      esc(state.eyebrowLabel || state.title) +
      "</span><h1>" +
      esc(state.title) +
      '</h1><p class="article-hero__meta">' +
      esc(state.subtitleEn) +
      "</p>" +
      heroImg +
      '</div><div class="article-body"><p class="article-body__lead">' +
      esc(state.leadParagraph) +
      "</p>" +
      sectionsHtml +
      groupsHtml +
      '<div class="article-cta glass-panel"><p>' +
      esc(state.ctaText) +
      '</p><a class="article-cta__btn glass">查看預約方式 →</a></div></div>'
    );
  }

  // ---------- plans ----------
  var PLANS_DIR = "src/plans";

  function renderPlansList(root) {
    root.innerHTML = shell("plans", '<div class="admin-loading">載入中…</div>');
    wireShellChrome(root);

    AdminAPI.listDir(PLANS_DIR).then(function (entries) {
      var files = entries.filter(function (e) {
        return e.type === "file" && /\.md$/.test(e.name);
      });
      return Promise.all(
        files.map(function (e) {
          return AdminAPI.getFile(e.path).then(function (f) {
            var data = AdminAPI.parseFrontmatter(f.content).data;
            return { slug: e.name.replace(/\.md$/, ""), title: data.title, order: data.order || 0 };
          });
        })
      );
    }).then(function (plans) {
      plans.sort(function (a, b) {
        return a.order - b.order;
      });
      var rows = plans
        .map(function (p) {
          return (
            '<div class="admin-list-row glass">' +
            '<div class="admin-list-row__body"><strong>' +
            esc(p.title) +
            "</strong><span class=\"admin-list-row__meta\">" +
            esc(p.slug) +
            "</span></div>" +
            '<div class="admin-list-row__actions">' +
            '<a class="admin-btn admin-btn--small" href="#/plans/edit/' +
            p.slug +
            '">編輯</a>' +
            "</div></div>"
          );
        })
        .join("");
      root.innerHTML = shell(
        "plans",
        '<div class="admin-page-head"><h1>拍攝方案</h1><a class="admin-btn admin-btn--primary" href="#/plans/new">+ 新增方案</a></div>' +
          '<div class="admin-list">' +
          (rows || '<p class="admin-empty">還沒有任何方案。</p>') +
          "</div>"
      );
      wireShellChrome(root);
    });
  }

  function renderPlanForm(root, slug) {
    var isNew = slug == null;
    root.innerHTML = shell("plans", '<div class="admin-loading">載入中…</div>');
    wireShellChrome(root);

    var loadExisting = isNew
      ? Promise.resolve(null)
      : AdminAPI.getFile(PLANS_DIR + "/" + slug + ".md");

    loadExisting.then(function (file) {
      var sha = file ? file.sha : null;
      var data = file ? AdminAPI.parseFrontmatter(file.content).data : {};
      var state = Object.assign(
        {
          layout: "plan",
          title: "",
          subtitleEn: "",
          eyebrowNumber: "",
          eyebrowLabel: "",
          serviceType: "",
          heroImage: "",
          heroImageAlt: "",
          leadParagraph: "",
          previewDescription: "",
          order: 1,
          ctaText: "",
          sections: [],
          groupsHeading: "",
          groups: [],
          seo: { title: "", description: "", keywords: "", ogImage: "" },
        },
        data
      );
      var slugState = { value: slug || "", touched: !isNew };

      var body =
        '<div class="admin-page-head"><h1>' +
        (isNew ? "新增拍攝方案" : "編輯拍攝方案") +
        '</h1><a class="admin-btn admin-btn--ghost" href="#/plans">← 返回列表</a></div>' +
        '<div class="admin-editor">' +
        '<form class="admin-form glass-panel" id="admin-plan-form">' +
        (isNew
          ? '<div class="admin-field"><div class="admin-field__label">網址代稱（slug）</div><input type="text" id="f-slug"></div>'
          : "") +
        '<div class="admin-field"><div class="admin-field__label">方案名稱</div><input type="text" id="f-title"></div>' +
        '<div class="admin-field"><div class="admin-field__label">英文副標</div><input type="text" id="f-subtitleEn"></div>' +
        '<div class="admin-field"><div class="admin-field__label">編號（例如 01）</div><input type="text" id="f-eyebrowNumber"></div>' +
        '<div class="admin-field"><div class="admin-field__label">編號旁標籤（留空使用方案名稱）</div><input type="text" id="f-eyebrowLabel"></div>' +
        '<div class="admin-field"><div class="admin-field__label">服務類型（SEO 結構化資料用）</div><input type="text" id="f-serviceType"></div>' +
        '<div id="admin-plan-image"></div>' +
        '<div class="admin-field"><div class="admin-field__label">開場段落</div><textarea id="f-leadParagraph" rows="3"></textarea></div>' +
        '<div class="admin-field"><div class="admin-field__label">首頁卡片一句話簡介</div><input type="text" id="f-previewDescription"></div>' +
        '<div class="admin-field"><div class="admin-field__label">首頁排序（數字愈小愈前面）</div><input type="number" id="f-order"></div>' +
        '<div class="admin-field"><div class="admin-field__label">結尾行動呼籲文字</div><textarea id="f-ctaText" rows="2"></textarea></div>' +
        '<div id="admin-plan-sections"></div>' +
        '<div class="admin-field"><div class="admin-field__label">分組區塊標題（選填）</div><input type="text" id="f-groupsHeading"></div>' +
        '<div id="admin-plan-groups"></div>' +
        '<div class="admin-field__label">SEO 設定</div>' +
        '<div class="admin-field"><div class="admin-field__label">SEO 標題（留空自動帶入標題）</div><input type="text" id="f-seo-title"></div>' +
        '<div class="admin-field"><div class="admin-field__label">SEO 描述</div><textarea id="f-seo-description" rows="2"></textarea></div>' +
        '<div class="admin-field"><div class="admin-field__label">SEO 關鍵字（逗號分隔）</div><input type="text" id="f-seo-keywords"></div>' +
        '<div id="admin-plan-ogimage"></div>' +
        '<button type="submit" class="admin-btn admin-btn--primary">儲存</button>' +
        "</form>" +
        '<div class="admin-preview"><div class="admin-preview__label">即時預覽</div><div class="admin-preview__frame" id="admin-plan-preview"></div></div>' +
        "</div>";

      root.innerHTML = shell("plans", body);
      wireShellChrome(root);
      var form = qs(root, "#admin-plan-form");

      if (isNew) {
        var slugInput = qs(form, "#f-slug");
        slugInput.value = slugState.value;
        slugInput.addEventListener("input", function () {
          slugState.touched = true;
          slugState.value = slugInput.value;
        });
      }

      var titleInput = bindText(form, "#f-title", state, "title");
      titleInput.addEventListener("input", function () {
        if (isNew && !slugState.touched) {
          slugState.value = AdminAPI.slugify(state.title);
          qs(form, "#f-slug").value = slugState.value;
        }
      });
      bindText(form, "#f-subtitleEn", state, "subtitleEn");
      bindText(form, "#f-eyebrowNumber", state, "eyebrowNumber");
      bindText(form, "#f-eyebrowLabel", state, "eyebrowLabel");
      bindText(form, "#f-serviceType", state, "serviceType");
      qs(form, "#admin-plan-image").appendChild(renderImageField(state, "heroImage", "heroImageAlt", "主圖"));
      bindText(form, "#f-leadParagraph", state, "leadParagraph");
      bindText(form, "#f-previewDescription", state, "previewDescription");
      bindText(form, "#f-order", state, "order");
      bindText(form, "#f-ctaText", state, "ctaText");

      qs(form, "#admin-plan-sections").appendChild(
        renderObjectList(
          state.sections,
          "內容區塊（例如：適合對象、內容包含）",
          "+ 新增區塊",
          function () {
            return { heading: "", items: [] };
          },
          function (item, bodyEl) {
            bodyEl.innerHTML = '<div class="admin-field"><div class="admin-field__label">標題</div><input type="text" class="admin-block-heading"></div>';
            bindText(bodyEl, ".admin-block-heading", item, "heading");
            item.items = item.items || [];
            bodyEl.appendChild(renderStringList(item.items, "項目清單", "例如：個人"));
          }
        )
      );

      bindText(form, "#f-groupsHeading", state, "groupsHeading");
      qs(form, "#admin-plan-groups").appendChild(
        renderObjectList(
          state.groups,
          "分組項目（選填，例如尊榮服務方案的多個服務分類）",
          "+ 新增分組",
          function () {
            return { icon: "✨", title: "", items: [] };
          },
          function (item, bodyEl) {
            bodyEl.innerHTML =
              '<div class="admin-field"><div class="admin-field__label">圖示 Emoji</div><input type="text" class="admin-block-icon"></div>' +
              '<div class="admin-field"><div class="admin-field__label">分組標題</div><input type="text" class="admin-block-title"></div>';
            bindText(bodyEl, ".admin-block-icon", item, "icon");
            bindText(bodyEl, ".admin-block-title", item, "title");
            item.items = item.items || [];
            bodyEl.appendChild(renderStringList(item.items, "項目清單", ""));
          }
        )
      );

      bindText(form, "#f-seo-title", state.seo, "title");
      bindText(form, "#f-seo-description", state.seo, "description");
      bindText(form, "#f-seo-keywords", state.seo, "keywords");
      qs(form, "#admin-plan-ogimage").appendChild(renderImageField(state.seo, "ogImage", null, "社群分享圖（留空使用主圖）"));

      var previewEl = qs(root, "#admin-plan-preview");
      wireLivePreview(form, previewEl, function () {
        return buildPlanPreviewHtml(state);
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var finalSlug = isNew ? slugState.value.trim() : slug;
        if (!finalSlug) {
          toast("請填寫網址代稱", "error");
          return;
        }
        state.order = Number(state.order) || 0;
        withBusy(qs(form, 'button[type="submit"]'), function () {
          var path = PLANS_DIR + "/" + finalSlug + ".md";
          var content = AdminAPI.serializeFrontmatter(state);
          if (isNew) {
            return AdminAPI.getFile(path).then(function (existing) {
              if (existing) throw new Error("這個網址代稱已經存在，請換一個");
              return AdminAPI.putFile(path, content, "後台新增拍攝方案：" + state.title).then(function () {
                toast("已儲存", "success");
                location.hash = "#/plans";
              });
            });
          }
          return AdminAPI.putFile(path, content, "後台更新拍攝方案：" + state.title, sha).then(function () {
            toast("已儲存", "success");
            location.hash = "#/plans";
          });
        });
      });
    });
  }

  // ---------- posts: contentBlocks editor ----------
  var blockUidCounter = 0;

  function renderContentBlockFields(item, bodyEl) {
    if (!item.type) item.type = item.image ? "image-text" : item.html != null ? "html" : "text";
    var uid = "blk" + ++blockUidCounter;

    function draw() {
      var typeSel =
        '<div class="admin-field"><div class="admin-field__label">區塊類型</div><select class="admin-block-type">' +
        ["text", "image-text", "html"]
          .map(function (t) {
            var label = t === "text" ? "純文字" : t === "image-text" ? "圖片＋文字" : "進階 HTML";
            return '<option value="' + t + '"' + (item.type === t ? " selected" : "") + '>' + label + "</option>";
          })
          .join("") +
        "</select></div>";

      var fieldsHtml;
      if (item.type === "html") {
        fieldsHtml =
          '<div class="admin-field"><div class="admin-field__label">自訂 HTML</div><textarea class="admin-block-html" rows="6"></textarea></div>';
      } else {
        fieldsHtml = '<div class="admin-field"><div class="admin-field__label">標題</div><input type="text" class="admin-block-heading"></div>';
        if (item.type === "image-text") {
          fieldsHtml +=
            '<div class="admin-block-image-slot"></div>' +
            '<div class="admin-field"><div class="admin-field__label">圖片位置</div>' +
            '<label class="admin-radio"><input type="radio" name="' +
            uid +
            '" value="left"> 靠左</label>' +
            '<label class="admin-radio"><input type="radio" name="' +
            uid +
            '" value="right"> 靠右</label></div>';
        }
        fieldsHtml += '<div class="admin-block-paragraphs-slot"></div><div class="admin-block-items-slot"></div>';
      }

      bodyEl.innerHTML = typeSel + fieldsHtml;
      qs(bodyEl, ".admin-block-type").addEventListener("change", function (e) {
        item.type = e.target.value;
        draw();
      });

      if (item.type === "html") {
        item.html = item.html || "";
        var ta = qs(bodyEl, ".admin-block-html");
        ta.value = item.html;
        ta.addEventListener("input", function () {
          item.html = ta.value;
        });
      } else {
        bindText(bodyEl, ".admin-block-heading", item, "heading");
        if (item.type === "image-text") {
          qs(bodyEl, ".admin-block-image-slot").appendChild(renderImageField(item, "image", "imageAlt", "圖片"));
          item.imagePosition = item.imagePosition || "left";
          qsa(bodyEl, 'input[name="' + uid + '"]').forEach(function (r) {
            r.checked = r.value === item.imagePosition;
            r.addEventListener("change", function () {
              item.imagePosition = r.value;
            });
          });
        }
        item.paragraphs = item.paragraphs || [];
        qs(bodyEl, ".admin-block-paragraphs-slot").appendChild(renderStringList(item.paragraphs, "段落文字", ""));
        item.items = item.items || [];
        qs(bodyEl, ".admin-block-items-slot").appendChild(renderStringList(item.items, "條列項目（選填）", ""));
      }
    }
    draw();
  }

  function normalizeBlocksForSave(blocks) {
    return (blocks || []).map(function (b) {
      if (b.type === "html") {
        return { type: "html", html: b.html || "" };
      }
      var out = { heading: b.heading || "", paragraphs: b.paragraphs || [] };
      if (b.items && b.items.length) out.items = b.items;
      if (b.type === "image-text" && b.image) {
        out.image = b.image;
        out.imageAlt = b.imageAlt || "";
        out.imagePosition = b.imagePosition || "left";
      }
      return out;
    });
  }

  function buildPostPreviewHtml(state) {
    var heroImg = state.heroImage
      ? '<div class="article-hero__image"><img src="' +
        esc(AdminAPI.rawUrl(state.heroImage)) +
        '" alt="' +
        esc(state.heroImageAlt) +
        '"></div>'
      : "";
    var blocksHtml = normalizeBlocksForSave(state.contentBlocks)
      .map(function (b) {
        if (b.type === "html") {
          return '<div class="article-section">' + b.html + "</div>";
        }
        var paras = (b.paragraphs || [])
          .map(function (p) {
            return "<p>" + esc(p) + "</p>";
          })
          .join("");
        var items = b.items && b.items.length
          ? "<ul>" +
            b.items
              .map(function (it) {
                return "<li>" + esc(it) + "</li>";
              })
              .join("") +
            "</ul>"
          : "";
        if (b.image) {
          return (
            '<div class="article-block' +
            (b.imagePosition === "right" ? " article-block--reverse" : "") +
            '"><div class="article-block__media"><img src="' +
            esc(AdminAPI.rawUrl(b.image)) +
            '" alt="' +
            esc(b.imageAlt) +
            '"></div><div class="article-block__text"><h2>' +
            esc(b.heading) +
            "</h2>" +
            paras +
            items +
            "</div></div>"
          );
        }
        return '<div class="article-section"><h2>' + esc(b.heading) + "</h2>" + paras + items + "</div>";
      })
      .join("");

    return (
      '<div class="article-hero"><span class="article-hero__tag">' +
      esc(state.tag) +
      "</span><h1>" +
      esc(state.title) +
      '</h1><p class="article-hero__meta">' +
      esc(state.metaLine) +
      "</p>" +
      heroImg +
      '</div><div class="article-body"><p class="article-body__lead">' +
      esc(state.leadParagraph) +
      "</p>" +
      blocksHtml +
      '<div class="article-cta glass-panel"><p>如果你也想在日本滑雪旅行中留下自然又有質感的回憶，歡迎查看日本滑雪攝影方案與可預約檔期。</p><a class="article-cta__btn glass">查看預約方案 →</a></div></div>'
    );
  }

  // ---------- posts ----------
  var POSTS_DIR = "src/posts";

  function renderPostsList(root) {
    root.innerHTML = shell("posts", '<div class="admin-loading">載入中…</div>');
    wireShellChrome(root);

    AdminAPI.listDir(POSTS_DIR).then(function (entries) {
      var files = entries.filter(function (e) {
        return e.type === "file" && /\.md$/.test(e.name);
      });
      return Promise.all(
        files.map(function (e) {
          return AdminAPI.getFile(e.path).then(function (f) {
            var data = AdminAPI.parseFrontmatter(f.content).data;
            return { slug: e.name.replace(/\.md$/, ""), title: data.title, date: data.date };
          });
        })
      );
    }).then(function (posts) {
      posts.sort(function (a, b) {
        return String(b.date).localeCompare(String(a.date));
      });
      var rows = posts
        .map(function (p) {
          return (
            '<div class="admin-list-row glass">' +
            '<div class="admin-list-row__body"><strong>' +
            esc(p.title) +
            "</strong><span class=\"admin-list-row__meta\">" +
            esc(p.date) +
            " · " +
            esc(p.slug) +
            "</span></div>" +
            '<div class="admin-list-row__actions">' +
            '<a class="admin-btn admin-btn--small" href="#/posts/edit/' +
            encodeURIComponent(p.slug) +
            '">編輯</a>' +
            '<button type="button" class="admin-btn admin-btn--small admin-btn--danger" data-delete>刪除</button>' +
            "</div></div>"
          );
        })
        .join("");
      root.innerHTML = shell(
        "posts",
        '<div class="admin-page-head"><h1>部落格文章</h1><a class="admin-btn admin-btn--primary" href="#/posts/new">+ 新增文章</a></div>' +
          '<div class="admin-list">' +
          (rows || '<p class="admin-empty">還沒有任何文章。</p>') +
          "</div>"
      );
      wireShellChrome(root);

      qsa(root, "[data-delete]").forEach(function (btn, i) {
        btn.addEventListener("click", function () {
          var post = posts[i];
          if (!confirm("確定要刪除「" + post.title + "」嗎？此操作無法復原。")) return;
          withBusy(btn, function () {
            return AdminAPI.getFile(POSTS_DIR + "/" + post.slug + ".md").then(function (latest) {
              return AdminAPI.deleteFile(
                POSTS_DIR + "/" + post.slug + ".md",
                "後台刪除文章：" + post.title,
                latest.sha
              );
            }).then(function () {
              toast("已刪除", "success");
              renderPostsList(root);
            });
          });
        });
      });
    });
  }

  function renderPostForm(root, slug) {
    var isNew = slug == null;
    root.innerHTML = shell("posts", '<div class="admin-loading">載入中…</div>');
    wireShellChrome(root);

    var loadExisting = isNew ? Promise.resolve(null) : AdminAPI.getFile(POSTS_DIR + "/" + slug + ".md");

    loadExisting.then(function (file) {
      var sha = file ? file.sha : null;
      var data = file ? AdminAPI.parseFrontmatter(file.content).data : {};
      var today = new Date().toISOString().slice(0, 10);
      var state = Object.assign(
        {
          layout: "article",
          title: "",
          tag: "",
          metaLine: "",
          heroImage: "",
          heroImageAlt: "",
          previewImage: "",
          previewImageAlt: "",
          leadParagraph: "",
          date: today,
          dateModified: today,
          previewDescription: "",
          seo: { title: "", description: "", keywords: "" },
          contentBlocks: [],
        },
        data
      );
      var slugState = { value: slug || "", touched: !isNew };

      var body =
        '<div class="admin-page-head"><h1>' +
        (isNew ? "新增文章" : "編輯文章") +
        '</h1><a class="admin-btn admin-btn--ghost" href="#/posts">← 返回列表</a></div>' +
        '<div class="admin-editor">' +
        '<form class="admin-form glass-panel" id="admin-post-form">' +
        (isNew
          ? '<div class="admin-field"><div class="admin-field__label">網址代稱（slug）</div><input type="text" id="f-slug"></div>'
          : "") +
        '<div class="admin-field"><div class="admin-field__label">標題</div><input type="text" id="f-title"></div>' +
        '<div class="admin-field"><div class="admin-field__label">分類標籤</div><input type="text" id="f-tag" placeholder="例如：教學、比較、雪場攻略"></div>' +
        '<div class="admin-field"><div class="admin-field__label">副標說明</div><input type="text" id="f-metaLine"></div>' +
        '<div id="admin-post-hero"></div>' +
        '<div id="admin-post-preview-image"></div>' +
        '<div class="admin-field"><div class="admin-field__label">開場段落</div><textarea id="f-leadParagraph" rows="3"></textarea></div>' +
        '<div class="admin-field"><div class="admin-field__label">發布日期</div><input type="date" id="f-date"></div>' +
        '<div class="admin-field"><div class="admin-field__label">更新日期</div><input type="date" id="f-dateModified"></div>' +
        '<div class="admin-field"><div class="admin-field__label">首頁卡片一句話簡介</div><input type="text" id="f-previewDescription"></div>' +
        '<div id="admin-post-blocks"></div>' +
        '<div class="admin-field__label">SEO 設定</div>' +
        '<div class="admin-field"><div class="admin-field__label">SEO 標題（留空自動帶入標題）</div><input type="text" id="f-seo-title"></div>' +
        '<div class="admin-field"><div class="admin-field__label">SEO 描述</div><textarea id="f-seo-description" rows="2"></textarea></div>' +
        '<div class="admin-field"><div class="admin-field__label">SEO 關鍵字（逗號分隔）</div><input type="text" id="f-seo-keywords"></div>' +
        '<button type="submit" class="admin-btn admin-btn--primary">儲存</button>' +
        "</form>" +
        '<div class="admin-preview"><div class="admin-preview__label">即時預覽</div><div class="admin-preview__frame" id="admin-post-preview"></div></div>' +
        "</div>";

      root.innerHTML = shell("posts", body);
      wireShellChrome(root);
      var form = qs(root, "#admin-post-form");

      if (isNew) {
        var slugInput = qs(form, "#f-slug");
        slugInput.value = slugState.value;
        slugInput.addEventListener("input", function () {
          slugState.touched = true;
          slugState.value = slugInput.value;
        });
      }

      var titleInput = bindText(form, "#f-title", state, "title");
      titleInput.addEventListener("input", function () {
        if (isNew && !slugState.touched) {
          slugState.value = AdminAPI.slugify(state.title);
          qs(form, "#f-slug").value = slugState.value;
        }
      });
      bindText(form, "#f-tag", state, "tag");
      bindText(form, "#f-metaLine", state, "metaLine");
      qs(form, "#admin-post-hero").appendChild(renderImageField(state, "heroImage", "heroImageAlt", "主圖（文章頁大圖）"));
      qs(form, "#admin-post-preview-image").appendChild(
        renderImageField(state, "previewImage", "previewImageAlt", "首頁卡片縮圖（留空使用主圖）")
      );
      bindText(form, "#f-leadParagraph", state, "leadParagraph");
      bindText(form, "#f-date", state, "date");
      bindText(form, "#f-dateModified", state, "dateModified");
      bindText(form, "#f-previewDescription", state, "previewDescription");

      qs(form, "#admin-post-blocks").appendChild(
        renderObjectList(
          state.contentBlocks,
          "文章內容（圖文區塊）",
          "+ 新增區塊",
          function () {
            return { type: "text", heading: "", paragraphs: [], items: [] };
          },
          renderContentBlockFields
        )
      );

      bindText(form, "#f-seo-title", state.seo, "title");
      bindText(form, "#f-seo-description", state.seo, "description");
      bindText(form, "#f-seo-keywords", state.seo, "keywords");

      var previewEl = qs(root, "#admin-post-preview");
      wireLivePreview(form, previewEl, function () {
        return buildPostPreviewHtml(state);
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var finalSlug = isNew ? slugState.value.trim() : slug;
        if (!finalSlug) {
          toast("請填寫網址代稱", "error");
          return;
        }
        withBusy(qs(form, 'button[type="submit"]'), function () {
          var path = POSTS_DIR + "/" + finalSlug + ".md";
          var toSave = Object.assign({}, state, { contentBlocks: normalizeBlocksForSave(state.contentBlocks) });
          var content = AdminAPI.serializeFrontmatter(toSave);
          if (isNew) {
            return AdminAPI.getFile(path).then(function (existing) {
              if (existing) throw new Error("這個網址代稱已經存在，請換一個");
              return AdminAPI.putFile(path, content, "後台新增文章：" + state.title).then(function () {
                toast("已儲存", "success");
                location.hash = "#/posts";
              });
            });
          }
          return AdminAPI.putFile(path, content, "後台更新文章：" + state.title, sha).then(function () {
            toast("已儲存", "success");
            location.hash = "#/posts";
          });
        });
      });
    });
  }

  // ---------- homepage settings ----------
  var SITE_PATH = "src/_data/site.json";

  // Mirrors the real homepage hero (.chapter__media / .chapter__content--hero)
  // and the about page (.about__inner) markup/classes so the preview is styled
  // exactly like the live site, not just a same-color-scheme approximation.
  function buildHomePreviewHtml(state) {
    var heroImg = state.heroImage
      ? '<img src="' + esc(AdminAPI.rawUrl(state.heroImage)) + '" alt="">'
      : "";
    return (
      '<div class="admin-hero-frame">' +
      '<div class="chapter__media">' +
      heroImg +
      "</div>" +
      '<div class="chapter__scrim chapter__scrim--hero"></div>' +
      '<div class="chapter__content chapter__content--hero">' +
      '<p class="eyebrow">SNOW PHOTOGRAPHY SERVICES</p>' +
      "<h1>SnowSurfStudio</h1>" +
      '<p class="chapter__location">' +
      esc(state.heroLocationLine) +
      "</p>" +
      '<p class="chapter__sub">2026 / 27 Season &middot; @snowsurfstudio</p>' +
      "</div></div>" +
      '<div class="about glass-panel admin-about-frame"><div class="about__inner">' +
      '<h3 class="about__brand">SnowSurfStudio</h3><p>' +
      esc(state.aboutBody) +
      "</p></div></div>"
    );
  }

  function renderHomepageForm(root) {
    root.innerHTML = shell("homepage", '<div class="admin-loading">載入中…</div>');
    wireShellChrome(root);

    AdminAPI.getFile(SITE_PATH).then(function (file) {
      var sha = file.sha;
      var state = Object.assign(
        {
          heroLocationLine: "",
          heroImage: "",
          heroImageAlt: "",
          aboutBody: "",
          seo: { title: "", description: "", keywords: "", ogImage: "" },
          newsItems: [],
        },
        JSON.parse(file.content)
      );

      var bodyHtml =
        '<div class="admin-page-head"><h1>封面與首頁設定</h1></div>' +
        '<div class="admin-editor">' +
        '<form class="admin-form glass-panel" id="admin-home-form">' +
        '<div id="admin-home-heroimage"></div>' +
        '<div class="admin-field"><div class="admin-field__label">首頁大標下方地點副標</div><input type="text" id="f-heroLocationLine"></div>' +
        '<div class="admin-field"><div class="admin-field__label">關於我們段落文字</div><textarea id="f-aboutBody" rows="6"></textarea></div>' +
        '<div id="admin-home-news"></div>' +
        '<div class="admin-field__label">首頁 SEO 設定</div>' +
        '<div class="admin-field"><div class="admin-field__label">SEO 標題</div><input type="text" id="f-seo-title"></div>' +
        '<div class="admin-field"><div class="admin-field__label">SEO 描述</div><textarea id="f-seo-description" rows="2"></textarea></div>' +
        '<div class="admin-field"><div class="admin-field__label">SEO 關鍵字（逗號分隔）</div><input type="text" id="f-seo-keywords"></div>' +
        '<div id="admin-home-ogimage"></div>' +
        '<button type="submit" class="admin-btn admin-btn--primary">儲存</button>' +
        "</form>" +
        '<div class="admin-preview"><div class="admin-preview__label">即時預覽</div><div class="admin-preview__frame" id="admin-home-preview"></div></div>' +
        "</div>";

      root.innerHTML = shell("homepage", bodyHtml);
      wireShellChrome(root);
      var form = qs(root, "#admin-home-form");

      qs(form, "#admin-home-heroimage").appendChild(renderImageField(state, "heroImage", "heroImageAlt", "首頁主視覺（Hero 大圖）"));
      bindText(form, "#f-heroLocationLine", state, "heroLocationLine");
      bindText(form, "#f-aboutBody", state, "aboutBody");

      qs(form, "#admin-home-news").appendChild(
        renderObjectList(
          state.newsItems,
          "最新消息（只有「顯示這則消息」打開的第一則會顯示在首頁）",
          "+ 新增消息",
          function () {
            return { active: false, title: "", copy: [], buttonLabel: "查看預約方式 →" };
          },
          function (item, bodyEl) {
            bodyEl.innerHTML =
              '<label class="admin-checkbox"><input type="checkbox" class="admin-news-active"> 顯示這則消息</label>' +
              '<div class="admin-field"><div class="admin-field__label">標題</div><input type="text" class="admin-news-title"></div>' +
              '<div class="admin-news-copy-slot"></div>' +
              '<div class="admin-field"><div class="admin-field__label">按鈕文字</div><input type="text" class="admin-news-btn"></div>';
            var activeBox = qs(bodyEl, ".admin-news-active");
            activeBox.checked = !!item.active;
            activeBox.addEventListener("change", function () {
              item.active = activeBox.checked;
            });
            bindText(bodyEl, ".admin-news-title", item, "title");
            bindText(bodyEl, ".admin-news-btn", item, "buttonLabel");
            item.copy = item.copy || [];
            qs(bodyEl, ".admin-news-copy-slot").appendChild(renderStringList(item.copy, "說明重點（條列式）", ""));
          }
        )
      );

      bindText(form, "#f-seo-title", state.seo, "title");
      bindText(form, "#f-seo-description", state.seo, "description");
      bindText(form, "#f-seo-keywords", state.seo, "keywords");
      qs(form, "#admin-home-ogimage").appendChild(renderImageField(state.seo, "ogImage", null, "社群分享圖"));

      var previewEl = qs(root, "#admin-home-preview");
      wireLivePreview(form, previewEl, function () {
        return buildHomePreviewHtml(state);
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        withBusy(qs(form, 'button[type="submit"]'), function () {
          return AdminAPI.putFile(
            SITE_PATH,
            JSON.stringify(state, null, 2) + "\n",
            "後台更新首頁設定",
            sha
          ).then(function () {
            toast("已儲存", "success");
          });
        });
      });
    });
  }

  return {
    el: el,
    qs: qs,
    qsa: qsa,
    esc: esc,
    toast: toast,
    withBusy: withBusy,
    shell: shell,
    wireShellChrome: wireShellChrome,
    renderStringList: renderStringList,
    renderObjectList: renderObjectList,
    renderImageField: renderImageField,
    bindText: bindText,
    wireLivePreview: wireLivePreview,
    renderLogin: renderLogin,
    renderDashboard: renderDashboard,
    renderGalleryList: renderGalleryList,
    renderGalleryForm: renderGalleryForm,
    renderPlansList: renderPlansList,
    renderPlanForm: renderPlanForm,
    renderPostsList: renderPostsList,
    renderPostForm: renderPostForm,
    renderHomepageForm: renderHomepageForm,
  };
})();
