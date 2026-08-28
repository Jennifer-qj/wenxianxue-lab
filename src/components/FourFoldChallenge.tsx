import { useMemo, useState } from "react";

type Category = "经" | "史" | "子" | "集";
type Stage = "frame" | "shelf" | "boundary" | "report";
type Book = { id: string; book: string; clue: string; answer: Category; reason: string };

const books: Book[] = [
  { id: "zhouyi", book: "《周易》", clue: "卦爻体系及其传注", answer: "经", reason: "儒家经典及其传注归入经部。" },
  { id: "maoshi", book: "《毛诗正义》", clue: "《诗经》的传、笺与疏", answer: "经", reason: "经典的注疏仍随经书归入经部。" },
  { id: "shiji", book: "《史记》", clue: "本纪、表、书、世家、列传", answer: "史", reason: "纪传体史书属于史部。" },
  { id: "tongjian", book: "《资治通鉴》", clue: "按年月编排历代史事", answer: "史", reason: "编年体史书的核心体例决定其归史部。" },
  { id: "zhuangzi", book: "《庄子》", clue: "先秦道家思想著作", answer: "子", reason: "诸子百家著作通常归入子部。" },
  { id: "mengxi", book: "《梦溪笔谈》", clue: "涉及天文、技术、制度与见闻", answer: "子", reason: "内容横跨多门，传统目录仍会依据著作性质和既有著录惯例安置，而不是照搬现代学科。" },
  { id: "tao", book: "《陶渊明集》", clue: "一位作者的诗文别集", answer: "集", reason: "一人诗文的别集归入集部。" },
  { id: "wenxuan", book: "《文选》", clue: "选录多位作者诗文", answer: "集", reason: "汇集多位作者文学作品的总集归入集部。" },
];

const categories: { id: Category; subtitle: string }[] = [
  { id: "经", subtitle: "经典与传注" }, { id: "史", subtitle: "史书与史法" },
  { id: "子", subtitle: "诸子与专门知识" }, { id: "集", subtitle: "诗文别集与总集" },
];

const boundaryChoices = [
  "书中谈到天文和技术，所以应该单独归入现代的自然科学类。",
  "内容跨越多门，但本题应依据传统著录框架、著作性质与既有分类惯例判断。",
  "作者曾任官，所以凡是他写的书都应归入史部。",
];

function save(score: number) {
  const key = "wxlab-progress";
  const stored = JSON.parse(localStorage.getItem(key) || "{}");
  stored["four-fold"] = { completed: true, score, total: books.length + 1, updatedAt: new Date().toISOString() };
  localStorage.setItem(key, JSON.stringify(stored));
  window.dispatchEvent(new CustomEvent("wxlab-progress-updated"));
}

