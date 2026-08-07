/* Hash router，串起登入狀態與各頁面。 */
(function () {
  function route() {
    var root = document.getElementById("app");
    var hash = location.hash || "#/";

    if (!AdminAPI.getToken()) {
      AdminViews.renderLogin(root);
      return;
    }

    var m;
    if (hash === "#/" || hash === "") {
      AdminViews.renderDashboard(root);
    } else if (hash === "#/homepage") {
      AdminViews.renderHomepageForm(root);
    } else if (hash === "#/gallery") {
      AdminViews.renderGalleryList(root);
    } else if (hash === "#/gallery/new") {
      AdminViews.renderGalleryForm(root, null);
    } else if ((m = /^#\/gallery\/edit\/(\d+)$/.exec(hash))) {
      AdminViews.renderGalleryForm(root, Number(m[1]));
    } else if (hash === "#/plans") {
      AdminViews.renderPlansList(root);
    } else if (hash === "#/plans/new") {
      AdminViews.renderPlanForm(root, null);
    } else if ((m = /^#\/plans\/edit\/(.+)$/.exec(hash))) {
      AdminViews.renderPlanForm(root, decodeURIComponent(m[1]));
    } else if (hash === "#/posts") {
      AdminViews.renderPostsList(root);
    } else if (hash === "#/posts/new") {
      AdminViews.renderPostForm(root, null);
    } else if ((m = /^#\/posts\/edit\/(.+)$/.exec(hash))) {
      AdminViews.renderPostForm(root, decodeURIComponent(m[1]));
    } else {
      AdminViews.renderDashboard(root);
    }
  }

  window.addEventListener("hashchange", route);
  window.addEventListener("DOMContentLoaded", route);
})();
