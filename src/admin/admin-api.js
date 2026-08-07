/* GitHub 存取層：登入、讀寫檔案、圖片上傳、frontmatter 解析/序列化。
   登入用的是使用者自己在 GitHub 產生的 Personal Access Token（貼上即可），
   不透過任何第三方中介服務——沒有 popup、沒有 OAuth 導向，單純拿 token 直接呼叫
   GitHub API，同時驗證一次確保 token 有效、有這個 repo 的存取權。 */

var AdminAPI = (function () {
  var REPO_OWNER = "bbbkai0314-netizen";
  var REPO_NAME = "snow-photography";
  var BRANCH = "main";
  var TOKEN_KEY = "admin_gh_token";
  var API_ROOT = "https://api.github.com/repos/" + REPO_OWNER + "/" + REPO_NAME + "/contents/";
  var REPO_ROOT = "https://api.github.com/repos/" + REPO_OWNER + "/" + REPO_NAME;

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
  }

  function login(token) {
    token = (token || "").trim();
    if (!token) return Promise.reject(new Error("請貼上 GitHub 權杖"));
    if (/[^\x20-\x7E]/.test(token)) {
      return Promise.reject(
        new Error("欄位裡的內容看起來不是權杖（可能被瀏覽器自動填入了別的密碼），請把欄位清空後重新手動貼上")
      );
    }
    return fetch(REPO_ROOT, {
      headers: { Accept: "application/vnd.github+json", Authorization: "token " + token },
    }).then(function (res) {
      if (res.status === 401 || res.status === 403) {
        throw new Error("權杖無效或已過期，請重新產生一組");
      }
      if (res.status === 404) {
        throw new Error("這組權杖沒有這個 repo 的存取權限");
      }
      if (!res.ok) {
        throw new Error("驗證失敗（" + res.status + "）");
      }
      setToken(token);
      return token;
    });
  }

  // ---------- UTF-8 safe base64 ----------
  function utf8ToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  function base64ToUtf8(b64) {
    return decodeURIComponent(escape(atob(b64)));
  }

  // ---------- Low-level GitHub Contents API ----------
  function ghFetch(path, options) {
    options = options || {};
    var headers = Object.assign(
      {
        Accept: "application/vnd.github+json",
        Authorization: "token " + getToken(),
      },
      options.headers || {}
    );
    return fetch(API_ROOT + path.replace(/^\//, ""), {
      method: options.method || "GET",
      headers: headers,
      body: options.body,
    });
  }

  function getFile(path) {
    return ghFetch(path + "?ref=" + BRANCH).then(function (res) {
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("讀取失敗：" + path + "（" + res.status + "）");
      return res.json().then(function (json) {
        return {
          sha: json.sha,
          content: base64ToUtf8(json.content.replace(/\n/g, "")),
        };
      });
    });
  }

  function listDir(path) {
    return ghFetch(path + "?ref=" + BRANCH).then(function (res) {
      if (res.status === 404) return [];
      if (!res.ok) throw new Error("讀取目錄失敗：" + path + "（" + res.status + "）");
      return res.json();
    });
  }

  function putFile(path, contentStr, message, sha) {
    var body = {
      message: message,
      content: utf8ToBase64(contentStr),
      branch: BRANCH,
    };
    if (sha) body.sha = sha;
    return ghFetch(path, { method: "PUT", body: JSON.stringify(body) }).then(function (res) {
      if (!res.ok) {
        return res.json().then(function (err) {
          throw new Error("存檔失敗：" + (err.message || res.status));
        });
      }
      return res.json();
    });
  }

  function putBinaryFile(path, base64Content, message, sha) {
    var body = {
      message: message,
      content: base64Content,
      branch: BRANCH,
    };
    if (sha) body.sha = sha;
    return ghFetch(path, { method: "PUT", body: JSON.stringify(body) }).then(function (res) {
      if (!res.ok) {
        return res.json().then(function (err) {
          throw new Error("上傳失敗：" + (err.message || res.status));
        });
      }
      return res.json();
    });
  }

  function deleteFile(path, message, sha) {
    return ghFetch(path, {
      method: "DELETE",
      body: JSON.stringify({ message: message, sha: sha, branch: BRANCH }),
    }).then(function (res) {
      if (!res.ok) {
        return res.json().then(function (err) {
          throw new Error("刪除失敗：" + (err.message || res.status));
        });
      }
      return res.json();
    });
  }

  // ---------- Image upload (src/images/<filename>, auto de-duped) ----------
  function readFileAsBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function uniqueImagePath(filename) {
    var dot = filename.lastIndexOf(".");
    var base = dot === -1 ? filename : filename.slice(0, dot);
    var ext = dot === -1 ? "" : filename.slice(dot);
    var candidate = "src/images/" + filename;
    var n = 2;

    function tryNext() {
      return getFile(candidate).then(function (existing) {
        if (!existing) return candidate;
        candidate = "src/images/" + base + "-" + n + ext;
        n += 1;
        return tryNext();
      });
    }
    return tryNext();
  }

  function uploadImage(file) {
    return uniqueImagePath(file.name).then(function (fullPath) {
      return readFileAsBase64(file).then(function (b64) {
        return putBinaryFile(fullPath, b64, "後台上傳圖片：" + file.name).then(function () {
          return "images/" + fullPath.replace(/^src\/images\//, "");
        });
      });
    });
  }

  // ---------- Frontmatter (YAML) parse / serialize, via js-yaml (CDN) ----------
  function parseFrontmatter(raw) {
    var match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
    if (!match) return { data: {}, body: raw };
    return { data: jsyaml.load(match[1]) || {}, body: match[2] };
  }

  function serializeFrontmatter(data) {
    var yamlStr = jsyaml.dump(data, { lineWidth: -1 });
    return "---\n" + yamlStr + "---\n";
  }

  // ---------- Slug ----------
  function slugify(title) {
    var base = String(title || "")
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "");
    return base || "entry-" + Date.now();
  }

  function rawUrl(imagePath) {
    if (!imagePath) return "";
    return (
      "https://raw.githubusercontent.com/" +
      REPO_OWNER +
      "/" +
      REPO_NAME +
      "/" +
      BRANCH +
      "/src/" +
      imagePath.replace(/^\/+/, "")
    );
  }

  return {
    login: login,
    logout: logout,
    getToken: getToken,
    rawUrl: rawUrl,
    getFile: getFile,
    listDir: listDir,
    putFile: putFile,
    deleteFile: deleteFile,
    uploadImage: uploadImage,
    parseFrontmatter: parseFrontmatter,
    serializeFrontmatter: serializeFrontmatter,
    slugify: slugify,
  };
})();
