import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const errors = [];
const readRoute = (route) => {
  const file = path.join(dist, route, "index.html");
  if (!fs.existsSync(file)) {
    errors.push(`缺少关键页面 /${route}/`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
};
const requireText = (html, route, markers) => markers.forEach((marker) => {
  if (!html.includes(marker)) errors.push(`/${route}/ 缺少关键交互标记：${marker}`);
});
const requireId = (html, route, ids) => ids.forEach((id) => {
  if (!new RegExp(`\\sid=["']${id}["']`).test(html)) errors.push(`/${route}/ 缺少 #${id} 锚点`);
});

if (!fs.existsSync(dist)) {
  console.error("❌ dist/ 尚未生成，请先运行 pnpm build");
  process.exit(1);
}

const home = readRoute("");
requireText(home, "", ["primary-nav", "开始第一条学习路径", "先看一份示例成果", "HomeResume"]);

for (let chapter = 1; chapter <= 14; chapter += 1) {
  const id = `ch${String(chapter).padStart(2, "0")}`;
  const route = `chapters/${id}`;
  const html = readRoute(route);
  requireId(html, route, ["journey", "overview", "learning-units", "deep-dive", "workflow", "check", "chapter-review", "source"]);
  requireText(html, route, ["data-claim-id=", "预计用时", "纸本定位"]);
  const unitCount = (html.match(/data-claim-id=/g) ?? []).length;
  if (unitCount < 7) errors.push(`/${route}/ 仅呈现 ${unitCount} 个可追踪学习单元`);
}

const lab = readRoute("lab");
requireId(lab, "lab", ["lab-directory", "fragment-casebook", "rare-book-dossier", "version-detective", "four-fold", "evidence-calibration", "criticism-studio", "skill-arcade", "case-gallery"]);
requireText(lab, "lab", ["今天想练哪一种判断", "残卷归档调查", "导出", "client=\"visible\""]);

const graph = readRoute("graph");
requireText(graph, "graph", ["GUIDED READING", "PATH EXPLORER", "concept-options", "拖动"]);

const progress = readRoute("progress");
requireId(progress, "progress", ["study-compass", "portfolio", "archive"]);
requireText(progress, "progress", ["生成活动报告 .md", "备份数据 .json", "导入档案", "storage-health"]);

for (const file of [home, lab, graph, progress]) {
  if (/href=["'](?:undefined|NaN|null)/.test(file)) errors.push("关键旅程中出现无效 href");
}

if (errors.length) {
  console.error(`❌ 关键学习旅程门禁未通过（${errors.length} 项）\n${errors.join("\n")}`);
  process.exit(1);
}

console.log("✅ 关键学习旅程门禁通过：首页入口、十四章任务链、九个实验区、图谱导览与档案工具均完整");

