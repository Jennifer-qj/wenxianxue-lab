import { useEffect, useMemo, useState } from "react";
import "./ChapterJourney.css";

type ReadingMode = "quick" | "standard" | "deep";
type JourneyRecord = {
  mode: ReadingMode;
  completed: string[];
  reflection: { takeaway: string; boundary: string; question: string };
  updatedAt: string;
};
type Props = {
  mode: "map" | "review";
  chapterId: string;
  chapterNumber: string;
  title: string;
  focus: string;
  sections: string[];
  keywords: string[];
  unitCount: number;
  quizCount: number;
  deepDiveId?: string;
};

const STORAGE_KEY = "wxlab-chapter-journeys-v1";
const emptyReflection = { takeaway: "", boundary: "", question: "" };

function emptyRecord(): JourneyRecord {
  return { mode: "standard", completed: [], reflection: { ...emptyReflection }, updatedAt: new Date(0).toISOString() };
}

function readRecord(chapterId: string): JourneyRecord {
  try {
    const archive = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { ...emptyRecord(), ...(archive[chapterId] ?? {}), reflection: { ...emptyReflection, ...(archive[chapterId]?.reflection ?? {}) } };
  } catch { return emptyRecord(); }
}

function writeRecord(chapterId: string, record: JourneyRecord) {
  try {
    const archive = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    archive[chapterId] = { ...record, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(archive));
    window.dispatchEvent(new CustomEvent("wxlab-chapter-journey-updated", { detail: { chapterId } }));
  } catch { /* 禁用存储时仍可在当前页面使用 */ }
}

