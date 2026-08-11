import { useMemo, useState } from "react";
import "./ResearchQuestionWorkbench.css";

type LensId = "content" | "carrier" | "formation" | "circulation" | "organization";

const lenses: Array<{ id: LensId; label: string; prompt: string }> = [
  { id: "content", label: "内容", prompt: "它记录了什么，核心概念怎样表达？" },
  { id: "carrier", label: "载体", prompt: "材料与形制保留了哪些物质线索？" },
  { id: "formation", label: "形成", prompt: "谁以何种方式写定、编纂或转述？" },
  { id: "circulation", label: "流传", prompt: "抄写、刊刻与收藏经历造成了哪些变化？" },
  { id: "organization", label: "整理", prompt: "目录、校勘和现代整理如何塑造今天的读本？" },
];

const strength = [
  { label: "直接断定", verb: "证明了", note: "需要高度排他的证据链，初步观察通常承受不起这种强度。" },
  { label: "很可能", verb: "有力支持", note: "已有多项相互独立的证据，但仍保留其他可能。" },
  { label: "可能", verb: "提示", note: "证据形成了方向，尚需进一步核验。" },
  { label: "待考", verb: "提出一个待验证线索", note: "适合证据来源或解释尚不稳定的阶段。" },
];

function saveProgress(lensCount: number, strengthIndex: number) {
  const key = "wxlab-progress";
  const current = JSON.parse(localStorage.getItem(key) || "{}");
  current["ch01-research-workbench"] = {
    completed: true,
    score: lensCount >= 3 && strengthIndex >= 1 ? 1 : 0,
    total: 1,
    title: "第一章·研究问题装配台",
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(key, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent("wxlab-progress-updated"));
}

export default function ResearchQuestionWorkbench() {
  const [selected, setSelected] = useState<LensId[]>(["content"]);
  const [strengthIndex, setStrengthIndex] = useState(2);
  const [submitted, setSubmitted] = useState(false);

  const selectedLenses = useMemo(() => lenses.filter((lens) => selected.includes(lens.id)), [selected]);
  const question = useMemo(() => {
    const labels = selectedLenses.map((lens) => lens.label).join("、");
    return `这部文献在${labels || "尚未选择的层面"}呈现出哪些线索，这些线索${strength[strengthIndex].verb}怎样的形成或流传判断？`;
  }, [selectedLenses, strengthIndex]);

  function toggle(id: LensId) {
    setSubmitted(false);
    setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  }

  function submit() {
    setSubmitted(true);
    saveProgress(selected.length, strengthIndex);
  }

  return (
    <div className="research-workbench">
      <header>
        <div><small>第一章互动实验</small><h3>研究问题装配台</h3></div>
        <p>不是猜答案，而是亲手决定“看什么”以及“结论能说多满”。</p>
      </header>

      <section className="workbench-step">
        <div className="step-heading"><span>01</span><div><h4>安装研究镜头</h4><p>至少组合三个镜头，才能看到文献的多层生命史。</p></div></div>
        <div className="lens-grid">
          {lenses.map((lens) => (
            <button key={lens.id} className={selected.includes(lens.id) ? "selected" : ""} onClick={() => toggle(lens.id)} aria-pressed={selected.includes(lens.id)}>
              <span>{selected.includes(lens.id) ? "已安装" : "安装"}</span>
              <strong>{lens.label}</strong>
              <small>{lens.prompt}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="workbench-step">
        <div className="step-heading"><span>02</span><div><h4>校准表述强度</h4><p>拖动滑杆，观察同一组证据怎样改变学术表述。</p></div></div>
        <label className="strength-control">
          <span className="sr-only">结论强度</span>
          <input type="range" min="0" max="3" step="1" value={strengthIndex} onChange={(event) => { setSubmitted(false); setStrengthIndex(Number(event.target.value)); }} />
          <span className="strength-labels">{strength.map((item, index) => <b className={index === strengthIndex ? "active" : ""} key={item.label}>{item.label}</b>)}</span>
        </label>
        <p className="strength-note"><strong>{strength[strengthIndex].label}：</strong>{strength[strengthIndex].note}</p>
      </section>

      <section className="question-output" aria-live="polite">
        <small>生成的研究问题</small>
        <blockquote>{question}</blockquote>
        <div className="coverage-meter"><span style={{ width: `${selected.length * 20}%` }}></span></div>
        <p>当前覆盖 {selected.length}/5 个研究层次。{selected.length < 3 ? "再安装镜头，避免把文献压缩成孤立文字。" : "已经形成跨层问题，可以带着它进入具体材料。"}</p>
        <button disabled={selected.length === 0} onClick={submit}>保存这条研究路径</button>
        {submitted && <div className={selected.length >= 3 && strengthIndex >= 1 ? "workbench-feedback success" : "workbench-feedback"}>
          <strong>{selected.length >= 3 && strengthIndex >= 1 ? "研究问题已成立" : "已保存，但建议继续校准"}</strong>
          <p>{selected.length < 3 ? "当前观察层次偏少。" : "研究镜头已经形成组合。"}{strengthIndex === 0 ? "“直接断定”需要排除其他解释；在只有观察框架时宜降低强度。" : "表述保留了继续核验的空间。"}</p>
        </div>}
      </section>
    </div>
  );
}
