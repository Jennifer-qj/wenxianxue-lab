import { useEffect, useMemo, useState } from "react";

type BinId = "core" | "support" | "caution";
type Evidence = { id: string; title: string; detail: string; bin: BinId; reason: string };

const evidence: Evidence[] = [
  { id: "taboo", title: "避讳字", detail: "“玄”字在多处有规律地缺末笔。", bin: "core", reason: "规律性避讳可缩小时代范围，但仍需与其他证据互证。" },
  { id: "preface", title: "序跋纪年", detail: "序中署“康熙三十二年”，内容与正文同版印刷。", bin: "core", reason: "纪年与正文的制作关系清楚，是本案较强的断代证据。" },
  { id: "engraver", title: "刻工活动", detail: "两名刻工还见于康熙中期的另一部刻本。", bin: "support", reason: "刻工活动年代可以旁证，但同名、复用旧版等情况仍需排除。" },
  { id: "catalog", title: "旧藏目录", detail: "乾隆初年藏书目录已著录同名同卷数之书。", bin: "support", reason: "著录可提供年代下限和流传线索，但未必就是眼前这一部。" },
  { id: "paper", title: "纸色较旧", detail: "纸张泛黄，手感松软，没有水印信息。", bin: "caution", reason: "纸色受保存环境影响，也存在旧纸后印，单独不能可靠断代。" },
  { id: "binding", title: "线装书衣", detail: "书衣整齐，蓝绢包角，疑为近代重装。", bin: "caution", reason: "装帧可能晚于书芯，不能把重装年代等同于刻印年代。" },
];

const bins: { id: BinId; title: string; hint: string }[] = [
  { id: "core", title: "关键证据", hint: "能直接约束版本判断" },
  { id: "support", title: "辅助互证", hint: "增强判断但不能单独定案" },
  { id: "caution", title: "保留事项", hint: "容易误导，必须说明局限" },
];

const verdicts = [
  "这是康熙三十二年的原装初印本，已经完全确定。",
  "综合避讳、序跋和刻工线索，暂定为康熙中期刻本；书衣可能后配，仍应核对牌记、版式与同版书影。",
  "所有线索都有局限，因此目前不能作出任何版本判断。",
];

function save(score: number, total: number) {
  const key = "wxlab-progress";
  const current = JSON.parse(localStorage.getItem(key) || "{}");
  current["version-detective"] = { completed: true, score, total, updatedAt: new Date().toISOString() };
  localStorage.setItem(key, JSON.stringify(current));
  window.dispatchEvent(new CustomEvent("wxlab-progress-updated"));
}

export default function VersionDetective() {
  const [placed, setPlaced] = useState<Record<string, BinId>>({});
  const [active, setActive] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [verdict, setVerdict] = useState<number | null>(null);
  const correctEvidence = useMemo(() => evidence.filter((item) => placed[item.id] === item.bin).length, [placed]);
  const done = checked && verdict !== null;
  const score = correctEvidence + (verdict === 1 ? 1 : 0);

  useEffect(() => {
    if (done) save(score, evidence.length + 1);
  }, [done, score]);

  function move(id: string, bin?: BinId) {
    if (checked) return;
    setPlaced((current) => {
      const next = { ...current };
      if (bin) next[id] = bin;
      else delete next[id];
      return next;
    });
    setActive(null);
  }

  function drop(event: React.DragEvent, bin?: BinId) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    if (id) move(id, bin);
  }

  function reset() {
    setPlaced({}); setActive(null); setChecked(false); setVerdict(null);
  }

  const card = (item: Evidence) => (
    <button
      key={item.id}
      type="button"
      draggable={!checked}
      className={`evidence-card ${active === item.id ? "active" : ""} ${checked ? (placed[item.id] === item.bin ? "correct" : "incorrect") : ""}`}
      onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
      onClick={() => !checked && setActive(active === item.id ? null : item.id)}
    >
      <strong>{item.title}</strong><span>{item.detail}</span>
      {checked && <small>{item.reason}</small>}
    </button>
  );

  return (
    <section className="detective evidence-desk">
      <div className="case-top"><div><p className="mini-label">CASE 001 · 证据分级</p><h2>无名刻本鉴定案</h2></div><span className="case-number">{Object.keys(placed).length}/{evidence.length}</span></div>
      <p className="desk-instruction">拖动证据卡进入三个证据盘。也可以先点卡片，再点目标证据盘。</p>
      <div className="evidence-pool" onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event)} onClick={() => active && move(active)}>
        <small>待研判线索</small>
        <div>{evidence.filter((item) => !placed[item.id]).map(card)}</div>
      </div>
      <div className="evidence-bins">
        {bins.map((bin) => (
          <section key={bin.id} className={active ? "accepting" : ""} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, bin.id)} onClick={() => active && move(active, bin.id)}>
            <header><strong>{bin.title}</strong><small>{bin.hint}</small></header>
            <div>{evidence.filter((item) => placed[item.id] === bin.id).map(card)}</div>
          </section>
        ))}
      </div>
      {!checked && <button className="game-button desk-submit" disabled={Object.keys(placed).length !== evidence.length} onClick={() => setChecked(true)}>核验我的证据盘</button>}
      {checked && (
        <div className="verdict-builder" aria-live="polite">
          <div className={`evidence-score ${correctEvidence === evidence.length ? "success" : ""}`}><strong>证据分级 {correctEvidence}/{evidence.length}</strong><span>绿色为判断合理；红色卡片请结合说明重新理解。</span></div>
          <h3>最后一步：选择与证据强度相称的鉴定结论</h3>
          <div className="verdict-options">{verdicts.map((item, index) => <button key={item} className={verdict === index ? (index === 1 ? "correct" : "incorrect") : ""} disabled={verdict !== null} onClick={() => setVerdict(index)}><span>{index + 1}</span>{item}</button>)}</div>
          {verdict !== null && <div className={`feedback ${verdict === 1 ? "success" : ""}`}><strong>{verdict === 1 ? "结论强度恰当" : "结论与证据强度不匹配"}</strong><p>版本判断既不能把线索写成绝对事实，也不能因为存在局限就拒绝判断。应同时写明依据、结论强度与待核事项。</p><button className="game-button" onClick={reset}>重新布置证据盘</button></div>}
        </div>
      )}
    </section>
  );
}
