import { useMemo, useState } from "react";

type BinId = "core" | "support" | "caution";
type Stage = "intake" | "evidence" | "argument" | "report";
type Evidence = { id: string; batch: number; source: string; title: string; detail: string; bin: BinId; reason: string };

const evidence: Evidence[] = [
  { id: "taboo", batch: 1, source: "书叶观察", title: "避讳字", detail: "“玄”字在正文多处有规律地缺末笔。", bin: "core", reason: "规律性避讳可缩小时代范围，但仍需与其他证据互证。" },
  { id: "paper", batch: 1, source: "载体观察", title: "纸色较旧", detail: "纸张泛黄、手感松软，没有可辨水印。", bin: "caution", reason: "纸色受保存环境影响，也存在旧纸后印，单独不能可靠断代。" },
  { id: "preface", batch: 2, source: "卷首材料", title: "序跋纪年", detail: "序中署“康熙三十二年”，内容与正文同版印刷。", bin: "core", reason: "纪年与正文的制作关系清楚，是本案较强的断代证据。" },
  { id: "binding", batch: 2, source: "装帧观察", title: "线装书衣", detail: "书衣整齐，蓝绢包角，疑为近代重装。", bin: "caution", reason: "装帧可能晚于书芯，不能把重装年代等同于刻印年代。" },
  { id: "engraver", batch: 3, source: "人物互证", title: "刻工活动", detail: "两名刻工还见于康熙中期的另一部刻本。", bin: "support", reason: "刻工活动年代可以旁证，但同名、复用旧版等情况仍需排除。" },
  { id: "catalog", batch: 3, source: "目录互证", title: "旧藏目录", detail: "乾隆初年藏书目录已著录同名同卷数之书。", bin: "support", reason: "著录可提供年代下限和流传线索，但未必就是眼前这一部。" },
];

const bins: { id: BinId; title: string; hint: string }[] = [
  { id: "core", title: "关键证据", hint: "直接约束版本判断" },
  { id: "support", title: "辅助互证", hint: "增强判断但不能单独定案" },
  { id: "caution", title: "保留事项", hint: "容易误导，必须说明局限" },
];

const hypotheses = [
  { title: "康熙三十二年原装初印", note: "纪年、刻印和装帧属于同一时间。" },
  { title: "康熙中期刻本，装帧可能较晚", note: "书芯年代与外观年代需要分别判断。" },
  { title: "现有材料完全无法判断", note: "任何线索有局限，就暂不提出假说。" },
];

const verdicts = [
  { tone: "过度断言", text: "这是康熙三十二年的原装初印本，已经完全确定。" },
  { tone: "证据相称", text: "综合避讳、序跋和刻工线索，暂定为康熙中期刻本；书衣可能后配，仍应核对牌记、版式与同版书影。" },
  { tone: "过度保守", text: "所有线索都有局限，因此目前不能作出任何版本判断。" },
];

function save(score: number, total: number) {
  const key = "wxlab-progress";
  const current = JSON.parse(localStorage.getItem(key) || "{}");
  current["version-detective"] = { completed: true, score, total, updatedAt: new Date().toISOString() };
  localStorage.setItem(key, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent("wxlab-progress-updated"));
}

