import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import yaml from "js-yaml";

const root = resolve(import.meta.dirname, "..");
const directory = resolve(root, "content/outline");
const files = (await readdir(directory)).filter((file) => /^ch\d{2}\.yaml$/.test(file)).sort();
const vaguePhrases = ["具有重要意义", "有助于更好地理解", "值得深入探讨", "进一步提升", "全面认识", "不言而喻", "众所周知"];
const records = [];
const errors = [];

function compact(value) {
  return String(value ?? "").replace(/[\s，。；：！？、“”‘’（）()《》]/g, "");
}

for (const file of files) {
  const parsed = yaml.load(await readFile(resolve(directory, file), "utf8"));
  for (const item of parsed?.items ?? []) {
    for (const field of ["key_question", "summary", "boundary"]) {
      const text = String(item[field] ?? "").trim();
      records.push({ file, id: item.id, field, text, normalized: compact(text) });
      if (!text) errors.push(`${file} · ${item.id} 缺少 ${field}`);
      for (const phrase of vaguePhrases) if (text.includes(phrase)) errors.push(`${file} · ${item.id} 的 ${field} 含空泛表达“${phrase}”`);
    }
    if (!String(item.key_question ?? "").endsWith("？")) errors.push(`${file} · ${item.id} 的 key_question 应以明确问句结束`);
    if (compact(item.summary).length < 16) errors.push(`${file} · ${item.id} 的 summary 过短，尚不足以独立复习`);
    if (compact(item.boundary).length < 12) errors.push(`${file} · ${item.id} 的 boundary 过短，尚未说明判断限制`);
    if (compact(item.summary) === compact(item.boundary)) errors.push(`${file} · ${item.id} 的 summary 与 boundary 完全相同`);
  }
}

for (const field of ["key_question", "summary", "boundary"]) {
  const groups = new Map();
  for (const item of records.filter((record) => record.field === field && record.normalized)) {
    const group = groups.get(item.normalized) ?? [];
    group.push(item);
    groups.set(item.normalized, group);
  }
  for (const group of groups.values()) if (group.length > 1) errors.push(`${field} 出现跨单元完全重复：${group.map((item) => `${item.file}/${item.id}`).join("、")}`);
}

if (errors.length) {
  console.error(`内容差异化门禁未通过（${errors.length} 项）：\n${errors.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(`✅ 内容差异化门禁通过：${files.length} 章、${records.length / 3} 个学习单元未发现空泛短句、缺失边界或跨单元完全重复`);
