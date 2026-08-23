import { useEffect, useMemo, useState } from "react";
import "./DeepDiveStudio.css";

type Evidence = { id: string; label: string; role: string; limitation: string };
type DeepDive = {
  id: string; chapter?: number; title: string; scenario: string; question: string; evidence: Evidence[];
  workflow: string[]; deliverable: string; rubric: string[];
};

export default function DeepDiveStudio({ study }: { study: DeepDive }) {
  const storageKey = `wenxianxue-deepdive-${study.id}`;
  const [selected, setSelected] = useState<string[]>([]);
  const [steps, setSteps] = useState<number[]>([]);
  const [note, setNote] = useState("");
  const [view, setView] = useState<"evidence" | "workflow" | "deliverable">("evidence");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (saved) { setSelected(saved.selected ?? []); setSteps(saved.steps ?? []); setNote(saved.note ?? ""); }
    } catch { /* 浏览器禁用存储时仍可正常使用 */ }
  }, [storageKey]);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify({ selected, steps, note })); } catch { /* ignore */ }
  }, [selected, steps, note, storageKey]);

  const total = study.evidence.length + study.workflow.length;
  const completed = selected.length + steps.length;
  const progress = Math.round((completed / total) * 100);

  useEffect(() => {
    if (completed !== total) return;
    try {
      const key = "wxlab-progress";
      const archive = JSON.parse(localStorage.getItem(key) || "{}");
      archive[study.id] = { completed: true, score: total, total, title: `第${study.chapter ?? Number(study.id.slice(7, 9))}章·${study.title}`, updatedAt: new Date().toISOString() };
      localStorage.setItem(key, JSON.stringify(archive));
      window.dispatchEvent(new CustomEvent("wxlab-progress-updated"));
    } catch { /* ignore */ }
  }, [completed, study.chapter, study.id, study.title, total]);
  const toggleEvidence = (id: string) => setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  const toggleStep = (index: number) => setSteps((items) => items.includes(index) ? items.filter((item) => item !== index) : [...items, index]);
  const chosenEvidence = useMemo(() => study.evidence.filter((item) => selected.includes(item.id)), [selected, study.evidence]);
  function exportNote() {
    const chapter = study.chapter ?? Number(study.id.slice(7, 9));
    const markdown = `# 第${chapter}章·${study.title}\n\n## 研究情境\n${study.scenario}\n\n## 核心问题\n${study.question}\n\n## 我选择的证据\n${chosenEvidence.map((item) => `- **${item.label}**：${item.role}（边界：${item.limitation}）`).join("\n") || "- 尚未选择证据"}\n\n## 分析流程\n${study.workflow.map((item, index) => `- [${steps.includes(index) ? "x" : " "}] ${item}`).join("\n")}\n\n## 我的学习札记\n${note || "（尚未填写）"}\n\n## 交付标准\n${study.rubric.map((item) => `- ${item}`).join("\n")}\n`;
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `wenxianxue-ch${String(chapter).padStart(2, "0")}-study.md`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <div className="deep-studio">
    <header className="deep-studio__header">
      <div><small>CASE STUDY</small><h3>{study.title}</h3></div>
      <div className="deep-studio__progress"><strong>{progress}%</strong><span><i style={{ width: `${progress}%` }} /></span></div>
    </header>
    <div className="deep-studio__brief"><p>{study.scenario}</p><blockquote>{study.question}</blockquote></div>
    <nav aria-label="案例步骤">
      <button className={view === "evidence" ? "active" : ""} onClick={() => setView("evidence")}>1. 选择证据 <b>{selected.length}/{study.evidence.length}</b></button>
      <button className={view === "workflow" ? "active" : ""} onClick={() => setView("workflow")}>2. 推进分析 <b>{steps.length}/{study.workflow.length}</b></button>
      <button className={view === "deliverable" ? "active" : ""} onClick={() => setView("deliverable")}>3. 形成成果</button>
    </nav>

    {view === "evidence" && <section className="deep-evidence">
      <p>选择你要纳入论证的材料。每张卡片同时说明证据能力和使用边界。</p>
      <div>{study.evidence.map((item) => {
        const checked = selected.includes(item.id);
        return <button key={item.id} className={checked ? "selected" : ""} onClick={() => toggleEvidence(item.id)} aria-pressed={checked}>
          <span>{checked ? "✓" : "+"}</span><strong>{item.label}</strong>
          <dl><div><dt>能说明</dt><dd>{item.role}</dd></div><div><dt>不能直接说明</dt><dd>{item.limitation}</dd></div></dl>
        </button>;
      })}</div>
    </section>}

    {view === "workflow" && <section className="deep-workflow">
      <p>按研究顺序推进，也可以反复返回证据区调整材料。</p>
      <ol>{study.workflow.map((item, index) => <li key={item} className={steps.includes(index) ? "done" : ""}>
        <button onClick={() => toggleStep(index)}><span>{steps.includes(index) ? "✓" : index + 1}</span><strong>{item}</strong></button>
      </li>)}</ol>
    </section>}

    {view === "deliverable" && <section className="deep-deliverable">
      <div><small>本章小成果</small><h4>{study.deliverable}</h4><p>已选 {chosenEvidence.length} 条证据；写作时至少明确一次“现有材料不能证明什么”。</p><label className="deep-note"><span>我的学习札记</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="写下你的判断、疑问或还需要回到原书核对的地方……" /></label></div>
      <ul>{study.rubric.map((item) => <li key={item}>{item}</li>)}</ul>
      <div className="deep-deliverable__actions"><button onClick={exportNote}>导出本章 Markdown</button><button onClick={() => { setSelected([]); setSteps([]); setNote(""); setView("evidence"); try { const key = "wxlab-progress"; const archive = JSON.parse(localStorage.getItem(key) || "{}"); delete archive[study.id]; localStorage.setItem(key, JSON.stringify(archive)); window.dispatchEvent(new CustomEvent("wxlab-progress-updated")); } catch { /* ignore */ } }}>重置研读记录</button></div>
    </section>}
  </div>;
}
