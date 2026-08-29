import { useEffect, useMemo, useState } from "react";
import "./LabDirectory.css";

type Method = "证据推理" | "分类判断" | "流程重建" | "物质观察";
type Level = "入门" | "进阶" | "综合";
type Experiment = {
  id: string; title: string; chapter: string; method: Method; level: Level; minutes: number;
  output: string; description: string; anchor: string;
};

const experiments: Experiment[] = [
  { id: "fragment-casebook", title: "残卷归档调查", chapter: "第二、五、七、十四章", method: "证据推理", level: "综合", minutes: 18, output: "残卷归档调查报告", description: "区分物质、目录与流传证据，控制缀合命题的强度。", anchor: "fragment-casebook" },
  { id: "rare-book-dossier", title: "古籍鉴定综合案卷", chapter: "跨章", method: "证据推理", level: "综合", minutes: 15, output: "综合鉴定意见", description: "在六间证据室之间推进，管理互相支持或冲突的线索。", anchor: "rare-book-dossier" },
  { id: "version-detective", title: "版本鉴定侦探", chapter: "第五章", method: "证据推理", level: "进阶", minutes: 8, output: "版本研判单", description: "先封存初始假说，再分批揭证并记录信心变化。", anchor: "version-detective" },
  { id: "four-fold", title: "四部分类挑战", chapter: "第七章", method: "分类判断", level: "入门", minutes: 6, output: "目录判断单", description: "声明分类框架、批量归架，并解释一部边界书。", anchor: "four-fold" },
  { id: "evidence-calibration", title: "证据称量室", chapter: "多章", method: "证据推理", level: "进阶", minutes: 8, output: "有限度结论", description: "给冲突线索分配强度，观察判断是否超过证据承载力。", anchor: "evidence-calibration" },
  { id: "collation-workbench", title: "校勘工作台", chapter: "第六章", method: "证据推理", level: "综合", minutes: 10, output: "可复查校勘记", description: "为异文材料分配证据角色，并写出取舍理由。", anchor: "criticism-studio" },
  { id: "version-stemma", title: "版本谱系推理", chapter: "第五、六章", method: "证据推理", level: "综合", minutes: 10, output: "谱系假说", description: "依据共享讹误连接版本，同时注明模型的限制。", anchor: "criticism-studio" },
  { id: "collation-clinic", title: "校勘诊所", chapter: "第六章", method: "流程重建", level: "入门", minutes: 5, output: "流程解释", description: "重排校勘步骤，并解释关键先后关系。", anchor: "skill-arcade" },
  { id: "carrier-museum", title: "载体博物馆", chapter: "第二章", method: "物质观察", level: "入门", minutes: 5, output: "载体鉴别记录", description: "用材料、制作和装联线索辨认五类载体。", anchor: "skill-arcade" },
  { id: "binding-puzzle", title: "装帧演变拼图", chapter: "第二章", method: "流程重建", level: "入门", minutes: 4, output: "形制边界说明", description: "重建学习序列，同时辨认“演变”叙述的局限。", anchor: "skill-arcade" },
  { id: "leishu-congshu", title: "类书还是丛书", chapter: "第九章", method: "分类判断", level: "入门", minutes: 5, output: "组织逻辑说明", description: "不看书名猜类别，而从材料组织单位作判断。", anchor: "skill-arcade" },
];

const methods: Array<"全部" | Method> = ["全部", "证据推理", "分类判断", "流程重建", "物质观察"];
const levels: Array<"全部" | Level> = ["全部", "入门", "进阶", "综合"];

export default function LabDirectory({ baseUrl }: { baseUrl: string }) {
  const [method, setMethod] = useState<(typeof methods)[number]>("全部");
  const [level, setLevel] = useState<(typeof levels)[number]>("全部");
  const [time, setTime] = useState(18);
  const [completed, setCompleted] = useState<string[]>([]);
  const [suggested, setSuggested] = useState("four-fold");

  useEffect(() => {
    try {
      const progress = JSON.parse(localStorage.getItem("wxlab-progress") || "{}");
      setCompleted(Object.entries(progress).filter(([, value]: [string, any]) => value?.completed).map(([key]) => key.replace(/^case-/, "")));
    } catch { /* 没有本地记录时保持空白 */ }
  }, []);

  const filtered = useMemo(() => experiments.filter((item) => (method === "全部" || item.method === method) && (level === "全部" || item.level === level) && item.minutes <= time), [method, level, time]);
  const recommendation = experiments.find((item) => item.id === suggested) ?? experiments[2];

  function chooseOne() {
    const pool = filtered.filter((item) => !completed.includes(item.id));
    const candidates = pool.length ? pool : filtered.length ? filtered : experiments;
    setSuggested(candidates[Math.floor(Math.random() * candidates.length)].id);
  }

  function hrefFor(item: Experiment) {
    const experiment = item.anchor === "skill-arcade" || item.anchor === "criticism-studio" ? `?experiment=${item.id}` : "";
    return `${baseUrl}lab/${experiment}#${item.anchor}`;
  }

  return <section className="lab-directory" aria-labelledby="lab-directory-title">
    <header><div><small>EXPERIMENT DIRECTORY · 实验目录</small><h2 id="lab-directory-title">今天想练哪一种判断？</h2><p>先按训练方式、难度和时间缩小范围。完成标记只读取当前浏览器，不代表能力认证。</p></div><aside><span>建议第一次体验</span><strong>{recommendation.title}</strong><small>{recommendation.minutes} 分钟 · 产出：{recommendation.output}</small><div><a href={hrefFor(recommendation)}>开始这项实验 →</a><button type="button" onClick={chooseOne}>换一个</button></div></aside></header>
    <div className="lab-filters"><fieldset><legend>训练方式</legend>{methods.map((item) => <button type="button" className={method === item ? "active" : ""} aria-pressed={method === item} onClick={() => setMethod(item)} key={item}>{item}</button>)}</fieldset><fieldset><legend>难度</legend>{levels.map((item) => <button type="button" className={level === item ? "active" : ""} aria-pressed={level === item} onClick={() => setLevel(item)} key={item}>{item}</button>)}</fieldset><label><span>最多用时 <b>{time} 分钟</b></span><input type="range" min="4" max="18" step="1" value={time} onChange={(event) => setTime(Number(event.target.value))} /></label></div>
    <div className="lab-directory-count"><strong>{filtered.length}</strong><span>项符合当前条件</span>{!filtered.length && <button type="button" onClick={() => { setMethod("全部"); setLevel("全部"); setTime(18); }}>清除筛选</button>}</div>
    <div className="lab-directory-grid">{filtered.map((item, index) => <article className={suggested === item.id ? "suggested" : ""} key={item.id}><header><span>{String(index + 1).padStart(2, "0")}</span>{completed.includes(item.id) && <b>本机已完成</b>}</header><small>{item.chapter} · {item.method}</small><h3>{item.title}</h3><p>{item.description}</p><dl><div><dt>难度</dt><dd>{item.level}</dd></div><div><dt>预计</dt><dd>{item.minutes} 分钟</dd></div><div><dt>产出</dt><dd>{item.output}</dd></div></dl><a href={hrefFor(item)}>进入实验 →</a></article>)}</div>
  </section>;
}
