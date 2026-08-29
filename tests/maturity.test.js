import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

describe("公开项目成熟度门禁", () => {
  it("提供 404 恢复路径与可安装应用清单", () => {
    const page = read("src/pages/404.astro");
    const manifest = JSON.parse(read("public/site.webmanifest"));
    expect(page).toContain("search/");
    expect(page).toContain("返回首页");
    expect(manifest.start_url).toBe("/wenxianxue-lab/");
    expect(manifest.display).toBe("standalone");
  });

  it("输出分享、结构化数据与搜索发现入口", () => {
    const layout = read("src/layouts/BaseLayout.astro");
    expect(layout).toContain("og-cover.png");
    expect(layout).toContain("LearningResource");
    expect(layout).toContain("site.webmanifest");
    expect(read("public/robots.txt")).toContain("sitemap.xml");
    expect(read("src/pages/sitemap.xml.ts")).toContain("conceptRoutes");
  });

  it("保留项目引用、贡献与问题反馈规范", () => {
    expect(existsSync(resolve(root, "CITATION.cff"))).toBe(true);
    expect(read("CONTRIBUTING.md")).toContain("不要上传");
    expect(read(".github/workflows/ci.yml")).toContain("pull_request");
    expect(existsSync(resolve(root, ".github/ISSUE_TEMPLATE/content-correction.yml"))).toBe(true);
  });

  it("展示素材完整且不是空白占位图", () => {
    const images = ["01-home", "02-guide", "03-coverage", "04-graph", "05-lab", "06-chapter", "07-story", "08-version", "09-catalog"];
    images.forEach((name) => expect(statSync(resolve(root, `docs/media/${name}.png`)).size).toBeGreaterThan(20_000));
  });

  it("提供本地札记、收藏、最近浏览和统一档案备份", () => {
    const layout = read("src/layouts/BaseLayout.astro");
    const progress = read("src/components/ProgressDashboard.tsx");
    expect(layout).toContain("LearningDock");
    expect(existsSync(resolve(root, "src/pages/notebook/index.astro"))).toBe(true);
    expect(read("src/lib/learningArchive.ts")).toContain("recent: LibraryEntry[]");
    expect(progress).toContain("library: readLibrary()");
    expect(progress).toContain("version: 3");
  });

  it("搜索支持相关检索词、近似匹配与状态筛选", () => {
    const search = read("src/components/SearchExplorer.tsx");
    expect(read("src/data/searchAliases.ts")).toContain("校雠");
    expect(search).toContain("近似词匹配");
    expect(search).toContain("复核状态");
    expect(search).toContain("sort((a, b) => b.score - a.score");
  });

  it("简答题保留原答并提供逐项量规和重写闭环", () => {
    const practice = read("src/components/StructuredPractice.tsx");
    expect(practice).toContain("toggleRubric");
    expect(practice).toContain("建议写作骨架");
    expect(practice).toContain("回到原答案继续修改");
    expect(practice).not.toContain('setResponse("self-pass")');
  });

  it("公开学术审计并让深度研读支持竞争结论", () => {
    const studio = read("src/components/DeepDiveStudio.tsx");
    expect(existsSync(resolve(root, "src/pages/audit/index.astro"))).toBe(true);
    expect(existsSync(resolve(root, "scripts/audit-academic.mjs"))).toBe(true);
    expect(read("package.json")).toContain("audit:academic");
    expect(studio).toContain("竞争性结论");
    expect(studio).toContain("missingEvidence");
    expect(studio).toContain("关键缺口");
  });

  it("公开作者性、内容来源边界与代表章节差异化入口", () => {
    const story = read("src/pages/story/index.astro");
    const signature = read("src/components/ChapterSignature.astro");
    expect(existsSync(resolve(root, "RIGHTS.md"))).toBe(true);
    expect(story).toContain("我与 AI");
    expect(story).toContain("仍未完成");
    expect(read("src/pages/sitemap.xml.ts")).toContain('"story/"');
    expect(signature).toContain('chapterId === "ch01"');
    expect(signature).toContain('chapterId === "ch05"');
    expect(signature).toContain('chapterId === "ch07"');
    expect(read("src/components/WelcomeGuide.tsx")).toContain('welcomeMode === "0"');
  });

  it("把纸本复核、真实贡献和用户测试做成可执行工具", () => {
    const review = read("src/components/ReviewWorkspace.tsx");
    const usability = read("src/components/UsabilitySession.tsx");
    expect(existsSync(resolve(root, "content/reviews/ch02.yaml"))).toBe(true);
    expect(review).toContain("本地勾选只帮助你工作");
    expect(review).toContain("导出本地复核记录");
    expect(read("src/data/community.ts")).toContain("只记录已经公开讨论并完成处理");
    expect(read("src/pages/usability/index.astro")).toContain("测的是网站而不是你");
    expect(usability).toContain("导出 JSON");
    expect(read("src/pages/sitemap.xml.ts")).toContain("reviewRoutes");
    expect(read("src/pages/sitemap.xml.ts")).toContain('"usability/"');
  });

  it("为全部待核验章节提供专属复核包，并保留编辑语气门禁", () => {
    for (let chapter = 2; chapter <= 14; chapter += 1) {
      const id = String(chapter).padStart(2, "0");
      const packet = read(`content/reviews/ch${id}.yaml`);
      expect(packet).toContain("source_requirement: paper_copy");
      expect(packet).toContain("status: queued");
    }
    expect(read("package.json")).toContain("audit-editorial-voice.mjs");
    expect(existsSync(resolve(root, "docs/编辑与术语规范.md"))).toBe(true);
  });

  it("证据称量实验要求强度判断和有限度结论，而非单选作答", () => {
    const lab = read("src/components/EvidenceCalibrationLab.tsx");
    expect(lab).toContain('type="range"');
    expect(lab).toContain("有限度结论");
    expect(lab).toContain("分歧不等于简单答错");
    expect(lab).not.toContain("radio");
  });

  it("旗舰案卷保留理由、信心校准和可撤回的决策轨迹", () => {
    const dossier = read("src/components/RareBookDossier.tsx");
    expect(dossier).toContain("用自己的话说明理由");
    expect(dossier).toContain('type="range"');
    expect(dossier).toContain("高信心偏差");
    expect(dossier).toContain("撤回并修改");
    expect(dossier).toContain("五阶段决策轨迹");
  });

  it("知识图谱提供问题驱动的分步导览", () => {
    const graph = read("src/components/KnowledgeGraph.tsx");
    expect(graph).toContain("GUIDED READING");
    expect(graph).toContain("一条版本判断怎样成立");
    expect(graph).toContain("校勘不是挑一个顺眼的字");
    expect(graph).toContain("一片残卷怎样回到原来的位置");
    expect(graph).toContain("moveTour");
  });

  it("代表章节公开作者旁注而不冒充原书引文", () => {
    const note = read("src/components/ChapterReadingNote.astro");
    expect(note).toContain("为什么这样拆");
    expect(note).toContain("初读容易踩的坑");
    expect(note).toContain("这一步不能越过");
    expect(note).toContain("不作为原书引文");
    for (let chapter = 1; chapter <= 14; chapter += 1) expect(note).toContain(`ch${String(chapter).padStart(2, "0")}:`);
    expect(note).toContain("辑佚与辨伪都在管理不完整的证据");
    expect(read("src/pages/chapters/[id].astro")).not.toContain("editorialChapters");
  });

  it("共校入口携带页面证据并公开处理状态", () => {
    const panel = read("src/components/FeedbackPanel.tsx");
    const page = read("src/pages/contribute/index.astro");
    expect(panel).toContain("window.getSelection");
    expect(panel).toContain("复制证据包并提交");
    expect(page).toContain("status: needs-evidence");
    expect(page).toContain("status: in-review");
    expect(read(".github/ISSUE_TEMPLATE/content-correction.yml")).toContain("这项依据能够证明到哪一步");
  });

  it("公开共校页读取真实 GitHub 队列并按章节形成修订索引", () => {
    const ledger = read("src/components/CommunityLedger.tsx");
    expect(ledger).toContain("api.github.com/repos");
    expect(ledger).toContain("章节修订索引");
    expect(ledger).toContain("不会用示例数据制造参与度");
    expect(ledger).toContain("不建立用户画像");
  });

  it("进阶校勘实验要求产出校勘记与版本谱系假说", () => {
    const studio = read("src/components/TextualCriticismStudio.tsx");
    expect(studio).toContain("写一条可供别人复查的校勘记");
    expect(studio).toContain("导出校勘工作单");
    expect(studio).toContain("用共误建立版本家族");
    expect(studio).toContain("当前信心");
    expect(studio).not.toContain('type="radio"');
  });

  it("学习单元公开机器标识、来源、复核等级与版本身份", () => {
    const chapter = read("src/pages/chapters/[id].astro");
    const endpoint = read("src/pages/data/knowledge.json.ts");
    expect(chapter).toContain("查看这条知识的来源与修订身份");
    expect(chapter).toContain("data-claim-id");
    expect(endpoint).toContain('schema_version: "1.1"');
    expect(endpoint).toContain("page_locator_status");
    expect(endpoint).toContain("derivative_note");
  });

  it("把首页续学、条目级共校与可读报告连成学习闭环", () => {
    const home = read("src/components/HomeResume.tsx");
    const panel = read("src/components/FeedbackPanel.tsx");
    const progress = read("src/components/ProgressDashboard.tsx");
    expect(home).toContain("从上次停下的地方继续");
    expect(home).toContain("readLibrary");
    expect(read("src/pages/index.astro")).toContain("<HomeResume");
    expect(panel).toContain("data-claim-id");
    expect(panel).toContain("当前审核状态");
    expect(progress).toContain("exportMarkdownReport");
    expect(progress).toContain("文献学实验室 · 我的学习报告");
    expect(progress).toContain("{gameCount}/9");
    expect(read("src/consts.ts")).toContain('version: "0.10.0"');
  });

  it("十四章提供预计用时、任务地图、章末复盘与成果导出", () => {
    const journey = read("src/components/ChapterJourney.tsx");
    const chapter = read("src/pages/chapters/[id].astro");
    const progress = read("src/components/ProgressDashboard.tsx");
    expect(chapter.match(/<ChapterJourney/g)?.length).toBe(2);
    expect(chapter).toContain('href="#journey"');
    expect(chapter).toContain('id="chapter-review"');
    expect(journey).toContain("速览");
    expect(journey).toContain("标准");
    expect(journey).toContain("深研");
    expect(journey).toContain("我带走的一条认识");
    expect(journey).toContain("导出本章学习复盘 .md");
    expect(progress).toContain("chapterJourneys");
    expect(progress).toContain("version: 3");
    expect(progress).toContain("{gameCount}/9");
    expect(progress).toContain("const totalActivities = 55");
  });

  it("将十四章本地记录整理成可解释、可导出的个人成果册", () => {
    const portfolio = read("src/components/LearningPortfolio.tsx");
    const progress = read("src/components/ProgressDashboard.tsx");
    const page = read("src/pages/progress/index.astro");
    expect(progress).toContain("<LearningPortfolio");
    expect(page).toContain('href="#portfolio"');
    expect(portfolio).toContain("六维学习证据画像");
    expect(portfolio).toContain("待追问题索引");
    expect(portfolio).toContain("十四章成果脊柱");
    expect(portfolio).toContain("复制这段说明");
    expect(portfolio).toContain("导出完整成果 .md");
    expect(portfolio).toContain("不是课程成绩、能力认证或原书内容替代品");
    expect(portfolio).toContain("任务轨迹占 50%");
  });

  it("为公开访客提供不污染个人档案的只读示例成果", () => {
    const portfolio = read("src/components/LearningPortfolio.tsx");
    const sample = read("src/data/samplePortfolio.ts");
    const home = read("src/pages/index.astro");
    expect(portfolio).toContain('get("portfolio") === "sample"');
    expect(portfolio).toContain("我的学习记录");
    expect(portfolio).toContain("查看示例成果");
    expect(portfolio).toContain("不会写入、覆盖或混入你的本地档案");
    expect(portfolio).toContain("window.history.replaceState");
    expect(portfolio).not.toContain("localStorage.setItem");
    expect(sample.match(/reflection:/g)?.length).toBe(6);
    expect(sample).toContain("更通顺的文本不一定更早或更可靠");
    expect(home).toContain("先看一份示例成果");
    expect(home).toContain("portfolio=sample#portfolio");
  });

  it("提供不离开页面的十分钟项目导览，并避免首次弹窗遮挡", () => {
    const tour = read("src/components/ProjectTour.tsx");
    const page = read("src/pages/tour/index.astro");
    expect(page).toContain("<ProjectTour");
    expect(page).toContain("10-MINUTE PROJECT TOUR");
    expect(tour).toContain("怎样拆一章");
    expect(tour).toContain("怎样判断");
    expect(tour).toContain("怎样成为成果");
    expect(tour).toContain("sessionStorage");
    expect(tour).toContain("复制我的导览记录");
    expect(read("src/components/WelcomeGuide.tsx")).toContain('endsWith("/tour/")');
    expect(read("src/pages/sitemap.xml.ts")).toContain('"tour/"');
  });

  it("版本侦探记录假说、分批证据、书面理由和可撤回报告", () => {
    const detective = read("src/components/VersionDetective.tsx");
    expect(detective).toContain("封存初始判断");
    expect(detective).toContain("拆封第");
    expect(detective).toContain("用自己的话说明");
    expect(detective).toContain('type="range"');
    expect(detective).toContain("撤回并修改");
    expect(detective).toContain("导出研判单 .md");
    expect(detective).toContain("高信心偏差提醒");
  });

  it("四部分类挑战先声明框架，再处理边界并导出判断", () => {
    const catalog = read("src/components/FourFoldChallenge.tsx");
    expect(catalog).toContain("确定框架");
    expect(catalog).toContain("按现代学科分区");
    expect(catalog).toContain("按传统四部著录");
    expect(catalog).toContain("边界书 · 《梦溪笔谈》");
    expect(catalog).toContain("说明最终依据和仍需核对的地方");
    expect(catalog).toContain("撤回并修改");
    expect(catalog).toContain("导出目录判断单 .md");
  });

  it("章节案例把点击操作转成有限度判断，而非自动满分", () => {
    const gallery = read("src/components/CaseGallery.tsx");
    expect(gallery).toContain("把操作转成自己的判断");
    expect(gallery).toContain("但现有材料还不能证明");
    expect(gallery).toContain('type="range"');
    expect(gallery).toContain("这个数字表示本轮任务覆盖情况");
    expect(gallery).toContain("撤回并修改");
    expect(gallery).not.toContain("saveCase(lab, 1, 1)");
  });

  it("真实读者测试同时记录任务行为与结束访谈", () => {
    const usability = read("src/components/UsabilitySession.tsx");
    expect(usability).toContain("理解项目定位");
    expect(read("src/pages/usability/index.astro")).toContain("七个任务");
    expect(usability).toContain("结束访谈");
    expect(usability).toContain("哪里最困惑、最像机器生成或最不可信");
    expect(read("docs/试用邀请模板.md")).toContain("不用照顾我的感受");
  });

  it("实验室先提供可筛选目录，再把访客送到指定实验", () => {
    const directory = read("src/components/LabDirectory.tsx");
    const page = read("src/pages/lab/index.astro");
    expect(page).toContain("<LabDirectory");
    expect(directory).toContain("今天想练哪一种判断");
    expect(directory).toContain("最多用时");
    expect(directory).toContain("产出");
    expect(directory).toContain("?experiment=");
    expect(directory).toContain("本机已完成");
  });

  it("轻量游戏也要求解释证据边界、校准信心并生成记录", () => {
    const arcade = read("src/components/SkillArcade.tsx");
    expect(arcade).toContain("ArcadeReflection");
    expect(arcade).toContain("适用边界");
    expect(arcade).toContain('type="range"');
    expect(arcade).toContain("复制学习记录");
    expect(arcade).toContain("撤回并重新");
  });

  it("公开完整制作方法，而不是只陈列功能清单", () => {
    const page = read("src/pages/making-of/index.astro");
    expect(page).toContain("从一本书到学习平台");
    expect(page).toContain("六种不同对象");
    expect(page).toContain("人机协作");
    expect(page).toContain("尚未产生首轮样本");
    expect(read("src/layouts/BaseLayout.astro")).toContain("making-of/");
  });

  it("本地汇总多份真实测试记录且不伪造演示数据", () => {
    const analysis = read("src/components/UsabilityAnalysis.tsx");
    expect(existsSync(resolve(root, "src/pages/usability/results.astro"))).toBe(true);
    expect(analysis).toContain("不会上传到网站或 GitHub");
    expect(analysis).toContain("这里不会填入演示数据");
    expect(analysis).toContain("中位耗时");
    expect(analysis).toContain("结束访谈原话");
    expect(analysis).toContain("按修复优先度排列");
  });

  it("残卷归档调查跨章组织证据、命题和可复查报告", () => {
    const casebook = read("src/components/FragmentCasebook.tsx");
    const lab = read("src/pages/lab/index.astro");
    expect(lab).toContain("<FragmentCasebook");
    expect(casebook).toContain("教学虚构案例");
    expect(casebook).toContain("直接支持");
    expect(casebook).toContain("不能这样推出");
    expect(casebook).toContain("不能越过的证据边界");
    expect(casebook).toContain('type="range"');
    expect(casebook).toContain("残卷归档调查报告");
    expect(casebook).toContain('progress["fragment-casebook"]');
  });

  it("学习罗盘用本地证据解释三项下一步行动", () => {
    const progress = read("src/components/ProgressDashboard.tsx");
    expect(progress).toContain("现在最值得做的三件事");
    expect(progress).toContain("到期复习");
    expect(progress).toContain("当前主线");
    expect(progress).toContain("跨章迁移");
    expect(progress).toContain("推荐只依据这台设备");
    expect(progress).toContain("slice(0, 3)");
  });

  it("发布前阻止学习单元空泛、过短或跨单元复制", () => {
    const audit = read("scripts/audit-content-voice.mjs");
    expect(read("package.json")).toContain("audit-content-voice.mjs");
    expect(audit).toContain("key_question");
    expect(audit).toContain("summary");
    expect(audit).toContain("boundary");
    expect(audit).toContain("跨单元完全重复");
    expect(read("docs/编辑与术语规范.md")).toContain("不得互相改写充数");
  });
});
