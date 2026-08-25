import { useEffect, useMemo, useRef, useState } from "react";

type Kind = "content" | "source" | "quiz" | "feature" | "bug" | "review";

const options: Array<{ id: Kind; label: string; description: string; template: string; prefix: string }> = [
  { id: "content", label: "知识表述", description: "概念、人物、年代或判断边界可能有误", template: "content-correction.yml", prefix: "内容纠错" },
  { id: "source", label: "来源页码", description: "纸本页码、书目信息或证据关系需要核对", template: "content-correction.yml", prefix: "来源核对" },
  { id: "quiz", label: "题目解析", description: "答案、解析或题型设计值得商榷", template: "content-correction.yml", prefix: "题目反馈" },
  { id: "feature", label: "功能建议", description: "提出新的学习方式、交互或展示建议", template: "feature-request.yml", prefix: "功能建议" },
  { id: "bug", label: "网站问题", description: "显示、链接、操作或学习记录发生故障", template: "bug-report.yml", prefix: "网站问题" },
  { id: "review", label: "认领共校", description: "愿意依据纸本核对当前章节或知识点", template: "review-claim.yml", prefix: "共校认领" },
];

export default function FeedbackPanel({ baseUrl, title }: { baseUrl: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("content");
  const [copied, setCopied] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const current = options.find((item) => item.id === kind)!;
  const context = useMemo(() => typeof window === "undefined" ? "" : [
    `页面：${title}`,
    `地址：${window.location.href}`,
    `反馈类型：${current.label}`,
    "涉及内容：请粘贴需要核对的短句或知识点名称（不要粘贴原书大段文字）",
  ].join("\n"), [title, current.label]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  function close() {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  async function continueToGitHub() {
    try {
      await navigator.clipboard.writeText(context);
      setCopied(true);
    } catch {
      setCopied(false);
    }
    const repo = "https://github.com/Jennifer-qj/wenxianxue-lab/issues/new";
    const params = new URLSearchParams({ template: current.template, title: `[${current.prefix}] ${title}` });
    window.open(`${repo}?${params}`, "_blank", "noopener,noreferrer");
  }

  return <>
    <button ref={triggerRef} className="feedback-trigger" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-controls="feedback-dialog">
      <span aria-hidden="true">校</span><b>反馈共校</b>
    </button>
    {open && <div className="feedback-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section ref={dialogRef} id="feedback-dialog" className="feedback-panel" role="dialog" aria-modal="true" aria-labelledby="feedback-title" aria-describedby="feedback-description">
        <header>
          <div><p>COMMUNITY REVIEW</p><h2 id="feedback-title">你发现了什么？</h2></div>
          <button ref={closeRef} onClick={close} aria-label="关闭反馈面板">×</button>
        </header>
        <p id="feedback-description" className="feedback-lead">选择反馈类型。系统会复制当前页面信息，并打开公开的 GitHub 处理单；网站本身不建立用户账号。</p>
        <div className="feedback-kinds">
          {options.map((item) => <button key={item.id} aria-pressed={kind === item.id} className={kind === item.id ? "active" : ""} onClick={() => { setKind(item.id); setCopied(false); }}>
            <strong>{item.label}</strong><span>{item.description}</span>
          </button>)}
        </div>
        <div className="feedback-context"><small>将自动附带</small><code>{title}</code><span>{typeof window !== "undefined" ? window.location.pathname : "当前页面"}</span></div>
        <footer>
          <a href={`${baseUrl}contribute/`}>先阅读共校规则</a>
          <button className="button" onClick={continueToGitHub}>{copied ? "信息已复制，继续前往" : "复制页面信息并提交"} <span>↗</span></button>
        </footer>
      </section>
    </div>}
  </>;
}
