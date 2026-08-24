import path from "node:path";
import { itemsOf, loadYaml, walkFiles } from "./lib/content-utils.mjs";

const load = (folder) => walkFiles(path.resolve("content", folder), [".yaml", ".yml"]).flatMap((file) => itemsOf(loadYaml(file)));
const units = load("outline");
const concepts = load("concepts");
const edges = load("graph");
const quizzes = load("quiz");
const deepdives = load("deepdives");
const blockers = [];
const notes = [];
let crossChapterLinks = 0;
const conceptById = new Map(concepts.map((item) => [item.id, item]));

for (const unit of units) {
  if (unit.page_end && unit.page_end < unit.page_start) blockers.push(`${unit.id} 的结束页早于起始页`);
  for (const id of unit.concept_ids ?? []) {
    const concept = conceptById.get(id);
    if (concept && !concept.chapter_ids.includes(`ch${String(unit.chapter).padStart(2, "0")}`)) crossChapterLinks += 1;
  }
}

for (const edge of edges) {
  if (edge.source === edge.target) blockers.push(`${edge.id} 形成自环关系`);
  if (edge.confidence === "confirmed" && String(edge.evidence).length < 12) notes.push(`${edge.id} 虽标为原书确认，但关系依据过短，建议人工复核`);
}

for (const quiz of quizzes) {
  if (quiz.type === "single_choice" && (quiz.answer < 0 || quiz.answer >= quiz.options.length)) blockers.push(`${quiz.id} 单选答案越界`);
  if (quiz.type === "multiple_choice" && quiz.answers.some((answer) => answer < 0 || answer >= quiz.options.length)) blockers.push(`${quiz.id} 多选答案越界`);
  if (quiz.type === "ordering") {
    const expected = quiz.items.map((_, index) => index).sort().join(",");
    if ([...quiz.answer].sort().join(",") !== expected) blockers.push(`${quiz.id} 排序答案不是完整排列`);
  }
  if (quiz.type === "classification" && quiz.items.some((item) => !quiz.zones.includes(item.zone))) blockers.push(`${quiz.id} 归类答案引用不存在的区域`);
  if (quiz.type === "evidence" && quiz.answer_ids.some((id) => !quiz.evidence_ids.includes(id))) blockers.push(`${quiz.id} 证据答案不在候选集合中`);
}

for (const study of deepdives) {
  const evidenceIds = new Set(study.evidence.map((item) => item.id));
  for (const conclusion of study.conclusions ?? []) for (const id of conclusion.requires ?? []) if (!evidenceIds.has(id)) blockers.push(`${study.id} 的结论 ${conclusion.id} 引用不存在的证据 ${id}`);
  const triggers = new Set((study.followups ?? []).map((item) => item.trigger));
  for (const trigger of ["insufficient", "conflict", "supported"]) if (!triggers.has(trigger)) blockers.push(`${study.id} 缺少 ${trigger} 自适应追问`);
}

const chapters = Array.from({ length: 14 }, (_, index) => {
  const chapter = index + 1; const id = `ch${String(chapter).padStart(2, "0")}`;
  const chapterUnits = units.filter((item) => item.chapter === chapter);
  const chapterConcepts = concepts.filter((item) => item.chapter_ids.includes(id));
  const chapterQuizzes = quizzes.filter((item) => item.chapter === chapter);
  const types = new Set(chapterQuizzes.map((item) => item.type));
  if (types.size < 7) notes.push(`第 ${chapter} 章题型少于 7 种，建议扩充交互多样性`);
  return {
    chapter,
    units: chapterUnits.length,
    verifiedUnits: chapterUnits.filter((item) => item.status === "verified").length,
    concepts: chapterConcepts.length,
    verifiedConcepts: chapterConcepts.filter((item) => item.status === "verified").length,
    quizzes: chapterQuizzes.length,
    quizTypes: types.size,
    deepConclusions: deepdives.find((item) => item.chapter === chapter)?.conclusions?.length ?? 0,
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  totals: { units: units.length, concepts: concepts.length, edges: edges.length, quizzes: quizzes.length, deepdives: deepdives.length, quizTypes: new Set(quizzes.map((item) => item.type)).size, crossChapterLinks },
  review: {
    verifiedUnits: units.filter((item) => item.status === "verified").length,
    pendingUnits: units.filter((item) => item.status !== "verified").length,
    verifiedConcepts: concepts.filter((item) => item.status === "verified").length,
    pendingConcepts: concepts.filter((item) => item.status !== "verified").length,
    confirmedEdges: edges.filter((item) => item.confidence === "confirmed").length,
    modeledEdges: edges.filter((item) => item.confidence !== "confirmed").length,
  },
  chapters, blockers, notes,
};

if (process.argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`学术结构审计：${units.length} 学习单元，${concepts.length} 概念，${edges.length} 关系，${quizzes.length} 题，${deepdives.length} 研读案例`);
  for (const item of chapters) console.log(`第 ${String(item.chapter).padStart(2, "0")} 章：${item.units} 单元（核验 ${item.verifiedUnits}）· ${item.concepts} 概念（核验 ${item.verifiedConcepts}）· ${item.quizzes} 题/${item.quizTypes} 题型 · ${item.deepConclusions} 条竞争结论`);
  console.log(`人工复核队列：${report.review.pendingUnits} 学习单元、${report.review.pendingConcepts} 概念；教学建模或待考关系 ${report.review.modeledEdges} 条`);
  console.log(`跨章概念复用：${crossChapterLinks} 处（记录为知识连接，不视为章节归属错误）`);
  for (const note of notes) console.warn(`⚠️ ${note}`);
}
if (blockers.length) {
  console.error(`❌ 学术结构审计发现 ${blockers.length} 个阻断问题`);
  for (const blocker of blockers) console.error(`- ${blocker}`);
  process.exit(1);
}
console.log("✅ 学术结构审计通过；未核验内容仍保留人工复核状态");
