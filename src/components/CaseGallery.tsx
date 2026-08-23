import { useMemo, useState } from "react";
import "./CaseGallery.css";

type LabCase = { id: string; title: string; engine: string; chapter: number; concept_ids: string[]; config: Record<string, any> };
const engineNames: Record<string, string> = { reasoning: "证据推理", classify: "分类工作台", sequence: "流程重排", simulate: "参数模拟", annotate: "文本标注", assemble: "材料组装" };

function saveCase(lab: LabCase, score: number, total: number) {
  try {
    const key = "wxlab-progress"; const progress = JSON.parse(localStorage.getItem(key) || "{}");
    progress[`case-${lab.id}`] = { completed: true, score, total, title: `第${lab.chapter}章·${lab.title}`, updatedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(progress)); window.dispatchEvent(new CustomEvent("wxlab-progress-updated"));
  } catch { /* 本地存储不可用时不阻塞实验 */ }
}

function labelOf(item: any) { return typeof item === "string" ? item : item.label ?? item.task ?? item.id; }
function idOf(item: any) { return typeof item === "string" ? item : item.id ?? item.label ?? item.task; }

function ReasoningLab({ lab }: { lab: LabCase }) {
  const stages = (lab.config.stages ?? []).map((stage: any) => ({ id: idOf(stage), label: labelOf(stage) }));
  const [done, setDone] = useState<string[]>([]); const complete = done.length === stages.length;
  return <div className="case-runner reasoning-runner"><p>逐步完成调查流程。每一步都代表证据链中不可省略的检查。</p><ol>{stages.map((stage: any, index: number) => <li className={done.includes(stage.id) ? "done" : ""} key={stage.id}><button onClick={() => setDone((items) => items.includes(stage.id) ? items.filter((id) => id !== stage.id) : [...items, stage.id])}><span>{done.includes(stage.id) ? "✓" : index + 1}</span><strong>{stage.label}</strong></button></li>)}</ol><button className="case-submit" disabled={!complete} onClick={() => saveCase(lab, stages.length, stages.length)}>形成有限度结论并归档</button>{complete && <p className="case-success">流程已完整。提交后会记入本地学习档案。</p>}</div>;
}

const inferredZones: Record<string, string> = { 甲骨: "中国早期载体", 青铜器: "中国早期载体", 石刻: "中国早期载体", 简牍: "中国早期载体", 帛: "中国早期载体", 莎草纸: "域外早期载体", 羊皮纸: "域外早期载体", 贝叶: "域外早期载体", 纸: "纸质载体" };
function ClassifyLab({ lab }: { lab: LabCase }) {
  const zones = (lab.config.zones ?? []).map(labelOf); const cards = (lab.config.items ?? []).map((item: any) => ({ id: idOf(item), label: labelOf(item), answer: item.zone ?? inferredZones[labelOf(item)] }));
  const [placed, setPlaced] = useState<Record<string, string>>({}); const [checked, setChecked] = useState(false);
  const score = cards.filter((card: any) => !card.answer || placed[card.id] === card.answer).length;
  return <div className="case-runner classify-runner"><p>为每张卡片选择目标区域，完成后统一核验。</p><div className="case-classify-grid">{cards.map((card: any) => <label className={checked ? (!card.answer || placed[card.id] === card.answer ? "correct" : "incorrect") : ""} key={card.id}><strong>{card.label}</strong><select disabled={checked} value={placed[card.id] ?? ""} onChange={(event) => setPlaced((current) => ({ ...current, [card.id]: event.target.value }))}><option value="">选择区域</option>{zones.map((zone: string) => <option key={zone}>{zone}</option>)}</select>{checked && card.answer && <small>应归入：{card.answer}</small>}</label>)}</div>{!checked ? <button className="case-submit" disabled={Object.keys(placed).length !== cards.length} onClick={() => { setChecked(true); saveCase(lab, score, cards.length); }}>统一核验</button> : <div className="case-result"><strong>{score}/{cards.length}</strong><span>项分类合理</span><button onClick={() => { setPlaced({}); setChecked(false); }}>重新分类</button></div>}</div>;
}

function OrderLab({ lab, assemble = false }: { lab: LabCase; assemble?: boolean }) {
  const raw = assemble ? lab.config.pieces ?? [] : lab.config.items ?? [];
  const items = raw.map((item: any) => ({ id: idOf(item), label: labelOf(item), detail: item.clue ?? "" }));
  const solution: string[] = lab.config.correct_order ?? lab.config.solution ?? items.map((item: any) => item.id);
  const correct = [...solution, ...items.map((item: any) => item.id).filter((id: string) => !solution.includes(id))];
  const initial = [...items.map((item: any) => item.id)].reverse(); const [order, setOrder] = useState(initial); const [checked, setChecked] = useState(false);
  const byId = new Map(items.map((item: any) => [item.id, item])); const score = order.filter((id, index) => id === correct[index]).length;
  function move(index: number, offset: number) { const target = index + offset; if (checked || target < 0 || target >= order.length) return; setOrder((current) => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; }); }
  return <div className="case-runner order-runner"><p>{assemble ? "依据文字、形制和来源线索重组材料；不可靠或不纳入的材料应放在最后。" : "把步骤调整为合理的研究顺序。"}</p><ol>{order.map((id, index) => { const item: any = byId.get(id); return <li className={checked ? (id === correct[index] ? "correct" : "incorrect") : ""} key={id}><b>{index + 1}</b><div><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}{checked && id !== correct[index] && <em>此处应为：{(byId.get(correct[index]) as any)?.label}</em>}</div><nav><button disabled={checked || index === 0} onClick={() => move(index, -1)}>↑</button><button disabled={checked || index === order.length - 1} onClick={() => move(index, 1)}>↓</button></nav></li>; })}</ol>{!checked ? <button className="case-submit" onClick={() => { setChecked(true); saveCase(lab, score, items.length); }}>核验方案</button> : <div className="case-result"><strong>{score}/{items.length}</strong><span>个位置正确</span><button onClick={() => { setOrder(initial); setChecked(false); }}>重新组装</button></div>}</div>;
}

