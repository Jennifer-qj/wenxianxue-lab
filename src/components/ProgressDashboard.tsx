import { useEffect, useState } from "react";

type SavedProgress = Record<string, { completed: boolean; score: number; total: number; updatedAt: string; title?: string }>;

const names: Record<string, string> = {
  "version-detective": "版本鉴定侦探",
  "four-fold": "四部分类挑战",
  "collation-clinic": "校勘诊所",
  "carrier-museum": "载体博物馆",
  "binding-puzzle": "装帧演变拼图",
  "leishu-congshu": "类书与丛书分拣",
};

export default function ProgressDashboard() {
  const [progress, setProgress] = useState<SavedProgress>({});

  useEffect(() => {
    const read = () => setProgress(JSON.parse(localStorage.getItem("wxlab-progress") || "{}"));
    read();
    window.addEventListener("wxlab-progress-updated", read);
    return () => window.removeEventListener("wxlab-progress-updated", read);
  }, []);

  const completed = Object.values(progress).filter((item) => item.completed).length;
  const totalActivities = 20;

  return (
    <div className="progress-dashboard">
      <section className="progress-summary">
        <p className="mini-label">保存在当前浏览器</p>
        <strong>{completed}</strong>
        <span>项章节检测或互动已完成</span>
        <div className="ring" style={{ "--value": `${Math.min(100, (completed / totalActivities) * 100)}%` } as React.CSSProperties}>
          <b>{Math.round((completed / totalActivities) * 100)}%</b>
        </div>
      </section>
      <section className="progress-list">
        <h2>最近记录</h2>
        {completed === 0 ? (
          <div className="empty-state">
            <span>卷</span>
            <p>还没有学习记录。阅读任意章节并完成章末检测，或前往互动实验室完成任务，这里就会出现你的第一条档案。</p>
          </div>
        ) : (
          Object.entries(progress).map(([id, item]) => (
            <article key={id}>
              <div>
                <strong>{item.title ?? names[id] ?? id}</strong>
                <small>{new Date(item.updatedAt).toLocaleDateString("zh-CN")}</small>
              </div>
              <span>{item.score} / {item.total}</span>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
