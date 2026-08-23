import { useState } from "react";
import "./RareBookDossier.css";

type Role = "support" | "limit" | "context";
type Evidence = { id: string; label: string; detail: string; role: Role };
type Stage = { id: string; title: string; question: string; evidence: Evidence[]; conclusions: string[]; answer: number; explanation: string };
const roleNames: Record<Role, string> = { support: "支持判断", limit: "限制结论", context: "背景线索" };
const stages: Stage[] = [
  { id: "object", title: "第一室·接收与分层", question: "先区分原始制作、后期改装与未经证实的旧说。", evidence: [
    { id: "paper", label: "纸色旧、帘纹可见", detail: "只能说明材料具有一定年代感，尚不能直接锁定刊刻朝代。", role: "context" },
    { id: "thread", label: "蓝色线装线很新", detail: "装订可能经过后改，不能把现装形态等同于初刻形态。", role: "context" },
    { id: "pencil", label: "封面铅笔题“宋刻”", detail: "属于近人判断，缺少署名和论证，不应直接作为年代证据。", role: "limit" },
  ], conclusions: ["旧纸足以证明它是宋刻本", "先记录各层材料，不急于认定封面旧说", "新装订足以证明正文也是新印"], answer: 1, explanation: "接收阶段的核心是拆分对象层次：正文书叶、装订、题签和后人说明可能来自不同时间。" },
  { id: "colophon", title: "第二室·牌记核验", question: "末叶出现“嘉靖重刊”牌记，但纸色和版框与正文略异。", evidence: [
    { id: "mark", label: "牌记明确写有嘉靖重刊", detail: "若与全书同属一个制作阶段，可支持明代重刊判断。", role: "support" },
    { id: "paper-diff", label: "牌记书叶纸色不同", detail: "提示牌记可能后配、补叶或来自另一部书。", role: "limit" },
    { id: "text-link", label: "牌记书名与正文相合", detail: "说明内容上相关，但仍不能替代物质层面的同版验证。", role: "context" },
  ], conclusions: ["按牌记直接认定全书刊于嘉靖", "牌记完全无用，应当删除", "暂作明代重刊线索，并检查接缝、纸张和版式"], answer: 2, explanation: "牌记很重要，但必须确认它是否属于当前这部书的原始组成。" },
  { id: "taboo", title: "第三室·避讳复核", question: "正文一处字形缺末笔，但同一字在其他书叶完整出现。", evidence: [
    { id: "missing", label: "一处缺末笔", detail: "可能是避讳，也可能来自版损、偶然缺刻或后期挖改。", role: "context" },
    { id: "complete", label: "同字多处完整", detail: "削弱系统性避讳的解释，要求更谨慎。", role: "limit" },
    { id: "repair", label: "该处周围有修版痕", detail: "提示字形异常可能属于后期版片处理。", role: "limit" },
  ], conclusions: ["仅凭这一处缺笔精确断为宋刻", "暂不能用此避讳锁定年代", "既然另处完整，就证明全书为伪本"], answer: 1, explanation: "避讳通常提供时间范围线索；孤例尤其需要排除偶然缺笔、翻刻和挖改。" },
  { id: "layout", title: "第四室·版式与刻工", question: "版式近似明刻，刻工姓名也见于一份明代著录，但同名身份未核实。", evidence: [
    { id: "layout", label: "行款、版心近似明刻", detail: "具有比较价值，但仿刻和地区差异会造成相似。", role: "context" },
    { id: "engraver", label: "同名刻工见于明代著录", detail: "在身份和活动范围核实后，可支持时间范围判断。", role: "support" },
    { id: "identity", label: "尚不能排除同名异人", detail: "限制刻工证据的确定性。", role: "limit" },
  ], conclusions: ["版式印象和同名刻工共同构成初步旁证", "字体像明刻，所以不必再查其他证据", "同名刻工足以精确到某一年"], answer: 0, explanation: "字体、版式和刻工适合进入综合比较，但不宜作为孤证。" },
  { id: "catalog", title: "第五室·著录与递藏", question: "清代藏书目录著录四卷，当前仅存两卷；一方藏印与目录记录相合。", evidence: [
    { id: "record", label: "清代目录著录四卷", detail: "支持该书曾以四卷形态存在，也提供后续追踪入口。", role: "support" },
    { id: "missing-volumes", label: "当前只存两卷", detail: "限制对完整性和具体传本同一性的判断。", role: "limit" },
    { id: "seal", label: "藏印与目录记录相合", detail: "可支持某一阶段的递藏关系。", role: "support" },
  ], conclusions: ["目录与藏印支持递藏，但还需解释缺卷与版本同一性", "目录著录说明当前残本必然就是原藏本", "缺两卷意味着目录一定错误"], answer: 0, explanation: "目录、藏印和实物可以互证收藏史，但‘同书名’不自动等于‘同一具体本子’。" },
];
const verdicts = [
  "据封面旧题，可直接定为宋刻善本。",
  "现有证据较支持明代重刊或翻刻方向，装订和牌记书叶可能后配；在刻工身份、纸张和可靠书影核验前，不宜精确断年。",
  "证据彼此冲突，因此这部书没有任何研究价值。",
];

