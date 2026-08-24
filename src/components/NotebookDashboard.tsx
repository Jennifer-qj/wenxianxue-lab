import { useEffect, useMemo, useState } from "react";
import { emptyLibrary, libraryTypeNames, readLibrary, writeLibrary, type LearningLibrary, type NoteEntry } from "../lib/learningArchive";
import "./NotebookDashboard.css";

type Tab = "notes" | "bookmarks" | "recent";

export default function NotebookDashboard({ baseUrl }: { baseUrl: string }) {
  const [library, setLibrary] = useState<LearningLibrary>(emptyLibrary());
  const [tab, setTab] = useState<Tab>("notes");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  function refresh() { setLibrary(readLibrary()); }
  useEffect(() => { refresh(); window.addEventListener("wxlab-library-updated", refresh); return () => window.removeEventListener("wxlab-library-updated", refresh); }, []);

  const notes = useMemo(() => Object.values(library.notes).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)), [library.notes]);
  const bookmarks = useMemo(() => Object.values(library.bookmarks).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)), [library.bookmarks]);
  const normalized = query.trim().toLocaleLowerCase("zh-CN");
  const matches = (title: string, text = "") => !normalized || `${title} ${text}`.toLocaleLowerCase("zh-CN").includes(normalized);
  const visibleNotes = notes.filter((item) => matches(item.title, item.text));
  const visibleBookmarks = bookmarks.filter((item) => matches(item.title));
  const visibleRecent = library.recent.filter((item) => matches(item.title));

  function updateNote(item: NoteEntry, text: string) {
    const next = readLibrary();
    const trimmed = text.trim();
    if (trimmed) next.notes[item.url] = { ...item, text: trimmed, updatedAt: new Date().toISOString() };
    else delete next.notes[item.url];
    writeLibrary(next); setNotice(trimmed ? "修改已保存" : "札记已删除");
  }

  function remove(kind: "notes" | "bookmarks" | "recent", url: string) {
    const next = readLibrary();
    if (kind === "recent") next.recent = next.recent.filter((item) => item.url !== url);
    else delete next[kind][url];
    writeLibrary(next); setNotice(kind === "notes" ? "札记已删除" : kind === "bookmarks" ? "收藏已移除" : "浏览记录已移除");
  }

  function exportMarkdown() {
    const lines = ["# 文献学实验室·个人学习札记", "", `导出时间：${new Date().toLocaleString("zh-CN")}`, "", "> 本文件来自浏览器本地记录，不代表原书内容或学术核验结论。", ""];
    notes.forEach((item) => lines.push(`## ${item.title}`, "", `- 页面：${new URL(item.url, window.location.origin).href}`, `- 更新：${new Date(item.updatedAt).toLocaleString("zh-CN")}`, "", item.text, ""));
    if (!notes.length) lines.push("（暂无札记）");
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `文献学实验室-学习札记-${new Date().toISOString().slice(0, 10)}.md`; anchor.click(); URL.revokeObjectURL(url);
    setNotice("Markdown 札记已导出");
  }

  const tabs: Array<[Tab, string, number]> = [["notes", "札记", notes.length], ["bookmarks", "收藏", bookmarks.length], ["recent", "最近浏览", library.recent.length]];
  const emptyText = normalized ? "当前筛选下没有结果。" : tab === "notes" ? "打开任意页面，点击右下角“学习札记”即可写下第一条记录。" : tab === "bookmarks" ? "还没有收藏。可在任意页面的札记面板中收藏。" : "浏览章节、概念或实验后，这里会出现继续学习入口。";

  return <div className="notebook-dashboard">
    <section className="notebook-summary">
      <div><small>LOCAL WORKSPACE</small><strong>{notes.length}</strong><span>条札记</span></div>
      <div><strong>{bookmarks.length}</strong><span>个收藏</span></div>
      <div><strong>{library.recent.length}</strong><span>次最近浏览</span></div>
      <aside><p>所有内容只保存在当前浏览器。</p><button disabled={!notes.length} onClick={exportMarkdown}>导出札记 Markdown</button><a href={`${baseUrl}progress/#archive`}>完整档案备份 →</a></aside>
    </section>
    <section className="notebook-console">
      <div role="tablist" aria-label="学习工作台分类">{tabs.map(([id, label, count]) => <button role="tab" aria-selected={tab === id} className={tab === id ? "active" : ""} onClick={() => setTab(id)} key={id}>{label}<b>{count}</b></button>)}</div>
      <label><span>筛选当前列表</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入页面标题或札记内容" /></label>
    </section>
    {notice && <p className="notebook-notice" role="status">{notice}</p>}
    <section className="notebook-list">
      {tab === "notes" && visibleNotes.map((item) => <article className="note-card" key={item.url}><header><div><span>{libraryTypeNames[item.type]}</span><a href={item.url}>{item.title}</a><small>{new Date(item.updatedAt).toLocaleDateString("zh-CN")}</small></div><button aria-label={`删除“${item.title}”的札记`} onClick={() => remove("notes", item.url)}>删除</button></header><textarea defaultValue={item.text} onBlur={(event) => event.target.value.trim() !== item.text && updateNote(item, event.target.value)} /><a href={item.url}>返回原页面继续学习 →</a></article>)}
      {tab === "bookmarks" && visibleBookmarks.map((item) => <article className="link-card" key={item.url}><span>{libraryTypeNames[item.type]}</span><div><a href={item.url}>{item.title}</a><small>收藏于 {new Date(item.updatedAt).toLocaleDateString("zh-CN")}</small></div><button onClick={() => remove("bookmarks", item.url)}>移除</button></article>)}
      {tab === "recent" && visibleRecent.map((item) => <article className="link-card" key={item.url}><span>{libraryTypeNames[item.type]}</span><div><a href={item.url}>{item.title}</a><small>{new Date(item.updatedAt).toLocaleString("zh-CN")}</small></div><button onClick={() => remove("recent", item.url)}>移除</button></article>)}
      {((tab === "notes" && !visibleNotes.length) || (tab === "bookmarks" && !visibleBookmarks.length) || (tab === "recent" && !visibleRecent.length)) && <div className="notebook-empty"><span aria-hidden="true">笺</span><p>{emptyText}</p>{normalized && <button onClick={() => setQuery("")}>清除筛选</button>}</div>}
    </section>
  </div>;
}
