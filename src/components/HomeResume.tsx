import { useEffect, useState } from "react";
import { readLibrary, type LearningLibrary } from "../lib/learningArchive";
import "./HomeResume.css";

type ProgressItem = { completed?: boolean };
type WrongItem = { attempts?: number; updatedAt?: string };

const emptyState = {
  ready: false,
  completed: 0,
  due: 0,
  library: null as LearningLibrary | null,
};

function safeRead<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; }
}

export default function HomeResume({ baseUrl }: { baseUrl: string }) {
  const [state, setState] = useState(emptyState);

  useEffect(() => {
    const progress = safeRead<Record<string, ProgressItem>>("wxlab-progress", {});
    const wrongBook = safeRead<Record<string, WrongItem>>("wxlab-wrongbook", {});
    const due = Object.values(wrongBook).filter((item) => {
      if (!item.updatedAt) return false;
      const interval = [1, 3, 7][Math.min(Math.max((item.attempts ?? 1) - 1, 0), 2)];
      return Date.now() - Date.parse(item.updatedAt) >= interval * 86400000;
    }).length;
    setState({
      ready: true,
      completed: Object.values(progress).filter((item) => item.completed).length,
      due,
      library: readLibrary(),
    });
  }, []);

  if (!state.ready) return <section className="home-resume home-resume--loading container" aria-label="正在读取本地学习记录" />;

  const recent = state.library?.recent.find((item) => ["chapter", "concept", "lab", "path"].includes(item.type));
  const notes = Object.keys(state.library?.notes ?? {}).length;
  const bookmarks = Object.keys(state.library?.bookmarks ?? {}).length;
  const hasArchive = Boolean(recent || state.completed || notes || bookmarks);
  const target = recent?.url ?? `${baseUrl}chapters/ch01/`;
  const targetTitle = recent?.title ?? "第一章 · 文献与文献学";

  return <section className={`home-resume container ${hasArchive ? "has-history" : "is-new"}`} aria-labelledby="home-resume-title">
    <div className="home-resume__mark" aria-hidden="true"><span>{hasArchive ? "续" : "启"}</span></div>
    <div className="home-resume__copy">
      <p className="eyebrow">LOCAL STUDY THREAD · 本地学习线索</p>
      <h2 id="home-resume-title">{hasArchive ? "从上次停下的地方继续" : "第一次来，可以先完成一小段"}</h2>
      <p>{hasArchive ? `最近浏览：${targetTitle}。记录只保存在这台设备，不会上传。` : "先读第一章的一个学习单元，再完成一次证据判断；网站会从这里开始保留你的进度。"}</p>
    </div>
    <dl aria-label="本地学习档案摘要">
      <div><dt>已完成</dt><dd>{state.completed}<small>/55 项</small></dd></div>
      <div><dt>札记</dt><dd>{notes}<small> 条</small></dd></div>
      <div><dt>今日复习</dt><dd>{state.due}<small> 题</small></dd></div>
    </dl>
    <div className="home-resume__actions">
      <a className="button" href={target}>{hasArchive ? "继续这条线索" : "从第一章开始"} <span>→</span></a>
      <a href={`${baseUrl}progress/`}>查看完整学习档案</a>
    </div>
  </section>;
}
