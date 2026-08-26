import { useMemo, useState } from "react";
import "./EvidenceCalibrationLab.css";

type Evidence = { id: string; label: string; detail: string; anchor: number; why: string };
type Dossier = { id: string; chapter: string; title: string; brief: string; question: string; evidence: Evidence[]; model: string };

const dossiers: Dossier[] = [
  {
    id: "edition", chapter: "第五章", title: "一部“宋刻本”的年代判断", brief: "旧藏题签称此书为宋刻本，但书内线索并不完全一致。请为每条证据分配可信强度，再写出有限度结论。", question: "现有材料能否支持“宋刻本”这一判断？",
    evidence: [
      { id: "preface", label: "卷首有南宋纪年序", detail: "序叶纸色略异，装订位置也不连贯。", anchor: 38, why: "纪年重要，但序叶可能后配，必须先确认与正文是否同一制作阶段。" },
      { id: "taboo", label: "正文稳定避一宋帝名讳", detail: "避讳贯穿多卷，不像偶然缺笔。", anchor: 72, why: "系统性避讳可形成时间线索，但仍须排除翻刻沿袭。" },
      { id: "engraver", label: "两名刻工见于南宋方志", detail: "姓名仅见于部分书叶。", anchor: 78, why: "刻工活动年代与具体书叶相合时较强，但不能自动覆盖补版部分。" },
      { id: "paper", label: "纸张纤维被描述为“古朴”", detail: "没有显微观察、尺寸或取样记录。", anchor: 18, why: "“古朴”是印象，不是可复查的纸张证据。" },
      { id: "catalog", label: "清代目录著录一部同名宋本", detail: "目录没有卷数、行款和递藏信息可与此本对应。", anchor: 30, why: "同名著录只能证明曾有此类版本，不能直接证明眼前这一本就是该本。" },
    ], model: "现有避讳和部分刻工线索支持正文中存在南宋版刻层次，但序叶可能后配、目录又无法与此本唯一对应，宜暂称“疑有南宋刻印基础，仍须核查版式、纸墨和补版层次”。",
  },
  {
    id: "collation", chapter: "第六章", title: "一句异文该不该改", brief: "甲本作“治其国”，乙本作“理其国”。你需要判断各条材料能承担多强的校勘作用。", question: "能否据现有材料把甲本直接改成“理其国”？",
    evidence: [
      { id: "old", label: "乙本年代早一百年", detail: "乙本残损，但该字清晰。", anchor: 70, why: "早本是重要见证，却不自动等于原文。" },
      { id: "usage", label: "本书同篇另三处都作“治”", detail: "语法位置与争议句相近。", anchor: 68, why: "稳定内部用例能支持本校，但还要解释为何乙本不同。" },
      { id: "quote", label: "更早类书引文作“理”", detail: "类书常有节引和改写。", anchor: 52, why: "早引有价值，但转引过程降低了直接性。" },
      { id: "meaning", label: "“理”读起来更顺", detail: "没有进一步语言史说明。", anchor: 20, why: "现代语感不能代替历史语言和版本证据。" },
      { id: "taboo", label: "乙本可能因避讳改“治”为“理”", detail: "同卷其他位置也有相同替换。", anchor: 82, why: "若替换规律稳定，可解释异文产生机制，是关键反证。" },
    ], model: "乙本虽早，但同卷存在系统性避讳替换；结合甲本与本书内部用例，暂不宜径改。校记应保留乙本“理”这一异文，并说明避讳可能性。",
  },
  {
    id: "forgery", chapter: "第九章", title: "一部托名古书的层次", brief: "题名托于先秦人物，但其中可能既有后世增益，也保存较早材料。请避免把判断压缩成简单真假二选一。", question: "应怎样描述这部书的真伪与价值？",
    evidence: [
      { id: "title", label: "书名与先秦作者相连", detail: "最早明确著录见于唐代目录。", anchor: 25, why: "题名是需要解释的传统，不是作者身份的直接证明。" },
      { id: "terms", label: "出现汉以后制度用语", detail: "多处用法与后世官制相合。", anchor: 82, why: "明确时代错位可强烈反对整书先秦成书说。" },
      { id: "quote", label: "其中两段见于早期出土材料", detail: "字句相近但篇章结构不同。", anchor: 70, why: "可支持部分材料较早，却不能证明现存全书同样早出。" },
      { id: "style", label: "有人认为文风“古雅”", detail: "没有量化语料或逐篇分析。", anchor: 15, why: "整体审美印象很容易循环论证。" },
      { id: "layers", label: "各篇术语和思想层次差异明显", detail: "差异与篇组分布相对应。", anchor: 76, why: "稳定的篇组差异支持层累形成，需要逐层讨论。" },
    ], model: "现存题名不能证明先秦作者身份，汉以后制度语也排除了整书先秦成书；但部分材料可能具有较早来源。较稳妥的结论是把它视为层累编成之书，分别讨论篇组年代与文献价值。",
  },
  {
    id: "fragment", chapter: "第十四章", title: "两片敦煌残卷能否缀合", brief: "两个机构分别收藏一片残卷，内容前后相接，但物质线索并不完全公开。请评估“同卷缀合”的证据链。", question: "现有材料足以宣布两片原属同一写卷吗？",
    evidence: [
      { id: "text", label: "两片文字内容连续", detail: "前片末句与后片首句语义相接。", anchor: 58, why: "内容连续很重要，但同一文本的不同抄本也可能相接。" },
      { id: "hand", label: "书手、行高和字距高度接近", detail: "基于同尺度高清图像测量。", anchor: 80, why: "书写与版面一致是较强的同卷证据。" },
      { id: "tear", label: "断口轮廓可以拼接", detail: "两馆图像拍摄角度和缩放比例不同。", anchor: 48, why: "在图像标定完成前，视觉拼合仍可能产生错觉。" },
      { id: "paper", label: "纸张色泽相近", detail: "缺少纤维、厚度和帘纹记录。", anchor: 22, why: "颜色受拍摄与老化影响，单独证明力很低。" },
      { id: "history", label: "两片收藏史都指向同一批流散材料", detail: "早期旧号之间仍缺一环。", anchor: 62, why: "共同来源提高可能性，但编号链的缺口应保留。" },
    ], model: "内容、书手和版面共同支持同卷可能，但断口图像尚未标定，纸张证据也不足；现阶段宜称“拟缀”，待同尺度影像、纤维与旧号链核查后再提高结论强度。",
  },
];

