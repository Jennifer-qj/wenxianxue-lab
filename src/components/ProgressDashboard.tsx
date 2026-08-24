import { useEffect, useRef, useState } from "react";
import { LIBRARY_KEY, emptyLibrary, readLibrary } from "../lib/learningArchive";

type ProgressItem = { completed: boolean; score: number; total: number; updatedAt: string; title?: string };
type SavedProgress = Record<string, ProgressItem>;
type WrongItem = { id: string; chapter: number; type: string; prompt: string; explanation: string; attempts: number; updatedAt: string };

const names: Record<string, string> = {
  "version-detective": "版本鉴定侦探", "four-fold": "四部分类挑战", "collation-clinic": "校勘诊所",
  "carrier-museum": "载体博物馆", "binding-puzzle": "装帧演变拼图", "leishu-congshu": "类书与丛书分拣",
  "ch01-research-workbench": "第一章·研究问题装配台",
  "rare-book-dossier": "古籍鉴定综合案卷",
};
const gameIds = new Set(["version-detective", "four-fold", "collation-clinic", "carrier-museum", "binding-puzzle", "leishu-congshu"]);
const totalActivities = 51; // 14 章综合练习 + 14 章研读 + 6 项旗舰实验 + 15 个案例 + 1 个研究问题工作台 + 1 个综合案卷
const chapterTitles = ["文献与文献学", "文献的载体", "文献的形成与流布", "文献的收藏与散佚", "文献的版本", "文献的校勘", "文献目录", "辑佚与辨伪", "类书与丛书", "地方志与家谱", "总集与别集", "出土文献（上）", "出土文献（下）", "敦煌文献"];

function safeRead<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; }
}

