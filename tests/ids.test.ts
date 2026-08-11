import { describe, expect, it } from "vitest";
import { assertId, assertUniqueIds } from "../src/lib/ids";

describe("ID 命名门禁", () => {
  it("接受合法 MKU 与概念 ID", () => {
    expect(assertId("mku", "mku-05-04-04")).toBe("mku-05-04-04");
    expect(assertId("concept", "c_taboo_char")).toBe("c_taboo_char");
  });
  it("拒绝错误格式与重复 ID", () => {
    expect(() => assertId("quiz", "question-1")).toThrow();
    expect(() => assertUniqueIds([{ id: "e-0001" }, { id: "e-0001" }])).toThrow();
  });
});
