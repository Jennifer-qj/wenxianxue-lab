import { useEffect, useMemo, useState } from "react";
import { contributionRecords } from "../data/community";
import "./CommunityLedger.css";

type GithubLabel = string | { name?: string };
type GithubIssue = {
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  created_at: string;
  updated_at: string;
  user: { login: string } | null;
  labels: GithubLabel[];
  pull_request?: unknown;
};

const repository = "Jennifer-qj/wenxianxue-lab";
const apiUrl = `https://api.github.com/repos/${repository}/issues?state=all&per_page=100&sort=updated&direction=desc`;
const statusOrder = ["status: needs-triage", "status: needs-evidence", "status: in-review", "status: accepted", "status: declined"] as const;
const statusLabels: Record<string, string> = {
  "status: needs-triage": "待分流",
  "status: needs-evidence": "待补证",
  "status: in-review": "复核中",
  "status: accepted": "已采用",
  "status: declined": "保留异议",
  unlabelled: "尚未标记",
};

function labelNames(issue: GithubIssue) {
  return issue.labels.map((label) => typeof label === "string" ? label : label.name ?? "");
}

function statusOf(issue: GithubIssue) {
  return statusOrder.find((status) => labelNames(issue).includes(status)) ?? "unlabelled";
}

function chapterOf(issue: GithubIssue) {
  const chinese = issue.title.match(/第\s*(\d{1,2})\s*章/);
  const id = issue.title.match(/\bch(\d{2})\b/i);
  const number = Number(chinese?.[1] ?? id?.[1]);
  return number >= 1 && number <= 14 ? number : null;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

export default function CommunityLedger() {
  const [issues, setIssues] = useState<GithubIssue[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [filter, setFilter] = useState<string>("all");
  const [chapter, setChapter] = useState("all");

  useEffect(() => {
    const cacheKey = "wxlab-community-issues-v1";
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const payload = JSON.parse(cached);
        if (Date.now() - payload.savedAt < 10 * 60 * 1000) {
          setIssues(payload.issues);
          setState("ready");
          return;
        }
      } catch { /* 继续请求公开数据 */ }
    }
    fetch(apiUrl, { headers: { Accept: "application/vnd.github+json" } })
      .then((response) => {
        if (!response.ok) throw new Error(`GitHub API ${response.status}`);
        return response.json();
      })
      .then((items: GithubIssue[]) => {
        const publicIssues = items.filter((item) => !item.pull_request);
        setIssues(publicIssues);
        setState("ready");
        sessionStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), issues: publicIssues }));
      })
      .catch(() => setState("error"));
  }, []);

  const counts = useMemo(() => Object.fromEntries(statusOrder.map((status) => [status, issues.filter((issue) => statusOf(issue) === status).length])), [issues]);
  const visible = useMemo(() => issues.filter((issue) => filter === "all" || statusOf(issue) === filter).slice(0, 12), [issues, filter]);
  const revisions = useMemo(() => issues.filter((issue) => {
    const issueChapter = chapterOf(issue);
    return chapter === "all" ? issueChapter !== null : issueChapter === Number(chapter);
  }), [issues, chapter]);
  const accepted = issues.filter((issue) => statusOf(issue) === "status: accepted");
  const contributors = new Set(accepted.map((issue) => issue.user?.login).filter(Boolean)).size;

  return <section className="community-ledger" aria-labelledby="community-ledger-title">
    <header>
      <div><p className="eyebrow">LIVE PUBLIC LEDGER · 实时公开台账</p><h2 id="community-ledger-title">让反馈、证据与处理结果出现在同一处</h2></div>
      <div className={`ledger-sync ${state}`} aria-live="polite"><span />{state === "loading" ? "正在读取 GitHub" : state === "ready" ? `已读取 ${issues.length} 条公开议题` : "暂时无法读取公开队列"}</div>
    </header>

    <div className="ledger-metrics" aria-label="共校状态统计">
      {statusOrder.map((status) => <button key={status} className={filter === status ? "active" : ""} onClick={() => setFilter(filter === status ? "all" : status)}><strong>{state === "ready" ? counts[status] : "—"}</strong><span>{statusLabels[status]}</span></button>)}
      <div><strong>{contributionRecords.length + accepted.length}</strong><span>公开采用记录</span></div>
      <div><strong>{contributors}</strong><span>GitHub 贡献者</span></div>
    </div>

    <div className="ledger-grid">
      <section className="issue-stream">
        <header><div><small>最近公开议题</small><strong>{filter === "all" ? "全部处理状态" : statusLabels[filter]}</strong></div><a href={`https://github.com/${repository}/issues`} target="_blank" rel="noreferrer">在 GitHub 查看 ↗</a></header>
        {state === "loading" && <div className="ledger-placeholder">正在读取公开 Issue，不会读取私人账号信息。</div>}
        {state === "error" && <div className="ledger-placeholder">GitHub 暂时没有返回数据。你仍可打开公开队列提交或查看记录。</div>}
        {state === "ready" && visible.length === 0 && <div className="ledger-placeholder">这个状态下目前没有公开记录。这里不会用示例数据制造参与度。</div>}
        {visible.map((issue) => <article key={issue.number}>
          <div><span className={`issue-status ${statusOf(issue).replace(/[: ]/g, "-")}`}>{statusLabels[statusOf(issue)]}</span><small>#{issue.number} · {dateLabel(issue.updated_at)}</small></div>
          <a href={issue.html_url} target="_blank" rel="noreferrer"><strong>{issue.title}</strong><span>{chapterOf(issue) ? `第 ${chapterOf(issue)} 章 · ` : "全站 · "}{issue.user?.login ?? "匿名贡献者"}</span></a>
        </article>)}
      </section>

      <aside className="chapter-history">
        <header><div><small>章节修订索引</small><strong>反馈发生在哪里？</strong></div><label><span className="sr-only">选择章节</span><select value={chapter} onChange={(event) => setChapter(event.target.value)}><option value="all">全部章节</option>{Array.from({ length: 14 }, (_, index) => <option key={index + 1} value={index + 1}>第 {index + 1} 章</option>)}</select></label></header>
        {state === "ready" && revisions.length === 0 ? <p>当前没有能从标题定位到这一章的公开 Issue。提交时写明“第几章”或“ch编号”，记录就会进入这里。</p> : <ol>{revisions.slice(0, 8).map((issue) => <li key={issue.number}><span>{dateLabel(issue.created_at)}</span><a href={issue.html_url} target="_blank" rel="noreferrer">{issue.title}</a><small>{statusLabels[statusOf(issue)]}</small></li>)}</ol>}
        <footer>台账直接读取公开 GitHub Issue；只显示公开账号名、标题、时间和处理标签，不建立用户画像。</footer>
      </aside>
    </div>
  </section>;
}
