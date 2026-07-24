import { useEffect, useState } from "react";

type SavedProgress = Record<string, { completed: boolean; score: number; total: number; updatedAt: string }>;

export default function ProgressDashboard() {
  const [progress, setProgress] = useState<SavedProgress>({});

  useEffect(() => {
    const read = () => setProgress(JSON.parse(localStorage.getItem("wxlab-progress") || "{}"));
    read();
    window.addEventListener("wxlab-progress-updated", read);
    return () => window.removeEventListener("wxlab-progress-updated", read);
  }, []);

  const completed = Object.values(progress).filter((item) => item.completed).length;

  return (
    <div className="progress-dashboard">
      <section className="progress-summary">
        <p className="mini-label">保存在当前浏览器</p>
        <strong>{completed}</strong>
        <span>项互动已完成</span>
        <div className="ring" style={{ "--value": `${Math.min(100, (completed / 12) * 100)}%` } as React.CSSProperties}>
          <b>{Math.round((completed / 12) * 100)}%</b>
        </div>
      </section>
      <section className="progress-list">
        <h2>最近记录</h2>
        {completed === 0 ? (
          <div className="empty-state">
            <span>卷</span>
            <p>还没有学习记录。前往互动实验室完成“版本鉴定侦探”，这里就会出现你的第一条档案。</p>
          </div>
        ) : (
          Object.entries(progress).map(([id, item]) => (
            <article key={id}>
              <div>
                <strong>{id === "version-detective" ? "版本鉴定侦探" : id}</strong>
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
