import { useMemo, useState } from "react";
import "./SkillArcade.css";

function save(id: string, score: number, total: number, note = "") {
  const key = "wxlab-progress";
  const progress = JSON.parse(localStorage.getItem(key) || "{}");
  progress[id] = { completed: true, score, total, note, updatedAt: new Date().toISOString() };
  localStorage.setItem(key, JSON.stringify(progress));
  window.dispatchEvent(new CustomEvent("wxlab-progress-updated"));
}

type SequenceItem = { id: string; title: string; detail: string };

function ArcadeReflection({ id, title, score, total, prompt, limitationPrompt }: { id: string; title: string; score: number; total: number; prompt: string; limitationPrompt: string }) {
  const [reason, setReason] = useState("");
  const [limitation, setLimitation] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [archived, setArchived] = useState(false);
  const [message, setMessage] = useState("");
  const ready = reason.trim().length >= 18 && limitation.trim().length >= 12;
  const report = `## ${title} · 学习记录\n\n- 操作得分：${score}/${total}\n- 当前把握：${confidence}/5\n- 我的解释：${reason.trim()}\n- 适用边界：${limitation.trim()}\n\n> 得分只反映本轮操作结果，不代表学术判断已经获得唯一答案。`;

  async function copyReport() {
    try { await navigator.clipboard.writeText(report); setMessage("学习记录已复制"); } catch { setMessage("浏览器未允许复制，请手动选择上方文字"); }
    window.setTimeout(() => setMessage(""), 2200);
  }

  return <section className="arcade-reflection"><header><small>SECOND PASS · 第二遍判断</small><h3>答案核验以后，还要说明为什么</h3><p>分数记录位置或分类是否吻合；下面的文字才记录你怎样理解这次操作。</p></header><label><span>{prompt}</span><textarea disabled={archived} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="至少 18 字。不要只复述正确答案。" /><small className={reason.trim().length >= 18 ? "ready" : ""}>{reason.trim().length}/18</small></label><label><span>{limitationPrompt}</span><textarea disabled={archived} value={limitation} onChange={(event) => setLimitation(event.target.value)} placeholder="至少 12 字。写出例外、未知或不能直接推出的部分。" /><small className={limitation.trim().length >= 12 ? "ready" : ""}>{limitation.trim().length}/12</small></label><label className="arcade-confidence"><span>当前把握程度</span><input disabled={archived} type="range" min="1" max="5" value={confidence} onChange={(event) => setConfidence(Number(event.target.value))} /><b>{confidence}/5</b></label>{!archived ? <button className="arcade-primary" disabled={!ready} onClick={() => { save(id, score, total, `${reason.trim()}｜边界：${limitation.trim()}｜把握 ${confidence}/5`); setArchived(true); }}>归档本次解释</button> : <footer><div><strong>本次记录已进入当前浏览器</strong><p>{reason}；但{limitation}</p><small>任务得分 {score}/{total} · 把握 {confidence}/5</small></div><button type="button" onClick={copyReport}>复制学习记录</button></footer>}{message && <p className="arcade-copy-status" role="status">{message}</p>}</section>;
}