function AnnotateLab({ lab }: { lab: LabCase }) {
  const hotspots = lab.config.hotspots ?? []; const [marked, setMarked] = useState<string[]>([]); const complete = marked.length === hotspots.length;
  return <div className="case-runner annotate-runner"><blockquote>{lab.config.passage}</blockquote><p>点击下列文字位置，展开它在校读中的证据作用。</p><div>{hotspots.map((spot: any) => { const active = marked.includes(spot.text); return <button className={active ? "marked" : ""} onClick={() => setMarked((items) => items.includes(spot.text) ? items.filter((text) => text !== spot.text) : [...items, spot.text])} key={spot.text}><span>{active ? "已标注" : "待标注"}</span><strong>{spot.text}</strong>{active && <small><b>{spot.role}</b>{spot.task}</small>}</button>; })}</div><button className="case-submit" disabled={!complete} onClick={() => saveCase(lab, hotspots.length, hotspots.length)}>保存标注记录</button></div>;
}

function SimulateLab({ lab }: { lab: LabCase }) {
  const models = Object.entries(lab.config.model_table ?? {}) as Array<[string, any]>; const params: string[] = lab.config.params ?? []; const [selected, setSelected] = useState<string[]>([]); const chosen = models.filter(([name]) => selected.includes(name));
  const metricKeys = ["speed", "cost", "reach", "error"];
  return <div className="case-runner simulate-runner"><p>选择两种流布方式，比较速度、成本、范围与误差风险。指标只表达相对趋势。</p><div className="simulation-options">{models.map(([name]) => <button className={selected.includes(name) ? "selected" : ""} disabled={!selected.includes(name) && selected.length >= 2} onClick={() => setSelected((items) => items.includes(name) ? items.filter((item) => item !== name) : [...items, name])} key={name}>{name}</button>)}</div><div className="simulation-table">{chosen.map(([name, values]) => <section key={name}><h4>{name}</h4>{params.map((param, index) => <div key={param}><span>{param}</span><i><b style={{ width: `${(values[metricKeys[index]] / 5) * 100}%` }} /></i><strong>{values[metricKeys[index]]}/5</strong></div>)}</section>)}</div><button className="case-submit" disabled={selected.length !== 2} onClick={() => saveCase(lab, 1, 1)}>保存比较结论</button></div>;
}

function LabRunner({ lab }: { lab: LabCase }) {
  if (lab.engine === "reasoning") return <ReasoningLab lab={lab} />;
  if (lab.engine === "classify") return <ClassifyLab lab={lab} />;
  if (lab.engine === "sequence") return <OrderLab lab={lab} />;
  if (lab.engine === "assemble") return <OrderLab lab={lab} assemble />;
  if (lab.engine === "annotate") return <AnnotateLab lab={lab} />;
  return <SimulateLab lab={lab} />;
}

export default function CaseGallery({ labs }: { labs: LabCase[] }) {
  const [chapter, setChapter] = useState("all"); const [engine, setEngine] = useState("all"); const [activeId, setActiveId] = useState(labs[0]?.id ?? "");
  const filtered = useMemo(() => labs.filter((lab) => (chapter === "all" || lab.chapter === Number(chapter)) && (engine === "all" || lab.engine === engine)), [chapter, engine, labs]);
  const active = labs.find((lab) => lab.id === activeId) ?? filtered[0] ?? labs[0];
  return <div className="case-gallery"><aside><div className="case-filters"><label>章节<select value={chapter} onChange={(event) => { setChapter(event.target.value); setActiveId(""); }}><option value="all">全部十四章</option>{Array.from({ length: 14 }, (_, index) => <option value={index + 1} key={index + 1}>第 {index + 1} 章</option>)}</select></label><label>机制<select value={engine} onChange={(event) => { setEngine(event.target.value); setActiveId(""); }}><option value="all">全部机制</option>{Object.entries(engineNames).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label></div><nav aria-label="选择章节实验">{filtered.map((lab) => <button className={active?.id === lab.id ? "active" : ""} onClick={() => setActiveId(lab.id)} key={lab.id}><small>第 {lab.chapter} 章 · {engineNames[lab.engine]}</small><strong>{lab.title}</strong></button>)}</nav></aside>{active && <main key={active.id}><header><div><small>CHAPTER {String(active.chapter).padStart(2, "0")} · {engineNames[active.engine]}</small><h3>{active.title}</h3></div><span>{active.concept_ids.length} 个关联概念</span></header><LabRunner lab={active} /></main>}</div>;
}
