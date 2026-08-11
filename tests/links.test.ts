import { describe, expect, it } from "vitest";
import { joinBase, normalizeInternalHref } from "../scripts/lib/links.mjs";

describe("GitHub Pages 路径", () => {
  it("安全拼接 base path", () => {
    expect(joinBase("/wenxianxue-lab/", "/chapters/ch01/")).toBe("/wenxianxue-lab/chapters/ch01/");
  });
  it("把部署路径还原为站内路由", () => {
    expect(normalizeInternalHref("/wenxianxue-lab/chapters/ch01/")).toBe("/chapters/ch01/");
    expect(normalizeInternalHref("https://github.com/example")).toBeNull();
  });
});
