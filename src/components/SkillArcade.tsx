import { useEffect, useState } from "react";

type ChoiceRound = { prompt: string; context: string; options: string[]; answer: number; reason: string };

function save(id: string, score: number, total: number) {
  const key = "wxlab-progress";
  const progress = JSON.parse(localStorage.getItem(key) || "{}");
  progress[id] = { completed: true, score, total, updatedAt: new Date().toISOString() };
  localStorage.setItem(key, JSON.stringify(progress));
  window.dispatchEvent(new CustomEvent("wxlab-progress-updated"));
}

function ChoiceGame({ id, rounds }: { id: string; rounds: ChoiceRound[] }) {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const round = rounds[index];

  function next() {
    const nextScore = score + (choice === round.answer ? 1 : 0);
    if (index === rounds.length - 1) {
      setScore(nextScore);
      setDone(true);
      save(id, nextScore, rounds.length);
    } else {
      setScore(nextScore);
      setIndex((value) => value + 1);
      setChoice(null);
    }
  }

  if (done) return (
    <div className="arcade-result">
      <span>任务完成</span><strong>{score} / {rounds.length}</strong>
      <button onClick={() => { setIndex(0); setChoice(null); setScore(0); setDone(false); }}>再玩一次</button>
    </div>
  );

  return (
    <div className="choice-game">
      <small>第 {index + 1} / {rounds.length} 题</small>
      <h3>{round.prompt}</h3>
      <blockquote>{round.context}</blockquote>
      <div className="arcade-options">
        {round.options.map((option, optionIndex) => (
          <button
            key={option}
            disabled={choice !== null}
            onClick={() => setChoice(optionIndex)}
            className={choice === optionIndex ? (optionIndex === round.answer ? "correct" : "incorrect") : ""}
          ><span>{String.fromCharCode(65 + optionIndex)}</span>{option}</button>
        ))}
      </div>
      {choice !== null && <div className="arcade-feedback"><strong>{choice === round.answer ? "判断成立" : `正确选择：${round.options[round.answer]}`}</strong><p>{round.reason}</p><button onClick={next}>继续 →</button></div>}
    </div>
  );
}

function BindingPuzzle() {
  const correct = ["卷子装", "经折装", "蝴蝶装", "包背装", "线装"];
  const shuffled = ["线装", "经折装", "包背装", "卷子装", "蝴蝶装"];
  const [selected, setSelected] = useState<string[]>([]);
  const complete = selected.length === correct.length;
  const success = complete && selected.every((item, index) => item === correct[index]);

  function reset() { setSelected([]); }
  useEffect(() => {
    if (complete) save("binding-puzzle", success ? 1 : 0, 1);
  }, [complete, success]);

  return (
    <div className="binding-game">
      <p>按历史演变顺序点击五种装潢形制。选中的卡片会进入下方时间轴。</p>
      <div className="binding-pool">
        {shuffled.map((item) => <button key={item} disabled={selected.includes(item)} onClick={() => setSelected((items) => [...items, item])}>{item}</button>)}
      </div>
      <div className="binding-timeline">
        {correct.map((_, index) => <span className={selected[index] ? "filled" : ""} key={index}>{selected[index] ?? index + 1}</span>)}
      </div>
      {complete && <div className={`arcade-feedback ${success ? "success" : ""}`}><strong>{success ? "顺序重建成功" : "这条演变线还需要调整"}</strong><p>基本学习序列为：卷子装 → 经折装 → 蝴蝶装 → 包背装 → 线装。真实文献中形制可能并存，现存装帧也可能经过后改。</p><button onClick={reset}>重新排列</button></div>}
    </div>
  );
}

