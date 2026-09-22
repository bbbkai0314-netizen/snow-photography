module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  // 營運儀表板：原始碼在 13_SOP_Workflows，不公開連結（noindex＋robots.txt 擋 /ops/）
  eleventyConfig.addPassthroughCopy({ "13_SOP_Workflows/dashboard.html": "ops/dashboard.html" });
  eleventyConfig.addPassthroughCopy("src/admin/admin.css");
  eleventyConfig.addPassthroughCopy("src/admin/admin.js");
  eleventyConfig.addPassthroughCopy("src/admin/admin-api.js");
  eleventyConfig.addPassthroughCopy("src/admin/admin-forms.js");
  eleventyConfig.addPassthroughCopy("src/admin/admin-editor.js");
  eleventyConfig.addPassthroughCopy("src/admin/admin-share.js");
  eleventyConfig.addPassthroughCopy("src/admin/admin-automation.js");
  eleventyConfig.addPassthroughCopy("src/admin/admin-meta-insights.js");
  eleventyConfig.addPassthroughCopy("src/admin/admin-bookings.js");
  eleventyConfig.addPassthroughCopy("src/admin/admin-calendar.js");
  eleventyConfig.addPassthroughCopy("src/admin/admin-views.js");

  // Sort a collection by its frontmatter "order" field (ascending).
  eleventyConfig.addFilter("sortByOrder", (arr) =>
    [...arr].sort((a, b) => (a.data.order || 0) - (b.data.order || 0))
  );

  // Cache-busting query string for CSS/JS so browsers pick up changes on every deploy.
  eleventyConfig.addGlobalData("assetVersion", () => Date.now());

  // Pick the first "active" item out of a list (used for the homepage news banner).
  eleventyConfig.addFilter("activeItem", (arr) =>
    (arr || []).find((item) => item.active)
  );

  // Split the gallery list into landscape/portrait groups for the two homepage grids.
  eleventyConfig.addFilter("byOrientation", (arr, orientation) =>
    (arr || []).filter((item) => item.orientation === orientation)
  );

  // YYYY-MM-DD for structured data and the sitemap. Some posts store dates as quoted strings,
  // others as unquoted YAML timestamps (parsed into Date objects at UTC midnight); read those in
  // Taipei time so the calendar day doesn't shift.
  eleventyConfig.addFilter("isoDate", (value) => {
    if (!value) return "";
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return new Date(d.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  });

  // Percent-encode image paths that contain spaces or CJK characters before using them in og:image.
  eleventyConfig.addFilter("encodeUri", (value) => encodeURI(value || ""));

  // Blog topic clusters (src/_data/blogClusters.json): look up a post by slug, find which cluster
  // a post belongs to, and list posts that aren't assigned to any cluster yet.
  eleventyConfig.addFilter("postBySlug", (posts, slug) =>
    (posts || []).find((post) => post.fileSlug === slug)
  );
  eleventyConfig.addFilter("clusterOf", (clusters, slug) =>
    (clusters || []).find((cluster) => (cluster.posts || []).includes(slug))
  );
  eleventyConfig.addFilter("relatedInCluster", (posts, cluster, slug, limit = 3) =>
    ((cluster && cluster.posts) || [])
      .filter((s) => s !== slug)
      .map((s) => (posts || []).find((post) => post.fileSlug === s))
      .filter(Boolean)
      .slice(0, limit)
  );
  eleventyConfig.addFilter("unclustered", (posts, clusters) => {
    const assigned = new Set((clusters || []).flatMap((cluster) => cluster.posts || []));
    return (posts || []).filter((post) => !assigned.has(post.fileSlug));
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
};
