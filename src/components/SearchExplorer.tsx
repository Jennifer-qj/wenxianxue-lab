import { useMemo, useState } from "react";

export type SearchItem = {
  id: string;
  type: "chapter" | "unit" | "concept" | "quiz" | "lab" | "deepdive";
  chapter: number;
  title: string;
  text: string;
  meta: string;
  href: string;
  status?: string;
};

const typeNames = { all: "全部", chapter: "章节", unit: "学习单元", concept: "概念", quiz: "题目", lab: "实验", deepdive: "深度研读" } as const;

export default function SearchExplorer({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | SearchItem["type"]>("all");
  const [chapter, setChapter] = useState("all");
  const normalized = query.trim().toLocaleLowerCase("zh-CN");
  const results = useMemo(() => items.filter((item) => {
    const matchesQuery = !normalized || `${item.title} ${item.text} ${item.meta}`.toLocaleLowerCase("zh-CN").includes(normalized);
    return matchesQuery && (type === "all" || item.type === type) && (chapter === "all" || item.chapter === Number(chapter));
  }).slice(0, 80), [chapter, items, normalized, type]);

  return <div className="search-explorer">
    <section className="search-console">
      <label className="search-input"><span>搜索全书结构化内容</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="试试：善本、校勘、敦煌、纸张……" /></label>
      <label><span>章节</span><select value={chapter} onChange={(event) => setChapter(event.target.value)}><option value="all">全部十四章</option>{Array.from({ length: 14 }, (_, index) => <option key={index + 1} value={index + 1}>第 {index + 1} 章</option>)}</select></label>
      <div className="search-types" aria-label="按内容类型筛选">{Object.entries(typeNames).map(([id, label]) => <button key={id} className={type === id ? "active" : ""} onClick={() => setType(id as typeof type)}>{label}</button>)}</div>
    </section>
    <div className="result-summary"><strong>{results.length}</strong><span>{normalized ? ` 条与“${query.trim()}”相关的结果` : " 条可浏览内容；输入关键词以缩小范围"}</span>{items.length > 80 && !normalized && <small>当前先显示前 80 条</small>}</div>
    <section className="search-results" aria-live="polite">
      {results.length ? results.map((item) => <a href={item.href} key={`${item.type}-${item.id}`}>
        <div><span>{typeNames[item.type]}</span><small>第 {item.chapter} 章 · {item.meta}</small>{item.status && <em>{item.status}</em>}</div>
        <h2>{item.title}</h2><p>{item.text}</p><b>打开内容 →</b>
      </a>) : <div className="no-results"><strong>没有找到匹配内容</strong><p>尝试缩短关键词、切换到全部类型，或者只选择章节浏览。</p><button onClick={() => { setQuery(""); setType("all"); setChapter("all"); }}>清除筛选</button></div>}
    </section>
  </div>;
}
