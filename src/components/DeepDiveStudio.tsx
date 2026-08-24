import { useEffect, useMemo, useState } from "react";
import "./DeepDiveStudio.css";

type Evidence = { id: string; label: string; role: string; limitation: string };
type Conclusion = { id: string; label: string; claim: string; requires: string[]; caution: string };
type DeepDive = {
  id: string; chapter?: number; title: string; scenario: string; question: string; evidence: Evidence[];
  workflow: string[]; deliverable: string; rubric: string[]; conclusions: Conclusion[];
  followups: Array<{ trigger: "insufficient" | "conflict" | "supported"; prompt: string }>;
};

export default function DeepDiveStudio({ study }: { study: DeepDive }) {
  const storageKey = `wenxianxue-deepdive-${study.id}`;
  const [selected, setSelected] = useState<string[]>([]);
  const [steps, setSteps] = useState<number[]>([]);
  const [note, setNote] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [gap, setGap] = useState("");
  const [view, setView] = useState<"evidence" | "workflow" | "deliverable">("evidence");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (saved) { setSelected(saved.selected ?? []); setSteps(saved.steps ?? []); setNote(saved.note ?? ""); setConclusion(saved.conclusion ?? ""); setGap(saved.gap ?? ""); }
    } catch { /* 浏览器禁用存储时仍可正常使用 */ }
  }, [storageKey]);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify({ version: 2, selected, steps, note, conclusion, gap })); } catch { /* ignore */ }
  }, [selected, steps, note, conclusion, gap, storageKey]);

  const evidenceReady = selected.length >= Math.min(2, study.evidence.length);
  const total = study.workflow.length + 3;
  const completed = steps.length + Number(evidenceReady) + Number(Boolean(conclusion)) + Number(Boolean(gap));
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
  const chosenConclusion = study.conclusions.find((item) => item.id === conclusion);
  const chosenGap = study.evidence.find((item) => item.id === gap);
  const missingEvidence = chosenConclusion?.requires.filter((id) => !selected.includes(id)) ?? [];
  const feedbackTrigger = !chosenConclusion || !evidenceReady ? "insufficient" : missingEvidence.length ? "conflict" : "supported";
  const followup = study.followups.find((item) => item.trigger === feedbackTrigger)?.prompt;
  function exportNote() {
    const chapter = study.chapter ?? Number(study.id.slice(7, 9));
    const markdown = `# 第${chapter}章·${study.title}\n\n## 研究情境\n${study.scenario}\n\n## 核心问题\n${study.question}\n\n## 我选择的证据\n${chosenEvidence.map((item) => `- **${item.label}**：${item.role}（边界：${item.limitation}）`).join("\n") || "- 尚未选择证据"}\n\n## 竞争性结论\n${chosenConclusion ? `**${chosenConclusion.label}**：${chosenConclusion.claim}\n\n结论限度：${chosenConclusion.caution}` : "（尚未选择）"}\n\n## 关键证据缺口\n${chosenGap ? `**${chosenGap.label}**：${chosenGap.limitation}` : "（尚未选择）"}\n\n## 分析流程\n${study.workflow.map((item, index) => `- [${steps.includes(index) ? "x" : " "}] ${item}`).join("\n")}\n\n## 我的学习札记\n${note || "（尚未填写）"}\n\n## 交付标准\n${study.rubric.map((item) => `- ${item}`).join("\n")}\n`;
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
      <button className={view === "evidence" ? "active" : ""} onClick={() => setView("evidence")}>1. 选择证据 <b>{selected.length} 条</b></button>
      <button className={view === "workflow" ? "active" : ""} onClick={() => setView("workflow")}>2. 推进分析 <b>{steps.length}/{study.workflow.length}</b></button>
      <button className={view === "deliverable" ? "active" : ""} onClick={() => setView("deliverable")}>3. 形成成果</button>
    </nav>

    {view === "evidence" && <section className="deep-evidence">
      <p>选择真正需要纳入论证的材料（至少两条），不是把所有卡片全部点亮。每张卡片同时说明证据能力和使用边界。</p>
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
      <div className="deep-output"><small>本章小成果</small><h4>{study.deliverable}</h4><p>已选 {chosenEvidence.length} 条证据。先比较竞争解释，再声明最关键的证据缺口。</p><fieldset className="conclusion-paths"><legend>选择一条暂定结论路径</legend>{study.conclusions.map((item) => <button className={conclusion === item.id ? "selected" : ""} aria-pressed={conclusion === item.id} onClick={() => setConclusion(item.id)} key={item.id}><strong>{item.label}</strong><span>{item.claim}</span><small>限度：{item.caution}</small></button>)}</fieldset><label className="gap-picker"><span>哪一项局限最可能改变结论？</span><select value={gap} onChange={(event) => setGap(event.target.value)}><option value="">请选择关键缺口</option>{study.evidence.map((item) => <option value={item.id} key={item.id}>{item.label}：{item.limitation}</option>)}</select></label>{chosenConclusion && <aside className={`adaptive-feedback ${feedbackTrigger}`}><strong>{feedbackTrigger === "supported" ? "这条路径得到当前证据支持" : feedbackTrigger === "conflict" ? "结论与证据之间仍有缺口" : "还不能形成结论"}</strong>{missingEvidence.length > 0 && <p>这条路径还依赖：{missingEvidence.map((id) => study.evidence.find((item) => item.id === id)?.label ?? id).join("、")}</p>}<p>{followup}</p></aside>}<label className="deep-note"><span>我的学习札记</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="写下你的判断、反证、疑问或还需要回到原书核对的地方……" /></label></div>
      <ul>{study.rubric.map((item) => <li key={item}>{item}</li>)}</ul>
      <div className="deep-deliverable__actions"><button disabled={completed !== total} onClick={exportNote}>导出本章 Markdown</button><button onClick={() => { setSelected([]); setSteps([]); setNote(""); setConclusion(""); setGap(""); setView("evidence"); try { const key = "wxlab-progress"; const archive = JSON.parse(localStorage.getItem(key) || "{}"); delete archive[study.id]; localStorage.setItem(key, JSON.stringify(archive)); window.dispatchEvent(new CustomEvent("wxlab-progress-updated")); } catch { /* ignore */ } }}>重置研读记录</button></div>
    </section>}
  </div>;
}
