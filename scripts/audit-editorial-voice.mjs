import { readdir, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const roots = ["src/pages", "src/components", "README.md"];
const forbidden = ["赋能", "沉浸式体验", "一站式", "全方位", "解锁知识", "全面提升", "深度赋能", "六项旗舰实验"];
const files = [];

async function collect(path) {
  const full = resolve(root, path);
  const entries = await readdir(full, { withFileTypes: true }).catch(() => null);
  if (!entries) { files.push(path); return; }
  for (const entry of entries) {
    const next = `${path}/${entry.name}`;
    if (entry.isDirectory()) await collect(next);
    else if ([".astro", ".tsx", ".ts", ".md"].includes(extname(entry.name))) files.push(next);
  }
}

for (const path of roots) await collect(path);
const findings = [];
for (const file of files) {
  const text = await readFile(resolve(root, file), "utf8");
  for (const phrase of forbidden) if (text.includes(phrase)) findings.push(`${file}：${phrase}`);
}
if (findings.length) {
  console.error(`编辑语气门禁未通过：\n${findings.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}
console.log("✅ 编辑语气门禁通过：未发现空泛宣传词或过期实验数量");
