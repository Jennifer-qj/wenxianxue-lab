import { useMemo, useState } from "react";
import "./TextualCriticismStudio.css";

type Role = "base" | "variant" | "limit";
type Edge = { from: string; to: string };

function save(id: string, score: number, total: number) {
  try {
    const progress = JSON.parse(localStorage.getItem("wxlab-progress") || "{}");
    progress[id] = { completed: true, score, total, updatedAt: new Date().toISOString() };
    localStorage.setItem("wxlab-progress", JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent("wxlab-progress-updated"));
  } catch { /* 练习仍可继续 */ }
}

const witnesses = [
  { id: "jia", name: "甲本", date: "较早刻本", text: "學而時習之，不亦說乎", note: "暂作底本；版刻较早，但本身并不自动等于原文。", expected: "base" as Role },
  { id: "yi", name: "乙本", date: "后出刻本", text: "學而時習之，不亦悅乎", note: "“悅”使文意更直白，但后出且传承关系未明。", expected: "variant" as Role },
  { id: "bing", name: "丙本", date: "抄本残卷", text: "學而時習之，不亦說乎", note: "与甲本文字相同，是否独立于甲本系统尚不能确认。", expected: "limit" as Role },
  { id: "yin", name: "旧注引文", date: "他书征引", text: "引作“不亦悅乎”", note: "引用可能释义性改写，不能与完整传本等量齐观。", expected: "limit" as Role },
];
const roleLabels: Record<Role, string> = { base: "支持保留底文", variant: "支持记录异文", limit: "限制结论强度" };

function CollationDesk() {
  const [roles, setRoles] = useState<Record<string, Role>>({});
  const [decision, setDecision] = useState<"retain" | "change" | "suspend" | "">("");
  const [note, setNote] = useState("");
  const [checked, setChecked] = useState(false);
  const roleScore = witnesses.filter((item) => roles[item.id] === item.expected).length;
  const score = roleScore + (decision === "suspend" ? 1 : 0) + (note.trim().length >= 30 ? 1 : 0);
  const ready = Object.keys(roles).length === witnesses.length && Boolean(decision) && note.trim().length >= 30;
  const decisionLabels = { retain: "径直保留甲本，不附说明", change: "据乙本改作“悅”", suspend: "保留底文，同时附记异文并存疑" };

  function exportNote() {
    const content = [`# 校勘工作单`, "", `- 处理意见：${decisionLabels[decision as keyof typeof decisionLabels]}`, `- 自拟校勘记：${note}`, "", "## 材料角色", ...witnesses.map((item) => `- ${item.name}：${roleLabels[roles[item.id]]}`), "", "> 教学虚构材料；不对应真实版本。"].join("\n");
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "校勘工作单.md"; link.click(); URL.revokeObjectURL(link.href);
  }

  return <div className="collation-desk">
    <header><div><small>虚构教学案 · 异文位置 01</small><h3>“說”还是“悅”？先整理证据，再写校勘记</h3></div><span>{Object.keys(roles).length}/4 已赋予证据角色</span></header>
    <div className="witness-table">{witnesses.map((item) => <article key={item.id} className={checked ? (roles[item.id] === item.expected ? "correct" : "incorrect") : ""}>
      <div><small>{item.date}</small><strong>{item.name}</strong><blockquote>{item.text}</blockquote></div><p>{item.note}</p>
      <fieldset disabled={checked}><legend>它在这一步承担什么作用？</legend>{(Object.keys(roleLabels) as Role[]).map((role) => <button type="button" className={roles[item.id] === role ? "selected" : ""} onClick={() => setRoles((current) => ({ ...current, [item.id]: role }))} key={role}>{roleLabels[role]}</button>)}</fieldset>
      {checked && roles[item.id] !== item.expected && <em>建议角色：{roleLabels[item.expected]}</em>}
    </article>)}</div>
    <section className="collation-compose">
      <div><small>处理方式</small>{Object.entries(decisionLabels).map(([id, label]) => <button disabled={checked} key={id} className={decision === id ? "selected" : ""} onClick={() => setDecision(id as typeof decision)}><span>{decision === id ? "●" : "○"}</span>{label}</button>)}</div>
      <label><span>写一条可供别人复查的校勘记 <small>{note.trim().length}/30 字起</small></span><textarea disabled={checked} value={note} onChange={(event) => setNote(event.target.value)} placeholder="至少交代底文、异文来源、取舍依据和仍然存在的疑点。" /></label>
    </section>
    {!checked ? <button className="studio-primary" disabled={!ready} onClick={() => { setChecked(true); save("collation-workbench", score, 6); }}>封存本次校勘判断</button> : <section className="studio-report"><div><small>可复核性报告</small><strong>{score}/6</strong></div><div><h4>{score === 6 ? "判断过程完整" : "仍有证据角色需要调整"}</h4><p>参考处理：甲本暂仍作“說”，乙本及旧注引作“悅”；诸本系统关系和引文性质尚未完全厘清，今保留底文并附记异文，暂不径改。</p><p>这里评价的是证据组织是否透明，不把某个字形包装成唯一标准答案。</p></div><nav><button onClick={() => setChecked(false)}>撤回修改</button><button onClick={exportNote}>导出校勘工作单</button></nav></section>}
  </div>;
}

const nodes = [
  { id: "omega", label: "Ω 假设祖本", x: 300, y: 55 },
  { id: "jia", label: "甲本", x: 160, y: 180 },
  { id: "bing", label: "丙本", x: 440, y: 180 },
  { id: "yi", label: "乙本", x: 100, y: 320 },
  { id: "ding", label: "丁本", x: 500, y: 320 },
];
const expectedEdges = ["omega>jia", "omega>bing", "jia>yi", "bing>ding"];
const clues = [
  ["甲、乙", "共同脱去一句，乙另有两处后起字形。"],
  ["丙、丁", "共同倒置一段，丁又出现一处独有讹字。"],
  ["甲、丙", "各自保存对方已经失去的一处文字。"],
];

