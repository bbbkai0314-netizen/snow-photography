module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/admin/admin.css");
  eleventyConfig.addPassthroughCopy("src/admin/admin.js");
  eleventyConfig.addPassthroughCopy("src/admin/admin-api.js");
  eleventyConfig.addPassthroughCopy("src/admin/admin-forms.js");
  eleventyConfig.addPassthroughCopy("src/admin/admin-editor.js");
  eleventyConfig.addPassthroughCopy("src/admin/admin-share.js");
  eleventyConfig.addPassthroughCopy("src/admin/admin-automation.js");
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