function save(score: number, total: number) {
  try {
    const progress = JSON.parse(localStorage.getItem("wxlab-progress") || "{}");
    progress["evidence-calibration"] = { completed: true, score, total, updatedAt: new Date().toISOString() };
    localStorage.setItem("wxlab-progress", JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent("wxlab-progress-updated"));
  } catch { /* 存储受限时不影响本次操作 */ }
}

export default function EvidenceCalibrationLab() {
  const [caseIndex, setCaseIndex] = useState(0);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [claim, setClaim] = useState("");
  const [limit, setLimit] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const dossier = dossiers[caseIndex];
  const values = dossier.evidence.map((item) => weights[item.id] ?? 50);
  const calibrated = useMemo(() => dossier.evidence.filter((item, index) => Math.abs(values[index] - item.anchor) <= 20).length, [dossier, values]);
  const ready = claim.trim().length >= 24 && Object.keys(weights).length === dossier.evidence.length && limit;

  function changeCase(index: number) { setCaseIndex(index); setWeights({}); setClaim(""); setLimit(false); setRevealed(false); }
  function reveal() { setRevealed(true); save(calibrated + (claim.trim().length >= 24 ? 1 : 0) + (limit ? 1 : 0), dossier.evidence.length + 2); }

  return <div className="calibration-lab">
    <nav aria-label="选择证据案卷">{dossiers.map((item, index) => <button key={item.id} className={index === caseIndex ? "active" : ""} onClick={() => changeCase(index)}><small>{item.chapter}</small><strong>{item.title}</strong></button>)}</nav>
    <section className="calibration-case">
      <header><div><small>{dossier.chapter} · 第 {caseIndex + 1}/{dossiers.length} 案</small><h2>{dossier.title}</h2><p>{dossier.brief}</p></div><aside><span>要回答的问题</span><strong>{dossier.question}</strong></aside></header>
      <div className="evidence-sliders">{dossier.evidence.map((item) => { const value = weights[item.id] ?? 50; return <article key={item.id}><header><strong>{item.label}</strong><output>{value}</output></header><p>{item.detail}</p><label><span>弱线索</span><input type="range" min="0" max="100" step="5" value={value} aria-label={`${item.label}的证据强度`} disabled={revealed} onChange={(event) => setWeights((current) => ({ ...current, [item.id]: Number(event.target.value) }))} /><span>强证据</span></label>{revealed && <div className={Math.abs(value - item.anchor) <= 20 ? "aligned" : "diverged"}><b>参考区间中心 {item.anchor}</b><p>{item.why}</p></div>}</article>; })}</div>
      <section className="bounded-claim"><label><span>写下你的有限度结论 <b>{claim.trim().length}/24 字起</b></span><textarea value={claim} disabled={revealed} onChange={(event) => setClaim(event.target.value)} placeholder="例如：现有线索较支持……，但……尚未核对，因此暂时只能判断……" /></label><label className="limit-check"><input type="checkbox" checked={limit} disabled={revealed} onChange={(event) => setLimit(event.target.checked)} /><span>我的结论至少说明了一项反证、缺口或不能推出的内容。</span></label></section>
      {!revealed ? <footer><p>这里不要求猜中一个唯一数字。你的任务是让证据强弱、推理跨度和结论语气相互匹配。</p><button disabled={!ready} onClick={reveal}>封存判断，查看校准报告</button></footer> : <section className="calibration-report"><header><div><small>CALIBRATION REPORT</small><strong>{calibrated}/{dossier.evidence.length}</strong><span>证据强度落入参考区间</span></div><p>分歧不等于简单答错。请比较你和参考判断分别依赖了什么、忽略了什么。</p></header><blockquote><small>参考结论</small>{dossier.model}</blockquote><div><button onClick={() => changeCase(caseIndex)}>重做本案</button><button onClick={() => changeCase((caseIndex + 1) % dossiers.length)}>进入下一案 →</button></div></section>}
    </section>
  </div>;
}

