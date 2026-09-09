import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const root = process.cwd();
const dist = path.join(root, "dist");
const limits = {
  maxJavaScript: 190 * 1024,
  totalJavaScript: 500 * 1024,
  maxCss: 80 * 1024,
  maxHtml: 450 * 1024,
  maxHtmlGzip: 80 * 1024,
  maxIslandsPerPage: 13,
};

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function kb(bytes) { return `${(bytes / 1024).toFixed(1)} KB`; }
function relative(file) { return path.relative(root, file).replaceAll("\\", "/"); }

if (!fs.existsSync(dist)) {
  console.error("❌ dist/ 尚未生成，请先运行 pnpm build");
  process.exit(1);
}

const files = walk(dist);
const js = files.filter((file) => file.endsWith(".js"));
const css = files.filter((file) => file.endsWith(".css"));
const html = files.filter((file) => file.endsWith(".html"));
const errors = [];
const largest = (items) => items.toSorted((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];
const totalJs = js.reduce((sum, file) => sum + fs.statSync(file).size, 0);
const largestJs = largest(js);
const largestCss = largest(css);
const largestHtml = largest(html);

if (totalJs > limits.totalJavaScript) errors.push(`JavaScript 总量 ${kb(totalJs)} > ${kb(limits.totalJavaScript)}`);
if (largestJs && fs.statSync(largestJs).size > limits.maxJavaScript) errors.push(`${relative(largestJs)} ${kb(fs.statSync(largestJs).size)} > 单个 JS 门限 ${kb(limits.maxJavaScript)}`);
if (largestCss && fs.statSync(largestCss).size > limits.maxCss) errors.push(`${relative(largestCss)} ${kb(fs.statSync(largestCss).size)} > 单个 CSS 门限 ${kb(limits.maxCss)}`);
if (largestHtml && fs.statSync(largestHtml).size > limits.maxHtml) errors.push(`${relative(largestHtml)} ${kb(fs.statSync(largestHtml).size)} > 单页 HTML 门限 ${kb(limits.maxHtml)}`);

for (const file of html) {
  const source = fs.readFileSync(file);
  const compressed = gzipSync(source).byteLength;
  if (compressed > limits.maxHtmlGzip) errors.push(`${relative(file)} gzip ${kb(compressed)} > ${kb(limits.maxHtmlGzip)}`);
  const islands = (source.toString("utf8").match(/<astro-island\b/g) ?? []).length;
  if (islands > limits.maxIslandsPerPage) errors.push(`${relative(file)} 同页包含 ${islands} 个互动岛 > ${limits.maxIslandsPerPage}`);
}

if (errors.length) {
  console.error(`❌ 性能预算未通过（${errors.length} 项）\n${errors.slice(0, 30).join("\n")}`);
  process.exit(1);
}

console.log(`✅ 性能预算通过：JS 总量 ${kb(totalJs)}；最大 JS ${kb(fs.statSync(largestJs).size)}；最大 CSS ${kb(fs.statSync(largestCss).size)}；最大 HTML ${kb(fs.statSync(largestHtml).size)}`);

