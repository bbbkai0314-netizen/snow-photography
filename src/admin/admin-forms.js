// Small reusable DOM/form building blocks for the admin SPA.
// No framework, no build step — just element factories over a mutable state object.
// Text/textarea fields write straight into the bound object on "input" (no re-render,
// so typing never loses focus). Structural changes (add/remove/move a list item) call
// the caller-supplied `rerender()` to redraw just that list.

const AdminForms = (() => {
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value == null || value === false) return;
      if (key.startsWith("on") && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === "className") {
        node.className = value;
      } else if (key === "dataset") {
        Object.entries(value).forEach(([k, v]) => (node.dataset[k] = v));
      } else if (key in node) {
        node[key] = value;
      } else {
        node.setAttribute(key, value);
      }
    });
    (Array.isArray(children) ? children : [children]).forEach((child) => {
      if (child == null || child === false) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function field(labelText, inputNode, hint) {
    return el("label", { className: "admin-field" }, [
      el("span", { className: "admin-field__label" }, labelText),
      inputNode,
      hint ? el("span", { className: "admin-field__hint" }, hint) : null,
    ]);
  }

  function textField({ label, value, placeholder = "", onChange, hint, required = false }) {
    const input = el("input", {
      type: "text",
      className: "admin-input",
      value: value || "",
      placeholder,
      required,
      oninput: (e) => onChange(e.target.value),
    });
    return field(label, input, hint);
  }

  function textareaField({ label, value, rows = 4, placeholder = "", onChange, hint }) {
    const input = el("textarea", {
      className: "admin-input admin-input--textarea",
      rows,
      placeholder,
      value: value || "",
      oninput: (e) => onChange(e.target.value),
    });
    return field(label, input, hint);
  }

  function selectField({ label, value, options, onChange, hint }) {
    const select = el(
      "select",
      { className: "admin-input", onchange: (e) => onChange(e.target.value) },
      options.map((opt) => {
        const optValue = typeof opt === "string" ? opt : opt.value;
        const optLabel = typeof opt === "string" ? opt : opt.label;
        return el("option", { value: optValue, selected: optValue === value }, optLabel);
      })
    );
    return field(label, select, hint);
  }

  function checkboxField({ label, checked, onChange }) {
    const input = el("input", {
      type: "checkbox",
      checked: !!checked,
      onchange: (e) => onChange(e.target.checked),
    });
    return el("label", { className: "admin-field admin-field--checkbox" }, [
      input,
      el("span", { className: "admin-field__label" }, label),
    ]);
  }

  // Image picker: text field with the site-relative path (e.g. "images/foo.jpg"),
  // a live thumbnail, and an "上傳新圖片" button that uploads via AdminApi and fills the path in.
  function imageField({ label, value, onChange, hint }) {
    let current = value || "";
    const preview = el("img", {
      className: "admin-image-preview",
      src: current ? "../" + current : "",
      style: current ? "" : "display:none",
    });
    const pathInput = el("input", {
      type: "text",
      className: "admin-input",
      value: current,
      placeholder: "images/example.jpg",
      oninput: (e) => {
        current = e.target.value;
        onChange(current);
        preview.src = current ? "../" + current : "";
        preview.style.display = current ? "" : "none";
      },
    });
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
          const path = await AdminApi.uploadImage(file);
          current = path;
          pathInput.value = path;
          onChange(current);
          preview.src = "../" + current;
          preview.style.display = "";
        } catch (err) {
          alert(err.message || "圖片上傳失敗");
        } finally {
          uploadBtn.disabled = false;
          uploadBtn.textContent = "上傳新圖片";
          fileInput.value = "";
        }
      },
    });
    const uploadBtn = el(
      "button",
      { type: "button", className: "admin-btn admin-btn--ghost", onclick: () => fileInput.click() },
      "上傳新圖片"
    );
    return field(label, el("div", { className: "admin-image-field" }, [preview, pathInput, uploadBtn, fileInput]), hint);
  }

  // A textarea representing an array of plain strings, one per line.
  function linesField({ label, values, onChange, hint, rows = 3 }) {
    return textareaField({
      label,
      value: (values || []).join("\n"),
      rows,
      onChange: (text) => onChange(text.split("\n").map((s) => s.trim()).filter(Boolean)),
      hint,
    });
  }

  // Generic add/remove/reorder editor for an array of objects.
  // `items` is mutated in place; `renderItem(item, index)` returns the fields for one row;
  // `rerender()` redraws the whole list after a structural change.
  function repeatableList({ items, renderItem, newItem, addLabel = "新增項目", emptyLabel = "尚未新增項目", rerender }) {
    const container = el("div", { className: "admin-repeatable" });

    function draw() {
      container.innerHTML = "";
      if (!items.length) {
        container.appendChild(el("p", { className: "admin-empty" }, emptyLabel));
      }
      items.forEach((item, index) => {
        const rowFields = renderItem(item, index);
        const controls = el("div", { className: "admin-repeatable__controls" }, [
          el(
            "button",
            {
              type: "button",
              className: "admin-btn admin-btn--icon",
              disabled: index === 0,
              title: "上移",
              onclick: () => {
                [items[index - 1], items[index]] = [items[index], items[index - 1]];
                draw();
                rerender && rerender();
              },
            },
            "↑"
          ),
          el(
            "button",
            {
              type: "button",
              className: "admin-btn admin-btn--icon",
              disabled: index === items.length - 1,
              title: "下移",
              onclick: () => {
                [items[index + 1], items[index]] = [items[index], items[index + 1]];
                draw();
                rerender && rerender();
              },
            },
            "↓"
          ),
          el(
            "button",
            {
              type: "button",
              className: "admin-btn admin-btn--icon admin-btn--danger",
              title: "刪除",
              onclick: () => {
                if (!confirm("確定要刪除這個項目嗎？")) return;
                items.splice(index, 1);
                draw();
                rerender && rerender();
              },
            },
            "✕"
          ),
        ]);
        container.appendChild(
          el("div", { className: "admin-repeatable__item glass" }, [
            el("div", { className: "admin-repeatable__body" }, rowFields),
            controls,
          ])
        );
      });
      container.appendChild(
        el(
          "button",
          {
            type: "button",
            className: "admin-btn",
            onclick: () => {
              items.push(newItem());
              draw();
              rerender && rerender();
            },
          },
          addLabel
        )
      );
    }

    draw();
    return container;
  }

  function section(title, children) {
    return el("section", { className: "admin-section glass" }, [
      el("h2", { className: "admin-section__title" }, title),
      ...(Array.isArray(children) ? children : [children]),
    ]);
  }

  return {
    el,
    field,
    textField,
    textareaField,
    linesField,
    selectField,
    checkboxField,
    imageField,
    repeatableList,
    section,
  };
})();
