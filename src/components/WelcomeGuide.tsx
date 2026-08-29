import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "wenxianxue-welcome-v1";

export default function WelcomeGuide({ baseUrl }: { baseUrl: string }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const welcomeMode = new URLSearchParams(window.location.search).get("welcome");
    if (welcomeMode === "0") return;
    if (window.location.pathname.endsWith("/tour/")) return;
    const replay = welcomeMode === "1";
    if (replay || !window.localStorage.getItem(STORAGE_KEY)) setOpen(true);
  }, []);
  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const background = [document.querySelector(".site-header"), document.querySelector("main"), document.querySelector(".site-footer"), document.querySelector(".learning-dock"), document.querySelector(".feedback-trigger")]
      .filter((item): item is HTMLElement => item instanceof HTMLElement);
    background.forEach((item) => item.setAttribute("inert", ""));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { close(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      background.forEach((item) => item.removeAttribute("inert"));
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.setTimeout(() => previousFocusRef.current?.focus(), 0);
    };
  }, [open]);

  function close() {
    window.localStorage.setItem(STORAGE_KEY, "seen");
    setOpen(false);
  }

  if (!open) return null;
  return <div className="welcome-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section ref={dialogRef} className="welcome-dialog" role="dialog" aria-modal="true" aria-labelledby="welcome-title" aria-describedby="welcome-description">
      <button ref={closeRef} className="welcome-close" onClick={close} aria-label="关闭首次访问引导">×</button>
      <p className="eyebrow">WELCOME · 首次访问</p>
      <h2 id="welcome-title">你想怎样进入文献学？</h2>
      <p id="welcome-description" className="welcome-lead">这里不是在线电子书。请选择一种方式开始；你的学习记录只保存在当前浏览器，不要求登录，也不建立用户画像。</p>
      <div className="welcome-routes">
        <a href={`${baseUrl}paths/intro/`} onClick={close}><small>01 · 系统学习</small><strong>我第一次学文献学</strong><span>从导论路径开始，依次读、练、回看。</span><b>进入入门路线 →</b></a>
        <a href={`${baseUrl}concepts/`} onClick={close}><small>02 · 带着问题来</small><strong>我想查一个概念</strong><span>从全书概念索引和关系网络进入。</span><b>打开概念词典 →</b></a>
        <a href={`${baseUrl}lab/#rare-book-dossier`} onClick={close}><small>03 · 动手判断</small><strong>我想直接玩案例</strong><span>通过鉴定案卷、排序和模拟实验学习。</span><b>进入互动实验室 →</b></a>
      </div>
      <button className="welcome-later" onClick={close}>知道了，以后从导航进入</button>
    </section>
  </div>;
}
