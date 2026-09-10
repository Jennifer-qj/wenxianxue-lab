import { useEffect, useMemo, useState } from "react";
import "./ReviewWorkspace.css";
import "./ReviewWorkspacePriority.css";

type CheckId = "page_range" | "names_dates" | "summary_fidelity" | "boundary_strength" | "linked_content";
type Verdict = "pending" | "confirmed" | "needs_edit" | "needs_source";
type Priority = "P0" | "P1" | "P2" | "UNSET";
type Unit = { id: string; section: string; subsection?: string; page_start: number; page_end?: number; key_question: string; summary: string; boundary: string; status: string };
type RecordItem = {
  unit_id: string;
  page_start: number;
  page_end?: number;
  focus: string[];
  review_priority?: "P0" | "P1" | "P2";
  priority_reasons?: string[];
  required_checks: CheckId[];
  status: string;
  reviewer?: string | null;
  reviewed_at?: string | null;
  evidence_note?: string | null;
};
type Entry = { checks: Partial<Record<CheckId, boolean>>; note: string; verdict: Verdict; updatedAt?: string };

const checkLabels: Record<CheckId, string> = {
  page_range: "页码与章节边界一致",
  names_dates: "专名、年代与数字已逐项核对",
  summary_fidelity: "原创概括未歪曲原意",
  boundary_strength: "判断边界与证据强度相称",
  linked_content: "概念、题目和案例关联合理",
};
const verdictLabels: Record<Verdict, string> = { pending: "尚未形成结论", confirmed: "可提交核验", needs_edit: "需要修改表述", needs_source: "需要补查资料" };
const priorityLabels: Record<Priority, string> = { P0: "优先终审", P1: "重点复查", P2: "常规复查", UNSET: "待分级" };
const priorityOrder: Record<Priority, number> = { P0: 0, P1: 1, P2: 2, UNSET: 3 };

