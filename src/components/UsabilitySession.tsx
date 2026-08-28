import { useEffect, useMemo, useState } from "react";
import "./UsabilitySession.css";
import "./UsabilityDebrief.css";

type Result = "untested" | "completed" | "blocked";
type TaskResult = { result: Result; seconds?: number; difficulty: number; note: string };
type Debrief = { understanding: string; useful: string; confusing: string; missing: string };
type Props = { baseUrl: string };

const tasks = [
  { id: "tour", title: "理解项目定位", goal: "从首页进入十分钟项目导览；完成后，用自己的话说出这个项目和‘在线电子书’有什么不同。", path: "tour/" },
  { id: "find", title: "找到一个知识点", goal: "从首页出发，找到第五章中关于善本判断的学习单元。", path: "chapters/ch05/" },
  { id: "graph", title: "使用知识图谱", goal: "在图谱中找到“版本”和“校勘”的关系，并说出你理解的连接理由。", path: "graph/" },
  { id: "lab", title: "完成一次操作", goal: "进入互动实验室，完成一个不只是单项选择的练习。", path: "lab/" },
  { id: "note", title: "留下学习痕迹", goal: "收藏或批注一个页面，再到札记中把它找回来。", path: "notebook/" },
  { id: "audit", title: "判断内容可信度", goal: "找到第二章的核验状态，并解释“待复核”意味着什么。", path: "audit/" },
  { id: "feedback", title: "提交一条反馈", goal: "找到内容纠错入口，走到提交前一步即可，不必真的发送。", path: "contribute/" },
] as const;

const blank = (): Record<string, TaskResult> => Object.fromEntries(tasks.map((task) => [task.id, { result: "untested", difficulty: 3, note: "" }]));
const key = "wenxianxue-usability-session-v1";
const debriefKey = "wenxianxue-usability-debrief-v1";
const blankDebrief: Debrief = { understanding: "", useful: "", confusing: "", missing: "" };

