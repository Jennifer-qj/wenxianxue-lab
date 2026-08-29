import { useMemo, useState } from "react";
import "./FragmentCasebook.css";

type Role = "" | "support" | "context" | "risk";
type Strength = "" | "supported" | "plausible" | "unsupported";

const evidence = [
  { id: "size", label: "纸幅与栏线", detail: "甲、乙两片高度及栏线间距接近，边缘均保留同方向的纤维撕裂。", answer: "support" },
  { id: "join", label: "断口与虫孔", detail: "甲片右缘与乙片左缘的缺口、虫孔位置可以连续对应。", answer: "support" },
  { id: "hand", label: "书写习惯", detail: "两片在转折、收笔和行间补字位置上出现同一组习惯。", answer: "support" },
  { id: "catalog", label: "馆藏题名", detail: "两馆旧目录分别拟题为“残经”与“杂抄”，题名来自整理者。", answer: "context" },
  { id: "number", label: "旧号与入藏", detail: "甲、乙两片在二十世纪初分别进入不同收藏，旧号体系互不相同。", answer: "context" },
  { id: "content", label: "内容相近", detail: "两片都出现同一类讲经术语，但没有直接的上下文承接。", answer: "risk" },
  { id: "colour", label: "数字图像颜色", detail: "网页图像看起来一深一浅，但拍摄光源与色彩校准信息缺失。", answer: "risk" },
  { id: "pencil", label: "近代铅笔号", detail: "乙片背面有近代铅笔编号，它能说明整理史，不能直接说明写卷年代。", answer: "context" },
] as const;

const claims = [
  { id: "same", text: "现有材料已经足以确认两片原属同一写卷。", answer: "unsupported" },
  { id: "method", text: "断口、虫孔、书手与文本承接应当联合检验。", answer: "supported" },
  { id: "title", text: "旧目录题名不同，足以证明两片内容无关。", answer: "unsupported" },
  { id: "next", text: "下一步应取得同尺度图像、纸张信息和完整入藏记录。", answer: "supported" },
] as const;

const roleNames: Record<Exclude<Role, "">, string> = { support: "直接支持", context: "背景线索", risk: "误判风险" };
const strengthNames: Record<Exclude<Strength, "">, string> = { supported: "现有材料支持", plausible: "可以提出，但需补证", unsupported: "不能这样推出" };

