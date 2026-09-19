import { useEffect, useMemo, useState } from "react";
import "./ReviewCommandCenter.css";

type Priority = "P0" | "P1" | "P2";
type Verdict = "pending" | "confirmed" | "needs_edit" | "needs_source";
type QueueItem = { unitId: string; chapter: number; chapterId: string; chapterTitle: string; section: string; subsection?: string; pageStart: number; pageEnd?: number; priority: Priority; priorityReasons: string[]; requiredChecks: string[] };
type SavedEntry = { checks?: Record<string, boolean>; note?: string; verdict?: Verdict; updatedAt?: string };
type WorkState = "untouched" | "started" | "attention" | "ready";

const priorityOrder: Record<Priority, number> = { P0: 0, P1: 1, P2: 2 };
const stateLabels: Record<WorkState, string> = { untouched: "尚未开始", started: "核对中", attention: "需修改／补查", ready: "可提交" };
const stateOrder: Record<WorkState, number> = { attention: 0, started: 1, untouched: 2, ready: 3 };
const storageKey = (chapter: number) => `wxlab-paper-review-ch${String(chapter).padStart(2, "0")}-v1`;

export default function ReviewCommandCenter({ items, baseUrl }: { items: QueueItem[]; baseUrl: string }) {
  const [saved, setSaved] = useState<Record<string, SavedEntry>>({});
  const [priority, setPriority] = useState<"all" | Priority>("all");
  const [chapter, setChapter] = useState("all");
  const [workState, setWorkState] = useState<"all" | WorkState>("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(18);
  const [notice, setNotice] = useState("");

  function reload() {
    const next: Record<string, SavedEntry> = {};
    for (const number of [...new Set(items.map((item) => item.chapter))]) {
      try { Object.assign(next, JSON.parse(localStorage.getItem(storageKey(number)) || "{}")); } catch { /* 章内工作台可重建损坏记录 */ }
    }
    setSaved(next);
  }

  useEffect(() => {
    reload();
    const refresh = () => reload();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); };
  }, [items]);

  const rows = useMemo(() => items.map((item) => {
    const entry = saved[item.unitId] ?? {};
    const checked = item.requiredChecks.filter((id) => entry.checks?.[id]).length;
    const complete = checked === item.requiredChecks.length && entry.verdict === "confirmed";
    const state: WorkState = complete ? "ready" : ["needs_edit", "needs_source"].includes(entry.verdict ?? "") ? "attention" : checked || entry.note?.trim() || (entry.verdict && entry.verdict !== "pending") ? "started" : "untouched";
    return { ...item, entry, checked, state };
  }).sort((a, b) => stateOrder[a.state] - stateOrder[b.state] || priorityOrder[a.priority] - priorityOrder[b.priority] || a.chapter - b.chapter || a.pageStart - b.pageStart), [items, saved]);

  const counts = rows.reduce((acc, row) => { acc[row.state] += 1; acc[row.priority] += 1; return acc; }, { untouched: 0, started: 0, attention: 0, ready: 0, P0: 0, P1: 0, P2: 0 });
  const nextTask = rows.find((row) => row.state !== "ready");
  const normalized = query.trim().toLowerCase();
  const filtered = rows.filter((row) => (priority === "all" || row.priority === priority) && (chapter === "all" || row.chapterId === chapter) && (workState === "all" || row.state === workState) && (!normalized || [row.unitId, row.chapterTitle, row.section, row.subsection, ...row.priorityReasons].filter(Boolean).join(" ").toLowerCase().includes(normalized)));

  function exportAll() {
    const payload = { schema_version: "1.0", exported_at: new Date().toISOString(), declaration: "本文件汇总当前浏览器中的纸本复核工作记录，不自动改变网站学术状态。", summary: { total: rows.length, ...counts }, items: rows.map(({ entry, state, checked, ...item }) => ({ ...item, work_state: state, checked_count: checked, local_record: entry })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "wenxianxue-full-paper-review.json"; link.click(); URL.revokeObjectURL(url);
    setNotice("全书本地复核记录已导出；它不会自动上传或改变公开状态。");
    window.setTimeout(() => setNotice(""), 2600);
  }

  return <section className="review-command" id="review-command-center">
    <header><div><p className="eyebrow">FULL REVIEW COMMAND CENTER</p><h2>把134项队列变成下一条可执行任务</h2><p>这里读取各章工作台保存在当前浏览器里的记录，统一计算进度。它不上传原书、不建立账号，也不把本地勾选当作公开核验。</p></div><div className="review-command-actions">{nextTask ? <a className="button" href={`${baseUrl}review/${nextTask.chapterId}/#${nextTask.unitId}`}>继续下一条 · {nextTask.unitId} →</a> : <span>当前设备上的队列均已可提交</span>}<button onClick={exportAll}>导出全书记录 ↓</button></div></header>
    <div className="review-command-stats"><article><strong>{counts.ready}<i>/{rows.length}</i></strong><span>可提交单元</span></article><article><strong>{counts.attention}</strong><span>需修改／补查</span></article><article><strong>{counts.started}</strong><span>正在核对</span></article><article><strong>{counts.untouched}</strong><span>尚未开始</span></article></div>
    <div className="review-command-progress" aria-label={`当前设备完成 ${counts.ready} / ${rows.length}`}><i style={{ width: `${rows.length ? counts.ready / rows.length * 100 : 0}%` }} /></div>
    <div className="review-command-filters">
      <label><span>检索任务</span><input value={query} onChange={(event) => { setQuery(event.target.value); setLimit(18); }} placeholder="书名、方法、单元编号……" /></label>
      <label><span>章节</span><select value={chapter} onChange={(event) => { setChapter(event.target.value); setLimit(18); }}><option value="all">全部章节</option>{[...new Map(items.map((item) => [item.chapterId, item])).values()].map((item) => <option value={item.chapterId} key={item.chapterId}>第 {item.chapter} 章 · {item.chapterTitle}</option>)}</select></label>
      <label><span>优先级</span><select value={priority} onChange={(event) => { setPriority(event.target.value as "all" | Priority); setLimit(18); }}><option value="all">全部优先级</option><option value="P0">P0 · {counts.P0}</option><option value="P1">P1 · {counts.P1}</option><option value="P2">P2 · {counts.P2}</option></select></label>
      <label><span>本机进度</span><select value={workState} onChange={(event) => { setWorkState(event.target.value as "all" | WorkState); setLimit(18); }}><option value="all">全部状态</option>{Object.entries(stateLabels).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>
    </div>
    <p className="review-command-caption">显示 {Math.min(filtered.length, limit)}/{filtered.length} 项 · 需修改／补查优先于未完成任务，同状态内再按P0、P1、P2排序。</p>
    <div className="review-command-list">{filtered.slice(0, limit).map((row) => <a href={`${baseUrl}review/${row.chapterId}/#${row.unitId}`} key={row.unitId}><span className={`priority ${row.priority.toLowerCase()}`}>{row.priority}</span><div><small>第 {row.chapter} 章 · 第 {row.pageStart}{row.pageEnd ? `—${row.pageEnd}` : ""} 页</small><strong>{row.section}{row.subsection ? ` · ${row.subsection}` : ""}</strong><p>{row.priorityReasons[0]}</p></div><aside><b>{stateLabels[row.state]}</b><small>{row.checked}/{row.requiredChecks.length} 检查项</small></aside></a>)}</div>
    {!filtered.length && <p className="review-command-empty">当前筛选下没有任务。</p>}
    {filtered.length > limit && <button className="review-command-more" onClick={() => setLimit((value) => value + 24)}>再显示24项</button>}
    {notice && <div className="review-command-toast" role="status">{notice}</div>}
  </section>;
}
