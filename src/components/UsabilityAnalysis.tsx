import { useMemo, useRef, useState } from "react";
import "./UsabilityAnalysis.css";

type TaskRecord = { id: string; title: string; result: "untested" | "completed" | "blocked"; seconds?: number; difficulty: number; note: string };
type Session = { project: string; tested_at: string; tasks: TaskRecord[]; debrief?: { understanding?: string; useful?: string; confusing?: string; missing?: string }; source?: string };

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function isSession(value: any): value is Session {
  return value?.project === "文献学实验室" && typeof value?.tested_at === "string" && Array.isArray(value?.tasks) && value.tasks.every((task: any) => typeof task?.id === "string" && ["untested", "completed", "blocked"].includes(task?.result));
}

export default function UsabilityAnalysis() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const aggregates = useMemo(() => {
    const ids = [...new Set(sessions.flatMap((session) => session.tasks.map((task) => task.id)))];
    return ids.map((id) => {
      const allRecords = sessions.flatMap((session) => session.tasks.filter((task) => task.id === id));
      const records = allRecords.filter((task) => task.result !== "untested");
      const completed = records.filter((item) => item.result === "completed").length;
      const blocked = records.filter((item) => item.result === "blocked").length;
      const timed = records.filter((item) => typeof item.seconds === "number");
      const difficulty = records.length ? records.reduce((sum, item) => sum + Number(item.difficulty || 0), 0) / records.length : 0;
      return { id, title: allRecords[0]?.title ?? id, tested: records.length, completed, blocked, rate: records.length ? Math.round((completed / records.length) * 100) : 0, seconds: median(timed.map((item) => item.seconds ?? 0)), difficulty: Number(difficulty.toFixed(1)), notes: records.map((item) => item.note?.trim()).filter(Boolean), priority: records.length ? (blocked / records.length) * 2 + difficulty / 5 : 0 };
    }).sort((a, b) => b.priority - a.priority);
  }, [sessions]);

  const testedTotal = aggregates.reduce((sum, item) => sum + item.tested, 0);
  const completedTotal = aggregates.reduce((sum, item) => sum + item.completed, 0);
  const blockedTotal = aggregates.reduce((sum, item) => sum + item.blocked, 0);
  const quotes = useMemo(() => ({
    understanding: sessions.map((item) => item.debrief?.understanding?.trim()).filter(Boolean),
    useful: sessions.map((item) => item.debrief?.useful?.trim()).filter(Boolean),
    confusing: sessions.map((item) => item.debrief?.confusing?.trim()).filter(Boolean),
    missing: sessions.map((item) => item.debrief?.missing?.trim()).filter(Boolean),
  }), [sessions]);

  async function ingest(files: FileList | File[]) {
    const accepted: Session[] = []; const rejected: string[] = [];
    for (const file of Array.from(files)) {
      try { const value = JSON.parse(await file.text()); if (isSession(value)) accepted.push({ ...value, source: file.name }); else rejected.push(file.name); } catch { rejected.push(file.name); }
    }
    setSessions((current) => {
      const byKey = new Map(current.map((item) => [item.tested_at, item]));
      accepted.forEach((item) => byKey.set(item.tested_at, item));
      return [...byKey.values()].sort((a, b) => a.tested_at.localeCompare(b.tested_at));
    });
    setMessage(`${accepted.length} 份记录已读入${rejected.length ? `；${rejected.length} 个文件格式不符` : ""}`);
  }

  function markdown() {
    const lines = ["# 文献学实验室 · 用户测试汇总", "", `- 有效场次：${sessions.length}`, `- 已执行任务：${testedTotal}`, `- 顺利完成：${completedTotal}`, `- 遇到阻碍：${blockedTotal}`, "", "## 任务结果（按修复优先度排列）", "", ...aggregates.flatMap((item) => [`### ${item.title}`, "", `- 完成率：${item.rate}%（${item.completed}/${item.tested}）`, `- 受阻：${item.blocked}`, `- 中位耗时：${item.seconds} 秒`, `- 平均难度：${item.difficulty}/5`, ...(item.notes.length ? ["- 观察记录：", ...item.notes.map((note) => `  - ${note}`)] : ["- 观察记录：未填写"]), ""]), "## 结束访谈原话", "", ...([['项目理解', quotes.understanding], ['最有帮助', quotes.useful], ['最困惑／不可信', quotes.confusing], ['还缺什么', quotes.missing]] as const).flatMap(([title, items]) => [`### ${title}`, "", ...(items.length ? items.map((item) => `- ${item}`) : ["- 暂无记录"]), ""]), "> 本汇总由浏览器本地文件生成；优先度只是受阻率与主观难度的排序线索，不能替代逐条阅读原始记录。"];
    return lines.join("\n");
  }

  async function copy() {
    try { await navigator.clipboard.writeText(markdown()); setMessage("完整汇总已复制"); } catch { setMessage("浏览器未允许复制，请下载 Markdown"); }
  }
  function download() {
    const blob = new Blob([markdown()], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `文献学实验室-用户测试汇总-${new Date().toISOString().slice(0, 10)}.md`; link.click(); URL.revokeObjectURL(link.href);
  }

  return <div className="analysis-workbench">
    <section className="analysis-import" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void ingest(event.dataTransfer.files); }}><div><small>LOCAL ANALYSIS · 仅在本机分析</small><h2>把多份匿名测试记录放在一起看</h2><p>选择或拖入测试页导出的 JSON。文件只在当前浏览器中读取，不会上传到网站或 GitHub。</p></div><input ref={inputRef} type="file" accept="application/json,.json" multiple onChange={(event) => event.target.files && void ingest(event.target.files)} /><button type="button" onClick={() => inputRef.current?.click()}>选择 JSON 文件</button>{message && <p role="status">{message}</p>}</section>
    {!sessions.length ? <section className="analysis-empty"><strong>等待真实记录</strong><p>这里不会填入演示数据。一个月后导入实际文件，统计与原话区才会出现结果。</p></section> : <><header className="analysis-summary"><div><small>有效场次</small><strong>{sessions.length}</strong></div><div><small>已执行任务</small><strong>{testedTotal}</strong></div><div><small>顺利完成</small><strong>{completedTotal}</strong></div><div><small>遇到阻碍</small><strong>{blockedTotal}</strong></div></header><section className="analysis-priority"><header><div><small>PRIORITY QUEUE</small><h2>先看高受阻、高难度的任务</h2></div><p>排序只用于发现需要先阅读的记录；不能因为数字靠前就跳过参与者原话。</p></header><div>{aggregates.map((item, index) => <article key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{item.title}</h3><p>{item.tested ? `完成率 ${item.rate}% · 受阻 ${item.blocked}/${item.tested} · 中位 ${item.seconds} 秒 · 难度 ${item.difficulty}/5` : "尚未执行"}</p>{item.notes.length ? <details><summary>查看 {item.notes.length} 条观察记录</summary><ul>{item.notes.map((note, noteIndex) => <li key={noteIndex}>“{note}”</li>)}</ul></details> : <small>没有填写观察记录</small>}</div><meter min="0" max="3" value={Math.min(3, item.priority)}>{item.priority}</meter></article>)}</div></section><section className="analysis-quotes"><header><small>VERBATIM NOTES</small><h2>结束访谈原话</h2></header>{([['项目理解', quotes.understanding], ['最有帮助', quotes.useful], ['最困惑／不可信', quotes.confusing], ['还缺什么', quotes.missing]] as const).map(([title, items]) => <div key={title}><h3>{title}</h3>{items.length ? items.map((item, index) => <blockquote key={index}>“{item}”</blockquote>) : <p>暂无记录</p>}</div>)}</section><footer className="analysis-export"><div><strong>保留一份未经粉饰的测试摘要</strong><p>Markdown 会包含全部任务指标、观察记录和结束访谈原话。</p></div><div><button type="button" onClick={copy}>复制完整汇总</button><button type="button" onClick={download}>下载 Markdown</button><button type="button" onClick={() => { setSessions([]); setMessage("已清空本次本地汇总"); }}>清空</button></div></footer></>}
  </div>;
}