export default function UsabilitySession({ baseUrl }: Props) {
  const [results, setResults] = useState<Record<string, TaskResult>>(blank);
  const [running, setRunning] = useState<{ id: string; started: number } | null>(null);
  const [message, setMessage] = useState("");
  const [debrief, setDebrief] = useState<Debrief>(blankDebrief);

  useEffect(() => {
    try { const saved = localStorage.getItem(key); if (saved) setResults({ ...blank(), ...JSON.parse(saved) }); const savedDebrief = localStorage.getItem(debriefKey); if (savedDebrief) setDebrief({ ...blankDebrief, ...JSON.parse(savedDebrief) }); } catch { /* 本地存储不可用时只保留本次会话 */ }
  }, []);
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(results)); } catch { /* 同上 */ } }, [results]);
  useEffect(() => { try { localStorage.setItem(debriefKey, JSON.stringify(debrief)); } catch { /* 同上 */ } }, [debrief]);

  const tested = Object.values(results).filter((item) => item.result !== "untested");
  const summary = useMemo(() => ({
    tested: tested.length,
    completed: tested.filter((item) => item.result === "completed").length,
    blocked: tested.filter((item) => item.result === "blocked").length,
    average: tested.length ? Math.round(tested.reduce((sum, item) => sum + (item.seconds ?? 0), 0) / tested.length) : 0,
  }), [results]);

  function update(id: string, patch: Partial<TaskResult>) {
    setResults((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }
  function start(id: string) { setRunning({ id, started: Date.now() }); }
  function finish(id: string, result: Exclude<Result, "untested">) {
    const seconds = running?.id === id ? Math.max(1, Math.round((Date.now() - running.started) / 1000)) : results[id].seconds;
    update(id, { result, seconds }); setRunning(null);
  }
  function payload() {
    return { project: "文献学实验室", tested_at: new Date().toISOString(), summary, tasks: tasks.map((task) => ({ id: task.id, title: task.title, ...results[task.id] })), debrief };
  }
  function download() {
    const blob = new Blob([JSON.stringify(payload(), null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `wenxianxue-usability-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href);
  }
  async function copyReport() {
    const lines = tasks.map((task) => { const item = results[task.id]; return `- ${task.title}：${item.result === "completed" ? "完成" : item.result === "blocked" ? "受阻" : "未测"}${item.seconds ? `，${item.seconds} 秒` : ""}，难度 ${item.difficulty}/5${item.note ? `；${item.note}` : ""}`; });
    const text = [`## 用户测试记录`, ``, `完成 ${summary.completed}/${summary.tested}，受阻 ${summary.blocked}，平均 ${summary.average} 秒。`, ``, ...lines, ``, `### 结束访谈`, ``, `- 项目理解：${debrief.understanding || "未记录"}`, `- 最有帮助：${debrief.useful || "未记录"}`, `- 最困惑：${debrief.confusing || "未记录"}`, `- 还缺什么：${debrief.missing || "未记录"}`].join("\n");
    try { await navigator.clipboard.writeText(text); setMessage("测试摘要已复制，可粘贴到 GitHub 反馈表单"); } catch { setMessage("浏览器未允许复制，请先导出 JSON"); }
    window.setTimeout(() => setMessage(""), 2600);
  }

  return <section className="usability-workbench">
    <header className="usability-summary"><div><small>本次测试</small><strong>{summary.tested}<i> / {tasks.length}</i></strong></div><div><small>顺利完成</small><strong>{summary.completed}</strong></div><div><small>遇到阻碍</small><strong>{summary.blocked}</strong></div><div><small>平均耗时</small><strong>{summary.average}<i> 秒</i></strong></div></header>
    <p className="privacy-note">记录只保存在当前浏览器，除非你主动导出或提交；请不要填写姓名、联系方式等个人信息。</p>
    <div className="usability-tasks">{tasks.map((task, index) => { const item = results[task.id]; const isRunning = running?.id === task.id; return <article key={task.id} className={item.result}>
      <header><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{task.title}</h2><p>{task.goal}</p></div><a href={`${baseUrl}${task.path}`} target="_blank" rel="noreferrer">打开目标页面 ↗</a></header>
      <div className="task-controls"><div className="timer">{isRunning ? <><b>计时中</b><button onClick={() => finish(task.id, "completed")}>顺利完成</button><button onClick={() => finish(task.id, "blocked")}>遇到阻碍</button></> : <button onClick={() => start(task.id)} disabled={Boolean(running)}>开始计时</button>}</div>
      <label><span>主观难度 <b>{item.difficulty}/5</b></span><input type="range" min="1" max="5" value={item.difficulty} onChange={(event) => update(task.id, { difficulty: Number(event.target.value) })} /></label>
      <label><span>哪里犹豫、绕路或出乎意料？</span><textarea value={item.note} onChange={(event) => update(task.id, { note: event.target.value })} placeholder="尽量记录具体动作，而不是只写‘不好用’。" /></label></div>
      <footer><span>{item.result === "completed" ? "已完成" : item.result === "blocked" ? "受阻" : "尚未测试"}{item.seconds ? ` · ${item.seconds} 秒` : ""}</span>{item.result !== "untested" && <button onClick={() => update(task.id, { result: "untested", seconds: undefined })}>重置本项</button>}</footer>
    </article>; })}</div>
    <section className="usability-debrief"><header><small>AFTER THE TASKS · 结束访谈</small><h2>先记原话，不急着替参与者总结</h2><p>以下问题没有标准答案。尽量逐字记录参与者的说法，尤其保留犹豫和批评。</p></header><div><label><span>你觉得这个网站想解决什么问题？</span><textarea value={debrief.understanding} onChange={(event) => setDebrief((current) => ({ ...current, understanding: event.target.value }))} /></label><label><span>哪一个部分最可能让你愿意继续使用？</span><textarea value={debrief.useful} onChange={(event) => setDebrief((current) => ({ ...current, useful: event.target.value }))} /></label><label><span>哪里最困惑、最像机器生成或最不可信？</span><textarea value={debrief.confusing} onChange={(event) => setDebrief((current) => ({ ...current, confusing: event.target.value }))} /></label><label><span>如果下周再来，你最希望多出什么？</span><textarea value={debrief.missing} onChange={(event) => setDebrief((current) => ({ ...current, missing: event.target.value }))} /></label></div></section>
    <footer className="usability-export"><div><strong>完成后，把观察变成可处理的证据</strong><p>导出文件适合自行留档；复制摘要会同时带上任务记录和结束访谈。</p></div><div><button onClick={download} disabled={!summary.tested}>导出 JSON</button><button onClick={copyReport} disabled={!summary.tested}>复制完整摘要</button><a href="https://github.com/Jennifer-qj/wenxianxue-lab/issues/new?template=feature-request.yml&title=%5B%E7%94%A8%E6%88%B7%E6%B5%8B%E8%AF%95%5D%20" target="_blank" rel="noreferrer">提交改进建议 ↗</a></div>{message && <p role="status">{message}</p>}</footer>
  </section>;
}