function ToolSorter() {
  const cards = [
    { title: "《太平御览》", type: "类书", clue: "按事类摘录群书材料" },
    { title: "《四库全书》", type: "丛书", clue: "汇集多种相对完整的著作" },
    { title: "《艺文类聚》", type: "类书", clue: "分类编排并保存大量旧文引文" },
    { title: "《知不足斋丛书》", type: "丛书", clue: "汇刻多种典籍" },
  ];
  const [index, setIndex] = useState(0);
  const [records, setRecords] = useState<boolean[]>([]);
  const [choice, setChoice] = useState<string | null>(null);
  const done = index === cards.length;
  const current = cards[index];

  function next(type: string) {
    if (choice) return;
    setChoice(type);
    const right = type === current.type;
    setRecords((items) => [...items, right]);
    setTimeout(() => {
      const nextIndex = index + 1;
      setIndex(nextIndex);
      setChoice(null);
      if (nextIndex === cards.length) save("leishu-congshu", records.filter(Boolean).length + (right ? 1 : 0), cards.length);
    }, 650);
  }

  if (done) return <div className="arcade-result"><span>工具书分拣完成</span><strong>{records.filter(Boolean).length} / {cards.length}</strong><button onClick={() => { setIndex(0); setRecords([]); setChoice(null); }}>重新分拣</button></div>;

  return (
    <div className="sorter">
      <small>待分拣 {index + 1}/{cards.length}</small>
      <div className="sort-card"><h3>{current.title}</h3><p>{current.clue}</p></div>
      <div className="sort-bins">
        {["类书", "丛书"].map((type) => <button key={type} className={choice === type ? (type === current.type ? "correct" : "incorrect") : ""} onClick={() => next(type)}><strong>{type}</strong><small>{type === "类书" ? "拆分材料，按类检索" : "保存多书，各自成篇"}</small></button>)}
      </div>
    </div>
  );
}

const collationRounds: ChoiceRound[] = [
  { prompt: "两版本一处文字不同", context: "甲本作“河清”，乙本作“何清”。你首先要记录和比较同书异本。", options: ["对校法", "本校法", "他校法", "直接臆改"], answer: 0, reason: "对校从同一文献的不同版本出发，先建立异文事实。" },
  { prompt: "全书相同句式反复出现", context: "疑字所在句可与本书另外十二处固定表达比较。", options: ["只查字典", "本校法", "删去疑字", "版本鉴定"], answer: 1, reason: "利用本书内部用例互证，属于本校。" },
  { prompt: "他书保存一段早期引文", context: "相关古书引用了本篇，文字正好可以解释当前脱文。", options: ["他校法", "只从最晚本", "不作记录", "看装帧"], answer: 0, reason: "用其他文献的引文、注释等校正本书，属于他校；仍需检查引文是否可靠。" },
];

const carrierRounds: ChoiceRound[] = [
  { prompt: "辨认载体", context: "材料狭长，多片编联，次序散乱会直接改变文本结构。", options: ["竹木简", "金文", "贝叶", "石刻"], answer: 0, reason: "简牍以单简编联成册，编绳朽断后次序重建是核心问题。" },
  { prompt: "辨认装潢", context: "书叶版心向内折叠，展开时形如蝴蝶展翼。", options: ["卷子装", "蝴蝶装", "线装", "经折装"], answer: 1, reason: "这是蝴蝶装的典型识别特征。" },
  { prompt: "判断证据强度", context: "纸张看起来很旧，但序跋、版式和著录尚未检查。", options: ["可直接断代", "只能作为待互证线索", "一定是伪本", "没有任何价值"], answer: 1, reason: "旧纸后用与仿古纸都可能出现，需与其他证据组合。" },
];

const games = [
  { id: "collation-clinic", tab: "校勘诊所", chapter: "第六章", intro: "面对异文，选择合适的校勘方法。", render: () => <ChoiceGame id="collation-clinic" rounds={collationRounds} /> },
  { id: "carrier-museum", tab: "载体博物馆", chapter: "第二章", intro: "从物质和形制特征辨认载体。", render: () => <ChoiceGame id="carrier-museum" rounds={carrierRounds} /> },
  { id: "binding-puzzle", tab: "装帧拼图", chapter: "第二章", intro: "亲手重建纸本文献装潢的学习序列。", render: () => <BindingPuzzle /> },
  { id: "leishu-congshu", tab: "工具书分拣", chapter: "第九章", intro: "用组织单位区分类书与丛书。", render: () => <ToolSorter /> },
];

export default function SkillArcade() {
  const [active, setActive] = useState(0);
  const game = games[active];
  return (
    <div className="skill-arcade">
      <nav className="arcade-tabs" aria-label="选择互动任务">
        {games.map((item, index) => <button className={active === index ? "active" : ""} onClick={() => setActive(index)} key={item.id}><small>{item.chapter}</small><strong>{item.tab}</strong></button>)}
      </nav>
      <section id={game.id} className="arcade-stage">
        <header><div><small>{game.chapter} · 可体验</small><h2>{game.tab}</h2></div><p>{game.intro}</p></header>
        {game.render()}
      </section>
    </div>
  );
}
