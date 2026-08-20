import { useEffect, useMemo, useState } from "react";

type Category = "经" | "史" | "子" | "集";
type Book = { id: string; book: string; clue: string; answer: Category; reason: string };

const books: Book[] = [
  { id: "zhouyi", book: "《周易》", clue: "卦爻体系及其传注", answer: "经", reason: "儒家经典及其传注归入经部。" },
  { id: "maoshi", book: "《毛诗正义》", clue: "《诗经》的传、笺与疏", answer: "经", reason: "经典的注疏仍随经书归入经部。" },
  { id: "shiji", book: "《史记》", clue: "本纪、表、书、世家、列传", answer: "史", reason: "纪传体正史属于史部。" },
  { id: "tongjian", book: "《资治通鉴》", clue: "按年月编排历代史事", answer: "史", reason: "编年体史书的核心体例决定其归史部。" },
  { id: "zhuangzi", book: "《庄子》", clue: "先秦道家思想著作", answer: "子", reason: "诸子百家著作通常归入子部。" },
  { id: "mengxi", book: "《梦溪笔谈》", clue: "涉及天文、技术、制度与见闻", answer: "子", reason: "传统目录常将此类综合性笔记归入子部。" },
  { id: "tao", book: "《陶渊明集》", clue: "一位作者的诗文别集", answer: "集", reason: "一人诗文的别集归入集部。" },
  { id: "wenxuan", book: "《文选》", clue: "选录多位作者诗文", answer: "集", reason: "汇集多位作者文学作品的总集归入集部。" },
];

const categories: { id: Category; subtitle: string }[] = [
  { id: "经", subtitle: "经典与传注" }, { id: "史", subtitle: "史书与史法" },
  { id: "子", subtitle: "诸子与专门知识" }, { id: "集", subtitle: "诗文别集与总集" },
];

export default function FourFoldChallenge() {
  const [placed, setPlaced] = useState<Record<string, Category>>({});
  const [active, setActive] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const score = useMemo(() => books.filter((item) => placed[item.id] === item.answer).length, [placed]);

  useEffect(() => {
    if (!checked) return;
    const key = "wxlab-progress";
    const stored = JSON.parse(localStorage.getItem(key) || "{}");
    stored["four-fold"] = { completed: true, score, total: books.length, updatedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(stored));
    window.dispatchEvent(new CustomEvent("wxlab-progress-updated"));
  }, [checked, score]);

  function move(id: string, category?: Category) {
    if (checked) return;
    setPlaced((current) => {
      const next = { ...current };
      if (category) next[id] = category;
      else delete next[id];
      return next;
    });
    setActive(null);
  }

  function drop(event: React.DragEvent, category?: Category) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    if (id) move(id, category);
  }

  function card(item: Book) {
    const right = placed[item.id] === item.answer;
    return <button key={item.id} draggable={!checked} className={`shelf-book ${active === item.id ? "active" : ""} ${checked ? (right ? "correct" : "incorrect") : ""}`} onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)} onClick={() => !checked && setActive(active === item.id ? null : item.id)}>
      <strong>{item.book}</strong><span>{item.clue}</span>{checked && <small>{item.reason}</small>}
    </button>;
  }

  function reset() { setPlaced({}); setActive(null); setChecked(false); }

  return (
    <div className="fourfold-game fourfold-shelves">
      <div className="shelf-progress" aria-label={`已归架 ${Object.keys(placed).length} 本，共 ${books.length} 本`}>{books.map((item) => <i className={placed[item.id] ? "filled" : ""} key={item.id} />)}</div>
      <p className="shelf-guide">拖动典籍卡到四部书架；触屏或键盘操作时，可先点典籍，再点书架。</p>
      <div className="book-cart" onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event)} onClick={() => active && move(active)}><header><strong>待归架书车</strong><small>{books.length - Object.keys(placed).length} 本</small></header><div>{books.filter((item) => !placed[item.id]).map(card)}</div></div>
      <div className="category-shelves">
        {categories.map((category) => <section key={category.id} className={active ? "accepting" : ""} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, category.id)} onClick={() => active && move(active, category.id)}>
          <header><strong>{category.id}<small>部</small></strong><span>{category.subtitle}</span></header>
          <div>{books.filter((item) => placed[item.id] === category.id).map(card)}</div>
        </section>)}
      </div>
      {!checked ? <button className="catalog-submit" disabled={Object.keys(placed).length !== books.length} onClick={() => setChecked(true)}>封架并核验</button> : <div className={`catalog-feedback ${score >= 6 ? "is-correct" : ""}`} aria-live="polite"><strong>归架完成：{score}/{books.length}</strong><p>红色卡片的解释会指出分类依据。四部分类看文献的核心内容、体例和传统著录位置，不按现代学科名称机械对应。</p><button onClick={reset}>重新归架</button></div>}
    </div>
  );
}