export default function FragmentCasebook() {
  const [stage, setStage] = useState(0);
  const [roles, setRoles] = useState<Record<string, Role>>({});
  const [strengths, setStrengths] = useState<Record<string, Strength>>({});
  const [identity, setIdentity] = useState("");
  const [boundary, setBoundary] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [confidence, setConfidence] = useState(55);
  const [finished, setFinished] = useState(false);
  const [notice, setNotice] = useState("");

  const roleReady = evidence.every((item) => roles[item.id]);
  const claimReady = claims.every((item) => strengths[item.id]);
  const writingReady = identity.trim().length >= 30 && boundary.trim().length >= 20 && nextStep.trim().length >= 15;
  const roleScore = evidence.filter((item) => roles[item.id] === item.answer).length;
  const claimScore = claims.filter((item) => strengths[item.id] === item.answer).length;
  const score = roleScore + claimScore + (writingReady ? 2 : 0);
  const total = evidence.length + claims.length + 2;

  const report = useMemo(() => [
    "# 残卷归档调查报告",
    "",
    "> 教学虚构案例；不能作为任何真实写卷的鉴定或著录意见。",
    "",
    `- 当前判断：${identity.trim() || "未填写"}`,
    `- 证据边界：${boundary.trim() || "未填写"}`,
    `- 下一步核查：${nextStep.trim() || "未填写"}`,
    `- 当前信心：${confidence}%`,
    `- 任务覆盖：${score}/${total}`,
    "",
    "## 证据角色",
    "",
    ...evidence.map((item) => `- ${item.label}：${roles[item.id] ? roleNames[roles[item.id] as Exclude<Role, "">] : "未判断"}`),
    "",
    "## 命题强度",
    "",
    ...claims.map((item) => `- ${item.text}：${strengths[item.id] ? strengthNames[strengths[item.id] as Exclude<Strength, "">] : "未判断"}`),
    "",
    "## 涉及章节",
    "",
    "第二章·载体｜第五章·版本证据｜第七章·目录著录｜第十四章·敦煌文献与残卷缀合",
  ].join("\n"), [identity, boundary, nextStep, confidence, roles, strengths, score]);

  function finish() {
    if (!writingReady) return;
    const progress = JSON.parse(localStorage.getItem("wxlab-progress") || "{}");
    progress["fragment-casebook"] = { completed: true, score, total, title: "残卷归档调查", note: `${identity.trim()}｜边界：${boundary.trim()}｜下一步：${nextStep.trim()}｜信心 ${confidence}%`, updatedAt: new Date().toISOString() };
    localStorage.setItem("wxlab-progress", JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent("wxlab-progress-updated"));
    setFinished(true);
  }

  async function copyReport() {
    try { await navigator.clipboard.writeText(report); setNotice("调查报告已复制"); } catch { setNotice("浏览器未允许复制，请使用下载"); }
  }

  function downloadReport() {
    const url = URL.createObjectURL(new Blob([report], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `残卷归档调查-${new Date().toISOString().slice(0, 10)}.md`; anchor.click(); URL.revokeObjectURL(url);
  }

  function reset() {
    setStage(0); setRoles({}); setStrengths({}); setIdentity(""); setBoundary(""); setNextStep(""); setConfidence(55); setFinished(false); setNotice("");
  }

  return <div className="fragment-casebook">
    <header className="fragment-casebook__head"><div><small>CROSS-CHAPTER CAPSTONE · 跨章综合调查</small><h3>两片分藏残卷，应该怎样进入同一份档案？</h3><p>这不是“猜它们是不是同一卷”。你要先区分证据角色，再控制命题强度，最后留下别人能够继续核查的归档意见。</p></div><aside><span>教学虚构案例</span><strong>DH-FRAG-01</strong><small>不对应任何真实馆藏写卷</small></aside></header>
    <nav className="casebook-stages" aria-label="调查阶段">{["证据分层", "命题校准", "归档意见"].map((label, index) => <button key={label} className={stage === index ? "active" : ""} disabled={index > stage || finished} onClick={() => setStage(index)}><span>0{index + 1}</span><strong>{label}</strong></button>)}</nav>

    {stage === 0 && <section className="casebook-evidence"><header><div><small>STEP 01 · EVIDENCE ROLES</small><h4>每条线索究竟能证明什么？</h4></div><p>“看起来有关”不是一种证据角色。把材料分成直接支持、背景线索和误判风险。</p></header><div>{evidence.map((item) => <article key={item.id}><small>{item.label}</small><p>{item.detail}</p><label><span>我的判断</span><select value={roles[item.id] ?? ""} onChange={(event) => setRoles((current) => ({ ...current, [item.id]: event.target.value as Role }))}><option value="">尚未分层</option><option value="support">直接支持</option><option value="context">背景线索</option><option value="risk">误判风险</option></select></label></article>)}</div><footer><span>{Object.keys(roles).length}/{evidence.length} 条已分层</span><button disabled={!roleReady} onClick={() => setStage(1)}>进入命题校准 →</button></footer></section>}

    {stage === 1 && <section className="casebook-claims"><header><div><small>STEP 02 · CLAIM CALIBRATION</small><h4>别让结论跑到证据前面</h4></div><p>同一条观察可以支持“值得继续核查”，却未必足以支持“已经确认”。</p></header><div>{claims.map((item, index) => <article key={item.id}><span>0{index + 1}</span><p>{item.text}</p><div>{(Object.entries(strengthNames) as Array<[Exclude<Strength, "">, string]>).map(([value, label]) => <button key={value} className={strengths[item.id] === value ? "selected" : ""} onClick={() => setStrengths((current) => ({ ...current, [item.id]: value }))}>{label}</button>)}</div></article>)}</div><footer><button className="secondary" onClick={() => setStage(0)}>← 返回证据分层</button><button disabled={!claimReady} onClick={() => setStage(2)}>撰写归档意见 →</button></footer></section>}

    {stage === 2 && !finished && <section className="casebook-writing"><header><div><small>STEP 03 · ARCHIVAL MEMO</small><h4>写一份允许后来者反驳和续查的意见</h4></div><div><span>证据角色 {roleScore}/{evidence.length}</span><span>命题强度 {claimScore}/{claims.length}</span></div></header><div className="casebook-writing__grid"><label><span>当前身份判断</span><textarea value={identity} onChange={(event) => setIdentity(event.target.value)} placeholder="至少 30 字：现有材料最合理地支持哪一种暂定关系？" /><small>{identity.trim().length}/30</small></label><label><span>不能越过的证据边界</span><textarea value={boundary} onChange={(event) => setBoundary(event.target.value)} placeholder="至少 20 字：哪些结论仍不能成立？" /><small>{boundary.trim().length}/20</small></label><label><span>下一步具体核查</span><textarea value={nextStep} onChange={(event) => setNextStep(event.target.value)} placeholder="至少 15 字：还要向哪一类材料提问？" /><small>{nextStep.trim().length}/15</small></label><label className="casebook-confidence"><span>当前信心</span><input type="range" min="20" max="90" step="5" value={confidence} onChange={(event) => setConfidence(Number(event.target.value))} /><b>{confidence}%</b><small>高信心不等于证据完整。</small></label></div><footer><button className="secondary" onClick={() => setStage(1)}>← 返回命题校准</button><button disabled={!writingReady} onClick={finish}>封存本次调查</button></footer></section>}

    {finished && <section className="casebook-report"><div className="casebook-report__stamp">归<br />档</div><div><small>CASE REPORT · 已保存至本机</small><h4>一份暂定意见，不是一锤定音</h4><blockquote>{identity}</blockquote><dl><div><dt>边界</dt><dd>{boundary}</dd></div><div><dt>下一步</dt><dd>{nextStep}</dd></div></dl><p>任务覆盖 {score}/{total} · 当前信心 {confidence}%。分数只反映是否完成证据分层、命题校准和书面记录。</p><footer><button onClick={copyReport}>复制报告</button><button onClick={downloadReport}>下载 Markdown</button><button onClick={reset}>重新调查</button></footer>{notice && <span role="status">{notice}</span>}</div></section>}

    <footer className="casebook-chapters"><span>第二章 · 载体</span><i>→</i><span>第五章 · 版本</span><i>→</i><span>第七章 · 目录</span><i>→</i><span>第十四章 · 敦煌文献</span></footer>
  </div>;
}
