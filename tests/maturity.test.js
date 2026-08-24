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
    const images = ["01-home", "02-guide", "03-coverage", "04-graph", "05-lab", "06-chapter"];
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
});
