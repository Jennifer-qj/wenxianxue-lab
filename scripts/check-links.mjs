import fs from "node:fs";
import path from "node:path";
import { displayPath, printFailure, walkFiles } from "./lib/content-utils.mjs";
import { normalizeInternalHref } from "./lib/links.mjs";

const errors = [];
for (const file of walkFiles(path.resolve("src"), [".astro", ".ts", ".tsx"])) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/wenxianxue-labchapters/.test(line)) errors.push(`${displayPath(file)} 第 ${index + 1} 行存在缺斜杠的 base path，请改用 import.meta.env.BASE_URL 或统一路径函数`);
  });
}

const dist = path.resolve("dist");
if (fs.existsSync(dist)) {
  const htmlFiles = walkFiles(dist, [".html"]);
  const routes = new Set(htmlFiles.map((file) => {
    const relative = path.relative(dist, file).replaceAll("\\", "/").replace(/index\.html$/, "");
    return `/${relative}`.replace(/\/+/g, "/");
  }));
  routes.add("/");
  for (const file of htmlFiles) {
    const current = `/${path.relative(dist, file).replaceAll("\\", "/").replace(/index\.html$/, "")}`.replace(/\/+/g, "/");
    const html = fs.readFileSync(file, "utf8");
    for (const match of html.matchAll(/href=["']([^"']+)["']/g)) {
      const target = normalizeInternalHref(match[1], current);
      if (!target || path.extname(target)) continue;
      if (!routes.has(target)) errors.push(`${displayPath(file)} 链接 ${match[1]} 指向不存在的站内页面 ${target}`);
    }
  }
} else console.warn("⚠️ dist/ 尚未生成，本次只检查源代码中的 base path 风险");

if (errors.length) { printFailure("链接门禁未通过", [...new Set(errors)]); process.exit(1); }
console.log("✅ 站内链接检查通过");
