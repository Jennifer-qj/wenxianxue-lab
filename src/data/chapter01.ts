export type DraftLearningUnit = {
  id: string;
  title: string;
  question: string;
  takeaway: string;
  boundary: string;
  concepts: string[];
};

export const chapter01DraftUnits: DraftLearningUnit[] = [
  {
    id: "draft-01-01",
    title: "先界定什么是文献",
    question: "文献是否只能等同于古书或文字材料？",
    takeaway: "学习时应同时注意被记录的信息、承载信息的形态，以及材料能否被保存、传播和利用。",
    boundary: "这是面向初学者的工作定义，不替代不同学术传统中的概念辨析。",
    concepts: ["文献", "记录", "载体"],
  },
  {
    id: "draft-01-02",
    title: "从文字走向文献生命史",
    question: "研究一部书，为什么不能只解释它写了什么？",
    takeaway: "同一文字会经历写定、抄写、刊刻、改编、收藏和整理；每个阶段都可能改变我们今天看到的文本。",
    boundary: "并非每项研究都要穷尽全部环节，应按问题选择最相关的证据。",
    concepts: ["形成", "流传", "整理"],
  },
  {
    id: "draft-01-03",
    title: "认识文献学的研究范围",
    question: "版本、校勘、目录和收藏为什么会在同一门学问中相遇？",
    takeaway: "它们分别处理文本形态、文字差异、知识组织与存藏经历，却能围绕同一文献互相提供证据。",
    boundary: "分支名称方便学习，但真实研究往往跨越多个分支。",
    concepts: ["版本", "校勘", "目录"],
  },
  {
    id: "draft-01-04",
    title: "把线索组织成证据链",
    question: "一条看似有力的线索，什么时候才能支持结论？",
    takeaway: "先确认线索来源，再检查是否存在其他解释，并寻找相互独立的材料进行互证。",
    boundary: "证据数量多不必然可靠；彼此抄袭或来自同一祖本的材料不能简单算作多重互证。",
    concepts: ["证据", "互证", "判断边界"],
  },
  {
    id: "draft-01-05",
    title: "理解学习文献学的意义",
    question: "文献学为什么不是阅读前的机械准备？",
    takeaway: "版本选择、文字校订和材料来源会直接影响解释，因此材料判断本身就是知识生产的一部分。",
    boundary: "文献学不能代替思想、文学或历史解释，但能说明解释建立在怎样的材料基础上。",
    concepts: ["材料可靠性", "版本选择", "学术表达"],
  },
];

