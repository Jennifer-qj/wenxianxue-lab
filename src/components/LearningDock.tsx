import { useEffect, useRef, useState } from "react";
import { emptyLibrary, readLibrary, recordRecent, writeLibrary, type LearningLibrary, type LibraryPageType } from "../lib/learningArchive";
import "./LearningDock.css";

type Props = { baseUrl: string; title: string; pageType: LibraryPageType };

export default function LearningDock({ baseUrl, title, pageType }: Props) {
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState<LearningLibrary>(emptyLibrary());
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const url = typeof window === "undefined" ? "" : `${window.location.pathname}${window.location.hash}`;

  function refresh() {
    const current = readLibrary();
    setLibrary(current);
    setNote(current.notes[url]?.text ?? "");
  }

  useEffect(() => {
    const cleanUrl = `${window.location.pathname}${window.location.hash}`;
    if (!cleanUrl.startsWith(`${baseUrl}notebook/`)) recordRecent({ url: cleanUrl, title, type: pageType });
    refresh();
    window.addEventListener("wxlab-library-updated", refresh);
    return () => window.removeEventListener("wxlab-library-updated", refresh);
  }, []);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => textareaRef.current?.focus(), 80);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      window.setTimeout(() => triggerRef.current?.focus(), 0);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function toggleBookmark() {
    const next = readLibrary();
    if (next.bookmarks[url]) delete next.bookmarks[url];
    else next.bookmarks[url] = { url, title, type: pageType, updatedAt: new Date().toISOString() };
    writeLibrary(next);
    setSaved(next.bookmarks[url] ? "已收藏" : "已取消收藏");
  }

  function saveNote() {
    const next = readLibrary();
    const text = note.trim();
    if (text) next.notes[url] = { url, title, type: pageType, text, updatedAt: new Date().toISOString() };
    else delete next.notes[url];
    writeLibrary(next);
    setSaved(text ? "札记已保存" : "空札记已移除");
    window.setTimeout(() => setSaved(""), 1600);
  }

  const bookmarked = Boolean(library.bookmarks[url]);
  return <aside className={`learning-dock ${open ? "open" : ""}`} aria-label="随身学习工具">
    <button ref={triggerRef} className="learning-dock__trigger" aria-expanded={open} aria-controls="learning-dock-panel" onClick={() => setOpen((value) => !value)}>
      <span aria-hidden="true">笺</span><b>{open ? "收起札记" : "学习札记"}</b>
    </button>
    {open && <section id="learning-dock-panel" className="learning-dock__panel" role="region" aria-labelledby="learning-dock-title">
      <header><div><small>LOCAL NOTEBOOK</small><strong id="learning-dock-title">{title}</strong></div><button aria-label="关闭札记" onClick={() => { setOpen(false); window.setTimeout(() => triggerRef.current?.focus(), 0); }}>×</button></header>
      <button className={`bookmark-toggle ${bookmarked ? "active" : ""}`} onClick={toggleBookmark}><span aria-hidden="true">{bookmarked ? "★" : "☆"}</span>{bookmarked ? "已加入收藏" : "收藏这个页面"}</button>
      <label><span>写下判断、疑问或待核对事项</span><textarea ref={textareaRef} value={note} maxLength={3000} onChange={(event) => setNote(event.target.value)} onBlur={saveNote} placeholder="例如：牌记只能作为证据链的一环；回纸本核对第……页。" /></label>
      <div className="learning-dock__meta"><span>{note.length} / 3000</span><button onClick={saveNote}>保存札记</button></div>
      {saved && <p role="status">{saved}</p>}
      <a className="notebook-link" href={`${baseUrl}notebook/`}>打开全部札记与收藏 →</a>
      <small className="privacy-copy">仅保存在当前浏览器，不会上传。</small>
    </section>}
  </aside>;
}