function saveProgress(score: number, total: number) {
  try { const key = "wxlab-progress"; const data = JSON.parse(localStorage.getItem(key) || "{}"); data["rare-book-dossier"] = { completed: true, score, total, title: "古籍鉴定综合案卷", updatedAt: new Date().toISOString() }; localStorage.setItem(key, JSON.stringify(data)); window.dispatchEvent(new CustomEvent("wxlab-progress-updated")); } catch { /* ignore */ }
}

export default function RareBookDossier({ baseUrl }: { baseUrl: string }) {
  const [stageIndex, setStageIndex] = useState(0); const [roles, setRoles] = useState<Record<string, Role>>({}); const [conclusion, setConclusion] = useState<number | null>(null); const [results, setResults] = useState<Array<{ score: number; total: number }>>([]); const [checked, setChecked] = useState(false); const [verdict, setVerdict] = useState<number | null>(null); const [note, setNote] = useState(""); const [finished, setFinished] = useState(false);
  const stage = stages[stageIndex]; const stageScore = stage.evidence.filter((item) => roles[item.id] === item.role).length + (conclusion === stage.answer ? 1 : 0); const stageTotal = stage.evidence.length + 1;
  const earned = results.reduce((sum, item) => sum + item.score, 0); const available = results.reduce((sum, item) => sum + item.total, 0); const finalScore = earned + (verdict === 1 ? 3 : 0); const finalTotal = available + 3;
  const reportLevel = finalScore / finalTotal >= .85 ? "谨慎而完整的鉴定意见" : finalScore / finalTotal >= .6 ? "方向合理，证据边界仍需加强" : "结论过强，需要回到材料";
  const roleComplete = Object.keys(roles).length === stage.evidence.length;
  const currentResult = results[stageIndex];
  function checkStage() { if (!roleComplete || conclusion === null) return; setChecked(true); setResults((items) => [...items.slice(0, stageIndex), { score: stageScore, total: stageTotal }]); }
  function nextStage() { setStageIndex((value) => value + 1); setRoles({}); setConclusion(null); setChecked(false); }
  function finish() { if (verdict === null) return; const score = earned + (verdict === 1 ? 3 : 0); const total = available + 3; saveProgress(score, total); setFinished(true); }
  function exportReport() { const text = `# 古籍鉴定综合案卷\n\n> 本案材料为教学用途的虚构案例。\n\n## 综合意见\n${verdicts[verdict ?? 1]}\n\n## 评分\n${finalScore}/${finalTotal} · ${reportLevel}\n\n## 我的案卷札记\n${note || "（尚未填写）"}\n\n## 仍需核验\n- 刻工同名身份与活动年代\n- 牌记书叶与正文的纸张、接缝和版框关系\n- 可靠目录、书影与其他传本\n- 纸张纤维与装订层次的实物信息\n`; const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "rare-book-dossier-report.md"; anchor.click(); URL.revokeObjectURL(url); }
  const progress = finished ? 100 : Math.round(((stageIndex + (checked ? 1 : 0)) / (stages.length + 1)) * 100);

  return <div className="dossier">
    <header><div><small>FICTIONAL TEACHING CASE · 教学虚构案</small><h3>《群书考证录》残本鉴定案</h3><p>一部题为“宋刻”的两卷残本进入整理室。你的任务不是猜年代，而是管理证据强度。</p></div><div className="dossier-seal"><span>案</span><b>{progress}%</b></div></header>
    <nav>{stages.map((item, index) => <button className={index === stageIndex && !finished ? "active" : index < stageIndex || finished ? "done" : ""} disabled key={item.id}><span>{index < stageIndex || finished ? "✓" : index + 1}</span><small>{item.title.replace(/第.室·/, "")}</small></button>)}<button className={stageIndex === stages.length || finished ? "active" : ""} disabled><span>{finished ? "✓" : 6}</span><small>综合意见</small></button></nav>

    {!finished && stageIndex < stages.length && <main>
      <aside className="dossier-object"><div className="book-object"><span>群书<br/>考证录</span><i>残本二卷</i></div><dl><div><dt>来历</dt><dd>旧藏流出，来源记录不完整</dd></div><div><dt>旧题</dt><dd>封面铅笔题“宋刻”</dd></div><div><dt>任务</dt><dd>形成有限度的鉴定意见</dd></div></dl></aside>
      <section><p className="eyebrow">{stage.title}</p><h4>{stage.question}</h4><p className="dossier-guide">为每条材料指定证据角色，再选择本阶段最稳妥的处理方式。</p><div className="dossier-evidence">{stage.evidence.map((item) => <article className={checked ? (roles[item.id] === item.role ? "correct" : "incorrect") : ""} key={item.id}><strong>{item.label}</strong><p>{item.detail}</p><div>{(Object.keys(roleNames) as Role[]).map((role) => <button key={role} disabled={checked} className={roles[item.id] === role ? "selected" : ""} onClick={() => setRoles((current) => ({ ...current, [item.id]: role }))}>{roleNames[role]}</button>)}</div>{checked && <small>建议角色：{roleNames[item.role]}</small>}</article>)}</div><div className="dossier-conclusions">{stage.conclusions.map((item, index) => <button key={item} disabled={checked} className={`${conclusion === index ? "selected" : ""} ${checked ? (index === stage.answer ? "correct" : conclusion === index ? "incorrect" : "") : ""}`} onClick={() => setConclusion(index)}><span>{String.fromCharCode(65 + index)}</span>{item}</button>)}</div>{!checked ? <button className="dossier-primary" disabled={!roleComplete || conclusion === null} onClick={checkStage}>核验本室判断</button> : <div className="dossier-feedback"><strong>{currentResult?.score}/{currentResult?.total}</strong><div><h5>{stageScore === stageTotal ? "证据角色与结论匹配" : "有材料角色或结论需要调整"}</h5><p>{stage.explanation}</p></div>{stageIndex < stages.length - 1 ? <button onClick={nextStage}>进入下一室 →</button> : <button onClick={() => setStageIndex(stages.length)}>形成综合意见 →</button>}</div>}</section>
    </main>}

    {!finished && stageIndex === stages.length && <section className="dossier-verdict"><div><p className="eyebrow">FINAL VERDICT</p><h4>选择与现有证据强度相称的综合意见</h4>{verdicts.map((item, index) => <button key={item} className={verdict === index ? "selected" : ""} onClick={() => setVerdict(index)}><span>{index + 1}</span>{item}</button>)}</div><aside><label><span>我的案卷札记</span><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="记录你仍然怀疑什么、下一步要查什么……" /></label><button className="dossier-primary" disabled={verdict === null} onClick={finish}>签署鉴定意见</button></aside></section>}

    {finished && <section className="dossier-complete"><div className="report-stamp">鉴<br/>定</div><div><p className="eyebrow">DOSSIER COMPLETE</p><h4>{reportLevel}</h4><strong>{finalScore}<i>/{finalTotal}</i></strong><blockquote>{verdicts[verdict ?? 1]}</blockquote><p>这份报告只针对教学案例。真实鉴定必须记录实物条件、明确材料来源，并由具备资格的研究者复核。</p><div><button onClick={exportReport}>导出 Markdown 报告</button><a href={`${baseUrl}concepts/c_version_evidence/`}>复习“版本证据链” →</a><button onClick={() => { setStageIndex(0); setRoles({}); setConclusion(null); setResults([]); setChecked(false); setVerdict(null); setNote(""); setFinished(false); }}>重新开案</button></div></div></section>}
  </div>;
}
