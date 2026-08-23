import { useEffect, useRef, useState } from "react";

type ProgressItem = { completed: boolean; score: number; total: number; updatedAt: string; title?: string };
type SavedProgress = Record<string, ProgressItem>;
type WrongItem = { id: string; chapter: number; type: string; prompt: string; explanation: string; attempts: number; updatedAt: string };

const names: Record<string, string> = {
  "version-detective": "版本鉴定侦探", "four-fold": "四部分类挑战", "collation-clinic": "校勘诊所",
  "carrier-museum": "载体博物馆", "binding-puzzle": "装帧演变拼图", "leishu-congshu": "类书与丛书分拣",
  "ch01-research-workbench": "第一章·研究问题装配台",
};
const gameIds = new Set(["version-detective", "four-fold", "collation-clinic", "carrier-museum", "binding-puzzle", "leishu-congshu"]);
const totalActivities = 50; // 14 章综合练习 + 14 章研读 + 6 项旗舰实验 + 15 个案例 + 1 个研究问题工作台

function safeRead<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; }
}

function hrefFor(id: string, baseUrl: string) {
  if (/^ch\d{2}-structured-practice$/.test(id)) return `${baseUrl}chapters/${id.slice(0, 4)}/#check`;
  if (/^deep-ch\d{2}/.test(id)) return `${baseUrl}chapters/${id.slice(5, 9)}/#deep-dive`;
  if (id === "ch01-research-workbench") return `${baseUrl}chapters/ch01/#workbench`;
  if (id.startsWith("case-")) return `${baseUrl}lab/#case-gallery`;
  if (gameIds.has(id)) return `${baseUrl}lab/#${id}`;
  return `${baseUrl}paths/`;
}

export default function ProgressDashboard({ baseUrl }: { baseUrl: string }) {
  const [progress, setProgress] = useState<SavedProgress>({});
  const [wrongBook, setWrongBook] = useState<Record<string, WrongItem>>({});
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function read() {
    setProgress(safeRead<SavedProgress>("wxlab-progress", {}));
    setWrongBook(safeRead<Record<string, WrongItem>>("wxlab-wrongbook", {}));
  }

  useEffect(() => {
    read();
    window.addEventListener("wxlab-progress-updated", read);
    return () => window.removeEventListener("wxlab-progress-updated", read);
  }, []);

  const entries = Object.entries(progress).filter(([, item]) => item.completed).sort((a, b) => Date.parse(b[1].updatedAt) - Date.parse(a[1].updatedAt));
  const completed = entries.length;
  const percent = Math.min(100, Math.round(completed / totalActivities * 100));
  const practiceCount = entries.filter(([id]) => id.endsWith("structured-practice")).length;
  const deepCount = entries.filter(([id]) => id.startsWith("deep-ch")).length;
  const gameCount = entries.filter(([id]) => gameIds.has(id)).length;
  const caseCount = entries.filter(([id]) => id.startsWith("case-")).length;
  const wrongItems = Object.values(wrongBook).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  function exportArchive() {
    const deepdives: Record<string, unknown> = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith("wenxianxue-deepdive-")) deepdives[key] = safeRead(key, {});
    }
    const payload = { version: 1, exportedAt: new Date().toISOString(), progress, wrongBook, deepdives };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `wenxianxue-learning-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url);
    setNotice("学习档案已经导出。文件只包含本地学习记录。 ");
  }

  async function importArchive(file?: File) {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (payload.version !== 1 || typeof payload.progress !== "object" || typeof payload.wrongBook !== "object") throw new Error();
      localStorage.setItem("wxlab-progress", JSON.stringify(payload.progress));
      localStorage.setItem("wxlab-wrongbook", JSON.stringify(payload.wrongBook));
      Object.entries(payload.deepdives ?? {}).forEach(([key, value]) => key.startsWith("wenxianxue-deepdive-") && localStorage.setItem(key, JSON.stringify(value)));
      read(); setNotice("学习档案导入成功。");
    } catch { setNotice("导入失败：请选择由本站导出的 JSON 学习档案。"); }
    if (inputRef.current) inputRef.current.value = "";
  }

  function clearArchive() {
    if (!window.confirm("确定清空当前浏览器中的全部学习进度、错题和研读记录吗？此操作不可撤销。")) return;
    localStorage.removeItem("wxlab-progress"); localStorage.removeItem("wxlab-wrongbook");
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter((key): key is string => Boolean(key?.startsWith("wenxianxue-deepdive-")));
    keys.forEach((key) => localStorage.removeItem(key)); read(); setNotice("本地学习档案已清空。");
  }

  return <div className="progress-dashboard progress-dashboard--full">
    <section className="progress-summary">
      <p className="mini-label">保存在当前浏览器</p><strong>{completed}</strong><span>项学习活动已完成，共 {totalActivities} 项</span>
      <div className="ring" style={{ "--value": `${percent}%` } as React.CSSProperties}><b>{percent}%</b></div>
      <div className="progress-breakdown"><span><b>{practiceCount}/14</b>章综合练习</span><span><b>{deepCount}/14</b>章深度研读</span><span><b>{gameCount}/6</b>旗舰实验</span><span><b>{caseCount}/15</b>章案例</span></div>
    </section>
    <section className="progress-list">
      <div className="progress-list-title"><h2>最近记录</h2>{entries[0] && <a href={hrefFor(entries[0][0], baseUrl)}>继续上次学习 →</a>}</div>
      {completed === 0 ? <div className="empty-state"><span>卷</span><p>还没有学习记录。完成任意章节综合练习、研读案例或互动实验，就会形成第一条档案。</p></div> : entries.slice(0, 10).map(([id, item]) => <article key={id}><div><strong>{item.title ?? names[id] ?? id}</strong><small>{new Date(item.updatedAt).toLocaleDateString("zh-CN")}</small></div><span>{item.score} / {item.total}</span><a href={hrefFor(id, baseUrl)}>继续</a></article>)}
    </section>
    <section className="wrongbook-panel">
      <header><div><p className="mini-label">Wrong book</p><h2>错题本</h2></div><strong>{wrongItems.length}</strong></header>
      {wrongItems.length ? wrongItems.slice(0, 8).map((item) => <article key={item.id}><div><small>第 {item.chapter} 章 · {item.type} · 错误 {item.attempts} 次</small><h3>{item.prompt}</h3><p>{item.explanation}</p></div><a href={`${baseUrl}chapters/ch${String(item.chapter).padStart(2, "0")}/#check`}>返回重做 →</a></article>) : <p className="wrong-empty">暂时没有错题。答错的结构化题目会自动进入这里；重新答对后自动移出。</p>}
    </section>
    <section className="archive-tools">
      <div><p className="mini-label">Portable archive</p><h2>带走你的学习记录</h2><p>导出文件只包含进度、错题和研读勾选，不包含账号或设备信息。</p></div>
      <div><button onClick={exportArchive}>导出 JSON</button><button onClick={() => inputRef.current?.click()}>导入档案</button><button className="danger" onClick={clearArchive}>清空记录</button><input ref={inputRef} type="file" accept="application/json" hidden onChange={(event) => importArchive(event.target.files?.[0])} /></div>
      {notice && <p className="archive-notice" role="status">{notice}</p>}
    </section>
  </div>;
}
