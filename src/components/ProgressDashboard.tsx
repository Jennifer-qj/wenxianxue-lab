import { useEffect, useRef, useState } from "react";
import { LIBRARY_KEY, emptyLibrary, readLibrary } from "../lib/learningArchive";
import LearningPortfolio from "./LearningPortfolio";

type ProgressItem = { completed: boolean; score: number; total: number; updatedAt: string; title?: string };
type SavedProgress = Record<string, ProgressItem>;
type WrongItem = { id: string; chapter: number; type: string; prompt: string; explanation: string; attempts: number; updatedAt: string };

const names: Record<string, string> = {
  "version-detective": "版本鉴定侦探", "four-fold": "四部分类挑战", "collation-clinic": "校勘诊所",
  "carrier-museum": "载体博物馆", "binding-puzzle": "装帧演变拼图", "leishu-congshu": "类书与丛书分拣",
  "evidence-calibration": "证据称量室",
  "collation-workbench": "校勘工作台", "version-stemma": "版本谱系推理",
  "ch01-research-workbench": "第一章·研究问题装配台",
  "rare-book-dossier": "古籍鉴定综合案卷",
  "fragment-casebook": "残卷归档调查",
};
const gameIds = new Set(["version-detective", "evidence-calibration", "four-fold", "collation-clinic", "carrier-museum", "binding-puzzle", "leishu-congshu", "collation-workbench", "version-stemma"]);
const totalActivities = 55; // 14 章综合练习 + 14 章研读 + 9 项技能实验 + 15 个案例 + 1 个研究问题工作台 + 2 个跨章案卷
const chapterTitles = ["文献与文献学", "文献的载体", "文献的形成与流布", "文献的收藏与散佚", "文献的版本", "文献的校勘", "文献目录", "辑佚与辨伪", "类书与丛书", "地方志与家谱", "总集与别集", "出土文献（上）", "出土文献（下）", "敦煌文献"];

function safeRead<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; }
}

