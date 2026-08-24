import { useEffect, useMemo, useState } from "react";
import "./SearchExplorer.css";

export type SearchItem = {
  id: string;
  type: "chapter" | "unit" | "concept" | "quiz" | "lab" | "deepdive";
  chapter: number;
  title: string;
  text: string;
  meta: string;
  href: string;
  status?: string;
  aliases?: string[];
};

const typeNames = { all: "全部", chapter: "章节", unit: "学习单元", concept: "概念", quiz: "题目", lab: "实验", deepdive: "深度研读" } as const;
const normalize = (text: string) => text.trim().toLocaleLowerCase("zh-CN").replace(/[\s·，。、“”‘’：；（）()《》\-_/]/g, "");

function distance(a: string, b: string) {
  const row = Array.from({ length: a.length + 1 }, (_, index) => index);
  for (let i = 1; i <= b.length; i += 1) {
    let previous = row[0]; row[0] = i;
    for (let j = 1; j <= a.length; j += 1) {
      const held = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[j - 1] === b[i - 1] ? 0 : 1)); previous = held;
    }
  }
  return row[a.length];
}

function scoreItem(item: SearchItem, query: string) {
  if (!query) return { score: 1, reason: "浏览全部" };
  const title = normalize(item.title); const text = normalize(item.text); const meta = normalize(item.meta);
  const aliases = (item.aliases ?? []).map(normalize);
  if (title === query) return { score: 120, reason: "标题完全匹配" };
  if (title.includes(query)) return { score: 95, reason: "标题匹配" };
  const aliasIndex = aliases.findIndex((term) => term === query || term.includes(query));
  if (aliasIndex >= 0) return { score: 80, reason: `相关检索词：${item.aliases?.[aliasIndex]}` };
  if (meta.includes(query)) return { score: 65, reason: "章节或类型匹配" };
  if (text.includes(query)) return { score: 50, reason: "正文摘要匹配" };
  const terms = [title, ...aliases].filter((term) => term.length >= 2 && Math.abs(term.length - query.length) <= 1);
  if (query.length >= 2 && terms.some((term) => distance(term, query) === 1)) return { score: 25, reason: "近似词匹配" };
  return { score: 0, reason: "" };
}

export default function SearchExplorer({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | SearchItem["type"]>("all");
  const [chapter, setChapter] = useState("all");
  const [status, setStatus] = useState("all");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") ?? ""); setType((params.get("type") as typeof type) ?? "all"); setChapter(params.get("chapter") ?? "all"); setStatus(params.get("status") ?? "all"); setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(); if (query.trim()) params.set("q", query.trim()); if (type !== "all") params.set("type", type); if (chapter !== "all") params.set("chapter", chapter); if (status !== "all") params.set("status", status);
    history.replaceState(null, "", `${window.location.pathname}${params.size ? `?${params}` : ""}`);
  }, [chapter, query, ready, status, type]);

  const normalized = normalize(query);
  const availableTypes = Object.entries(typeNames).filter(([id]) => id === "all" || items.some((item) => item.type === id));
  const statuses = Array.from(new Set(items.map((item) => item.status).filter(Boolean) as string[]));
  const ranked = useMemo(() => items.map((item) => ({ item, ...scoreItem(item, normalized) })).filter(({ item, score }) => score > 0 && (type === "all" || item.type === type) && (chapter === "all" || item.chapter === Number(chapter)) && (status === "all" || item.status === status)).sort((a, b) => b.score - a.score || a.item.chapter - b.item.chapter), [chapter, items, normalized, status, type]);
  const results = ranked.slice(0, 80);
  const suggestion = useMemo(() => {
    if (!normalized || ranked.some((result) => result.score >= 50)) return "";
    const terms = items.flatMap((item) => [item.title, ...(item.aliases ?? [])]).filter((term, index, all) => term.length >= 2 && all.indexOf(term) === index);
    return terms.map((term) => ({ term, distance: distance(normalize(term), normalized) })).filter((item) => item.distance <= Math.max(1, Math.floor(normalized.length / 3))).sort((a, b) => a.distance - b.distance)[0]?.term ?? "";
  }, [items, normalized, ranked]);

  function clear() { setQuery(""); setType("all"); setChapter("all"); setStatus("all"); }
  return <div className="search-explorer">
    <section className="search-console">
      <label className="search-input"><span>搜索全书结构化内容</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="试试：善本、校雠、族谱、藏经洞……" /></label>
      <label><span>章节</span><select value={chapter} onChange={(event) => setChapter(event.target.value)}><option value="all">全部十四章</option>{Array.from({ length: 14 }, (_, index) => <option key={index + 1} value={index + 1}>第 {index + 1} 章</option>)}</select></label>
      <label><span>复核状态</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">全部状态</option>{statuses.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
      <div className="search-types" aria-label="按内容类型筛选">{availableTypes.map(([id, label]) => <button key={id} className={type === id ? "active" : ""} onClick={() => setType(id as typeof type)}>{label}</button>)}</div>
    </section>
    {suggestion && <p className="search-suggestion">没有高置信度的直接命中。你是否想搜索：<button onClick={() => setQuery(suggestion)}>{suggestion}</button></p>}
    <div className="result-summary"><strong>{ranked.length}</strong><span>{normalized ? ` 条与“${query.trim()}”相关的结果` : " 条可浏览内容；输入关键词以缩小范围"}</span>{ranked.length > 80 && <small>按相关度显示前 80 条</small>}</div>
    <section className="search-results" aria-live="polite">
      {results.length ? results.map(({ item, reason }) => <a href={item.href} key={`${item.type}-${item.id}`}>
        <div><span>{typeNames[item.type]}</span><small>第 {item.chapter} 章 · {item.meta}</small>{item.status && <em>{item.status}</em>}</div>
        <h2>{item.title}</h2><p>{item.text}</p><div className="match-reason">{reason}</div><b>打开内容 →</b>
      </a>) : <div className="no-results"><strong>没有找到匹配内容</strong><p>尝试同义表达、缩短关键词，或清除章节与状态筛选。</p><button onClick={clear}>清除筛选</button></div>}
    </section>
  </div>;
}
