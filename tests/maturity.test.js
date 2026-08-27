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
    expect(progress).toContain("version: 2");
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
});
