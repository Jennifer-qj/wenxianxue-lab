import { useEffect, useMemo, useState } from "react";
import { chapters } from "../data/site";
import "./LearningPortfolio.css";

type ProgressItem = { completed?: boolean; score?: number; total?: number; updatedAt?: string };
type ProgressArchive = Record<string, ProgressItem>;
type JourneyRecord = {
  mode?: "quick" | "standard" | "deep";
  completed?: string[];
  reflection?: { takeaway?: string; boundary?: string; question?: string };
  updatedAt?: string;
};
type JourneyArchive = Record<string, JourneyRecord>;

const STORAGE_KEY = "wxlab-chapter-journeys-v1";
const taskIds = ["orientation", "structure", "evidence", "method", "practice", "reflection"];
const modeNames = { quick: "速览", standard: "标准", deep: "深研" };
const capabilityTracks = [
  { label: "概念界定", chapters: [1] },
  { label: "载体版本", chapters: [2, 5] },
  { label: "形成流传", chapters: [3, 4] },
  { label: "校勘辨伪", chapters: [6, 8] },
  { label: "目录组织", chapters: [7, 9] },
  { label: "专门文献", chapters: [10, 11, 12, 13, 14] },
];

function readJourneys(): JourneyArchive {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

function downloadMarkdown(filename: string, markdown: string) {
  const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function LearningPortfolio({ baseUrl, progress }: { baseUrl: string; progress: ProgressArchive }) {
  const [journeys, setJourneys] = useState<JourneyArchive>({});
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const refresh = () => setJourneys(readJourneys());
    refresh();
    window.addEventListener("wxlab-chapter-journey-updated", refresh);
    return () => window.removeEventListener("wxlab-chapter-journey-updated", refresh);
  }, []);

  const chapterEvidence = useMemo(() => chapters.map((chapter, index) => {
    const record = journeys[chapter.id] ?? {};
    const reflection = record.reflection ?? {};
    const practice = progress[`${chapter.id}-structured-practice`];
    const deep = Object.entries(progress).some(([id, item]) => id.startsWith(`deep-${chapter.id}`) && item.completed);
    const completed = new Set((record.completed ?? []).filter((id) => taskIds.includes(id)));
    if (practice?.completed) completed.add("practice");
    if (deep) completed.add("evidence");
    const reflected = [reflection.takeaway, reflection.boundary, reflection.question].every((value) => (value ?? "").trim().length >= 6);
    if (reflected) completed.add("reflection");
    const routePercent = Math.round(completed.size / taskIds.length * 100);
    const practicePercent = practice?.completed && practice.total ? Math.round((practice.score ?? 0) / practice.total * 100) : 0;
    const evidenceScore = Math.round(routePercent * .5 + practicePercent * .3 + (deep ? 20 : 0));
    return { chapter, index: index + 1, record, reflection, completed, reflected, deep, practice, routePercent, practicePercent, evidenceScore };
  }), [journeys, progress]);

  const profiles = capabilityTracks.map((track) => {
    const items = track.chapters.map((chapter) => chapterEvidence[chapter - 1]);
    return { ...track, score: Math.round(items.reduce((sum, item) => sum + item.evidenceScore, 0) / items.length) };
  });
  const reflectedCount = chapterEvidence.filter((item) => item.reflected).length;
  const routeCount = chapterEvidence.filter((item) => item.routePercent === 100).length;
  const questions = chapterEvidence
    .filter((item) => (item.reflection.question ?? "").trim())
    .sort((a, b) => Date.parse(b.record.updatedAt ?? "") - Date.parse(a.record.updatedAt ?? ""));
  const strongest = [...profiles].sort((a, b) => b.score - a.score)[0];
  const hasEvidence = strongest.score > 0;
  const readiness = reflectedCount === 14 ? "完整成果" : reflectedCount >= 10 ? "系统成形" : reflectedCount >= 5 ? "持续生长" : reflectedCount ? "已经起笔" : "等待第一笔";
  const projectStatement = `我正在通过“文献学实验室”把《文献学概要》的阅读转化为可核验的数字学习过程。目前已完成 ${routeCount} 章完整任务路线、${reflectedCount} 章结构化复盘，并留下 ${questions.length} 个待追问题。网站用章节地图、证据实践和本地学习档案连接阅读与判断；这些记录是阶段性学习证据，不替代纸本核验。`;

  const radarPoints = profiles.map((profile, index) => {
    const angle = (-90 + index * 60) * Math.PI / 180;
    const radius = profile.score / 100 * 74;
    return `${110 + Math.cos(angle) * radius},${110 + Math.sin(angle) * radius}`;
  }).join(" ");
  const axisPoints = profiles.map((_, index) => {
    const angle = (-90 + index * 60) * Math.PI / 180;
    return { x: 110 + Math.cos(angle) * 78, y: 110 + Math.sin(angle) * 78 };
  });

  async function copyStatement() {
    try {
      await navigator.clipboard.writeText(projectStatement);
      setNotice("阶段成果说明已复制");
    } catch {
      setNotice("浏览器未开放复制权限，请手动选择上方文字");
    }
    window.setTimeout(() => setNotice(""), 2000);
  }

  function exportPortfolio() {
    const today = new Date();
    const lines = [
      "# 文献学实验室 · 我的十四章学习成果",
      "",
      `- 生成日期：${today.toLocaleDateString("zh-CN")}`,
      `- 完整任务路线：${routeCount} / 14`,
      `- 已形成复盘：${reflectedCount} / 14`,
      `- 待追问题：${questions.length}`,
      `- 阶段状态：${readiness}`,
      "",
      "> 这是一份由本地学习记录生成的阶段成果，不是课程成绩、能力认证或原书内容替代品。正式引用请回到纸本与可靠学术资料核验。",
      "",
      "## 阶段成果说明",
      "",
      projectStatement,
      "",
      "## 六维学习证据画像",
      "",
      "| 维度 | 关联章节 | 证据覆盖 |",
      "| --- | --- | ---: |",
      ...profiles.map((profile) => `| ${profile.label} | ${profile.chapters.map((chapter) => `第${chapter}章`).join("、")} | ${profile.score}% |`),
      "",
      "## 十四章成果",
      "",
      ...chapterEvidence.flatMap((item) => [
        `### ${item.chapter.number} · ${item.chapter.title}`,
        "",
        `- 学习路线：${modeNames[item.record.mode ?? "standard"]}`,
        `- 任务完成：${item.completed.size} / ${taskIds.length}`,
        `- 综合练习：${item.practice?.completed ? `${item.practice.score ?? 0} / ${item.practice.total ?? 0}` : "尚未完成"}`,
        `- 深度研读：${item.deep ? "已完成" : "尚未完成"}`,
        `- 关键词：${item.chapter.keywords.join("、")}`,
        "",
        "**我带走的一条认识**",
        "",
        (item.reflection.takeaway ?? "").trim() || "（尚未填写）",
        "",
        "**这条认识的证据边界**",
        "",
        (item.reflection.boundary ?? "").trim() || "（尚未填写）",
        "",
        "**我准备继续核对的问题**",
        "",
        (item.reflection.question ?? "").trim() || "（尚未填写）",
        "",
        `页面：https://jennifer-qj.github.io/wenxianxue-lab/chapters/${item.chapter.id}/`,
        "",
      ]),
      "## 待追问题索引",
      "",
      ...(questions.length ? questions.map((item) => `- ${item.chapter.number}：${item.reflection.question?.trim()}`) : ["- 尚未留下待追问题。"]),
      "",
      "---",
      "由“文献学实验室”在本地生成：https://jennifer-qj.github.io/wenxianxue-lab/",
    ];
    downloadMarkdown(`文献学实验室-十四章学习成果-${today.toISOString().slice(0, 10)}.md`, lines.join("\n"));
    setNotice("完整学习成果已导出");
    window.setTimeout(() => setNotice(""), 2000);
  }

  return <section className="learning-portfolio" id="portfolio">
    <header className="portfolio-heading">
      <div><p className="mini-label">Personal portfolio · 本地生成</p><h2>把十四次阅读，收束成一份阶段成果</h2><p>成果册只读取当前浏览器中的学习记录。它呈现做过什么、留下什么和还要查什么，不替你宣称“已经掌握”。</p></div>
      <div className="portfolio-status"><small>当前阶段</small><strong>{readiness}</strong><span>{reflectedCount}/14 章形成复盘</span></div>
    </header>

    <div className="portfolio-metrics" aria-label="成果册概览">
      <article><small>完整路线</small><strong>{routeCount}<i>/14</i></strong><span>六步任务全部留痕</span></article>
      <article><small>章节复盘</small><strong>{reflectedCount}<i>/14</i></strong><span>认识、边界与问题齐备</span></article>
      <article><small>待追问题</small><strong>{questions.length}</strong><span>下一轮纸本核验入口</span></article>
      <article><small>证据最充足</small><strong className="metric-label">{hasEvidence ? strongest.label : "尚未形成"}</strong><span>{hasEvidence ? `当前覆盖 ${strongest.score}%` : "完成任务后自动更新"}</span></article>
    </div>

    <div className="portfolio-analysis">
      <article className="capability-radar">
        <header><small>六维学习证据画像</small><h3>哪些方向已经留下较多证据？</h3></header>
        <div className="radar-layout">
          <svg viewBox="0 0 220 220" role="img" aria-label={profiles.map((profile) => `${profile.label}${profile.score}%`).join("，")}>
            {[.25, .5, .75, 1].map((level) => <polygon key={level} points={axisPoints.map((point) => `${110 + (point.x - 110) * level},${110 + (point.y - 110) * level}`).join(" ")} className="radar-ring" />)}
            {axisPoints.map((point, index) => <line key={index} x1="110" y1="110" x2={point.x} y2={point.y} className="radar-axis" />)}
            <polygon points={radarPoints} className="radar-value" />
            {radarPoints.split(" ").map((point, index) => { const [cx, cy] = point.split(","); return <circle key={index} cx={cx} cy={cy} r="3" className="radar-dot" />; })}
          </svg>
          <ol>{profiles.map((profile, index) => <li key={profile.label}><span>{String(index + 1).padStart(2, "0")} · {profile.label}</span><strong>{profile.score}%</strong><i><b style={{ width: `${profile.score}%` }} /></i></li>)}</ol>
        </div>
        <p>计算依据：关联章节的任务轨迹占 50%，综合练习占 30%，深度研读占 20%。这是学习证据覆盖，不是能力测评。</p>
      </article>

      <article className="question-ledger">
        <header><small>Question ledger</small><h3>把“不知道”保留下来</h3><p>好的复盘不是把问题消灭，而是让下一次核对有明确入口。</p></header>
        {questions.length ? <ol>{questions.slice(0, 6).map((item) => <li key={item.chapter.id}><a href={`${baseUrl}chapters/${item.chapter.id}/#chapter-review`}><span>{item.chapter.number}</span><p>{item.reflection.question}</p><b>回到本章 →</b></a></li>)}</ol> : <div className="portfolio-empty"><span>问</span><p>尚未留下待追问题。完成任一章的三栏复盘后，它会出现在这里。</p><a href={`${baseUrl}chapters/ch01/#chapter-review`}>从第一章开始 →</a></div>}
      </article>
    </div>

    <div className="chapter-spine">
      <header><div><small>Fourteen chapter outputs</small><h3>十四章成果脊柱</h3></div><span>点击任一章继续补写</span></header>
      <div>{chapterEvidence.map((item) => <a key={item.chapter.id} href={`${baseUrl}chapters/${item.chapter.id}/#chapter-review`} style={{ "--chapter-progress": `${item.routePercent}%` } as React.CSSProperties}>
        <small>{String(item.index).padStart(2, "0")}</small><strong>{item.chapter.title}</strong><p>{(item.reflection.takeaway ?? "").trim() || "尚未形成本章认识"}</p><i><b /></i><span>{item.completed.size}/6 任务 · {item.reflected ? "复盘完成" : "待复盘"}</span>
      </a>)}</div>
    </div>

    <footer className="portfolio-export">
      <div><small>可复用的阶段说明</small><p>{projectStatement}</p></div>
      <div><button onClick={copyStatement}>复制这段说明</button><button className="primary" onClick={exportPortfolio}>导出完整成果 .md</button></div>
      {notice && <span role="status">{notice}</span>}
    </footer>
  </section>;
}
