const path = require("path");
const Image = require("@11ty/eleventy-img");

const OPTIONS = {
  widths: [480, 800, 1200],
  formats: ["webp"],
  outputDir: path.join("_site", "images", "resp"),
  urlPath: "/images/resp/",
  filenameFormat: (_id, src, width, format) => {
    const name = path.basename(src, path.extname(src)).replace(/[^\w.-]+/g, "_").slice(0, 80);
    return `${name}-${width}w.${format}`;
  },
  sharpWebpOptions: { quality: 68, effort: 4 },
};

function pack(stats) {
  const variants = (stats.webp || []).slice().sort((a, b) => a.width - b.width);
  const fallback = variants.find((variant) => variant.width >= 800) || variants[variants.length - 1];
  const largest = variants[variants.length - 1];
  return {
    src: fallback.url,
    srcset: variants.map((variant) => `${variant.url} ${variant.width}w`).join(", "),
    width: largest.width,
    height: largest.height,
  };
}

module.exports = async function () {
  const primary = await Image("./src/images/air-grab-homepage-hero.webp", OPTIONS);
  const secondary = await Image("./src/images/a-life-in-moments-beach.webp", OPTIONS);
  return {
    primary: pack(primary),
    secondary: pack(secondary),
  };
};
