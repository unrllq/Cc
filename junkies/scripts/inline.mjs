// Bundles out/index.html into one self-contained HTML file (CSS + JS inlined),
// so the site opens from disk or from any static host without the _next folder.
// Usage: npm run build && node scripts/inline.mjs [target.html]
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = "out";
const target = process.argv[2] ?? "junkies.html";
const read = (href) => readFileSync(join(out, href.replace(/^\//, "")), "utf8");

let html = readFileSync(join(out, "index.html"), "utf8");

// Drop preload hints for files that are about to be inlined.
html = html.replace(/<link rel="preload"[^>]*href="\/_next\/[^"]*"[^>]*\/?>/g, "");

html = html.replace(
  /<link rel="stylesheet" href="(\/_next\/[^"]+\.css)"[^>]*\/?>/g,
  (_, href) => `<style>${read(href)}</style>`
);

html = html.replace(
  /<script src="(\/_next\/[^"]+\.js)"[^>]*><\/script>/g,
  (_, src) => `<script>${read(src).replace(/<\/script/gi, "<\\/script")}</script>`
);

// The RSC payload still names the CSS file; React would re-insert it as a <link>
// and throw when it 404s. Point it at an empty data: stylesheet instead.
html = html.replace(/\/_next\/static\/css\/[^"\\]+\.css/g, "data:text/css,");

const left = html.match(/\/_next\/static\/[^"')\s]+/g) ?? [];
writeFileSync(target, html);
console.log(`${target}: ${(html.length / 1024).toFixed(0)} KB, external _next refs left: ${left.length}`);
if (left.length) console.log([...new Set(left)].slice(0, 10).join("\n"));
