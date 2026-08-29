// Hash router for the admin SPA. Every route delegates to a render function in AdminViews.

async function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";

  if (!AdminApi.getToken()) {
    app.appendChild(AdminViews.renderLogin(render));
    return;
  }

  const hash = location.hash.replace(/^#\/?/, "");
  const parts = hash.split("/").filter(Boolean);
  const [section, action, id] = parts;

  const loading = document.createElement("div");
  loading.className = "admin-loading";
  loading.textContent = "載入中…";
  app.appendChild(loading);

  try {
    let view;
    if (!section) {
      view = await AdminViews.renderDashboard();
    } else if (section === "homepage") {
      view = await AdminViews.renderHomepage();
    } else if (section === "gallery") {
      view = await AdminViews.renderGalleryList();
    } else if (section === "plans") {
      view = action === "new" ? await AdminViews.renderPlanEdit(null) : action === "edit" ? await AdminViews.renderPlanEdit(id) : await AdminViews.renderPlansList();
    } else if (section === "posts") {
      view = action === "new" ? await AdminViews.renderPostEdit(null) : action === "edit" ? await AdminViews.renderPostEdit(id) : await AdminViews.renderPostsList();
    } else if (section === "calendar") {
      view = await AdminViews.renderCalendar();
    } else if (section === "bookings") {
      view = await AdminViews.renderBookings();
    } else if (section === "automation") {
      view = await AdminViews.renderAutomation();
    } else {
      view = await AdminViews.renderDashboard();
    }
    app.innerHTML = "";
    app.appendChild(view);
  } catch (err) {
    app.innerHTML = "";
    const box = document.createElement("div");
    box.className = "admin-shell";
    box.appendChild(AdminViews.renderTopbar());
    const msg = document.createElement("div");
    msg.className = "admin-error glass";
    msg.textContent = err.message || "發生未知錯誤";
    box.appendChild(msg);
    app.appendChild(box);
  }
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", render);
