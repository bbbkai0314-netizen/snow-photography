// GitHub-backed data layer for the admin SPA.
// No backend, no OAuth — the user pastes a fine-grained GitHub Personal Access Token,
// which is stored in localStorage and sent directly to the GitHub Contents API from the browser.

const GH_OWNER = "bbbkai0314-netizen";
const GH_REPO = "snow-photography";
const GH_BRANCH = "main";
const GH_API_ROOT = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}`;
const TOKEN_KEY = "admin_gh_token";

const AdminApi = (() => {
  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  function authHeaders() {
    return {
      Accept: "application/vnd.github+json",
      Authorization: "token " + getToken(),
    };
  }

  // UTF-8 safe base64 encode/decode (browser atob/btoa only handle Latin1 directly).
  function b64Encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  function b64Decode(str) {
    return decodeURIComponent(escape(atob(str.replace(/\n/g, ""))));
  }

  // Validate a token by making a real authenticated request against this repo.
  async function validateToken(token) {
    if (/[^\x00-\x7F]/.test(token)) {
      throw new Error(
        "這組權杖包含非英數字元，看起來可能是密碼管理員自動填入了錯誤的欄位，請重新貼上 GitHub Token。"
      );
    }
    const res = await fetch(GH_API_ROOT, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "token " + token,
      },
    });
    if (res.status === 401 || res.status === 403) {
      throw new Error("權杖無效或已過期，請重新產生一組 GitHub Token。");
    }
    if (res.status === 404) {
      throw new Error("這組權杖沒有這個 repo 的存取權限，請確認 Token 設定的 Repository access。");
    }
    if (!res.ok) {
      throw new Error(`無法驗證權杖（HTTP ${res.status}），請稍後再試。`);
    }
    return true;
  }

  // Fetch a file's decoded text content + its blob sha (needed for updates).
  // Returns null if the file doesn't exist yet.
  async function getFile(path) {
    const res = await fetch(
      `${GH_API_ROOT}/contents/${encodeURI(path)}?ref=${GH_BRANCH}`,
      { headers: authHeaders() }
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`讀取檔案失敗：${path}（HTTP ${res.status}）`);
    const data = await res.json();
    return { sha: data.sha, content: b64Decode(data.content) };
  }

  // Create or update a text file. Pass the sha you last read to detect conflicts;
  // omit it (or leave undefined) when creating a brand new file.
  async function putFile(path, contentStr, message, sha) {
    const body = {
      message,
      content: b64Encode(contentStr),
      branch: GH_BRANCH,
    };
    if (sha) body.sha = sha;
    const res = await fetch(`${GH_API_ROOT}/contents/${encodeURI(path)}`, {
      method: "PUT",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 409) {
      throw new Error(
        "這個檔案在你編輯的期間被其他變更覆蓋了（可能是開了兩個分頁，或剛好有其他人也在改）。請重新整理頁面，確認內容後再儲存一次。"
      );
    }
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(`儲存失敗（HTTP ${res.status}）：${detail.message || "未知錯誤"}`);
    }
    return res.json();
  }

  async function deleteFile(path, message, sha) {
    const res = await fetch(`${GH_API_ROOT}/contents/${encodeURI(path)}`, {
      method: "DELETE",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ message, sha, branch: GH_BRANCH }),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(`刪除失敗（HTTP ${res.status}）：${detail.message || "未知錯誤"}`);
    }
    return res.json();
  }

  // List files directly under a directory (non-recursive).
  async function listDir(path) {
    const res = await fetch(
      `${GH_API_ROOT}/contents/${encodeURI(path)}?ref=${GH_BRANCH}`,
      { headers: authHeaders() }
    );
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`讀取目錄失敗：${path}（HTTP ${res.status}）`);
    return res.json();
  }

  // Turn an arbitrary filename into something safe for a GitHub path:
  // keep ascii letters/digits/dot/dash/underscore, replace everything else with "-".
  function sanitizeFilename(name) {
    const dot = name.lastIndexOf(".");
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : "";
    const cleanBase = base
      .normalize("NFKD")
      .replace(/[^\w-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
    const cleanExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, "");
    return (cleanBase || "image") + cleanExt;
  }

  // Upload an image File to src/images/, de-duping the filename if it already exists.
  // Returns the site-relative path (e.g. "images/foo-2.jpg").
  async function uploadImage(file) {
    const safeName = sanitizeFilename(file.name);
    const dot = safeName.lastIndexOf(".");
    const base = dot > 0 ? safeName.slice(0, dot) : safeName;
    const ext = dot > 0 ? safeName.slice(dot) : "";

    let candidate = safeName;
    let n = 2;
    while (await getFile(`src/images/${candidate}`)) {
      candidate = `${base}-${n}${ext}`;
      n += 1;
    }

    const buffer = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    const base64Content = btoa(binary);

    const res = await fetch(`${GH_API_ROOT}/contents/src/images/${candidate}`, {
      method: "PUT",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `新增圖片：${candidate}`,
        content: base64Content,
        branch: GH_BRANCH,
      }),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(`圖片上傳失敗（HTTP ${res.status}）：${detail.message || "未知錯誤"}`);
    }
    return `images/${candidate}`;
  }

  // Site-relative path (e.g. "images/foo.jpg", as stored by uploadImage) -> public raw URL.
  function rawUrlFor(sitePath) {
    return `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/src/${sitePath}`;
  }

  // Trigger a workflow_dispatch run. `workflowFile` is the filename under .github/workflows/.
  async function dispatchWorkflow(workflowFile, inputs) {
    const res = await fetch(`${GH_API_ROOT}/actions/workflows/${workflowFile}/dispatches`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ ref: GH_BRANCH, inputs }),
    });
    if (res.status === 404) {
      throw new Error("找不到這個 workflow，請確認 .github/workflows/" + workflowFile + " 已經 push 到 GitHub。");
    }
    if (res.status === 403) {
      throw new Error(
        "這組權杖沒有觸發 GitHub Actions 的權限。請到 GitHub → Settings → Developer settings → " +
        "Personal access tokens 找到這組權杖，把「Actions」權限改成 Read and write（或重新產生一組含這個權限的權杖後，登出重新登入）。"
      );
    }
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(`觸發失敗（HTTP ${res.status}）：${detail.message || "未知錯誤"}`);
    }
  }

  // Best-effort lookup of the run that a dispatch just created (the dispatch API itself
  // returns no run id), by matching the most recent workflow_dispatch run created after `since`.
  async function findRecentRun(workflowFile, since) {
    const res = await fetch(`${GH_API_ROOT}/actions/workflows/${workflowFile}/runs?event=workflow_dispatch&per_page=5`, {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const cutoff = since.getTime() - 20000;
    const runs = (data.workflow_runs || []).filter((r) => new Date(r.created_at).getTime() >= cutoff);
    return runs[0] || null;
  }

  return {
    getToken,
    setToken,
    clearToken,
    validateToken,
    getFile,
    putFile,
    deleteFile,
    listDir,
    uploadImage,
    sanitizeFilename,
    rawUrlFor,
    dispatchWorkflow,
    findRecentRun,
  };
})();