function SequenceBoard({ id, title, items, shuffled, note, reflectionPrompt, limitationPrompt }: { id: string; title: string; items: SequenceItem[]; shuffled: string[]; note: string; reflectionPrompt: string; limitationPrompt: string }) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const [order, setOrder] = useState(shuffled);
  const [dragging, setDragging] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const score = order.filter((item, index) => item === items[index].id).length;

  function move(source: string, target: string) {
    if (checked || source === target) return;
    setOrder((current) => {
      const next = current.filter((item) => item !== source);
      next.splice(next.indexOf(target), 0, source);
      return next;
    });
  }

  function shift(index: number, offset: number) {
    if (checked || index + offset < 0 || index + offset >= order.length) return;
    setOrder((current) => {
      const next = [...current];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });
  }

  function check() { setChecked(true); }
  function reset() { setOrder(shuffled); setChecked(false); }

  return <div className="sequence-game">
    <p className="mechanic-note">拖动卡片重排；也可使用每张卡右侧的上移、下移按钮。</p>
    <ol className="sequence-board">{order.map((idValue, index) => {
      const item = byId.get(idValue)!; const correct = items[index].id === idValue;
      return <li key={item.id} draggable={!checked} onDragStart={() => setDragging(item.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => dragging && move(dragging, item.id)} className={checked ? (correct ? "correct" : "incorrect") : ""}>
        <b>{index + 1}</b><div><strong>{item.title}</strong><span>{item.detail}</span>{checked && !correct && <small>此位置应为：{items[index].title}</small>}</div>
        <nav aria-label={`调整“${item.title}”的位置`}><button aria-label={`上移${item.title}`} disabled={checked || index === 0} onClick={() => shift(index, -1)}>↑</button><button aria-label={`下移${item.title}`} disabled={checked || index === order.length - 1} onClick={() => shift(index, 1)}>↓</button></nav>
      </li>;
    })}</ol>
    {!checked ? <button className="arcade-primary" onClick={check}>核验流程</button> : <><div className={`arcade-feedback ${score === items.length ? "success" : ""}`}><strong>正确位置 {score}/{items.length}</strong><p>{note}</p><button onClick={reset}>撤回并重新排列</button></div><ArcadeReflection id={id} title={title} score={score} total={items.length} prompt={reflectionPrompt} limitationPrompt={limitationPrompt} /></>}
  </div>;
}

type SortCard = { id: string; title: string; detail: string; answer: string; reason: string };
type SortBin = { id: string; title: string; hint: string };

function BatchSorter({ id, title, cards, bins, mode, conclusion, reflectionPrompt, limitationPrompt }: { id: string; title: string; cards: SortCard[]; bins: SortBin[]; mode: string; conclusion: string; reflectionPrompt: string; limitationPrompt: string }) {
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const score = useMemo(() => cards.filter((card) => placed[card.id] === card.answer).length, [cards, placed]);

  function move(cardId: string, binId?: string) {
    if (checked) return;
    setPlaced((current) => {
      const next = { ...current };
      if (binId) next[cardId] = binId;
      else delete next[cardId];
      return next;
    });
    setActive(null);
  }

  function drop(event: React.DragEvent, binId?: string) {
    event.preventDefault();
    const cardId = event.dataTransfer.getData("text/plain");
    if (cardId) move(cardId, binId);
  }

  function cardView(card: SortCard) {
    const correct = placed[card.id] === card.answer;
    return <button key={card.id} draggable={!checked} onDragStart={(event) => event.dataTransfer.setData("text/plain", card.id)} onClick={() => !checked && setActive(active === card.id ? null : card.id)} className={`batch-card ${active === card.id ? "active" : ""} ${checked ? (correct ? "correct" : "incorrect") : ""}`}><strong>{card.title}</strong><span>{card.detail}</span>{checked && <small>{card.reason}</small>}</button>;
  }

  function check() { setChecked(true); }
  function reset() { setPlaced({}); setActive(null); setChecked(false); }

  return <div className={`batch-sorter ${mode}`}>
    <p className="mechanic-note">拖动卡片完成整批配对；也可先点卡片，再点目标区域。</p>
    <div className={`mobile-selection ${active ? "visible" : ""}`} role="status" aria-live="polite">{active ? <>已选：<strong>{cards.find((card) => card.id === active)?.title}</strong>，现在点一个目标区域。</> : "先点一张卡片，再选择目标区域。"}</div>
    <section className="sorting-tray" role="button" tabIndex={active ? 0 : -1} aria-label="移回待处理卡片" onKeyDown={(event) => { if (active && (event.key === "Enter" || event.key === " ")) move(active); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event)} onClick={() => active && move(active)}><header><strong>待处理卡片</strong><small>{cards.length - Object.keys(placed).length} 项</small></header><div>{cards.filter((card) => !placed[card.id]).map(cardView)}</div></section>
    <div className="sorting-bins">{bins.map((bin) => <section key={bin.id} role="button" tabIndex={active ? 0 : -1} aria-label={`把已选卡片放入${bin.title}`} className={active ? "accepting" : ""} onKeyDown={(event) => { if (active && (event.key === "Enter" || event.key === " ")) move(active, bin.id); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, bin.id)} onClick={() => active && move(active, bin.id)}><header><strong>{bin.title}</strong><small>{bin.hint}</small></header><div>{cards.filter((card) => placed[card.id] === bin.id).map(cardView)}</div></section>)}</div>
    {!checked ? <button className="arcade-primary" disabled={Object.keys(placed).length !== cards.length} onClick={check}>全部完成，统一核验</button> : <><div className={`arcade-feedback ${score === cards.length ? "success" : ""}`}><strong>匹配正确 {score}/{cards.length}</strong><p>{conclusion}</p><button onClick={reset}>撤回并重新分类</button></div><ArcadeReflection id={id} title={title} score={score} total={cards.length} prompt={reflectionPrompt} limitationPrompt={limitationPrompt} /></>}
  </div>;
}

