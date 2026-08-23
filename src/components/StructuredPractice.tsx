import { useMemo, useState } from "react";
import "./StructuredPractice.css";

type Pair = { left: string; right: string };
type ClassItem = { label: string; zone: string };
type Quiz = {
  id: string; chapter: number; type: string; prompt: string; explanation: string;
  options?: string[]; answer?: number | boolean | number[]; answers?: Array<number | string>;
  pairs?: Pair[]; items?: Array<string | ClassItem>; zones?: string[];
  evidence_ids?: string[]; answer_ids?: string[]; rubric?: string[];
};

const typeNames: Record<string, string> = {
  single_choice: "单选", multiple_choice: "多选", true_false: "判断", fill_blank: "填空",
  matching: "配对", ordering: "排序", classification: "归类", evidence: "证据判断", short_answer: "简答自评",
};

function equalSets(a: Array<number | string>, b: Array<number | string>) {
  return a.length === b.length && [...a].sort().every((item, index) => item === [...b].sort()[index]);
}

function save(score: number, total: number, chapter: number) {
  const key = "wxlab-progress";
  const progress = JSON.parse(localStorage.getItem(key) || "{}");
  progress[`ch${String(chapter).padStart(2, "0")}-structured-practice`] = { completed: true, score, total, title: `第${chapter === 1 ? "一" : chapter === 2 ? "二" : chapter}章·九题型综合练习`, updatedAt: new Date().toISOString() };
  localStorage.setItem(key, JSON.stringify(progress));
  window.dispatchEvent(new CustomEvent("wxlab-progress-updated"));
}

