import fs from "node:fs";
import path from "node:path";
import { displayPath, printFailure } from "./lib/content-utils.mjs";

const excluded = new Set([".git", "node_modules", "dist", ".astro"]);
function walk(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walk(target)); else files.push(target);
  }
  return files;
}
const forbiddenExtensions = new Set([".pdf", ".epub", ".mobi", ".azw", ".azw3", ".djvu"]);
const suspiciousNames = [/扫描/i, /原书.*全文/i, /电子书/i, /mineru/i];
const errors = [];
for (const file of walk(process.cwd())) {
  const extension = path.extname(file).toLowerCase();
  const name = path.basename(file);
  if (forbiddenExtensions.has(extension) || suspiciousNames.some((pattern) => pattern.test(name))) errors.push(`${displayPath(file)} 疑似原书电子文本或扫描材料，请移出公开仓库并放入受忽略的 private/ 目录`);
}
if (errors.length) { printFailure("仓库版权审计未通过", errors); process.exit(1); }
console.log("✅ 仓库未发现原书电子文本或扫描材料");