export default function ReviewWorkspace({ chapter, chapterTitle, edition, sourceNote, units, packet, baseUrl }: { chapter: number; chapterTitle: string; edition: string; sourceNote: string; units: Unit[]; packet: RecordItem[]; baseUrl: string }) {
  const storageKey = `wxlab-paper-review-ch${String(chapter).padStart(2, "0")}-v1`;
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [filter, setFilter] = useState<"all" | "unfinished" | "attention" | "ready">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(storageKey) || "{}")); } catch { setEntries({}); }
  }, [storageKey]);
  useEffect(() => {
    if (!Object.keys(entries).length) return;
    try { localStorage.setItem(storageKey, JSON.stringify(entries)); } catch { /* 无痕模式或存储受限时仍可继续本次复核 */ }
  }, [entries, storageKey]);

  const rows = useMemo(() => units.map((unit) => {
    const record = packet.find((item) => item.unit_id === unit.id);
    const required = record?.required_checks ?? (["page_range", "names_dates", "summary_fidelity", "boundary_strength", "linked_content"] as CheckId[]);
    const entry = entries[unit.id] ?? { checks: {}, note: "", verdict: "pending" as Verdict };
    const checked = required.filter((id) => entry.checks[id]).length;
    const priority: Priority = record?.review_priority ?? "UNSET";
    return { unit, record, priority, required, entry, checked, complete: checked === required.length && entry.verdict === "confirmed" };
  }).sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || a.unit.page_start - b.unit.page_start), [entries, packet, units]);
  const visible = rows.filter(({ entry, complete, priority }) => (priorityFilter === "all" || priority === priorityFilter) && (filter === "all" || (filter === "unfinished" && !complete) || (filter === "attention" && ["needs_edit", "needs_source"].includes(entry.verdict)) || (filter === "ready" && complete)));
  const ready = rows.filter((row) => row.complete).length;
  const checkedCount = rows.reduce((sum, row) => sum + row.checked, 0);
  const requiredCount = rows.reduce((sum, row) => sum + row.required.length, 0);
  const priorityCounts = rows.reduce((counts, row) => ({ ...counts, [row.priority]: counts[row.priority] + 1 }), { P0: 0, P1: 0, P2: 0, UNSET: 0 });

  function update(id: string, patch: Partial<Entry>) {
    setEntries((current) => {
      const existing: Entry = current[id] ?? { checks: {}, note: "", verdict: "pending" };
      return { ...current, [id]: { ...existing, ...patch, updatedAt: new Date().toISOString() } };
    });
  }
  function toggle(id: string, check: CheckId) {
    const current = entries[id] ?? { checks: {}, note: "", verdict: "pending" as Verdict };
    update(id, { checks: { ...current.checks, [check]: !current.checks[check] } });
  }
  function snapshot() {
    return {
      schema_version: "1.0", chapter, chapter_title: chapterTitle, edition,
      exported_at: new Date().toISOString(), declaration: "本文件是复核工作记录，不自动改变网站学术状态。",
      items: rows.map(({ unit, record, priority, required, entry, complete }) => ({ unit_id: unit.id, pages: `${record?.page_start ?? unit.page_start}-${record?.page_end ?? unit.page_end ?? unit.page_start}`, review_priority: priority, priority_reasons: record?.priority_reasons ?? [], required_checks: required, ...entry, ready_to_submit: complete })),
    };
  }
  function exportReview() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot(), null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `chapter-${String(chapter).padStart(2, "0")}-paper-review.json`; link.click(); URL.revokeObjectURL(url);
  }
  async function copyUnit(unit: Unit) {
    const row = rows.find((item) => item.unit.id === unit.id)!;
    const text = [`复核单元：${unit.id}｜${unit.section}${unit.subsection ? ` · ${unit.subsection}` : ""}`, `纸本范围：第 ${row.record?.page_start ?? unit.page_start}${(row.record?.page_end ?? unit.page_end) ? `—${row.record?.page_end ?? unit.page_end}` : ""} 页`, `结论：${verdictLabels[row.entry.verdict]}`, `记录：${row.entry.note || "尚未填写"}`, `已核对：${row.required.filter((id) => row.entry.checks[id]).map((id) => checkLabels[id]).join("；") || "无"}`].join("\n");
    try { await navigator.clipboard.writeText(text); setSaved(`${unit.id} 的反馈摘要已复制`); } catch { setSaved("浏览器未允许复制，请改用章节 JSON 导出"); }
    window.setTimeout(() => setSaved(""), 2200);
  }
  async function submitChapter() {
    const report = JSON.stringify(snapshot(), null, 2);
    let copied = false;
    try { await navigator.clipboard.writeText(report); copied = true; } catch { setSaved("浏览器未允许复制，请先导出 JSON，再附到处理单中"); }
    const title = encodeURIComponent(`[纸本复核] 第${chapter}章 ${chapterTitle}`);
    window.open(`https://github.com/Jennifer-qj/wenxianxue-lab/issues/new?template=review-claim.yml&title=${title}`, "_blank", "noopener,noreferrer");
    if (copied) setSaved("复核快照已复制，请在新打开的处理单中粘贴并补充纸本依据");
  }

  return <div className="review-workspace">
    <section className="review-console">
      <div><small>LOCAL PAPER REVIEW</small><h2>第 {chapter} 章纸本复核工作台</h2><p>{sourceNote}</p></div>
      <dl><div><dt>{priorityCounts.P0}</dt><dd>优先终审</dd></div><div><dt>{ready}/{units.length}</dt><dd>单元可提交</dd></div><div><dt>{checkedCount}/{requiredCount}</dt><dd>检查项完成</dd></div></dl>
      <div className="review-actions"><button onClick={() => window.print()}>打印当前核对单</button><button onClick={exportReview}>导出本地复核记录 ↓</button><button className="primary" disabled={!ready} onClick={submitChapter}>复制快照并提交共校 ↗</button></div>
    </section>
    <div className="review-boundary" role="note"><strong>当前材料边界</strong><span>网站不托管原书扫描件；这里已经备好页码和风险线索，但仍需把实体书或合法自用扫描件放在手边逐项核对。本地勾选只帮助你工作，不会自动更改网站状态，提供纸本依据并经过公开合并后才能标为“已核验”。</span></div>
    <div className="review-filter-groups"><nav className="review-filters" aria-label="按进度筛选复核条目">{([['all','全部进度'],['unfinished','未完成'],['attention','需修改／补查'],['ready','可提交']] as const).map(([id,label]) => <button key={id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)}>{label}</button>)}</nav><nav className="review-filters priority" aria-label="按优先级筛选复核条目">{([['all','全部优先级'],['P0',`优先终审 ${priorityCounts.P0}`],['P1',`重点复查 ${priorityCounts.P1}`],['P2',`常规复查 ${priorityCounts.P2}`],['UNSET',`待分级 ${priorityCounts.UNSET}`]] as const).map(([id,label]) => <button key={id} className={priorityFilter === id ? "active" : ""} onClick={() => setPriorityFilter(id)}>{label}</button>)}</nav></div>
    <p className="review-sort-note">当前显示 {visible.length} 项；无论原章节顺序如何，优先终审条目会排在最前。</p>
    <div className="review-list">{visible.map(({ unit, record, priority, required, entry, checked, complete }) => <article className={`${complete ? "complete" : entry.verdict !== "pending" ? "attention" : ""} priority-${priority.toLowerCase()}`} key={unit.id}>
      <header><div><div className="review-kicker"><small>{unit.id}</small><b data-priority={priority}>{priority} · {priorityLabels[priority]}</b></div><h3>{unit.section}{unit.subsection ? ` · ${unit.subsection}` : ""}</h3></div><div className="review-location"><span>纸本第 {record?.page_start ?? unit.page_start}{(record?.page_end ?? unit.page_end) ? `—${record?.page_end ?? unit.page_end}` : ""} 页</span>{record?.status === "in_review" ? <small>文字稿预对读</small> : null}</div></header>
      <div className="review-source"><div><small>当前关键问题</small><p>{unit.key_question}</p></div><div><small>项目原创概括</small><p>{unit.summary}</p></div><div><small>当前判断边界</small><p>{unit.boundary}</p></div></div>
      {record?.evidence_note ? <aside className="review-precheck"><strong>文字稿预对读 · 待纸本终审</strong><div><p>{record.evidence_note}</p><small>{record.reviewer ?? "未署名"}{record.reviewed_at ? ` · ${record.reviewed_at}` : ""}</small></div></aside> : null}
      {record?.priority_reasons?.length ? <aside className="review-priority"><strong>为何排在这里</strong><ul>{record.priority_reasons.map((item) => <li key={item}>{item}</li>)}</ul></aside> : null}
      {record?.focus?.length ? <aside><strong>本单元优先核对</strong><ul>{record.focus.map((item) => <li key={item}>{item}</li>)}</ul></aside> : null}
      <div className="review-checks">{required.map((id) => <button key={id} aria-pressed={Boolean(entry.checks[id])} className={entry.checks[id] ? "checked" : ""} onClick={() => toggle(unit.id, id)}><span>{entry.checks[id] ? "✓" : "□"}</span>{checkLabels[id]}</button>)}</div>
      <div className="review-note"><label><span>纸本证据、疑点或建议改写</span><textarea value={entry.note} onChange={(event) => update(unit.id, { note: event.target.value })} placeholder="记录具体页码、短语、版本差异或需要进一步检索的资料；不要粘贴大段原文。" /></label><label><span>阶段判断</span><select value={entry.verdict} onChange={(event) => update(unit.id, { verdict: event.target.value as Verdict })}>{Object.entries(verdictLabels).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label></div>
      <footer><span>{checked}/{required.length} 项完成 · 网站状态仍为“{unit.status === "verified" ? "已核验" : "待复核"}”</span><button onClick={() => copyUnit(unit)}>复制本单元反馈</button></footer>
    </article>)}</div>
    {!visible.length && <p className="review-empty">当前筛选下没有条目。</p>}
    {saved && <div className="review-toast" role="status">{saved}</div>}
    <p className="review-return"><a href={`${baseUrl}audit/`}>← 返回全书内容审计</a></p>
  </div>;
}
