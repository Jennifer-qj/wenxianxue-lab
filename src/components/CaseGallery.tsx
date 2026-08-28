import { useMemo, useState } from "react";
import "./CaseGallery.css";

type LabCase = { id: string; title: string; engine: string; chapter: number; concept_ids: string[]; concepts?: Array<{ id: string; label: string }>; config: Record<string, any> };
const engineNames: Record<string, string> = { reasoning: "证据推理", classify: "分类工作台", sequence: "流程重排", simulate: "参数模拟", annotate: "文本标注", assemble: "材料组装" };

function saveCase(lab: LabCase, score: number, total: number, note = "") {
  try {
    const key = "wxlab-progress"; const progress = JSON.parse(localStorage.getItem(key) || "{}");
    progress[`case-${lab.id}`] = { completed: true, score, total, note, title: `第${lab.chapter}章·${lab.title}`, updatedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(progress)); window.dispatchEvent(new CustomEvent("wxlab-progress-updated"));
  } catch { /* 本地存储不可用时不阻塞实验 */ }
}

function labelOf(item: any) { return typeof item === "string" ? item : item.label ?? item.task ?? item.id; }
function idOf(item: any) { return typeof item === "string" ? item : item.id ?? item.label ?? item.task; }

const engineAdvice: Record<string, string> = {
  reasoning: "回看是否遗漏证据来源、反证和结论强度；流程完整不等于结论必然正确。",
  classify: "优先重做标红项目，并解释分类依据，而不是只记住目标区域。",
  sequence: "先辨认每一步的输入和输出，再判断它为什么必须先于下一步。",
  assemble: "区分核心证据、辅助线索与应当排除的噪音材料。",
  annotate: "标注后要继续说明证据作用及其不能直接证明的部分。",
  simulate: "比较参数只是形成假设，真实历史判断仍需回到具体材料。",
};
function CaseReport({ lab, score, total, note, metric = "任务完成度", onRetry }: { lab: LabCase; score: number; total: number; note?: string; metric?: string; onRetry?: () => void }) {
  const ratio = total ? score / total : 0; const level = ratio === 1 ? "本轮记录已归档" : ratio >= .6 ? "基本完成，仍有缺口" : "需要重新检查";
  return <section className={`case-report ${ratio === 1 ? "excellent" : ratio >= .6 ? "developing" : "retry"}`} role="status"><div><small>{metric}</small><strong>{score}<i>/{total}</i></strong></div><div><h4>{level}</h4>{note && <blockquote>“{note}”</blockquote>}<p>{engineAdvice[lab.engine]}</p><span>这个数字表示本轮任务覆盖情况，不代表学术判断已经得到唯一答案。</span></div>{onRetry && <button onClick={onRetry}>撤回并修改</button>}</section>;
}

function CaseReflection({ conclusion, limitation, confidence, disabled = false, prompt, onConclusion, onLimitation, onConfidence }: { conclusion: string; limitation: string; confidence: number; disabled?: boolean; prompt: string; onConclusion: (value: string) => void; onLimitation: (value: string) => void; onConfidence: (value: number) => void }) {
  return <section className="case-reflection"><header><small>JUDGMENT NOTE</small><h4>把操作转成自己的判断</h4><p>{prompt}</p></header><label><span>我目前可以判断……</span><textarea disabled={disabled} value={conclusion} onChange={(event) => onConclusion(event.target.value)} placeholder="请用自己的话写下阶段性结论（至少 18 字）" /></label><label><span>但现有材料还不能证明……</span><textarea disabled={disabled} value={limitation} onChange={(event) => onLimitation(event.target.value)} placeholder="写下至少一个证据边界（至少 12 字）" /></label><label className="case-confidence"><span>当前把握程度</span><input disabled={disabled} type="range" min="1" max="5" value={confidence} onChange={(event) => onConfidence(Number(event.target.value))} /><strong>{confidence}/5</strong><small>{confidence <= 2 ? "线索性判断" : confidence <= 4 ? "有依据，但仍待复核" : "较有把握，仍保留边界"}</small></label></section>;
}