function hrefFor(id: string, baseUrl: string) {
  if (/^ch\d{2}-structured-practice$/.test(id)) return `${baseUrl}chapters/${id.slice(0, 4)}/#check`;
  if (/^deep-ch\d{2}/.test(id)) return `${baseUrl}chapters/${id.slice(5, 9)}/#deep-dive`;
  if (id === "ch01-research-workbench") return `${baseUrl}chapters/ch01/#workbench`;
  if (id === "rare-book-dossier") return `${baseUrl}lab/#rare-book-dossier`;
  if (id === "fragment-casebook") return `${baseUrl}lab/#fragment-casebook`;
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
  const dossierCount = entries.filter(([id]) => id === "rare-book-dossier" || id === "fragment-casebook").length;
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
  const recommendedHref = !recommended.practice || recommended.wrong
    ? `${baseUrl}chapters/${recommended.token}/#check`
    : !recommended.deep
      ? `${baseUrl}chapters/${recommended.token}/#deep-dive`
      : !recommended.chapterCase
        ? `${baseUrl}lab/#case-gallery`
        : `${baseUrl}chapters/${recommended.token}/#chapter-review`;
  const recommendedAction = !recommended.practice
    ? "先完成综合练习，建立本章的第一条基线。"
    : recommended.wrong
      ? `先订正本章 ${recommended.wrong} 道错题，检查误解来自概念还是证据。`
      : !recommended.deep
        ? "把已答对的知识带入竞争性结论，补一次深度研读。"
        : !recommended.chapterCase
          ? "知识与研读已经有记录，下一步用章节案例完成迁移。"
          : "本章三类任务已覆盖，回到章末写下认识、边界和待追问题。";
  const studyPlans = [
    ...(dueItems.length ? [{ id: "due", kicker: "到期复习", title: `${dueItems.length} 道错题已经到复习时间`, reason: "依据错误次数和上次作答日期安排；先回忆，再查看解释。", time: `${Math.min(15, 4 + dueItems.length * 2)} 分钟`, href: `${baseUrl}chapters/ch${String(dueItems[0].chapter).padStart(2, "0")}/#check` }] : []),
    { id: "chapter", kicker: "当前主线", title: `第 ${recommended.chapter} 章 · ${chapterTitles[recommended.chapter - 1]}`, reason: recommendedAction, time: recommended.practice ? "10—15 分钟" : "8—12 分钟", href: recommendedHref },
    ...(practiceCount >= 2 && !entries.some(([id]) => id === "fragment-casebook") ? [{ id: "capstone", kicker: "跨章迁移", title: "残卷归档调查", reason: "你已经留下至少两章练习记录，可以尝试联合载体、版本、目录和敦煌文献证据。", time: "约 18 分钟", href: `${baseUrl}lab/#fragment-casebook` }] : []),
    ...(completed >= 3 ? [{ id: "portfolio", kicker: "收束记录", title: "整理一条阶段成果", reason: "把已经完成的动作、弱项和待追问题放回成果册，避免只累计完成数。", time: "约 6 分钟", href: `${baseUrl}progress/#portfolio` }] : []),
    { id: "tour", kicker: "理解方法", title: "走完一次十分钟导览", reason: "如果还没有连续记录，先用同一案例经历猜测、证据修订与复盘。", time: "约 10 分钟", href: `${baseUrl}tour/` },
    { id: "lab", kicker: "自由练习", title: "从实验目录挑一项判断", reason: "按训练方式、难度和时间筛选，不必按固定章节顺序前进。", time: "4—18 分钟", href: `${baseUrl}lab/#lab-directory` },
  ].filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index).slice(0, 3);

  function exportArchive() {
    const deepdives: Record<string, unknown> = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith("wenxianxue-deepdive-")) deepdives[key] = safeRead(key, {});
    }
    const chapterJourneys = safeRead<Record<string, unknown>>("wxlab-chapter-journeys-v1", {});
    const payload = { version: 3, exportedAt: new Date().toISOString(), progress, wrongBook, deepdives, library: readLibrary(), chapterJourneys };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `wenxianxue-learning-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url);
    setNotice("学习档案已经导出。文件只包含本地学习记录。 ");
  }

  function exportMarkdownReport() {
    const library = readLibrary();
    const generated = new Date();
    const readableDate = generated.toLocaleDateString("zh-CN");
    const lines = [
      "# 文献学实验室 · 我的学习报告",
      "",
      `- 生成日期：${readableDate}`,
      `- 已完成活动：${completed} / ${totalActivities}`,
      `- 综合进度：${percent}%`,
      `- 连续学习：${streak} 天`,
      `- 当前错题：${wrongItems.length}（今日到期 ${dueItems.length}）`,
      "",
      "> 本报告由浏览器中的本地学习记录生成，不代表课程成绩或学术能力认证。",
      "",
      "## 十四章掌握度",
      "",
      "| 章节 | 主题 | 掌握度 | 练习 | 研读 | 案例 |",
      "| --- | --- | ---: | --- | --- | --- |",
      ...chapterMastery.map((item) => `| 第 ${item.chapter} 章 | ${chapterTitles[item.chapter - 1]} | ${item.mastery}% | ${item.practice ? "完成" : "未完成"} | ${item.deep ? "完成" : "未完成"} | ${item.chapterCase ? "完成" : "未完成"} |`),
      "",
      "## 最近完成",
      "",
      ...(entries.length ? entries.slice(0, 20).map(([id, item]) => `- ${new Date(item.updatedAt).toLocaleDateString("zh-CN")} · ${item.title ?? names[id] ?? id}（${item.score}/${item.total}）`) : ["- 尚无已完成活动。"]),
      "",
      "## 待复习问题",
      "",
      ...(wrongItems.length ? wrongItems.slice(0, 20).map((item) => `- 第 ${item.chapter} 章 · ${item.prompt}（错误 ${item.attempts} 次）`) : ["- 当前没有错题记录。"]),
      "",
      "## 收藏与札记",
      "",
      `- 收藏：${Object.keys(library.bookmarks).length} 项`,
      `- 札记：${Object.keys(library.notes).length} 条`,
      "",
      ...Object.values(library.notes).slice(0, 30).flatMap((item) => [
        `### ${item.title}`,
        "",
        item.text.trim(),
        "",
        `页面：${new URL(item.url, window.location.origin).href}`,
        "",
      ]),
      "---",
      "由“文献学实验室”生成：https://jennifer-qj.github.io/wenxianxue-lab/",
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `文献学实验室-学习报告-${generated.toISOString().slice(0, 10)}.md`; anchor.click(); URL.revokeObjectURL(url);
    setNotice("可阅读的 Markdown 学习报告已经生成。札记仅在你主动导出的文件中出现。");
  }

  async function importArchive(file?: File) {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (![1, 2, 3].includes(payload.version) || typeof payload.progress !== "object" || typeof payload.wrongBook !== "object") throw new Error();
      localStorage.setItem("wxlab-progress", JSON.stringify(payload.progress));
      localStorage.setItem("wxlab-wrongbook", JSON.stringify(payload.wrongBook));
      Object.entries(payload.deepdives ?? {}).forEach(([key, value]) => key.startsWith("wenxianxue-deepdive-") && localStorage.setItem(key, JSON.stringify(value)));
      if (payload.version >= 2 && payload.library && typeof payload.library === "object") { localStorage.setItem(LIBRARY_KEY, JSON.stringify({ ...emptyLibrary(), ...payload.library, version: 1 })); window.dispatchEvent(new CustomEvent("wxlab-library-updated")); }
      if (payload.version >= 3 && payload.chapterJourneys && typeof payload.chapterJourneys === "object") { localStorage.setItem("wxlab-chapter-journeys-v1", JSON.stringify(payload.chapterJourneys)); window.dispatchEvent(new CustomEvent("wxlab-chapter-journey-updated")); }
      read(); setNotice("学习档案导入成功。");
    } catch { setNotice("导入失败：请选择由本站导出的 JSON 学习档案。"); }
    if (inputRef.current) inputRef.current.value = "";
  }

  function clearArchive() {
    if (!window.confirm("确定清空当前浏览器中的全部进度、错题、研读记录、章节复盘、札记与收藏吗？此操作不可撤销。")) return;
    localStorage.removeItem("wxlab-progress"); localStorage.removeItem("wxlab-wrongbook");
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter((key): key is string => Boolean(key?.startsWith("wenxianxue-deepdive-")));
    keys.forEach((key) => localStorage.removeItem(key)); read(); setNotice("本地学习档案已清空。");
    localStorage.removeItem(LIBRARY_KEY); window.dispatchEvent(new CustomEvent("wxlab-library-updated"));
    localStorage.removeItem("wxlab-chapter-journeys-v1"); window.dispatchEvent(new CustomEvent("wxlab-chapter-journey-updated"));
  }

  return <div className="progress-dashboard progress-dashboard--full">
    <section className="progress-summary">
      <p className="mini-label">保存在当前浏览器</p><strong>{completed}</strong><span>项学习活动已完成，共 {totalActivities} 项</span>
      <div className="ring" style={{ "--value": `${percent}%` } as React.CSSProperties}><b>{percent}%</b></div>
      <div className="progress-breakdown"><span><b>{practiceCount}/14</b>章综合练习</span><span><b>{deepCount}/14</b>章深度研读</span><span><b>{gameCount}/9</b>技能实验</span><span><b>{caseCount}/15</b>章案例</span><span><b>{dossierCount}/2</b>跨章案卷</span></div>
      <div className="study-vitals"><span><b>{streak}</b>连续学习天数</span><span><b>{dueItems.length}</b>今日到期错题</span></div>
    </section>
    <section className="progress-list">
      <div className="progress-list-title"><h2>最近记录</h2>{entries[0] && <a href={hrefFor(entries[0][0], baseUrl)}>继续上次学习 →</a>}</div>
      {completed === 0 ? <div className="empty-state"><span>卷</span><p>还没有学习记录。完成任意章节综合练习、研读案例或互动实验，就会形成第一条档案。</p></div> : entries.slice(0, 10).map(([id, item]) => <article key={id}><div><strong>{item.title ?? names[id] ?? id}</strong><small>{new Date(item.updatedAt).toLocaleDateString("zh-CN")}</small></div><span>{item.score} / {item.total}</span><a href={hrefFor(id, baseUrl)}>继续</a></article>)}
    </section>
    <section className="study-compass" id="study-compass">
      <header><div><p className="mini-label">Study compass · 本地生成</p><h2>现在最值得做的三件事</h2></div><p>推荐只依据这台设备中的错题、完成记录和章节覆盖；它解释排序理由，不分析身份，也不把路径包装成唯一答案。</p></header>
      <div>{studyPlans.map((item, index) => <article key={item.id}><span>0{index + 1}</span><small>{item.kicker}</small><h3>{item.title}</h3><p>{item.reason}</p><footer><b>{item.time}</b><a href={item.href}>开始 →</a></footer></article>)}</div>
    </section>
    <section className="mastery-panel">
      <header><div><p className="mini-label">Chapter mastery</p><h2>十四章掌握度</h2></div><aside><span>下一步建议</span><strong>第 {recommended.chapter} 章 · {chapterTitles[recommended.chapter - 1]}</strong><p>{recommended.practice ? recommended.wrong ? `先重做本章 ${recommended.wrong} 道错题，再完成案例。` : "继续完成深度研读或章节案例。" : "先完成本章综合练习，建立第一条掌握度记录。"}</p><a href={`${baseUrl}chapters/${recommended.token}/`}>开始建议任务 →</a></aside></header>
      <div className="mastery-grid">{chapterMastery.map((item) => <a href={`${baseUrl}chapters/${item.token}/`} key={item.token} style={{ "--mastery": `${item.mastery}%` } as React.CSSProperties}><small>第 {item.chapter} 章</small><strong>{item.mastery}%</strong><span>{chapterTitles[item.chapter - 1]}</span><i><b /></i><em>{item.practice ? "练习✓" : "练习—"} · {item.deep ? "研读✓" : "研读—"} · {item.chapterCase ? "案例✓" : "案例—"}</em></a>)}</div>
      <p className="mastery-note">掌握度为本地学习指标：综合练习占 55%，深度研读占 25%，章节案例占 20%；未订正错题会适度扣分。它不是学术能力认证。</p>
    </section>
    <LearningPortfolio baseUrl={baseUrl} progress={progress} />
    <section className="wrongbook-panel">
      <header><div><p className="mini-label">Wrong book</p><h2>错题本</h2></div><strong>{wrongItems.length}</strong></header>
      {wrongItems.length ? wrongItems.slice(0, 8).map((item) => <article key={item.id}><div><small>第 {item.chapter} 章 · {item.type} · 错误 {item.attempts} 次 {dueItems.some((due) => due.id === item.id) ? "· 今日应复习" : "· 等待间隔复习"}</small><h3>{item.prompt}</h3><p>{item.explanation}</p></div><a href={`${baseUrl}chapters/ch${String(item.chapter).padStart(2, "0")}/#check`}>返回重做 →</a></article>) : <p className="wrong-empty">暂时没有错题。答错的结构化题目会自动进入这里；重新答对后自动移出。</p>}
    </section>
    <section className="archive-tools" id="archive">
      <div><p className="mini-label">Portable archive</p><h2>带走你的学习记录</h2><p>统一备份进度、错题、研读勾选、章节复盘、札记、收藏和最近浏览；不包含账号或设备信息。</p></div>
      <div><button onClick={exportMarkdownReport}>生成活动报告 .md</button><button onClick={exportArchive}>备份数据 .json</button><button onClick={() => inputRef.current?.click()}>导入档案</button><button className="danger" onClick={clearArchive}>清空记录</button><input ref={inputRef} type="file" accept="application/json" hidden onChange={(event) => importArchive(event.target.files?.[0])} /></div>
      {notice && <p className="archive-notice" role="status">{notice}</p>}
    </section>
  </div>;
}
