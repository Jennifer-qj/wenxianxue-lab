import { describe, expect, it } from "vitest";
import { deepDiveSchema, graphEdgeSchema, labSchema, mkuSchema, quizSchema } from "../src/lib/schemas";

describe("内容 Schema", () => {
  it("合法 MKU 通过，缺真实页码失败", () => {
    const valid = { id:"mku-05-04-04",chapter:5,chapter_title:"文献的版本",section:"版本鉴定",module:"M5",page_start:167,status:"reviewed",key_question:"怎样鉴定版本？",summary:"综合多项证据形成有限度判断。",boundary:"单一线索不能自动证明刊刻年代。",concept_ids:["c_taboo_char"],quiz_ids:[],lab_ids:[] };
    expect(mkuSchema.safeParse(valid).success).toBe(true);
    expect(mkuSchema.safeParse({ ...valid, page_start: 0 }).success).toBe(false);
    expect(mkuSchema.safeParse({ ...valid, boundary: "" }).success).toBe(false);
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
  it("深度研读必须同时说明证据作用与限制", () => {
    const evidence = ["a", "b", "c"].map((id) => ({ id, label:id, role:"支持判断", limitation:"不能单独定案" }));
    const valid = { id:"deep-ch01-001",chapter:1,title:"案例",scenario:"情境",question:"问题",concept_ids:["c_a","c_b"],evidence,workflow:["观察","比较","结论"],deliverable:"研究札记",rubric:["证据","推理","边界"],status:"pending_review" };
    expect(deepDiveSchema.safeParse(valid).success).toBe(true);
    expect(deepDiveSchema.safeParse({ ...valid, evidence:evidence.slice(0, 2) }).success).toBe(false);
  });
});
