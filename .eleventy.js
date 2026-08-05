module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/admin");

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
