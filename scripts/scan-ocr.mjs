import fs from "node:fs";
import path from "node:path";
import { displayPath, printFailure, walkFiles } from "./lib/content-utils.mjs";

const roots = ["content", "src", "dist"].map((folder) => path.resolve(folder)).filter(fs.existsSync);
const errors = [];
for (const root of roots) for (const file of walkFiles(root, [".md", ".yaml", ".yml", ".ts", ".tsx", ".astro", ".html", ".json"])) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/\x4f\x43\x52/i.test(line)) errors.push(`${displayPath(file)} 第 ${index + 1} 行含不应公开的技术处理标记，请改为经纸本核验的真实引用或删除该出处`);
  });
}
if (errors.length) { printFailure("公开内容扫描未通过", errors); process.exit(1); }
console.log("✅ 公开内容未发现技术处理标记");