function ReasoningLab({ lab }: { lab: LabCase }) {
  const stages = (lab.config.stages ?? []).map((stage: any) => ({ id: idOf(stage), label: labelOf(stage) }));
  const [done, setDone] = useState<string[]>([]); const [submitted, setSubmitted] = useState(false); const [conclusion, setConclusion] = useState(""); const [limitation, setLimitation] = useState(""); const [confidence, setConfidence] = useState(3);
  const complete = done.length === stages.length && conclusion.trim().length >= 18 && limitation.trim().length >= 12; const total = stages.length + 2;
  return <div className="case-runner reasoning-runner"><p>逐步完成调查流程。勾选只表示你检查过这一环，最终仍需亲自写出结论与边界。</p><ol>{stages.map((stage: any, index: number) => <li className={done.includes(stage.id) ? "done" : ""} key={stage.id}><button disabled={submitted} onClick={() => setDone((items) => items.includes(stage.id) ? items.filter((id) => id !== stage.id) : [...items, stage.id])}><span>{done.includes(stage.id) ? "✓" : index + 1}</span><strong>{stage.label}</strong></button></li>)}</ol><CaseReflection conclusion={conclusion} limitation={limitation} confidence={confidence} disabled={submitted} prompt="完成流程后，不要复述按钮文字；请说明这些检查如何限制你的结论。" onConclusion={setConclusion} onLimitation={setLimitation} onConfidence={setConfidence} />{!submitted && <button className="case-submit" disabled={!complete} onClick={() => { saveCase(lab, total, total, `${conclusion.trim()}｜边界：${limitation.trim()}｜把握 ${confidence}/5`); setSubmitted(true); }}>形成有限度结论并归档</button>}{submitted && <CaseReport lab={lab} score={total} total={total} note={`${conclusion.trim()}；但${limitation.trim()}`} metric="流程与判断记录" onRetry={() => setSubmitted(false)} />}</div>;
}

const inferredZones: Record<string, string> = { 甲骨: "中国早期载体", 青铜器: "中国早期载体", 石刻: "中国早期载体", 简牍: "中国早期载体", 帛: "中国早期载体", 莎草纸: "域外早期载体", 羊皮纸: "域外早期载体", 贝叶: "域外早期载体", 纸: "纸质载体" };
function ClassifyLab({ lab }: { lab: LabCase }) {
  const zones = (lab.config.zones ?? []).map(labelOf); const cards = (lab.config.items ?? []).map((item: any) => ({ id: idOf(item), label: labelOf(item), answer: item.zone ?? inferredZones[labelOf(item)] }));
  const [placed, setPlaced] = useState<Record<string, string>>({}); const [checked, setChecked] = useState(false);
  const score = cards.filter((card: any) => !card.answer || placed[card.id] === card.answer).length;
  return <div className="case-runner classify-runner"><p>为每张卡片选择目标区域，完成后统一核验。</p><div className="case-classify-grid">{cards.map((card: any) => <label className={checked ? (!card.answer || placed[card.id] === card.answer ? "correct" : "incorrect") : ""} key={card.id}><strong>{card.label}</strong><select disabled={checked} value={placed[card.id] ?? ""} onChange={(event) => setPlaced((current) => ({ ...current, [card.id]: event.target.value }))}><option value="">选择区域</option>{zones.map((zone: string) => <option key={zone}>{zone}</option>)}</select>{checked && card.answer && <small>应归入：{card.answer}</small>}</label>)}</div>{!checked ? <button className="case-submit" disabled={Object.keys(placed).length !== cards.length} onClick={() => { setChecked(true); saveCase(lab, score, cards.length); }}>统一核验</button> : <CaseReport lab={lab} score={score} total={cards.length} onRetry={() => { setPlaced({}); setChecked(false); }} />}</div>;
}