const collationSteps: SequenceItem[] = [
  { id: "record", title: "记录异文", detail: "先忠实记录甲、乙两本的字句差异。" },
  { id: "source", title: "核查版本来源", detail: "确认各本年代、传承和是否为同一系统。" },
  { id: "internal", title: "本校与对校", detail: "比较异本，并查本书内部固定用例。" },
  { id: "external", title: "寻找他校证据", detail: "检查古注、类书引文与相关文献。" },
  { id: "judge", title: "判断文本", detail: "综合语义、体例和版本关系提出判断。" },
  { id: "note", title: "写明校记", detail: "保存异文事实、依据与仍然存在的疑点。" },
];

const bindingItems: SequenceItem[] = [
  { id: "scroll", title: "卷子装", detail: "长幅卷收，展开阅读。" },
  { id: "accordion", title: "经折装", detail: "长卷往返折叠成册。" },
  { id: "butterfly", title: "蝴蝶装", detail: "版心向内，展开如蝶翼。" },
  { id: "wrapped", title: "包背装", detail: "书叶背向折叠，以纸包背。" },
  { id: "thread", title: "线装", detail: "书叶齐订，书背露线。" },
];

const carrierCards: SortCard[] = [
  { id: "slips", title: "编绳朽断后次序散乱", detail: "单片狭长，可见契口与墨迹。", answer: "bamboo", reason: "简牍由单简编联，次序复原是整理重点。" },
  { id: "bronze", title: "文字与器物共同铸成", detail: "铭文位置受器形与铸造工艺约束。", answer: "metal", reason: "青铜器铭文不能脱离器类、纹饰和铸造环境解释。" },
  { id: "silk", title: "柔软织物，可书可画", detail: "折叠保存，纤维经纬清楚。", answer: "silk", reason: "帛书以丝织品为载体，适合书写和绘图。" },
  { id: "leaf", title: "长叶穿孔，以绳贯穿", detail: "文字常沿叶片长向排列。", answer: "leaf", reason: "贝叶经处理后刻写或书写，穿孔夹装。" },
  { id: "paper", title: "植物纤维抄造，可见帘纹", detail: "适合卷装，也推动册页装发展。", answer: "paper", reason: "纸的纤维、帘纹和加工痕迹都是物质鉴定线索。" },
];

const carrierBins: SortBin[] = [
  { id: "bamboo", title: "竹木简", hint: "编联成册" }, { id: "metal", title: "金文", hint: "器物铭刻" },
  { id: "silk", title: "帛书", hint: "丝织载体" }, { id: "leaf", title: "贝叶", hint: "穿孔夹装" },
  { id: "paper", title: "纸本", hint: "纤维抄造" },
];

