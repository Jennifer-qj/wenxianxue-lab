import { useEffect, useState } from "react";
import type { LessonQuiz } from "../data/lessons";

export default function ChapterCheck({ chapterId, title, quiz }: { chapterId: string; title: string; quiz: LessonQuiz[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [saved, setSaved] = useState(false);
  const completed = Object.keys(answers).length === quiz.length;
  const score = quiz.reduce((total, item, index) => total + (answers[index] === item.answer ? 1 : 0), 0);

  useEffect(() => {
    if (!completed || saved) return;
    const key = "wxlab-progress";
    const progress = JSON.parse(localStorage.getItem(key) || "{}");
    progress[chapterId] = { completed: true, score, total: quiz.length, title, updatedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent("wxlab-progress-updated"));
    setSaved(true);
  }, [chapterId, completed, saved, score, quiz.length, title]);

  return (
    <div className="chapter-check">
      {quiz.map((item, questionIndex) => {
        const choice = answers[questionIndex];
        const answered = choice !== undefined;
        return (
          <section className="check-question" key={item.question}>
            <div className="check-number">0{questionIndex + 1}</div>
            <div>
              <h3>{item.question}</h3>
              <div className="check-options">
                {item.options.map((option, optionIndex) => (
                  <button
                    key={option}
                    disabled={answered}
                    className={answered && optionIndex === choice ? (optionIndex === item.answer ? "correct" : "incorrect") : ""}
                    onClick={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))}
                  >
                    <span>{String.fromCharCode(65 + optionIndex)}</span>{option}
                  </button>
                ))}
              </div>
              {answered && (
                <p className="check-feedback">
                  <strong>{choice === item.answer ? "判断正确。" : `答案是 ${String.fromCharCode(65 + item.answer)}。`}</strong>
                  {item.explanation}
                </p>
              )}
            </div>
          </section>
        );
      })}
      {completed && (
        <div className="check-result" aria-live="polite">
          <span>本章检测完成</span>
          <strong>{score} / {quiz.length}</strong>
          <button onClick={() => { setAnswers({}); setSaved(false); }}>重新检测</button>
        </div>
      )}
    </div>
  );
}