function OrderLab({ lab, assemble = false }: { lab: LabCase; assemble?: boolean }) {
  const raw = assemble ? lab.config.pieces ?? [] : lab.config.items ?? [];
  const items = raw.map((item: any) => ({ id: idOf(item), label: labelOf(item), detail: item.clue ?? "" }));
  const solution: string[] = lab.config.correct_order ?? lab.config.solution ?? items.map((item: any) => item.id);
  const correct = [...solution, ...items.map((item: any) => item.id).filter((id: string) => !solution.includes(id))];
  const initial = [...items.map((item: any) => item.id)].reverse(); const [order, setOrder] = useState(initial); const [checked, setChecked] = useState(false);
  const byId = new Map(items.map((item: any) => [item.id, item])); const score = order.filter((id, index) => id === correct[index]).length;
  function move(index: number, offset: number) { const target = index + offset; if (checked || target < 0 || target >= order.length) return; setOrder((current) => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; }); }
  return <div className="case-runner order-runner"><p>{assemble ? "依据文字、形制和来源线索重组材料；不可靠或不纳入的材料应放在最后。" : "把步骤调整为合理的研究顺序。"}</p><ol>{order.map((id, index) => { const item: any = byId.get(id); return <li className={checked ? (id === correct[index] ? "correct" : "incorrect") : ""} key={id}><b>{index + 1}</b><div><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}{checked && id !== correct[index] && <em>此处应为：{(byId.get(correct[index]) as any)?.label}</em>}</div><nav><button disabled={checked || index === 0} onClick={() => move(index, -1)}>↑</button><button disabled={checked || index === order.length - 1} onClick={() => move(index, 1)}>↓</button></nav></li>; })}</ol>{!checked ? <button className="case-submit" onClick={() => { setChecked(true); saveCase(lab, score, items.length); }}>核验方案</button> : <CaseReport lab={lab} score={score} total={items.length} onRetry={() => { setOrder(initial); setChecked(false); }} />}</div>;
}

function AnnotateLab({ lab }: { lab: LabCase }) {
  const hotspots = lab.config.hotspots ?? []; const [marked, setMarked] = useState<string[]>([]); const [saved, setSaved] = useState(false); const [conclusion, setConclusion] = useState(""); const [limitation, setLimitation] = useState(""); const [confidence, setConfidence] = useState(3); const total = hotspots.length + 2;
  const complete = marked.length === hotspots.length && conclusion.trim().length >= 18 && limitation.trim().length >= 12;
  return <div className="case-runner annotate-runner"><blockquote>{lab.config.passage}</blockquote><p>先点击文字位置辨认证据角色，再说明这些标注共同支持什么、不能支持什么。</p><div className="annotation-hotspots">{hotspots.map((spot: any) => { const active = marked.includes(spot.text); return <button disabled={saved} className={active ? "marked" : ""} onClick={() => setMarked((items) => items.includes(spot.text) ? items.filter((text) => text !== spot.text) : [...items, spot.text])} key={spot.text}><span>{active ? "已标注" : "待标注"}</span><strong>{spot.text}</strong>{active && <small><b>{spot.role}</b>{spot.task}</small>}</button>; })}</div><CaseReflection conclusion={conclusion} limitation={limitation} confidence={confidence} disabled={saved} prompt="不要只说‘发现异文’：请明确哪条证据更早或更直接，以及它仍可能有哪些风险。" onConclusion={setConclusion} onLimitation={setLimitation} onConfidence={setConfidence} />{!saved ? <button className="case-submit" disabled={!complete} onClick={() => { saveCase(lab, total, total, `${conclusion.trim()}｜边界：${limitation.trim()}｜把握 ${confidence}/5`); setSaved(true); }}>保存标注与判断</button> : <CaseReport lab={lab} score={total} total={total} note={`${conclusion.trim()}；但${limitation.trim()}`} metric="标注与解释记录" onRetry={() => setSaved(false)} />}</div>;
}