export default function FourFoldChallenge() {
  const [stage, setStage] = useState<Stage>("frame");
  const [frame, setFrame] = useState<"modern" | "traditional" | null>(null);
  const [placed, setPlaced] = useState<Record<string, Category>>({});
  const [active, setActive] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [boundary, setBoundary] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [revisions, setRevisions] = useState(0);
  const score = useMemo(() => books.filter((item) => placed[item.id] === item.answer).length, [placed]);
  const totalScore = score + (boundary === 1 ? 1 : 0);

  function move(id: string, category?: Category) {
    if (checked) return;
    setPlaced((current) => {
      const next = { ...current };
      if (category) next[id] = category; else delete next[id];
      return next;
    });
    setActive(null);
  }

  function drop(event: React.DragEvent, category?: Category) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    if (id) move(id, category);
  }

  function reviseShelves() {
    setChecked(false); setStage("shelf"); setRevisions((value) => value + 1);
  }

  function finalize() {
    if (boundary === null || note.trim().length < 18) return;
    save(totalScore); setStage("report");
  }

  function reportText() {
    const shelves = categories.map((category) => `### ${category.id}部\n${books.filter((item) => placed[item.id] === category.id).map((item) => `- ${item.book}：${item.clue}`).join("\n") || "- 无"}`).join("\n\n");
    return [
      "# 文献学实验室 · 四部归架判断单", "", "> 本报告记录一次教学练习，不是古籍目录著录成果。", "",
      "## 采用的分类框架", "传统经、史、子、集四部著录框架。", "", "## 归架结果", shelves, "",
      "## 边界判断", boundaryChoices[boundary ?? 0], "", "## 我的分类说明", note.trim(), "",
      "## 过程记录", `归架与边界判断 ${totalScore}/9；主动返回调整 ${revisions} 次。`, "",
      "## 下一步", "核对具体目录实例：同一部书在不同时代、不同目录中是否可能改变位置？",
    ].join("\n");
  }

  function downloadReport() {
    const url = URL.createObjectURL(new Blob([reportText()], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "四部归架-判断单.md"; link.click(); URL.revokeObjectURL(url);
  }

  function card(item: Book) {
    const right = placed[item.id] === item.answer;
    return <button key={item.id} type="button" draggable={!checked} className={`shelf-book ${active === item.id ? "active" : ""} ${checked ? (right ? "correct" : "incorrect") : ""}`} onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)} onClick={() => !checked && setActive(active === item.id ? null : item.id)}>
      <strong>{item.book}</strong><span>{item.clue}</span>{checked && <small>{item.reason}</small>}
    </button>;
  }

  function reset() {
    setStage("frame"); setFrame(null); setPlaced({}); setActive(null); setChecked(false); setBoundary(null); setNote(""); setRevisions(0);
  }

  return (
    <div className="fourfold-game fourfold-shelves">
      <header className="catalog-case-head"><div><small>CATALOG CASE 01</small><strong>八部书的归架工作单</strong></div><span>{stage === "frame" ? "01" : stage === "shelf" ? "02" : stage === "boundary" ? "03" : "04"}/04</span></header>
      <ol className="catalog-trail" aria-label="目录判断阶段"><li className={stage === "frame" ? "active" : "done"}>确定框架</li><li className={stage === "shelf" ? "active" : ["boundary", "report"].includes(stage) ? "done" : ""}>批量归架</li><li className={stage === "boundary" ? "active" : stage === "report" ? "done" : ""}>解释边界</li><li className={stage === "report" ? "active" : ""}>形成记录</li></ol>

      {stage === "frame" && <section className="catalog-frame">
        <p className="mini-label">先回答一个经常被跳过的问题</p><h3>你打算按照哪一套秩序整理这辆书车？</h3><p>分类不是从书里自动长出来的答案。同一部书换一套知识框架，可能得到不同位置。本练习考察的是传统四部分类。</p>
        <div className="catalog-frame-options"><button className={frame === "modern" ? "selected" : ""} onClick={() => setFrame("modern")}><b>按现代学科分区</b><small>哲学、历史、文学、自然科学……</small></button><button className={frame === "traditional" ? "selected" : ""} onClick={() => setFrame("traditional")}><b>按传统四部著录</b><small>经、史、子、集及其内部类目</small></button></div>
        {frame && <div className={`frame-feedback ${frame === "traditional" ? "good" : "revise"}`}><strong>{frame === "traditional" ? "框架与任务相符" : "这套框架有用，但不是本案正在检验的秩序"}</strong><p>{frame === "traditional" ? "接下来不要只看现代学科主题，还要留意著作体例、经典从属和传统著录位置。" : "《梦溪笔谈》会横跨许多现代学科；若直接按今天的院系分书，就无法解释它在传统目录中的位置。"}</p></div>}
        <button className="catalog-submit" disabled={frame !== "traditional"} onClick={() => setStage("shelf")}>带着这套框架开始归架 →</button>
      </section>}

      {stage === "shelf" && <section className="catalog-shelf-stage">
        <div className="catalog-frame-stamp"><span>本案采用</span><strong>传统经史子集四部框架</strong></div>
        <div className="shelf-progress" aria-label={`已归架 ${Object.keys(placed).length} 本，共 ${books.length} 本`}>{books.map((item) => <i className={placed[item.id] ? "filled" : ""} key={item.id} />)}</div>
        <p className="shelf-guide">拖动典籍卡到四部书架；触屏或键盘操作时，可先点典籍，再点书架。</p>
        <div className="book-cart" onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event)} onClick={() => active && move(active)}><header><strong>待归架书车</strong><small>{books.length - Object.keys(placed).length} 本</small></header><div>{books.filter((item) => !placed[item.id]).map(card)}</div></div>
        <div className="category-shelves">{categories.map((category) => <section key={category.id} className={active ? "accepting" : ""} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, category.id)} onClick={() => active && move(active, category.id)}><header><strong>{category.id}<small>部</small></strong><span>{category.subtitle}</span></header><div>{books.filter((item) => placed[item.id] === category.id).map(card)}</div></section>)}</div>
        {!checked ? <button className="catalog-submit" disabled={Object.keys(placed).length !== books.length} onClick={() => setChecked(true)}>封架并核验</button> : <div className={`catalog-feedback ${score >= 6 ? "is-correct" : ""}`} aria-live="polite"><strong>归架判断：{score}/{books.length}</strong><p>卡片解释的是传统著录依据。红色并不表示这部书只有一个永恒位置，而是说明你的选择和本题采用的四部框架不一致。</p><div><button onClick={reviseShelves}>返回调整书架</button><button onClick={() => setStage("boundary")}>继续处理边界书 →</button></div></div>}
      </section>}

      {stage === "boundary" && <section className="catalog-boundary">
        <p className="mini-label">边界书 · 《梦溪笔谈》</p><h3>它谈天文、数学、技术、制度和见闻，为什么不能只凭主题贴一个现代标签？</h3>
        <div className="boundary-choices">{boundaryChoices.map((item, index) => <button className={boundary === index ? (index === 1 ? "correct" : "incorrect") : ""} onClick={() => setBoundary(index)} key={item}><span>{index + 1}</span>{item}</button>)}</div>
        {boundary !== null && <div className={`frame-feedback ${boundary === 1 ? "good" : "revise"}`}><strong>{boundary === 1 ? "你区分了“内容主题”和“分类制度”" : "这个理由把一个线索当成了全部分类依据"}</strong><p>古籍分类既考虑内容，也受到体例、经典从属、学术传统和具体目录实践影响。目录位置是历史知识秩序的一部分。</p></div>}
        <label className="catalog-note"><span>选一部你刚才最犹豫的书，说明最终依据和仍需核对的地方。</span><textarea value={note} maxLength={300} onChange={(event) => setNote(event.target.value)} placeholder="例如：《毛诗正义》虽然包含解释文字，但它依附《诗经》的传注系统，所以随经书归经部；若核对具体目录，还要看它被著录到哪一小类。" /><small className={note.trim().length >= 18 ? "ready" : ""}>{note.trim().length}/300 · 至少 18 个字</small></label>
        <div className="catalog-boundary-actions"><button onClick={reviseShelves}>← 返回书架修改</button><button className="primary" disabled={boundary === null || note.trim().length < 18} onClick={finalize}>封存目录判断 →</button></div>
      </section>}

      {stage === "report" && <section className="catalog-report" aria-live="polite">
        <p className="mini-label">CATALOG NOTE · 已形成判断记录</p><h3>你完成的不只是八次归类，而是一次有框架、有边界的目录判断。</h3>
        <div className="catalog-score"><strong>{totalScore}<small>/9</small></strong><span>归架与边界判断和参考框架相称</span></div>
        <dl><div><dt>分类框架</dt><dd>传统经、史、子、集四部著录框架</dd></div><div><dt>边界意识</dt><dd>{boundary === 1 ? "已区分内容主题与历史分类制度" : "建议继续核对内容、体例与著录惯例的关系"}</dd></div><div><dt>你的说明</dt><dd>{note}</dd></div><div><dt>修订轨迹</dt><dd>主动返回调整 {revisions} 次</dd></div></dl>
        <p className="catalog-next">下一步可回到第七章核对：目录除了分类，还怎样通过著录和提要说明一部书？</p>
        <div className="report-actions"><button onClick={downloadReport}>导出目录判断单 .md</button><button onClick={reviseShelves}>撤回并修改</button><button onClick={reset}>重新开始</button></div>
      </section>}
    </div>
  );
}
