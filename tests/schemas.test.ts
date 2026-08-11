import { describe, expect, it } from "vitest";
import { graphEdgeSchema, labSchema, mkuSchema, quizSchema } from "../src/lib/schemas";

describe("内容 Schema", () => {
  it("合法 MKU 通过，缺真实页码失败", () => {
    const valid = { id:"mku-05-04-04",chapter:5,chapter_title:"文献的版本",section:"版本鉴定",module:"M5",page_start:167,status:"reviewed",concept_ids:["c_taboo_char"],quiz_ids:[],lab_ids:[] };
    expect(mkuSchema.safeParse(valid).success).toBe(true);
    expect(mkuSchema.safeParse({ ...valid, page_start: 0 }).success).toBe(false);
  });
  it("关系必须有证据与置信度", () => {
    const valid = { id:"e-0001",source:"c_a",target:"c_b",type:"relatedTo",evidence:"教学关系",confidence:"pedagogical" };
    expect(graphEdgeSchema.safeParse(valid).success).toBe(true);
    expect(graphEdgeSchema.safeParse({ ...valid, evidence:"" }).success).toBe(false);
  });
  it("题目和实验使用判别联合类型", () => {
    const quiz = { id:"q-ch01-001",chapter:1,type:"true_false",concept_ids:["c_a"],prompt:"判断",answer:true,explanation:"解析" };
    expect(quizSchema.safeParse(quiz).success).toBe(true);
    const lab = { id:"lab-01-case-001",title:"案例",engine:"reasoning",concept_ids:["c_a"],config:{stages:["采证"],scoring:{coverage:.4}} };
    expect(labSchema.safeParse(lab).success).toBe(true);
    expect(labSchema.safeParse({ ...lab, config:{} }).success).toBe(false);
  });
});
