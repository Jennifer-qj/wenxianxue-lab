import path from "node:path";
import fs from "node:fs";
import { displayPath, itemsOf, lineOf, loadYaml, printFailure, walkFiles } from "./lib/content-utils.mjs";

const contentRoot = path.resolve("content");
const yamlFiles = (folder) => walkFiles(path.join(contentRoot, folder), [".yaml", ".yml"]);
const loadGroup = (folder, keys = []) => yamlFiles(folder).flatMap((file) => {
  const document = loadYaml(file);
  return itemsOf(document, keys).map((item, index) => ({ item, document, index }));
});

const errors = [];
const warnings = [];
const reviewed = new Set(["reviewed", "verified"]);
const mkus = loadGroup("outline", ["mkus"]);
const concepts = loadGroup("concepts", ["concepts"]);
const edges = loadGroup("graph", ["edges"]);
const quizzes = loadGroup("quiz", ["quiz", "questions"]);
const labs = loadGroup("labs", ["labs", "cases"]);
const conceptIds = new Set(concepts.map(({ item }) => item.id));
const quizIds = new Set(quizzes.map(({ item }) => item.id));

function location(record) {
  return `${displayPath(record.document.file)} 第 ${lineOf(record.document, record.item?.id)} 行 ${record.item?.id ?? `第 ${record.index + 1} 条`}`;
}

for (const record of mkus) {
  const { item } = record;
  if (!Number.isInteger(item.page_start) || item.page_start <= 0) errors.push(`${location(record)} 缺少有效 page_start，请按中华书局 2008 年修订本补充真实页码`);
  if (reviewed.has(item.status) && (!Array.isArray(item.concept_ids) || item.concept_ids.length === 0)) errors.push(`${location(record)} 已进入复核阶段但未关联 concept_ids，请至少补 1 个真实概念 ID`);
  if (reviewed.has(item.status) && (!Array.isArray(item.quiz_ids) || item.quiz_ids.length === 0)) warnings.push(`${location(record)} 已进入复核阶段但未关联题目`);
  for (const id of item.concept_ids ?? []) if (!conceptIds.has(id)) errors.push(`${location(record)} 引用了不存在的概念 ${id}，请检查拼写或先创建该概念`);
  for (const id of item.quiz_ids ?? []) if (!quizIds.has(id)) errors.push(`${location(record)} 引用了不存在的题目 ${id}，请检查拼写或先创建该题目`);
}

for (const record of edges) {
  const { item } = record;
  if (!String(item.evidence ?? "").trim()) errors.push(`${location(record)} 缺少 evidence，请填写可核验的关系依据`);
  if (!["confirmed", "pedagogical", "doubtful"].includes(item.confidence)) errors.push(`${location(record)} confidence 无效，请填写 confirmed、pedagogical 或 doubtful`);
  for (const id of [item.source, item.target]) if (id && !conceptIds.has(id)) errors.push(`${location(record)} 引用了不存在的概念 ${id}`);
}

for (const record of quizzes) for (const id of record.item.concept_ids ?? []) {
  if (!conceptIds.has(id)) errors.push(`${location(record)} 引用了不存在的 concept_id：${id}`);
}

const engineNeeds = {
  reasoning: ["stages", "scoring"], classify: ["zones", "items"], sequence: ["items", "correct_order"],
  simulate: ["params", "model_table"], annotate: ["passage", "hotspots"], assemble: ["pieces", "solution"],
};
for (const record of labs) {
  for (const id of record.item.concept_ids ?? []) if (!conceptIds.has(id)) errors.push(`${location(record)} 引用了不存在的 concept_id：${id}`);
  const needs = engineNeeds[record.item.engine];
  if (!needs) errors.push(`${location(record)} engine 无效，请使用六种通用引擎之一`);
  else for (const field of needs) if (record.item.config?.[field] == null) errors.push(`${location(record)} 的 ${record.item.engine} 配置缺少 ${field}，请按模板补充`);
}

const productionFiles = walkFiles(path.resolve("src"), [".astro", ".tsx", ".ts", ".md"]);
const forbiddenPlaceholders = ["待开发", "敬请期待", "TODO", "制作中"];
for (const file of productionFiles) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const word of forbiddenPlaceholders) if (line.includes(word)) errors.push(`${displayPath(file)} 第 ${index + 1} 行含生产占位词“${word}”，未完成内容请下架而不是展示占位卡`);
  });
}

const coverage = mkus.length ? Math.round((mkus.filter(({ item }) => (item.concept_ids?.length ?? 0) > 0).length / mkus.length) * 100) : 0;
console.log(`内容统计：MKU ${mkus.length}，概念 ${concepts.length}，关系 ${edges.length}，题目 ${quizzes.length}，实验案例 ${labs.length}，MKU 概念覆盖率 ${coverage}%`);
if (mkus.length === 0) warnings.push("尚未录入正式 MKU；请在确认纸本版次后由本人填写 content/outline/");
for (const warning of warnings) console.warn(`⚠️ ${warning}`);
if (errors.length) { printFailure("内容门禁未通过", errors); process.exit(1); }
console.log("✅ 内容门禁通过");
