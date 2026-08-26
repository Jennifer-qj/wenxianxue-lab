import { useEffect, useMemo, useState } from "react";
import "./ReviewWorkspace.css";

type CheckId = "page_range" | "names_dates" | "summary_fidelity" | "boundary_strength" | "linked_content";
type Verdict = "pending" | "confirmed" | "needs_edit" | "needs_source";
type Unit = { id: string; section: string; subsection?: string; page_start: number; page_end?: number; key_question: string; summary: string; boundary: string; status: string };
type RecordItem = { unit_id: string; page_start: number; page_end?: number; focus: string[]; required_checks: CheckId[]; status: string };
type Entry = { checks: Partial<Record<CheckId, boolean>>; note: string; verdict: Verdict; updatedAt?: string };

const checkLabels: Record<CheckId, string> = {
  page_range: "页码与章节边界一致",
  names_dates: "专名、年代与数字已逐项核对",
  summary_fidelity: "原创概括未歪曲原意",
  boundary_strength: "判断边界与证据强度相称",
  linked_content: "概念、题目和案例关联合理",
};
const verdictLabels: Record<Verdict, string> = { pending: "尚未形成结论", confirmed: "可提交核验", needs_edit: "需要修改表述", needs_source: "需要补查资料" };

export default function ReviewWorkspace({ chapter, chapterTitle, edition, sourceNote, units, packet, baseUrl }: { chapter: number; chapterTitle: string; edition: string; sourceNote: string; units: Unit[]; packet: RecordItem[]; baseUrl: string }) {
  const storageKey = `wxlab-paper-review-ch${String(chapter).padStart(2, "0")}-v1`;
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [filter, setFilter] = useState<"all" | "unfinished" | "attention" | "ready">("all");
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
    return { unit, record, required, entry, checked, complete: checked === required.length && entry.verdict === "confirmed" };
  }), [entries, packet, units]);
  const visible = rows.filter(({ entry, complete }) => filter === "all" || (filter === "unfinished" && !complete) || (filter === "attention" && ["needs_edit", "needs_source"].includes(entry.verdict)) || (filter === "ready" && complete));
  const ready = rows.filter((row) => row.complete).length;
  const checkedCount = rows.reduce((sum, row) => sum + row.checked, 0);
  const requiredCount = rows.reduce((sum, row) => sum + row.required.length, 0);

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
      items: rows.map(({ unit, record, required, entry, complete }) => ({ unit_id: unit.id, pages: `${record?.page_start ?? unit.page_start}-${record?.page_end ?? unit.page_end ?? unit.page_start}`, required_checks: required, ...entry, ready_to_submit: complete })),
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
      <dl><div><dt>{ready}/{units.length}</dt><dd>单元可提交</dd></div><div><dt>{checkedCount}/{requiredCount}</dt><dd>检查项完成</dd></div><div><dt>0</dt><dd>自动改为已核验</dd></div></dl>
      <div className="review-actions"><button onClick={exportReview}>导出本地复核记录 ↓</button><button className="primary" disabled={!ready} onClick={submitChapter}>复制快照并提交共校 ↗</button></div>
    </section>
    <div className="review-boundary" role="note"><strong>重要边界</strong><span>本地勾选只帮助你工作，不会自动更改网站状态。必须提供纸本依据并经过公开合并，单元才可从“待复核”改为“已核验”。</span></div>
    <nav className="review-filters" aria-label="筛选复核条目">{([['all','全部'],['unfinished','未完成'],['attention','需修改／补查'],['ready','可提交']] as const).map(([id,label]) => <button key={id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)}>{label}</button>)}</nav>
    <div className="review-list">{visible.map(({ unit, record, required, entry, checked, complete }) => <article className={complete ? "complete" : entry.verdict !== "pending" ? "attention" : ""} key={unit.id}>
      <header><div><small>{unit.id}</small><h3>{unit.section}{unit.subsection ? ` · ${unit.subsection}` : ""}</h3></div><span>纸本第 {record?.page_start ?? unit.page_start}{(record?.page_end ?? unit.page_end) ? `—${record?.page_end ?? unit.page_end}` : ""} 页</span></header>
      <div className="review-source"><div><small>当前关键问题</small><p>{unit.key_question}</p></div><div><small>项目原创概括</small><p>{unit.summary}</p></div><div><small>当前判断边界</small><p>{unit.boundary}</p></div></div>
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