export default function VersionDetective() {
  const [stage, setStage] = useState<Stage>("intake");
  const [hypothesis, setHypothesis] = useState<number | null>(null);
  const [initialConfidence, setInitialConfidence] = useState(50);
  const [revealedBatch, setRevealedBatch] = useState(1);
  const [placed, setPlaced] = useState<Record<string, BinId>>({});
  const [active, setActive] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [reason, setReason] = useState("");
  const [verdict, setVerdict] = useState<number | null>(null);
  const [finalConfidence, setFinalConfidence] = useState(60);
  const [revisions, setRevisions] = useState(0);
  const [finalized, setFinalized] = useState(false);

  const visibleEvidence = evidence.filter((item) => item.batch <= revealedBatch);
  const correctEvidence = useMemo(() => evidence.filter((item) => placed[item.id] === item.bin).length, [placed]);
  const score = correctEvidence + (verdict === 1 ? 1 : 0);
  const confidenceDelta = finalConfidence - initialConfidence;

  function move(id: string, bin?: BinId) {
    if (checked) return;
    setPlaced((current) => {
      const next = { ...current };
      if (bin) next[id] = bin; else delete next[id];
      return next;
    });
    setActive(null);
  }

  function drop(event: React.DragEvent, bin?: BinId) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    if (id) move(id, bin);
  }

  function reviseEvidence() {
    setChecked(false); setStage("evidence"); setFinalized(false); setRevisions((value) => value + 1);
  }

  function finalize() {
    if (verdict === null || reason.trim().length < 20) return;
    save(score, evidence.length + 1);
    setFinalized(true); setStage("report");
  }

  function reportText() {
    const placements = bins.map((bin) => `### ${bin.title}\n${evidence.filter((item) => placed[item.id] === bin.id).map((item) => `- ${item.title}：${item.detail}`).join("\n") || "- 无"}`).join("\n\n");
    return [
      "# 文献学实验室 · 版本侦探研判单", "", "> 教学虚构案，不是真实古籍鉴定报告。", "",
      "## 初始假说", hypotheses[hypothesis ?? 0].title, `初始信心：${initialConfidence}%`, "",
      "## 证据分级", placements, "", "## 判断理由", reason.trim(), "",
      "## 最终结论", verdicts[verdict ?? 0].text, `最终信心：${finalConfidence}%（较初始 ${confidenceDelta >= 0 ? "+" : ""}${confidenceDelta}）`, "",
      "## 决策轨迹", `分批查看 3 组证据；证据分级 ${correctEvidence}/6；主动撤回修订 ${revisions} 次。`, "",
      "## 尚待核对", "牌记、版式、同版书影与更可靠的纸张信息。",
    ].join("\n");
  }

  function downloadReport() {
    const url = URL.createObjectURL(new Blob([reportText()], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "版本侦探-研判单.md"; link.click(); URL.revokeObjectURL(url);
  }

  function reset() {
    setStage("intake"); setHypothesis(null); setInitialConfidence(50); setRevealedBatch(1); setPlaced({}); setActive(null); setChecked(false); setReason(""); setVerdict(null); setFinalConfidence(60); setRevisions(0); setFinalized(false);
  }

  const card = (item: Evidence) => (
    <button key={item.id} type="button" draggable={!checked} className={`evidence-card ${active === item.id ? "active" : ""} ${checked ? (placed[item.id] === item.bin ? "correct" : "incorrect") : ""}`} onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)} onClick={() => !checked && setActive(active === item.id ? null : item.id)}>
      <small>{item.source}</small><strong>{item.title}</strong><span>{item.detail}</span>{checked && <em>{item.reason}</em>}
    </button>
  );

  return (
    <section className="detective evidence-desk">
      <header className="case-top"><div><p className="mini-label">CASE 001 · 单案推理轨迹</p><h2>无名刻本鉴定案</h2><small>教学虚构材料 · 预计 8 分钟</small></div><span className="case-number">{stage === "intake" ? "01" : stage === "evidence" ? "02" : stage === "argument" ? "03" : "04"}/04</span></header>
      <ol className="detective-trail" aria-label="研判阶段"><li className={stage === "intake" ? "active" : "done"}>先立假说</li><li className={stage === "evidence" ? "active" : ["argument", "report"].includes(stage) ? "done" : ""}>分批看证</li><li className={stage === "argument" ? "active" : stage === "report" ? "done" : ""}>写出理由</li><li className={stage === "report" ? "active" : ""}>形成报告</li></ol>

      {stage === "intake" && <div className="detective-intake">
        <p className="desk-instruction">案情：一部无明确牌记的线装书被题签标作“康熙本”。在查看详细线索前，先留下你的初始假说；后面允许改变。</p>
        <h3>你现在最愿意提出哪一个工作假说？</h3>
        <div className="hypothesis-options">{hypotheses.map((item, index) => <button key={item.title} className={hypothesis === index ? "selected" : ""} onClick={() => setHypothesis(index)}><span>{index + 1}</span><b>{item.title}</b><small>{item.note}</small></button>)}</div>
        <label className="confidence-control"><span><b>初始信心</b><small>不是成绩，只记录证据出现前你有多确定。</small></span><output>{initialConfidence}%</output><input type="range" min="20" max="90" step="5" value={initialConfidence} onChange={(event) => setInitialConfidence(Number(event.target.value))} /></label>
        <button className="game-button desk-submit" disabled={hypothesis === null} onClick={() => hypothesis !== null && setStage("evidence")}>封存初始判断，开始查证 →</button>
      </div>}

      {stage === "evidence" && <div className="detective-evidence-stage">
        <div className="hypothesis-strip"><span>封存的初始假说</span><strong>{hypothesis === null ? "—" : hypotheses[hypothesis].title}</strong><b>{initialConfidence}%</b></div>
        <p className="desk-instruction">线索分三批出现。拖动卡片进入证据盘；也可以先点卡片，再点目标盘。每多一批证据，都可以改变原来的分级。</p>
        <div className="evidence-reveal"><span>已拆封 {revealedBatch}/3 组</span><div>{[1, 2, 3].map((batch) => <i key={batch} className={batch <= revealedBatch ? "open" : ""} />)}</div>{revealedBatch < 3 && <button onClick={() => setRevealedBatch((value) => value + 1)}>拆封第 {revealedBatch + 1} 组线索</button>}</div>
        <div className="evidence-pool" onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event)} onClick={() => active && move(active)}><small>待研判线索 · 当前可见 {visibleEvidence.length} 张</small><div>{visibleEvidence.filter((item) => !placed[item.id]).map(card)}</div></div>
        <div className="evidence-bins">{bins.map((bin) => <section key={bin.id} className={active ? "accepting" : ""} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, bin.id)} onClick={() => active && move(active, bin.id)}><header><strong>{bin.title}</strong><small>{bin.hint}</small></header><div>{visibleEvidence.filter((item) => placed[item.id] === bin.id).map(card)}</div></section>)}</div>
        {!checked ? <button className="game-button desk-submit" disabled={revealedBatch !== 3 || Object.keys(placed).length !== evidence.length} onClick={() => setChecked(true)}>核验我的证据盘</button> : <div className="classification-review" aria-live="polite"><div className={`evidence-score ${correctEvidence === evidence.length ? "success" : ""}`}><strong>证据角色判断 {correctEvidence}/{evidence.length}</strong><span>卡片说明的是“为什么有这种强度”，不是只报对错。</span></div><div><button onClick={reviseEvidence}>返回修改分级</button><button className="primary" onClick={() => setStage("argument")}>带着证据写结论 →</button></div></div>}
      </div>}

      {stage === "argument" && <div className="verdict-builder">
        <div className="argument-ledger"><div><span>初始假说</span><strong>{hypotheses[hypothesis ?? 0].title}</strong></div><div><span>分级结果</span><strong>{correctEvidence}/6</strong></div><div><span>已修订</span><strong>{revisions} 次</strong></div></div>
        <h3>先写理由，再选择结论</h3>
        <label className="reason-field"><span>用自己的话说明：哪几条证据最关键？哪一处仍不能确定？</span><textarea value={reason} maxLength={360} onChange={(event) => setReason(event.target.value)} placeholder="例如：序跋纪年与正文同版，加上规律性避讳，足以暂定刻印时期；但书衣疑为重装，所以不能把装帧和书芯判为同一年代……" /><small className={reason.trim().length >= 20 ? "ready" : ""}>{reason.trim().length}/360 · 至少 20 个字</small></label>
        <h3>哪一种表述与现有证据强度相称？</h3>
        <div className="verdict-options">{verdicts.map((item, index) => <button key={item.text} className={verdict === index ? (index === 1 ? "correct" : "incorrect") : ""} onClick={() => setVerdict(index)}><span>{index + 1}</span><div><small>{item.tone}</small>{item.text}</div></button>)}</div>
        {verdict !== null && <div className={`feedback ${verdict === 1 ? "success" : ""}`}><strong>{verdicts[verdict].tone}</strong><p>{verdict === 1 ? "这段话同时交代了依据、结论强度和待核事项。" : verdict === 0 ? "明确纪年不等于原装初印；这句话把推测写成了定论。" : "证据有局限不等于拒绝判断；有限度结论比沉默更可检验。"}</p></div>}
        <label className="confidence-control"><span><b>看完证据后的信心</b><small>允许上升，也允许下降。</small></span><output>{finalConfidence}%</output><input type="range" min="20" max="95" step="5" value={finalConfidence} onChange={(event) => setFinalConfidence(Number(event.target.value))} /></label>
        <div className="argument-actions"><button onClick={reviseEvidence}>← 返回证据并修订</button><button className="primary" disabled={reason.trim().length < 20 || verdict === null} onClick={finalize}>封存本次研判 →</button></div>
      </div>}

      {stage === "report" && finalized && <div className="detective-report" aria-live="polite">
        <p className="mini-label">DECISION TRACE · 本次研判已封存</p><h3>你的结论不是从答案里选出来的，而是从一条可回看的轨迹里长出来的。</h3>
        <div className="confidence-shift"><span><small>初始信心</small><b>{initialConfidence}%</b></span><i>→</i><span><small>最终信心</small><b>{finalConfidence}%</b></span><em className={confidenceDelta >= 0 ? "up" : "down"}>{confidenceDelta >= 0 ? "+" : ""}{confidenceDelta}</em></div>
        <div className="report-diagnosis"><strong>{score}/{evidence.length + 1} 项判断与参考相称</strong><p>{verdict === 1 && correctEvidence === evidence.length ? "你区分了证据角色，也控制了结论强度。下一步不是追求更肯定，而是去找能消除保留事项的新材料。" : "报告保留了你的真实判断。可以导出后对照卡片说明，看看分歧来自证据角色还是结论措辞。"}</p>{finalConfidence >= 80 && score < evidence.length + 1 && <p className="calibration-warning">高信心偏差提醒：当前确定程度高于判断吻合度，值得回到证据盘再检查一次。</p>}</div>
        <dl className="decision-trace"><div><dt>01 初判</dt><dd>{hypotheses[hypothesis ?? 0].title}（{initialConfidence}%）</dd></div><div><dt>02 查证</dt><dd>查看 3 组 6 条线索，证据角色判断 {correctEvidence}/6。</dd></div><div><dt>03 修订</dt><dd>主动返回证据 {revisions} 次。</dd></div><div><dt>04 结论</dt><dd>{verdicts[verdict ?? 0].tone}（{finalConfidence}%）</dd></div></dl>
        <div className="report-actions"><button onClick={downloadReport}>导出研判单 .md</button><button onClick={reviseEvidence}>撤回并修改</button><button onClick={reset}>开始新一轮</button></div>
      </div>}
    </section>
  );
}