export default function ChapterJourney(props: Props) {
  const { mode, chapterId, chapterNumber, title, focus, sections, keywords, unitCount, quizCount, deepDiveId } = props;
  const [record, setRecord] = useState<JourneyRecord>(emptyRecord());
  const [automatic, setAutomatic] = useState<string[]>([]);
  const [saved, setSaved] = useState("");

  function refresh() {
    const next = readRecord(chapterId);
    setRecord(next);
    try {
      const progress = JSON.parse(localStorage.getItem("wxlab-progress") || "{}");
      const completed: string[] = [];
      if (progress[`${chapterId}-structured-practice`]?.completed || progress[chapterId]?.completed) completed.push("practice");
      if (deepDiveId && progress[deepDiveId]?.completed) completed.push("evidence");
      setAutomatic(completed);
    } catch { setAutomatic([]); }
  }

  useEffect(() => {
    refresh();
    const onJourney = (event: Event) => {
      const detail = (event as CustomEvent<{ chapterId?: string }>).detail;
      if (!detail?.chapterId || detail.chapterId === chapterId) refresh();
    };
    window.addEventListener("wxlab-chapter-journey-updated", onJourney);
    window.addEventListener("wxlab-progress-updated", refresh);
    return () => {
      window.removeEventListener("wxlab-chapter-journey-updated", onJourney);
      window.removeEventListener("wxlab-progress-updated", refresh);
    };
  }, [chapterId, deepDiveId]);

  const quickMinutes = 15;
  const standardMinutes = Math.max(35, 24 + unitCount);
  const deepMinutes = standardMinutes + 30;
  const modeOptions = [
    { id: "quick" as const, label: "速览", minutes: quickMinutes, route: "导读 → 旁注 → 检测" },
    { id: "standard" as const, label: "标准", minutes: standardMinutes, route: "学习单元 → 方法 → 检测" },
    { id: "deep" as const, label: "深研", minutes: deepMinutes, route: "完整阅读 → 案例 → 复盘" },
  ];
  const tasks = [
    { id: "orientation", label: "定位问题", detail: "读导读与章节旁注", href: "#overview" },
    { id: "structure", label: "拆分知识", detail: `${unitCount} 个学习单元`, href: "#learning-units" },
    { id: "evidence", label: "处理证据", detail: "完成案例研读", href: "#deep-dive" },
    { id: "method", label: "整理方法", detail: "把知识改成步骤", href: "#workflow" },
    { id: "practice", label: "检验判断", detail: `${quizCount} 道结构化题`, href: "#check" },
    { id: "reflection", label: "留下复盘", detail: "写结论、边界与问题", href: "#chapter-review" },
  ];
  const completed = useMemo(() => new Set([...record.completed, ...automatic]), [record.completed, automatic]);
  const percent = Math.round(completed.size / tasks.length * 100);

  function update(next: JourneyRecord, message?: string) {
    setRecord(next);
    writeRecord(chapterId, next);
    if (message) {
      setSaved(message);
      window.setTimeout(() => setSaved(""), 1800);
    }
  }

  function toggleTask(id: string) {
    if (automatic.includes(id)) return;
    const done = record.completed.includes(id);
    update({ ...record, completed: done ? record.completed.filter((item) => item !== id) : [...record.completed, id] });
  }

  function updateReflection(field: keyof JourneyRecord["reflection"], value: string) {
    const reflection = { ...record.reflection, [field]: value };
    const ready = Object.values(reflection).every((item) => item.trim().length >= 6);
    const completedTasks = ready ? [...new Set([...record.completed, "reflection"])] : record.completed.filter((item) => item !== "reflection");
    update({ ...record, reflection, completed: completedTasks });
  }

  function exportChapter() {
    const modeLabel = modeOptions.find((item) => item.id === record.mode)?.label ?? "标准";
    const markdown = [
      `# ${chapterNumber} · ${title}｜学习复盘`,
      "",
      `- 学习模式：${modeLabel}`,
      `- 导出日期：${new Date().toLocaleDateString("zh-CN")}`,
      `- 任务完成：${completed.size} / ${tasks.length}`,
      "",
      "## 本章问题",
      "",
      focus,
      "",
      "## 阅读结构",
      "",
      ...sections.map((item, index) => `${index + 1}. ${item}`),
      "",
      "## 任务轨迹",
      "",
      ...tasks.map((task) => `- [${completed.has(task.id) ? "x" : " "}] ${task.label}：${task.detail}`),
      "",
      "## 我带走的一条认识",
      "",
      record.reflection.takeaway.trim() || "（尚未填写）",
      "",
      "## 这条认识的证据边界",
      "",
      record.reflection.boundary.trim() || "（尚未填写）",
      "",
      "## 我准备继续核对的问题",
      "",
      record.reflection.question.trim() || "（尚未填写）",
      "",
      `关键词：${keywords.join("、")}`,
      "",
      "> 本报告是个人学习复盘，不是原书摘录，也不构成学术核验结论。",
      "",
      `页面：${window.location.href.split("#")[0]}`,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${chapterId}-${title}-学习复盘.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    setSaved("本章学习复盘已导出");
  }

  if (mode === "review") return <div className="chapter-reflection">
    <header>
      <div><small>CHAPTER OUTPUT · 本地自动保存</small><h3>用自己的话，为这一章收束一次</h3></div>
      <div className="chapter-reflection__score"><strong>{completed.size}/{tasks.length}</strong><span>任务完成</span></div>
    </header>
    <div className="chapter-reflection__fields">
      <label><span>01 · 我带走的一条认识</span><textarea value={record.reflection.takeaway} onChange={(event) => updateReflection("takeaway", event.target.value)} maxLength={800} placeholder="不要抄定义。写下你现在能够解释或判断的一件事……" /></label>
      <label><span>02 · 这条认识的证据边界</span><textarea value={record.reflection.boundary} onChange={(event) => updateReflection("boundary", event.target.value)} maxLength={800} placeholder="它在什么条件下成立？还不能证明什么？" /></label>
      <label><span>03 · 我准备继续核对的问题</span><textarea value={record.reflection.question} onChange={(event) => updateReflection("question", event.target.value)} maxLength={800} placeholder="回到纸本、目录或其他资料时，下一步要查什么？" /></label>
    </div>
    <footer><p>{completed.has("reflection") ? "三项复盘已经齐备，可以导出一份本章成果。" : "每项至少写 6 个字，系统才把“章末复盘”记为完成。"}</p><button onClick={exportChapter}>导出本章学习复盘 .md</button></footer>
    {saved && <p className="chapter-journey__notice" role="status">{saved}</p>}
  </div>;

  return <div className="chapter-journey">
    <header>
      <div><small>CHAPTER ROUTE · 本章学习地图</small><h2>先决定今天读到哪一层</h2><p>预计用时只帮助安排一次学习，不代表必须连续完成。</p></div>
      <div className="chapter-journey__progress" style={{ "--journey-progress": `${percent}%` } as React.CSSProperties}><strong>{percent}%</strong><span>本章任务</span></div>
    </header>
    <div className="reading-modes" role="group" aria-label="选择本章学习模式">
      {modeOptions.map((option) => <button key={option.id} className={record.mode === option.id ? "active" : ""} aria-pressed={record.mode === option.id} onClick={() => update({ ...record, mode: option.id }, `已选择${option.label}模式`)}><span>{option.label}</span><strong>约 {option.minutes} 分钟</strong><small>{option.route}</small></button>)}
    </div>
    <ol className="journey-steps">
      {tasks.map((task, index) => <li key={task.id} className={completed.has(task.id) ? "done" : ""}>
        <a href={task.href}><span>{String(index + 1).padStart(2, "0")}</span><strong>{task.label}</strong><small>{task.detail}</small></a>
        <button disabled={automatic.includes(task.id)} onClick={() => toggleTask(task.id)} aria-pressed={completed.has(task.id)} aria-label={`${completed.has(task.id) ? "取消完成" : "标记完成"}：${task.label}`} title={automatic.includes(task.id) ? "由学习记录自动确认" : "手动标记任务状态"}>{completed.has(task.id) ? "✓" : "+"}</button>
      </li>)}
    </ol>
    <footer><span>选择不会锁住路线，你可以随时跳到更深或更轻的读法。</span><a href="#overview">开始本章 →</a></footer>
    {saved && <p className="chapter-journey__notice" role="status">{saved}</p>}
  </div>;
}
