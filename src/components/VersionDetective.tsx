import { useEffect, useMemo, useState } from "react";

type Clue = {
  label: string;
  evidence: string;
  question: string;
  options: { text: string; correct: boolean; feedback: string }[];
};

const clues: Clue[] = [
  {
    label: "线索一 · 避讳",
    evidence: "书中多处将“玄”字改写或缺末笔。",
    question: "这条线索最稳妥的解释是什么？",
    options: [
      { text: "它一定是宋版书", correct: false, feedback: "单一字形不能直接证明是宋版，还要排除后刻本、翻刻本和偶然缺笔。" },
      { text: "可能与清代避讳有关", correct: true, feedback: "正确。清代避康熙帝名讳时常涉及“玄”字，但仍须结合序跋、牌记等证据。" },
      { text: "缺笔只是印刷损坏，没有价值", correct: false, feedback: "印刷损坏当然可能发生，但有规律地多次出现，就值得作为版本证据继续观察。" },
    ],
  },
  {
    label: "线索二 · 牌记",
    evidence: "卷末牌记提供了刊刻者和刊刻地点，但牌记所在叶与前文纸色略有差异。",
    question: "下一步最应该做什么？",
    options: [
      { text: "直接按牌记确定全书年代", correct: false, feedback: "牌记可能被后人补配、挖改或沿用，不能跳过物质检查。" },
      { text: "核查该叶是否后配，并与其他著录互证", correct: true, feedback: "正确。牌记很重要，但要确认它与整部书是否属于同一制作阶段。" },
      { text: "忽略牌记，只看字体", correct: false, feedback: "版本鉴定依靠证据组合。字体也可能被后世仿刻，不能取代其他线索。" },
    ],
  },
  {
    label: "线索三 · 证据组合",
    evidence: "避讳现象、序跋年代、刻工活动时间大体相合；纸张和装帧可能经过后世修整。",
    question: "怎样写结论更符合文献学态度？",
    options: [
      { text: "综合证据支持清代早期刻本，但装帧并非原装，仍需对照书影", correct: true, feedback: "很好。结论说明了证据强度、保留条件和下一步验证方式。" },
      { text: "绝对是真正的清初原装本", correct: false, feedback: "“绝对”“原装”超出了现有证据，忽略了装帧可能后修的情况。" },
      { text: "所有证据都有局限，所以无法得出任何结论", correct: false, feedback: "多闻阙疑不等于拒绝判断；应当给出有证据支持、同时保留边界的结论。" },
    ],
  },
];

export default function VersionDetective() {
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const clue = clues[step];
  const percent = useMemo(() => ((step + (done ? 1 : 0)) / clues.length) * 100, [step, done]);

  useEffect(() => {
    if (!done) return;
    const key = "wxlab-progress";
    const current = JSON.parse(localStorage.getItem(key) || "{}");
    current["version-detective"] = {
      completed: true,
      score,
      total: clues.length,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent("wxlab-progress-updated"));
  }, [done, score]);

  function answer(index: number) {
    if (choice !== null) return;
    setChoice(index);
    if (clue.options[index].correct) setScore((value) => value + 1);
  }

  function next() {
    if (step === clues.length - 1) {
      setDone(true);
      return;
    }
    setStep((value) => value + 1);
    setChoice(null);
  }

  function restart() {
    setStep(0);
    setChoice(null);
    setScore(0);
    setDone(false);
  }

  if (done) {
    return (
      <section className="detective-result" aria-live="polite">
        <span className="seal">案</span>
        <p className="mini-label">鉴定记录已归档</p>
        <h2>{score === 3 ? "证据意识很敏锐" : "你完成了第一次版本会诊"}</h2>
        <p>本轮得分 {score} / {clues.length}。版本鉴定的关键不是猜中年代，而是区分“线索”“证据”和“结论”的强度。</p>
        <button className="game-button" onClick={restart}>重新鉴定</button>
      </section>
    );
  }

  return (
    <section className="detective">
      <div className="game-progress" aria-label={`第 ${step + 1} 关，共 ${clues.length} 关`}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className="case-top">
        <div>
          <p className="mini-label">{clue.label}</p>
          <h2>无名刻本鉴定案</h2>
        </div>
        <span className="case-number">CASE 001</span>
      </div>
      <blockquote>{clue.evidence}</blockquote>
      <p className="question">{clue.question}</p>
      <div className="options">
        {clue.options.map((option, index) => (
          <button
            key={option.text}
            className={choice === index ? (option.correct ? "correct" : "incorrect") : ""}
            onClick={() => answer(index)}
            disabled={choice !== null}
          >
            <span>{String.fromCharCode(65 + index)}</span>
            {option.text}
          </button>
        ))}
      </div>
      {choice !== null && (
        <div className="feedback" aria-live="polite">
          <strong>{clue.options[choice].correct ? "判断成立" : "还需再审"}</strong>
          <p>{clue.options[choice].feedback}</p>
          <button className="game-button" onClick={next}>
            {step === clues.length - 1 ? "完成鉴定" : "查看下一条线索"} →
          </button>
        </div>
      )}
    </section>
  );
}
