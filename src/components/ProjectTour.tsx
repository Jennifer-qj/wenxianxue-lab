import { useEffect, useMemo, useState } from "react";

type TourStep = 0 | 1 | 2 | 3 | 4 | 5;
type EvidenceChoice = "core" | "support" | "caution";

const STORAGE_KEY = "wxlab-project-tour-v1";
const steps = [
  { n: "01", time: "1 分钟", label: "为什么要做" },
  { n: "02", time: "2 分钟", label: "怎样拆一章" },
  { n: "03", time: "2 分钟", label: "怎样判断" },
  { n: "04", time: "2 分钟", label: "怎样连接" },
  { n: "05", time: "2 分钟", label: "怎样留下自己" },
  { n: "06", time: "1 分钟", label: "怎样成为成果" },
] as const;

const evidence = [
  { id: "preface", title: "序跋纪年", detail: "序中署“康熙三十二年”，且与正文同版印刷。", expected: "core" as EvidenceChoice },
  { id: "engraver", title: "刻工活动", detail: "两名刻工还见于另一部康熙中期刻本。", expected: "support" as EvidenceChoice },
  { id: "paper", title: "纸色泛黄", detail: "纸张松软，无水印；保存环境不明。", expected: "caution" as EvidenceChoice },
] as const;

export default function ProjectTour({ baseUrl }: { baseUrl: string }) {
  const [step, setStep] = useState<TourStep>(0);
  const [choice, setChoice] = useState<EvidenceChoice | null>(null);
  const [reflection, setReflection] = useState("");
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const finished = step === 5 && reflection.trim().length >= 12;
  const progress = ((step + 1) / steps.length) * 100;

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (saved) {
        setStep(Math.min(5, Math.max(0, saved.step ?? 0)) as TourStep);
        setChoice(saved.choice ?? null);
        setReflection(saved.reflection ?? "");
      }
    } catch { /* 失效的会话记录直接忽略 */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, choice, reflection }));
  }, [ready, step, choice, reflection]);

  const summary = useMemo(() => [
    "# 文献学实验室 · 十分钟导览记录",
    "",
    `- 我对“序跋纪年”的证据判断：${choice === "core" ? "关键证据" : choice === "support" ? "辅助互证" : choice === "caution" ? "保留事项" : "尚未判断"}`,
    `- 我带走的一句话：${reflection.trim() || "尚未填写"}`,
    "- 下一步：回到原书，核对一条具体表述或页码。",
    "",
    "这份记录来自个人浏览器中的一次项目导览，不是能力认证或学术结论。",
  ].join("\n"), [choice, reflection]);

  function go(next: number) {
    setStep(Math.min(5, Math.max(0, next)) as TourStep);
    requestAnimationFrame(() => document.querySelector(".tour-workbench")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function copySummary() {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function reset() {
    sessionStorage.removeItem(STORAGE_KEY);
    setStep(0); setChoice(null); setReflection(""); setCopied(false);
  }

  return (
    <section className="tour-workbench" aria-labelledby="tour-title">
      <header className="tour-board-head">
        <div><small>GUIDED PROJECT TOUR</small><h2 id="tour-title">十分钟，看见一本书怎样变成学习实验室</h2></div>
        <div className="tour-progress" aria-label={`导览进度 ${step + 1} / ${steps.length}`}><strong>{String(step + 1).padStart(2, "0")}</strong><span>/ 06</span></div>
      </header>
      <div className="tour-meter" aria-hidden="true"><i style={{ width: `${progress}%` }} /></div>
      <nav className="tour-stepper" aria-label="导览步骤">
        {steps.map((item, index) => <button key={item.n} className={index === step ? "active" : index < step ? "visited" : ""} aria-current={index === step ? "step" : undefined} onClick={() => go(index)}><span>{item.n}</span><b>{item.label}</b><small>{item.time}</small></button>)}
      </nav>

      <div className="tour-scene" aria-live="polite">
        {step === 0 && <article className="tour-opening">
          <p className="tour-kicker">第一站 · 不是把书搬上网</p>
          <h3>我真正想保存的，是读书时发生的判断。</h3>
          <p>原书告诉我什么是版本、目录和校勘；纸边的箭头却暴露了另一件事：定义懂了，不等于遇到材料时会判断。这个项目因此没有发布原书全文，而是把“比较、怀疑、互证、暂缓结论”做成可以动手完成的任务。</p>
          <div className="tour-contrast"><span><del>原文 → 网页</del><small>只换一种阅读载体</small></span><i>→</i><span><strong>问题 → 操作 → 反馈 → 复盘</strong><small>留下自己的学习证据</small></span></div>
        </article>}

        {step === 1 && <article>
          <p className="tour-kicker">第二站 · 以第五章“版本的鉴定”为例</p>
          <h3>一章不再只是一串小标题，而是一条能走完的任务线。</h3>
          <div className="tour-chapter-map">
            <span><b>定位</b><small>这章解决什么问题？</small></span><i>→</i><span><b>拆概念</b><small>版本、版次、印次</small></span><i>→</i><span><b>看证据</b><small>牌记、避讳、刻工</small></span><i>→</i><span><b>做判断</b><small>结论能写多满？</small></span><i>→</i><span><b>复盘</b><small>还缺哪条证据？</small></span>
          </div>
          <p className="tour-side-note">全站 14 章都进入了同一学习闭环，但每章的案例、作者旁注和纸本复核重点并不相同。</p>
          <a className="tour-source-link" href={`${baseUrl}chapters/ch05/#journey`} target="_blank">在新标签查看第五章学习地图 ↗</a>
        </article>}

        {step === 2 && <article>
          <p className="tour-kicker">第三站 · 先做一次真正的证据判断</p>
          <h3>“序跋纪年”在这宗版本鉴定案里，应该放在哪里？</h3>
          <blockquote>序中署“康熙三十二年”，内容与正文同版印刷。</blockquote>
          <div className="tour-evidence-choices">
            {(["core", "support", "caution"] as EvidenceChoice[]).map((id) => <button key={id} className={choice === id ? "selected" : ""} onClick={() => setChoice(id)}><b>{id === "core" ? "关键证据" : id === "support" ? "辅助互证" : "保留事项"}</b><small>{id === "core" ? "直接约束判断" : id === "support" ? "增强但不能定案" : "容易误导或条件不明"}</small></button>)}
          </div>
          {choice && <div className={`tour-diagnosis ${choice === evidence[0].expected ? "good" : "revise"}`}><strong>{choice === "core" ? "证据角色判断合理" : "再看一眼“同版印刷”"}</strong><p>{choice === "core" ? "纪年与正文的制作关系清楚，能够直接缩小断代范围；但它仍不能单独证明“原装初印”。" : "如果序跋只是后配抄入，强度会下降；题目特别交代“与正文同版印刷”，正是在说明它与这次刻印的关系。"}</p></div>}
          <p className="tour-side-note">完整实验还会加入刻工、纸张与重装等相互冲突的线索。这里仅用一张教学卡演示机制，材料并非真实古籍鉴定记录。</p>
        </article>}

        {step === 3 && <article>
          <p className="tour-kicker">第四站 · 从一张卡回到整张知识网</p>
          <h3>证据不是孤岛，它会沿着概念关系改变判断。</h3>
          <div className="tour-mini-graph" aria-label="版本鉴定概念关系示意">
            <span className="node main">版本鉴定</span><span className="node n1">序跋</span><span className="node n2">避讳</span><span className="node n3">刻工</span><span className="node n4">装帧</span><span className="node n5">目录著录</span>
            <i className="edge e1" /><i className="edge e2" /><i className="edge e3" /><i className="edge e4" /><i className="edge e5" />
          </div>
          <p>图谱的用途不是“看起来复杂”，而是回答具体问题：一条版本判断需要哪些互证？校勘与版本为何会相遇？残卷又怎样借目录重建位置？</p>
          <a className="tour-source-link" href={`${baseUrl}graph/`} target="_blank">打开可拖动知识图谱与三条问题导览 ↗</a>
        </article>}

        {step === 4 && <article>
          <p className="tour-kicker">第五站 · 把别人的知识改写成自己的问题</p>
          <h3>现在，用一句话留下你真正带走的东西。</h3>
          <label className="tour-reflection"><span>我原来以为……现在我会先……</span><textarea value={reflection} onChange={(event) => setReflection(event.target.value)} maxLength={180} placeholder="例如：我原来以为有明确纪年就能定版，现在我会先确认序跋与正文是否属于同一次制作，再用其他证据互证。" /><small className={reflection.trim().length >= 12 ? "ready" : ""}>{reflection.trim().length}/180 · 至少写 12 个字，这不是标准答案。</small></label>
          <p className="tour-side-note">这句话只暂存在当前浏览器标签页，不会上传。正式章节页会把“认识—证据边界—待核问题”整理进个人成果册。</p>
        </article>}

        {step === 5 && <article className="tour-finale">
          <p className="tour-kicker">第六站 · 你刚才完成的不是浏览，而是一条学习记录</p>
          <h3>{finished ? "一条微型学习闭环已经成立。" : "还差一句自己的复盘，就能完成这条路线。"}</h3>
          <div className="tour-output"><small>本次导览留下的证据</small><dl><div><dt>理解</dt><dd>网站不是原书电子版，而是判断练习场。</dd></div><div><dt>判断</dt><dd>{choice ? `你把序跋纪年归为“${choice === "core" ? "关键证据" : choice === "support" ? "辅助互证" : "保留事项"}”。` : "尚未完成证据判断。"}</dd></div><div><dt>复盘</dt><dd>{reflection.trim() || "尚未写下自己带走的一句话。"}</dd></div></dl></div>
          <div className="tour-final-actions"><button disabled={!finished} onClick={copySummary}>{copied ? "已复制导览记录 ✓" : "复制我的导览记录"}</button><a href={`${baseUrl}progress/?welcome=0&portfolio=sample#portfolio`}>查看完整示例成果册 →</a></div>
          <p>真正的成果册不会因为点过页面就自动“变优秀”。它只汇总已经留下的任务轨迹、练习、复盘和待追问题，并明确标注空白。</p>
        </article>}
      </div>

      <footer className="tour-controls">
        <button onClick={() => go(step - 1)} disabled={step === 0}>← 上一步</button>
        <span>{steps[step].time} · {steps[step].label}</span>
        {step < 5 ? <button className="primary" onClick={() => go(step + 1)} disabled={(step === 2 && !choice) || (step === 4 && reflection.trim().length < 12)}>继续下一站 →</button> : <button onClick={reset}>重新走一次</button>}
      </footer>
    </section>
  );
}
