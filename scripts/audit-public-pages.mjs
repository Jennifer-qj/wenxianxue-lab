import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const baseUrl = "https://jennifer-qj.github.io/wenxianxue-lab/";
const errors = [];
const warnings = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function routeFor(file) {
  const relative = path.relative(dist, file).replaceAll("\\", "/");
  if (relative === "index.html") return "";
  if (relative.endsWith("/index.html")) return relative.slice(0, -"index.html".length);
  return relative;
}

function count(html, expression) {
  return [...html.matchAll(expression)].length;
}

function value(html, expression) {
  return html.match(expression)?.[1]?.trim() ?? "";
}

function report(file, message) {
  errors.push(`${path.relative(root, file).replaceAll("\\", "/")}: ${message}`);
}

if (!fs.existsSync(dist)) {
  console.error("❌ dist/ 尚未生成，请先运行 npm run build");
  process.exit(1);
}

const htmlFiles = walk(dist).filter((file) => file.endsWith(".html"));
const publicPages = htmlFiles.filter((file) => path.basename(file) !== "404.html");
const titles = new Map();

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const route = routeFor(file);
  const pageName = route || "首页";
  const title = value(html, /<title>([\s\S]*?)<\/title>/i);
  const description = value(html, /<meta\s+name="description"\s+content="([^"]+)"/i);
  const canonical = value(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i);

  if (!/<html\s+lang="zh-CN"/i.test(html)) report(file, "缺少 html lang=zh-CN");
  if (!/<meta\s+name="viewport"/i.test(html)) report(file, "缺少移动端 viewport");
  if (!title) report(file, "页面标题为空");
  if (!description || description.length < 16) report(file, "页面描述缺失或过短");
  if (!canonical.startsWith(baseUrl)) report(file, `canonical 不在公开站点内：${canonical || "（空）"}`);
  if (!/<a\s+class="skip-link"\s+href="#main"/i.test(html)) report(file, "缺少跳到正文链接");
  if (count(html, /<main\b[^>]*\bid="main"/gi) !== 1) report(file, "必须且只能有一个 main#main");
  if (count(html, /<h1\b/gi) !== 1) report(file, `应有且只能有一个 h1，当前为 ${count(html, /<h1\b/gi)}`);

  for (const marker of ["og:title", "og:description", "og:image", "twitter:title", "twitter:description", "twitter:image"]) {
    const property = marker.startsWith("og:") ? "property" : "name";
    if (!new RegExp(`<meta\\s+${property}="${marker}"\\s+content="[^"]+"`, "i").test(html)) report(file, `缺少 ${marker}`);
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/gi)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicateIds.length) report(file, `存在重复 id：${duplicateIds.join("、")}`);

  for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\salt=("[^"]*"|'[^']*')/i.test(image[0])) report(file, `图片缺少 alt：${image[0].slice(0, 100)}`);
  }
  for (const link of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)) {
    if (!/\srel="[^"]*(noopener|noreferrer)[^"]*"/i.test(link[0])) report(file, "新窗口链接缺少 noopener/noreferrer");
  }
  for (const href of html.matchAll(/\shref="(\/[^"]*)"/gi)) {
    const target = href[1];
    if (!target.startsWith("/wenxianxue-lab/") && !target.startsWith("//")) report(file, `根路径链接越出项目 base：${target}`);
  }

  const jsonLd = value(html, /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  try { JSON.parse(jsonLd); } catch { report(file, "结构化数据不是有效 JSON"); }

  if (titles.has(title) && title) warnings.push(`标题重复：${title}（${titles.get(title)}、${pageName}）`);
  else if (title) titles.set(title, pageName);
}

const sitemapFile = path.join(dist, "sitemap.xml");
if (!fs.existsSync(sitemapFile)) errors.push("dist/sitemap.xml: 文件缺失");
else {
  const sitemap = fs.readFileSync(sitemapFile, "utf8");
  for (const file of publicPages) {
    const route = routeFor(file);
    if (!sitemap.includes(`<loc>${baseUrl}${route}</loc>`)) report(file, "公开 HTML 未进入 sitemap.xml");
  }
  if (!/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sitemap)) errors.push("dist/sitemap.xml: 缺少 lastmod");
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, "public", "site.webmanifest"), "utf8"));
if (manifest.id !== "/wenxianxue-lab/" || manifest.scope !== "/wenxianxue-lab/") errors.push("public/site.webmanifest: id 或 scope 不正确");
if (!Array.isArray(manifest.categories) || !manifest.categories.includes("education")) errors.push("public/site.webmanifest: 缺少教育类别");

const cover = fs.readFileSync(path.join(root, "public", "og-cover.png"));
if (cover.readUInt32BE(16) !== 1200 || cover.readUInt32BE(20) !== 630) errors.push("public/og-cover.png: 分享图必须为 1200×630");

if (warnings.length) console.warn(`⚠️ 公开页面审计提示 ${warnings.length} 项\n${warnings.slice(0, 12).join("\n")}`);
if (errors.length) {
  console.error(`❌ 公开页面审计未通过（${errors.length} 项）\n${errors.slice(0, 40).join("\n")}`);
  process.exit(1);
}

console.log(`✅ 公开页面审计通过：${htmlFiles.length} 个 HTML，标题、描述、分享卡、主标题、图片替代文本、外链安全、结构化数据与站点地图均有效`);
