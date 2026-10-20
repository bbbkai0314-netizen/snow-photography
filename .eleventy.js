const fs = require("fs");
const path = require("path");
const Image = require("@11ty/eleventy-img");

const RESPONSIVE_WIDTHS = [480, 800, 1200, null];
const responsiveCache = new Map();

function imgAttr(tag, name) {
  const match = tag.match(new RegExp("\\s" + name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')", "i"));
  return match ? (match[1] != null ? match[1] : match[2]) : null;
}

function sourceFileForSrc(src) {
  if (!src || /^(?:https?:|data:|blob:)/i.test(src)) return null;
  const clean = decodeURIComponent(src.split("#")[0].split("?")[0]);
  const marker = "images/";
  const index = clean.lastIndexOf(marker);
  if (index === -1) return null;
  const file = path.join("src", clean.slice(index));
  return fs.existsSync(file) ? file : null;
}

function sizesForImage(html, index, tag) {
  const className = imgAttr(tag, "class") || "";
  if (className.includes("chapter-card__slide")) {
    return "(max-width: 900px) 88vw, 400px";
  }
  const before = html.slice(Math.max(0, index - 220), index);
  const markers = ["plan-preview", "gcard", "gcard--portrait"];
  let context = "";
  let at = -1;
  markers.forEach((marker) => {
    const found = before.lastIndexOf(marker);
    if (found >= at && found !== -1) {
      at = found;
      context = marker;
    }
  });
  if (context === "gcard--portrait") {
    return "(max-width: 560px) 46vw, (max-width: 900px) 30vw, 22vw";
  }
  if (context === "gcard") {
    return "(max-width: 560px) 92vw, (max-width: 900px) 46vw, 30vw";
  }
  if (context === "plan-preview") {
    return "(max-width: 900px) 46vw, 280px";
  }
  return "(max-width: 720px) 92vw, 720px";
}

function responsiveStats(file) {
  if (!responsiveCache.has(file)) {
    responsiveCache.set(file, Image(file, {
      widths: RESPONSIVE_WIDTHS,
      formats: ["webp"],
      outputDir: path.join("_site", "images", "resp"),
      urlPath: "/images/resp/",
      minimumThreshold: 1.25,
      filenameFormat: (id, src, width, format) => {
        const name = path.basename(src, path.extname(src)).replace(/[^\w.-]+/g, "_").slice(0, 80);
        return `${name}-${id}-${width}w.${format}`;
      },
      sharpWebpOptions: { quality: 76, effort: 4 },
    }));
  }
  return responsiveCache.get(file);
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");

  eleventyConfig.addTransform("responsiveImages", async function (content, outputPath) {
    if (!outputPath || !outputPath.endsWith(".html")) return content;
    const tags = [];
    const re = /<img\b[^>]*>/gi;
    let match;
    while ((match = re.exec(content))) tags.push({ tag: match[0], index: match.index });

    const replacements = await Promise.all(tags.map(async ({ tag, index }) => {
      const src = imgAttr(tag, "src");
      const className = imgAttr(tag, "class") || "";
      if (!src || imgAttr(tag, "srcset") || /\bhero-fade\b/.test(className)) return null;
      const file = sourceFileForSrc(src);
      if (!file) return null;
      if (!/\.(?:webp|jpe?g|png)$/i.test(file)) return null;
      try {
        const stats = await responsiveStats(file);
        const variants = stats.webp || [];
        if (variants.length < 2) return null;
        const srcset = variants.map((item) => `${encodeURI(item.url)} ${item.width}w`).join(", ");
        const sizes = sizesForImage(content, index, tag);
        const low = (imgAttr(tag, "loading") === "lazy" && !imgAttr(tag, "fetchpriority"))
          ? " fetchpriority=\"low\""
          : "";
        const extra = ` srcset="${srcset}" sizes="${sizes}"${low}`;
        const updated = tag.endsWith("/>")
          ? tag.slice(0, -2).replace(/\s*$/, "") + extra + " />"
          : tag.slice(0, -1).replace(/\s*$/, "") + extra + ">";
        return { tag, updated };
      } catch (error) {
        console.warn("[responsiveImages]", file, error.message);
        return null;
      }
    }));

    let html = content;
    replacements.filter(Boolean).forEach(({ tag, updated }) => {
      html = html.replace(tag, () => updated);
    });
    return html;
  });

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

  // Homepage inlines the whole sheet. A partial sheet let the footer jump
  // when the rest arrived (CLS 0.9). Other pages keep the external file.
  eleventyConfig.addGlobalData("criticalCss", () =>
    fs.readFileSync(path.join(__dirname, "src", "css", "style.css"), "utf8")
  );

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