function updateWrongBook(quiz: Quiz, correct: boolean) {
  const key = "wxlab-wrongbook";
  try {
    const wrongBook = JSON.parse(localStorage.getItem(key) || "{}");
    if (correct) delete wrongBook[quiz.id];
    else wrongBook[quiz.id] = {
      id: quiz.id, chapter: quiz.chapter, type: quiz.type, prompt: quiz.prompt,
      explanation: quiz.explanation, attempts: (wrongBook[quiz.id]?.attempts ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(wrongBook));
    window.dispatchEvent(new CustomEvent("wxlab-progress-updated"));
  } catch { /* 存储不可用时不阻塞答题 */ }
}

export default function StructuredPractice({ quizzes }: { quizzes: Quiz[] }) {
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const quiz = quizzes[index];
  const response = responses[quiz.id];
  const isChecked = checked[quiz.id];
  const completed = Object.keys(checked).length;
  const score = Object.values(results).filter(Boolean).length;

  const matchRights = useMemo(() => quiz.pairs?.map((pair) => pair.right).reverse() ?? [], [quiz]);
  const ordering = (response as string[] | undefined) ?? (quiz.type === "ordering" ? quiz.items as string[] : []);

  function setResponse(value: unknown) {
    setResponses((state) => ({ ...state, [quiz.id]: value }));
  }

  function evaluate(forcedResponse: unknown = response) {
    let correct = false;
    if (quiz.type === "single_choice" || quiz.type === "true_false") correct = forcedResponse === quiz.answer;
    if (quiz.type === "multiple_choice") correct = equalSets((forcedResponse as number[] | undefined) ?? [], quiz.answers as number[]);
    if (quiz.type === "fill_blank") correct = (quiz.answers as string[]).some((answer) => answer.trim().toLowerCase() === String(forcedResponse ?? "").trim().toLowerCase());
    if (quiz.type === "matching") correct = quiz.pairs!.every((pair) => (forcedResponse as Record<string, string> | undefined)?.[pair.left] === pair.right);
    if (quiz.type === "ordering") correct = (quiz.answer as number[]).every((sourceIndex, position) => ordering[position] === (quiz.items as string[])[sourceIndex]);
    if (quiz.type === "classification") correct = (quiz.items as ClassItem[]).every((item) => (forcedResponse as Record<string, string> | undefined)?.[item.label] === item.zone);
    if (quiz.type === "evidence") correct = equalSets((forcedResponse as string[] | undefined) ?? [], quiz.answer_ids!);
    if (quiz.type === "short_answer") correct = forcedResponse === "self-pass";
    const nextResults = { ...results, [quiz.id]: correct };
    updateWrongBook(quiz, correct);
    setResults(nextResults);
    setChecked((state) => ({ ...state, [quiz.id]: true }));
    if (completed + (isChecked ? 0 : 1) === quizzes.length) save(Object.values(nextResults).filter(Boolean).length, quizzes.length, quiz.chapter);
  }

  function toggleList(value: number | string) {
    const list = (response as Array<number | string> | undefined) ?? [];
    setResponse(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function move(position: number, direction: -1 | 1) {
    const current = ordering.length ? [...ordering] : [...(quiz.items as string[])];
    const target = position + direction;
    if (target < 0 || target >= current.length) return;
    [current[position], current[target]] = [current[target], current[position]];
    setResponse(current);
  }

  return (
    <div className="structured-practice">
      <header>
        <div><small>第{quiz.chapter === 1 ? "一" : quiz.chapter === 2 ? "二" : quiz.chapter}章综合练习</small><strong>{completed}/{quizzes.length} 已完成 · {score} 得分</strong></div>
        <div className="practice-progress"><span style={{ width: `${(completed / quizzes.length) * 100}%` }} /></div>
      </header>
      <div className="practice-body">
        <nav aria-label="题目导航">{quizzes.map((item, itemIndex) => <button key={item.id} className={`${itemIndex === index ? "active" : ""} ${checked[item.id] ? (results[item.id] ? "right" : "wrong") : ""}`} onClick={() => setIndex(itemIndex)}>{itemIndex + 1}<small>{typeNames[item.type]}</small></button>)}</nav>
        <article>
          <p className="practice-type">{typeNames[quiz.type]} · 第 {index + 1} 题</p>
          <h3>{quiz.prompt}</h3>

          {(quiz.type === "single_choice" || quiz.type === "multiple_choice") && <div className="practice-options">{quiz.options!.map((option, optionIndex) => {
            const selected = quiz.type === "single_choice" ? response === optionIndex : ((response as number[] | undefined) ?? []).includes(optionIndex);
            return <button disabled={isChecked} aria-pressed={selected} className={selected ? "selected" : ""} onClick={() => quiz.type === "single_choice" ? setResponse(optionIndex) : toggleList(optionIndex)} key={option}><span>{quiz.type === "single_choice" ? String.fromCharCode(65 + optionIndex) : selected ? "✓" : "□"}</span>{option}</button>;
          })}</div>}

          {quiz.type === "true_false" && <div className="binary-options"><button disabled={isChecked} className={response === true ? "selected" : ""} onClick={() => setResponse(true)}>判断成立</button><button disabled={isChecked} className={response === false ? "selected" : ""} onClick={() => setResponse(false)}>判断不成立</button></div>}
          {quiz.type === "fill_blank" && <input className="fill-answer" disabled={isChecked} value={String(response ?? "")} onChange={(event) => setResponse(event.target.value)} placeholder="输入答案" />}

          {quiz.type === "matching" && <div className="pairing-grid">{quiz.pairs!.map((pair) => <label key={pair.left}><strong>{pair.left}</strong><span>连接到</span><select disabled={isChecked} value={(response as Record<string,string> | undefined)?.[pair.left] ?? ""} onChange={(event) => setResponse({ ...(response as object ?? {}), [pair.left]: event.target.value })}><option value="">请选择</option>{matchRights.map((right) => <option key={right}>{right}</option>)}</select></label>)}</div>}

          {quiz.type === "ordering" && <ol className="ordering-list">{ordering.map((item, itemIndex) => <li key={item}><span>{itemIndex + 1}</span><strong>{item}</strong><div><button disabled={isChecked || itemIndex === 0} onClick={() => move(itemIndex, -1)}>↑</button><button disabled={isChecked || itemIndex === ordering.length - 1} onClick={() => move(itemIndex, 1)}>↓</button></div></li>)}</ol>}

          {quiz.type === "classification" && <div className="classification-grid">{(quiz.items as ClassItem[]).map((item) => <label key={item.label}><strong>{item.label}</strong><select disabled={isChecked} value={(response as Record<string,string> | undefined)?.[item.label] ?? ""} onChange={(event) => setResponse({ ...(response as object ?? {}), [item.label]: event.target.value })}><option value="">放入类别</option>{quiz.zones!.map((zone) => <option key={zone}>{zone}</option>)}</select></label>)}</div>}

          {quiz.type === "evidence" && <div className="evidence-board">{quiz.evidence_ids!.map((evidence) => { const selected = ((response as string[] | undefined) ?? []).includes(evidence); return <button disabled={isChecked} aria-pressed={selected} className={selected ? "selected" : ""} onClick={() => toggleList(evidence)} key={evidence}><span>{selected ? "已收入证据链" : "点击选取"}</span><strong>{evidence}</strong></button>; })}</div>}

          {quiz.type === "short_answer" && <div className="short-answer"><textarea disabled={isChecked} value={typeof response === "string" && response !== "self-pass" && response !== "self-retry" ? response : ""} onChange={(event) => setResponse(event.target.value)} placeholder="先写下你的判断与依据……" />{isChecked && <ul>{quiz.rubric!.map((item) => <li key={item}>{item}</li>)}</ul>}{!isChecked && <p>提交后按评分要点自评；简答题不由机器替你判断学术质量。</p>}</div>}

          {!isChecked && quiz.type !== "short_answer" && <button className="submit-answer" disabled={response == null || (Array.isArray(response) && response.length === 0)} onClick={evaluate}>提交判断</button>}
          {!isChecked && quiz.type === "short_answer" && <button className="submit-answer" disabled={!String(response ?? "").trim()} onClick={() => setChecked((state) => ({ ...state, [quiz.id]: true }))}>查看评分要点</button>}
          {isChecked && quiz.type === "short_answer" && response !== "self-pass" && response !== "self-retry" && <div className="self-score"><button onClick={() => { setResponse("self-pass"); evaluate("self-pass"); }}>达到要点</button><button onClick={() => { setResponse("self-retry"); evaluate("self-retry"); }}>需要重写</button></div>}

          {isChecked && (quiz.type !== "short_answer" || response === "self-pass" || response === "self-retry") && <div className={`practice-feedback ${results[quiz.id] ? "success" : ""}`}><strong>{results[quiz.id] ? "判断成立" : "这一步还可以修正"}</strong><p>{quiz.explanation}</p><button onClick={() => setIndex((index + 1) % quizzes.length)}>{index === quizzes.length - 1 ? "回到第一题" : "下一题 →"}</button></div>}
        </article>
      </div>
    </div>
  );
}