function StemmaLab() {
  const [edges, setEdges] = useState<Edge[]>([]);
  const [parent, setParent] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [confidence, setConfidence] = useState(50);
  const [checked, setChecked] = useState(false);
  const byId = useMemo(() => new Map(nodes.map((node) => [node.id, node])), []);
  const edgeKeys = edges.map((edge) => `${edge.from}>${edge.to}`);
  const edgeScore = expectedEdges.filter((edge) => edgeKeys.includes(edge)).length;
  const extra = edgeKeys.filter((edge) => !expectedEdges.includes(edge)).length;
  const score = Math.max(0, edgeScore - extra) + (reason.trim().length >= 24 ? 1 : 0);
  const ready = edges.length >= 4 && reason.trim().length >= 24;

  function choose(id: string) {
    if (checked) return;
    if (!parent) { setParent(id); return; }
    if (parent !== id && id !== "omega" && !edges.some((edge) => edge.from === parent && edge.to === id)) setEdges((items) => [...items, { from: parent, to: id }]);
    setParent(null);
  }

  return <div className="stemma-lab">
    <header><div><small>VERSION STEMMA · 谱系假说</small><h3>用共误建立版本家族</h3></div><p>先点可能的父本，再点子本；连线不是断言真实祖本，而是把当前假说画出来。</p></header>
    <div className="stemma-grid">
      <aside><small>已知线索</small>{clues.map(([group, clue]) => <article key={group}><strong>{group}</strong><p>{clue}</p></article>)}<p>共享讹误可以提示亲缘，但抄配、校改和共同来源都可能制造例外。</p></aside>
      <section className="stemma-canvas">
        <svg viewBox="0 0 600 380" role="img" aria-label="可编辑的版本谱系图">
          <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" /></marker></defs>
          {edges.map((edge) => { const from = byId.get(edge.from)!; const to = byId.get(edge.to)!; return <line key={`${edge.from}-${edge.to}`} x1={from.x} y1={from.y + 22} x2={to.x} y2={to.y - 22} markerEnd="url(#arrow)" />; })}
          {nodes.map((node) => <g key={node.id} className={parent === node.id ? "selected" : ""} role="button" tabIndex={0} onClick={() => choose(node.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") choose(node.id); }}><circle cx={node.x} cy={node.y} r="42" /><text x={node.x} y={node.y + 4} textAnchor="middle">{node.label}</text></g>)}
        </svg>
        <p className="stemma-instruction">{parent ? `已选择“${byId.get(parent)?.label}”为父本，请选择子本。` : "点击一个节点，开始建立下一条亲缘线。"}</p>
        <div className="edge-list">{edges.map((edge) => <button disabled={checked} onClick={() => setEdges((items) => items.filter((item) => item !== edge))} key={`${edge.from}-${edge.to}`}>{byId.get(edge.from)?.label} → {byId.get(edge.to)?.label}<span>×</span></button>)}</div>
      </section>
    </div>
    <div className="stemma-reason"><label><span>为什么这样连接？ <small>{reason.trim().length}/24 字起</small></span><textarea disabled={checked} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="说明你怎样使用共误，同时指出谱系假说的一个限制。" /></label><label><span>当前信心：{confidence}%</span><input disabled={checked} type="range" min="10" max="100" step="5" value={confidence} onChange={(event) => setConfidence(Number(event.target.value))} /><small>材料有限时，高信心也需要额外解释。</small></label></div>
    {!checked ? <button className="studio-primary" disabled={!ready} onClick={() => { setChecked(true); save("version-stemma", score, 5); }}>核验谱系假说</button> : <section className="studio-report"><div><small>谱系推理报告</small><strong>{score}/5</strong></div><div><h4>{edgeScore === 4 && extra === 0 ? "当前连线与参考假说一致" : "请重新检查共享讹误的分组"}</h4><p>参考假说把甲—乙与丙—丁分别看作两个分支。它仍不能排除横向校改，因此应写成“目前较能解释材料的模型”，而不是确定的历史事实。</p><p>{confidence >= 80 && score < 5 ? "你的信心高于当前证据表现，建议降低结论语气。" : "信心值已经进入报告，用来比较判断强度与证据完整度。"}</p></div><nav><button onClick={() => setChecked(false)}>撤回修改</button><button onClick={() => { setEdges([]); setReason(""); setConfidence(50); setChecked(false); }}>重新建模</button></nav></section>}
  </div>;
}

export default function TextualCriticismStudio() {
  const [tab, setTab] = useState<"collation" | "stemma">(() => {
    if (typeof window === "undefined") return "collation";
    return new URLSearchParams(window.location.search).get("experiment") === "version-stemma" ? "stemma" : "collation";
  });
  return <div className="criticism-studio">
    <nav aria-label="选择进阶实验"><button className={tab === "collation" ? "active" : ""} onClick={() => setTab("collation")}><small>第六章</small><strong>校勘工作台</strong><span>整理异文并写校勘记</span></button><button className={tab === "stemma" ? "active" : ""} onClick={() => setTab("stemma")}><small>第五、六章</small><strong>版本谱系推理</strong><span>根据共误建立亲缘假说</span></button></nav>
    <section key={tab}>{tab === "collation" ? <CollationDesk /> : <StemmaLab />}</section>
  </div>;
}