const toolCards: SortCard[] = [
  { id: "taiping", title: "《太平御览》", detail: "按事类摘录群书材料", answer: "leishu", reason: "材料被拆分后按类别重新组织，属于类书。" },
  { id: "yiwen", title: "《艺文类聚》", detail: "分类编排并保存大量旧文引文", answer: "leishu", reason: "以事类为纲汇录资料，属于类书。" },
  { id: "chuxue", title: "《初学记》", detail: "分门列事，兼录诗文", answer: "leishu", reason: "按类汇集可检索材料，属于类书。" },
  { id: "siku", title: "《四库全书》", detail: "汇集多种相对完整的著作", answer: "congshu", reason: "保存多种各自成篇的完整著作，属于丛书。" },
  { id: "zhibuzu", title: "《知不足斋丛书》", detail: "汇刻多种珍稀典籍", answer: "congshu", reason: "以多书汇刻为组织方式，属于丛书。" },
  { id: "sibu", title: "《四部丛刊》", detail: "影印汇集经史子集多书", answer: "congshu", reason: "各书保留相对独立形态，属于丛书。" },
];

const games = [
  { id: "collation-clinic", tab: "校勘诊所", chapter: "第六章", intro: "把一次校勘调查从记录异文排到形成校记。", render: () => <SequenceBoard id="collation-clinic" title="校勘诊所" items={collationSteps} shuffled={["judge", "record", "external", "note", "source", "internal"]} note="校勘不是先猜正确答案，而是先固定异文事实和版本来源，再逐层互证，最后把依据写进校记。" reflectionPrompt="选择一组相邻步骤，说明为什么前一步必须先完成。" limitationPrompt="这套流程在哪些情况下不能机械套用？" /> },
  { id: "carrier-museum", tab: "载体博物馆", chapter: "第二章", intro: "把五组物质线索送回对应的载体标本柜。", render: () => <BatchSorter id="carrier-museum" title="载体博物馆" cards={carrierCards} bins={carrierBins} mode="museum-matcher" conclusion="辨认载体要同时看材料、制作方式、书写方式和装联结构，不能只凭“看起来很旧”。" reflectionPrompt="选一张卡，说明你实际组合了哪两类物质线索。" limitationPrompt="仅凭当前线索，为什么还不能完成断代或真伪判断？" /> },
  { id: "binding-puzzle", tab: "装帧拼图", chapter: "第二章", intro: "拖动五种装帧，重建便于学习的形制演变序列。", render: () => <SequenceBoard id="binding-puzzle" title="装帧演变拼图" items={bindingItems} shuffled={["thread", "accordion", "wrapped", "scroll", "butterfly"]} note="这一序列用于理解形制演变，但真实文献中多种装帧可能长期并存，现存装帧也可能经过后改。" reflectionPrompt="说明一个形制变化怎样改变阅读或装订方式。" limitationPrompt="为什么这条学习序列不能直接当成每部书的绝对年代线？" /> },
  { id: "leishu-congshu", tab: "工具书分拣", chapter: "第九章", intro: "一次处理六部书，按组织单位分入类书或丛书。", render: () => <BatchSorter id="leishu-congshu" title="类书还是丛书" cards={toolCards} bins={[{ id: "leishu", title: "类书", hint: "拆分材料，按类重组" }, { id: "congshu", title: "丛书", hint: "汇集多书，各自成篇" }]} mode="tool-sorter" conclusion="核心区别不在书名，而在组织单位：类书拆分原书材料再分类，丛书汇集多种相对完整的书。" reflectionPrompt="不用举书名，说明类书与丛书的组织单位有何不同。" limitationPrompt="只凭名称或规模判断时，可能出现什么误判？" /> },
];

export default function SkillArcade() {
  const [active, setActive] = useState(() => {
    if (typeof window === "undefined") return 0;
    const requested = new URLSearchParams(window.location.search).get("experiment");
    const index = games.findIndex((item) => item.id === requested);
    return index >= 0 ? index : 0;
  });
  const game = games[active];
  return <div className="skill-arcade">
    <nav className="arcade-tabs" aria-label="选择互动任务">{games.map((item, index) => <button className={active === index ? "active" : ""} onClick={() => setActive(index)} key={item.id}><small>{item.chapter}</small><strong>{item.tab}</strong></button>)}</nav>
    <section id={game.id} className="arcade-stage"><header><div><small>{game.chapter} · 拖拽任务</small><h2>{game.tab}</h2></div><p>{game.intro}</p></header><div className="arcade-task" key={game.id}>{game.render()}</div></section>
  </div>;
}
