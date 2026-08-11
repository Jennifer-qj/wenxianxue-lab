import { useEffect, useMemo, useState } from "react";
import "./DeepDiveStudio.css";

type Evidence = { id: string; label: string; role: string; limitation: string };
type DeepDive = {
  id: string; title: string; scenario: string; question: string; evidence: Evidence[];
  workflow: string[]; deliverable: string; rubric: string[];
};

export default function DeepDiveStudio({ study }: { study: DeepDive }) {
  const storageKey = `wenxianxue-deepdive-${study.id}`;
  const [selected, setSelected] = useState<string[]>([]);
  const [steps, setSteps] = useState<number[]>([]);
  const [view, setView] = useState<"evidence" | "workflow" | "deliverable">("evidence");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (saved) { setSelected(saved.selected ?? []); setSteps(saved.steps ?? []); }
    } catch { /* 浏览器禁用存储时仍可正常使用 */ }
  }, [storageKey]);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify({ selected, steps })); } catch { /* ignore */ }
  }, [selected, steps, storageKey]);

  const total = study.evidence.length + study.workflow.length;
  const completed = selected.length + steps.length;
  const progress = Math.round((completed / total) * 100);
  const toggleEvidence = (id: string) => setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  const toggleStep = (index: number) => setSteps((items) => items.includes(index) ? items.filter((item) => item !== index) : [...items, index]);
  const chosenEvidence = useMemo(() => study.evidence.filter((item) => selected.includes(item.id)), [selected, study.evidence]);

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
      <div><small>本章小成果</small><h4>{study.deliverable}</h4><p>已选 {chosenEvidence.length} 条证据；写作时至少明确一次“现有材料不能证明什么”。</p></div>
      <ul>{study.rubric.map((item) => <li key={item}>{item}</li>)}</ul>
      <button onClick={() => { setSelected([]); setSteps([]); setView("evidence"); }}>重置研读记录</button>
    </section>}
  </div>;
}