function SimulateLab({ lab }: { lab: LabCase }) {
  const models = Object.entries(lab.config.model_table ?? {}) as Array<[string, any]>; const params: string[] = lab.config.params ?? []; const [selected, setSelected] = useState<string[]>([]); const [saved, setSaved] = useState(false); const [conclusion, setConclusion] = useState(""); const [limitation, setLimitation] = useState(""); const [confidence, setConfidence] = useState(3); const chosen = models.filter(([name]) => selected.includes(name));
  const metricKeys = ["speed", "cost", "reach", "error"];
  const complete = selected.length === 2 && conclusion.trim().length >= 18 && limitation.trim().length >= 12;
  return <div className="case-runner simulate-runner"><p>选择两种流布方式，比较速度、成本、范围与误差风险。指标是帮助提问的简化模型，不是历史事实的精确测量。</p><div className="simulation-options">{models.map(([name]) => <button className={selected.includes(name) ? "selected" : ""} disabled={saved || (!selected.includes(name) && selected.length >= 2)} onClick={() => setSelected((items) => items.includes(name) ? items.filter((item) => item !== name) : [...items, name])} key={name}>{name}</button>)}</div><div className="simulation-table">{chosen.map(([name, values]) => <section key={name}><h4>{name}</h4>{params.map((param, index) => <div key={param}><span>{param}</span><i><b style={{ width: `${(values[metricKeys[index]] / 5) * 100}%` }} /></i><strong>{values[metricKeys[index]]}/5</strong></div>)}</section>)}</div>{selected.length === 2 && <CaseReflection conclusion={conclusion} limitation={limitation} confidence={confidence} disabled={saved} prompt={`比较“${selected[0]}”与“${selected[1]}”：如果目标不同，哪种方式更合适？这个模型又忽略了什么？`} onConclusion={setConclusion} onLimitation={setLimitation} onConfidence={setConfidence} />}{!saved ? <button className="case-submit" disabled={!complete} onClick={() => { saveCase(lab, 3, 3, `${selected.join(" vs ")}｜${conclusion.trim()}｜边界：${limitation.trim()}｜把握 ${confidence}/5`); setSaved(true); }}>保存比较结论</button> : <CaseReport lab={lab} score={3} total={3} note={`${conclusion.trim()}；但${limitation.trim()}`} metric="比较与边界记录" onRetry={() => setSaved(false)} />}</div>;
}

function LabRunner({ lab }: { lab: LabCase }) {
  if (lab.engine === "reasoning") return <ReasoningLab lab={lab} />;
  if (lab.engine === "classify") return <ClassifyLab lab={lab} />;
  if (lab.engine === "sequence") return <OrderLab lab={lab} />;
  if (lab.engine === "assemble") return <OrderLab lab={lab} assemble />;
  if (lab.engine === "annotate") return <AnnotateLab lab={lab} />;
  return <SimulateLab lab={lab} />;
}

export default function CaseGallery({ labs, baseUrl }: { labs: LabCase[]; baseUrl: string }) {
  const [chapter, setChapter] = useState("all"); const [engine, setEngine] = useState("all"); const [activeId, setActiveId] = useState(labs[0]?.id ?? "");
  const filtered = useMemo(() => labs.filter((lab) => (chapter === "all" || lab.chapter === Number(chapter)) && (engine === "all" || lab.engine === engine)), [chapter, engine, labs]);
  const active = labs.find((lab) => lab.id === activeId) ?? filtered[0] ?? labs[0];
  return <div className="case-gallery"><aside><div className="case-filters"><label>章节<select value={chapter} onChange={(event) => { setChapter(event.target.value); setActiveId(""); }}><option value="all">全部十四章</option>{Array.from({ length: 14 }, (_, index) => <option value={index + 1} key={index + 1}>第 {index + 1} 章</option>)}</select></label><label>机制<select value={engine} onChange={(event) => { setEngine(event.target.value); setActiveId(""); }}><option value="all">全部机制</option>{Object.entries(engineNames).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label></div><nav aria-label="选择章节实验">{filtered.map((lab) => <button className={active?.id === lab.id ? "active" : ""} onClick={() => setActiveId(lab.id)} key={lab.id}><small>第 {lab.chapter} 章 · {engineNames[lab.engine]}</small><strong>{lab.title}</strong></button>)}</nav></aside>{active && <section className="case-workspace" key={active.id}><header><div><small>CHAPTER {String(active.chapter).padStart(2, "0")} · {engineNames[active.engine]}</small><h3>{active.title}</h3></div><span>{active.concept_ids.length} 个关联概念</span></header>{active.concepts && <div className="case-concepts"><small>完成前可先复习：</small>{active.concepts.map((concept) => <a href={`${baseUrl}concepts/${concept.id}/`}>{concept.label}</a>)}</div>}<LabRunner lab={active} /></section>}</div>;
}
