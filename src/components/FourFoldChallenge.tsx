import { useEffect, useState } from "react";

const cases = [
  { book: "《周易》", clue: "以卦爻体系及其传注为核心的经典", answer: "经", reason: "传统四部分类中，儒家经典及其传注归入经部。" },
  { book: "《史记》", clue: "以本纪、表、书、世家、列传组织历史叙述", answer: "史", reason: "纪传体正史是史部最典型的门类之一。" },
  { book: "《庄子》", clue: "先秦诸子著作，道家思想的重要文献", answer: "子", reason: "诸子百家著作通常归入子部；分类依据不只是文学风格。" },
  { book: "《陶渊明集》", clue: "汇集一位作者诗文的别集", answer: "集", reason: "一人诗文的别集归入集部，与汇集多人的总集相区别。" },
  { book: "《资治通鉴》", clue: "按年月编排史事的编年体史书", answer: "史", reason: "虽然具有强烈的议论与文学性，其核心体例和用途仍属于史部。" },
  { book: "《文选》", clue: "选录多位作者诗文的总集", answer: "集", reason: "汇集多位作者文学作品的总集属于集部。" },
] as const;

const categories = ["经", "史", "子", "集"] as const;

export default function FourFoldChallenge() {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const current = cases[index];

  useEffect(() => {
    if (!done) return;
    const key = "wxlab-progress";
    const stored = JSON.parse(localStorage.getItem(key) || "{}");
    stored["four-fold"] = { completed: true, score, total: cases.length, updatedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(stored));
    window.dispatchEvent(new CustomEvent("wxlab-progress-updated"));
  }, [done, score]);

  function choose(category: string) {
    if (choice) return;
    setChoice(category);
    if (category === current.answer) setScore((value) => value + 1);
  }

  function next() {
    if (index === cases.length - 1) {
      setDone(true);
      return;
    }
    setIndex((value) => value + 1);
    setChoice(null);
  }

  function restart() {
    setIndex(0);
    setChoice(null);
    setScore(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="fourfold-result" aria-live="polite">
        <span>四部归架完成</span>
        <strong>{score}<small> / {cases.length}</small></strong>
        <p>{score >= 5 ? "你已经抓住了“按内容与体例归类”的基本原则。" : "再试一次，重点观察每部书的核心内容与编纂体例。"}</p>
        <button onClick={restart}>重新归架</button>
      </div>
    );
  }

  const correct = choice === current.answer;

  return (
    <div className="fourfold-game">
      <div className="shelf-progress">
        {cases.map((item, itemIndex) => <i className={itemIndex < index || (itemIndex === index && choice) ? "filled" : ""} key={item.book} />)}
      </div>
      <div className="catalog-card">
        <small>待归架典籍 · {index + 1}/{cases.length}</small>
        <h3>{current.book}</h3>
        <p>{current.clue}</p>
      </div>
      <p className="prompt">它最适合归入哪一部？</p>
      <div className="fourfold-options">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => choose(category)}
            disabled={choice !== null}
            className={choice === category ? (category === current.answer ? "correct" : "incorrect") : ""}
          >
            <strong>{category}</strong><small>部</small>
          </button>
        ))}
      </div>
      {choice && (
        <div className={`catalog-feedback ${correct ? "is-correct" : ""}`} aria-live="polite">
          <strong>{correct ? "归架正确" : `应归入${current.answer}部`}</strong>
          <p>{current.reason}</p>
          <button onClick={next}>{index === cases.length - 1 ? "查看成绩" : "下一部典籍 →"}</button>
        </div>
      )}
    </div>
  );
}