function hrefFor(id: string, baseUrl: string) {
  if (/^ch\d{2}-structured-practice$/.test(id)) return `${baseUrl}chapters/${id.slice(0, 4)}/#check`;
  if (/^deep-ch\d{2}/.test(id)) return `${baseUrl}chapters/${id.slice(5, 9)}/#deep-dive`;
  if (id === "ch01-research-workbench") return `${baseUrl}chapters/ch01/#workbench`;
  if (id === "rare-book-dossier") return `${baseUrl}lab/#rare-book-dossier`;
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
  const dossierCount = entries.filter(([id]) => id === "rare-book-dossier").length;
  const wrongItems = Object.values(wrongBook).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const dueItems = wrongItems.filter((item) => {
    const interval = [1, 3, 7][Math.min(Math.max(item.attempts - 1, 0), 2)];
    return Date.now() - Date.parse(item.updatedAt) >= interval * 86400000;
  });
  const activeDays = new Set(entries.map(([, item]) => new Date(item.updatedAt).toLocaleDateString("en-CA")));
  let streak = 0; const cursor = new Date();
  while (activeDays.has(cursor.toLocaleDateString("en-CA"))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  const chapterMastery = Array.from({ length: 14 }, (_, index) => {
    const chapter = index + 1; const token = `ch${String(chapter).padStart(2, "0")}`;
    const practice = entries.find(([id]) => id === `${token}-structured-practice`)?.[1];
    const deep = entries.some(([id]) => id.startsWith(`deep-${token}`));
    const chapterCase = entries.some(([id, item]) => id.startsWith("case-") && item.title?.includes(`第${chapter}章`));
    const wrong = wrongItems.filter((item) => item.chapter === chapter).length;
    const practiceScore = practice ? (practice.total ? practice.score / practice.total : 0) * 55 : 0;
    const mastery = Math.max(0, Math.min(100, Math.round(practiceScore + (deep ? 25 : 0) + (chapterCase ? 20 : 0) - Math.min(15, wrong * 3))));
    return { chapter, token, mastery, wrong, practice: Boolean(practice), deep, chapterCase };
  });
  const recommended = chapterMastery.find((item) => item.mastery < 60) ?? chapterMastery.find((item) => item.mastery < 85) ?? chapterMastery[0];

  function exportArchive() {
    const deepdives: Record<string, unknown> = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith("wenxianxue-deepdive-")) deepdives[key] = safeRead(key, {});
    }
    const payload = { version: 2, exportedAt: new Date().toISOString(), progress, wrongBook, deepdives, library: readLibrary() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `wenxianxue-learning-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url);
    setNotice("学习档案已经导出。文件只包含本地学习记录。 ");
  }

  async function importArchive(file?: File) {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (![1, 2].includes(payload.version) || typeof payload.progress !== "object" || typeof payload.wrongBook !== "object") throw new Error();
      localStorage.setItem("wxlab-progress", JSON.stringify(payload.progress));
      localStorage.setItem("wxlab-wrongbook", JSON.stringify(payload.wrongBook));
      Object.entries(payload.deepdives ?? {}).forEach(([key, value]) => key.startsWith("wenxianxue-deepdive-") && localStorage.setItem(key, JSON.stringify(value)));
      if (payload.version === 2 && payload.library && typeof payload.library === "object") { localStorage.setItem(LIBRARY_KEY, JSON.stringify({ ...emptyLibrary(), ...payload.library, version: 1 })); window.dispatchEvent(new CustomEvent("wxlab-library-updated")); }
      read(); setNotice("学习档案导入成功。");
    } catch { setNotice("导入失败：请选择由本站导出的 JSON 学习档案。"); }
    if (inputRef.current) inputRef.current.value = "";
  }

  function clearArchive() {
    if (!window.confirm("确定清空当前浏览器中的全部进度、错题、研读记录、札记与收藏吗？此操作不可撤销。")) return;
    localStorage.removeItem("wxlab-progress"); localStorage.removeItem("wxlab-wrongbook");
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter((key): key is string => Boolean(key?.startsWith("wenxianxue-deepdive-")));
    keys.forEach((key) => localStorage.removeItem(key)); read(); setNotice("本地学习档案已清空。");
    localStorage.removeItem(LIBRARY_KEY); window.dispatchEvent(new CustomEvent("wxlab-library-updated"));
  }

  return <div className="progress-dashboard progress-dashboard--full">
    <section className="progress-summary">
      <p className="mini-label">保存在当前浏览器</p><strong>{completed}</strong><span>项学习活动已完成，共 {totalActivities} 项</span>
      <div className="ring" style={{ "--value": `${percent}%` } as React.CSSProperties}><b>{percent}%</b></div>
      <div className="progress-breakdown"><span><b>{practiceCount}/14</b>章综合练习</span><span><b>{deepCount}/14</b>章深度研读</span><span><b>{gameCount}/6</b>旗舰实验</span><span><b>{caseCount}/15</b>章案例</span><span><b>{dossierCount}/1</b>综合案卷</span></div>
      <div className="study-vitals"><span><b>{streak}</b>连续学习天数</span><span><b>{dueItems.length}</b>今日到期错题</span></div>
    </section>
    <section className="mastery-panel">
      <header><div><p className="mini-label">Chapter mastery</p><h2>十四章掌握度</h2></div><aside><span>下一步建议</span><strong>第 {recommended.chapter} 章 · {chapterTitles[recommended.chapter - 1]}</strong><p>{recommended.practice ? recommended.wrong ? `先重做本章 ${recommended.wrong} 道错题，再完成案例。` : "继续完成深度研读或章节案例。" : "先完成本章综合练习，建立第一条掌握度记录。"}</p><a href={`${baseUrl}chapters/${recommended.token}/`}>开始建议任务 →</a></aside></header>
      <div className="mastery-grid">{chapterMastery.map((item) => <a href={`${baseUrl}chapters/${item.token}/`} key={item.token} style={{ "--mastery": `${item.mastery}%` } as React.CSSProperties}><small>第 {item.chapter} 章</small><strong>{item.mastery}%</strong><span>{chapterTitles[item.chapter - 1]}</span><i><b /></i><em>{item.practice ? "练习✓" : "练习—"} · {item.deep ? "研读✓" : "研读—"} · {item.chapterCase ? "案例✓" : "案例—"}</em></a>)}</div>
      <p className="mastery-note">掌握度为本地学习指标：综合练习占 55%，深度研读占 25%，章节案例占 20%；未订正错题会适度扣分。它不是学术能力认证。</p>
    </section>
    <section className="progress-list">
      <div className="progress-list-title"><h2>最近记录</h2>{entries[0] && <a href={hrefFor(entries[0][0], baseUrl)}>继续上次学习 →</a>}</div>
      {completed === 0 ? <div className="empty-state"><span>卷</span><p>还没有学习记录。完成任意章节综合练习、研读案例或互动实验，就会形成第一条档案。</p></div> : entries.slice(0, 10).map(([id, item]) => <article key={id}><div><strong>{item.title ?? names[id] ?? id}</strong><small>{new Date(item.updatedAt).toLocaleDateString("zh-CN")}</small></div><span>{item.score} / {item.total}</span><a href={hrefFor(id, baseUrl)}>继续</a></article>)}
    </section>
    <section className="wrongbook-panel">
      <header><div><p className="mini-label">Wrong book</p><h2>错题本</h2></div><strong>{wrongItems.length}</strong></header>
      {wrongItems.length ? wrongItems.slice(0, 8).map((item) => <article key={item.id}><div><small>第 {item.chapter} 章 · {item.type} · 错误 {item.attempts} 次 {dueItems.some((due) => due.id === item.id) ? "· 今日应复习" : "· 等待间隔复习"}</small><h3>{item.prompt}</h3><p>{item.explanation}</p></div><a href={`${baseUrl}chapters/ch${String(item.chapter).padStart(2, "0")}/#check`}>返回重做 →</a></article>) : <p className="wrong-empty">暂时没有错题。答错的结构化题目会自动进入这里；重新答对后自动移出。</p>}
    </section>
    <section className="archive-tools" id="archive">
      <div><p className="mini-label">Portable archive</p><h2>带走你的学习记录</h2><p>统一备份进度、错题、研读勾选、札记、收藏和最近浏览；不包含账号或设备信息。</p></div>
      <div><button onClick={exportArchive}>导出 JSON</button><button onClick={() => inputRef.current?.click()}>导入档案</button><button className="danger" onClick={clearArchive}>清空记录</button><input ref={inputRef} type="file" accept="application/json" hidden onChange={(event) => importArchive(event.target.files?.[0])} /></div>
      {notice && <p className="archive-notice" role="status">{notice}</p>}
    </section>
  </div>;
}
