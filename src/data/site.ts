export type Chapter = {
  id: string;
  number: string;
  title: string;
  focus: string;
  sections: string[];
  keywords: string[];
  pathIds: string[];
  review: "待复核" | "初步复核" | "已复核";
  source: { verified: boolean; pageStart?: number; pageEnd?: number };
};

export type LearningPath = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  chapters: string;
  chapterIds: string[];
  outcomes: string[];
  color: string;
};

export type LabGame = {
  id: string;
  title: string;
  description: string;
  chapters: string;
  status: "可体验";
  icon: string;
};

export const chapters: Chapter[] = [
  {
    id: "ch01", number: "第一章", title: "文献与文献学",
    focus: "建立“文献—文献学—研究范围”的基础坐标，理解学习文献学的意义。",
    sections: ["文献的界义", "文献学研究的范围", "为什么要学习文献学"],
    keywords: ["文献", "文献学", "知识载体"], pathIds: ["intro"], review: "初步复核",
    source: { verified: false },
  },
  {
    id: "ch02", number: "第二章", title: "文献的载体",
    focus: "从甲骨、金石、竹木、帛到纸，观察材料与装潢如何影响文献形态。",
    sections: ["甲骨与金石", "竹木、帛及域外载体", "纸与造纸术", "卷子装至线装的演变"],
    keywords: ["载体", "纸张", "装潢", "线装"], pathIds: ["material"], review: "初步复核",
    source: { verified: false },
  },
  {
    id: "ch03", number: "第三章", title: "文献的形成与流布",
    focus: "追踪著、述、编、译等形成方式，以及讲唱、抄写、镌刻、印刷和摄影等传播路径。",
    sections: ["文献的形成", "翻译的类型", "讲唱与抄写", "镌刻、印刷与摄影"],
    keywords: ["编纂", "翻译", "流布", "印刷"], pathIds: ["circulation"], review: "待复核",
    source: { verified: false },
  },
  {
    id: "ch04", number: "第四章", title: "文献的收藏与散佚",
    focus: "在官府藏书、私家藏书与历代散佚之间，理解文献保存的制度与偶然性。",
    sections: ["历代官府藏书", "文献的大量散佚", "私家藏书兴替", "近代藏书家"],
    keywords: ["收藏", "散佚", "藏书家", "公藏"], pathIds: ["collection"], review: "待复核",
    source: { verified: false },
  },
  {
    id: "ch05", number: "第五章", title: "文献的版本",
    focus: "辨认写本、刻本、套印本、活字本等类型，并用多项证据进行版本鉴定。",
    sections: ["版本类型", "善本的界义", "版本鉴定十五法", "牌记、避讳、版式与纸张"],
    keywords: ["版本", "善本", "牌记", "避讳", "书影"], pathIds: ["criticism"], review: "初步复核",
    source: { verified: false },
  },
  {
    id: "ch06", number: "第六章", title: "文献的校勘",
    focus: "识别讹、脱、衍、倒等错误，掌握对校、本校、他校与综合考证的适用边界。",
    sections: ["错讹类型与目的", "校勘所需条件", "四种主要方法", "校勘记与多闻阙疑"],
    keywords: ["校勘", "异本", "对校", "本校", "校勘记"], pathIds: ["criticism"], review: "初步复核",
    source: { verified: false },
  },
  {
    id: "ch07", number: "第七章", title: "文献目录",
    focus: "理解目录的分类、著录与提要功能，把书名、篇卷、撰人、版本组织成检索入口。",
    sections: ["目录的产生与含义", "古籍分类", "目录的主要内容", "目录的类型"],
    keywords: ["目录", "分类", "著录", "提要", "四部"], pathIds: ["organization"], review: "初步复核",
    source: { verified: false },
  },
  {
    id: "ch08", number: "第八章", title: "文献的辑佚与辨伪",
    focus: "从亡佚材料中重建文本，并以源流、语言、制度、地理、思想等证据辨识伪书。",
    sections: ["辑佚的历史与方法", "作伪动机与手段", "辨伪二十法", "伪书的多重价值"],
    keywords: ["辑佚", "辨伪", "伪书", "源流", "制度"], pathIds: ["criticism"], review: "初步复核",
    source: { verified: false },
  },
  {
    id: "ch09", number: "第九章", title: "类书与丛书",
    focus: "比较类书按类汇辑材料与丛书汇刻多种著作的组织逻辑、用途及代表性典籍。",
    sections: ["类书的起源与功用", "类书举要", "丛书的起源与功用", "丛书举要"],
    keywords: ["类书", "丛书", "辑佚", "检索"], pathIds: ["organization"], review: "待复核",
    source: { verified: false },
  },
  {
    id: "ch10", number: "第十章", title: "地方志与家谱",
    focus: "认识地方志和家谱的体例、存佚与史料价值，学习从中提取地域和宗族信息。",
    sections: ["地方志的产生与种类", "地方志的用途", "家谱的内容", "家谱的价值与存佚"],
    keywords: ["地方志", "家谱", "人口史", "移民史", "宗族"], pathIds: ["special"], review: "待复核",
    source: { verified: false },
  },
  {
    id: "ch11", number: "第十一章", title: "总集与别集",
    focus: "区分汇集多人作品的总集与收录一人作品的别集，评估其文学与文献价值。",
    sections: ["总集的类型与举要", "全集举要", "别集的起源", "别集的内容与文献价值"],
    keywords: ["总集", "全集", "别集", "诗文"], pathIds: ["special"], review: "待复核",
    source: { verified: false },
  },
  {
    id: "ch12", number: "第十二章", title: "出土文献概述（上）",
    focus: "从发现、发掘、结集和考释四个环节认识甲骨文与金文文献。",
    sections: ["甲骨文的发现与发掘", "甲骨资料的结集与考释", "甲骨文献价值", "金文的出土、汇集与价值"],
    keywords: ["出土文献", "甲骨文", "金文", "考释"], pathIds: ["special"], review: "待复核",
    source: { verified: false },
  },
  {
    id: "ch13", number: "第十三章", title: "出土文献概述（下）",
    focus: "继续考察简帛、石刻、盟书、玺印、砖瓦文字和纸质出土文献。",
    sections: ["简帛文献概况", "简帛文献价值", "石刻文献要籍与价值", "其他出土文献"],
    keywords: ["简帛", "石刻", "盟书", "玺印", "墓志"], pathIds: ["special"], review: "待复核",
    source: { verified: false },
  },
  {
    id: "ch14", number: "第十四章", title: "敦煌文献概述",
    focus: "把藏经洞发现、文献流散、目录编制、整理刊行与学术价值连成完整档案链。",
    sections: ["敦煌与藏经洞", "发现、封闭与流散", "敦煌文献目录", "汇编整理与内容价值"],
    keywords: ["敦煌", "藏经洞", "敦煌遗书", "目录", "写本"], pathIds: ["special"], review: "待复核",
    source: { verified: false },
  },
];

export const learningPaths: LearningPath[] = [
  { id: "intro", number: "01", title: "走进文献学", subtitle: "先建立对象、方法与问题意识，再进入具体门类。", chapters: "第一章", chapterIds: ["ch01"], outcomes: ["说清“文献”的工作定义", "辨认文献学的研究范围", "建立阅读问题清单"], color: "#9c4738" },
  { id: "material", number: "02", title: "文献的物质生命", subtitle: "材料、制作和装潢不是外壳，而是判断年代与流传的证据。", chapters: "第二章", chapterIds: ["ch02"], outcomes: ["识别九类主要载体", "梳理五种纸本文献装潢", "理解物质特征的证据价值"], color: "#a57435" },
  { id: "circulation", number: "03", title: "形成、翻译与流布", subtitle: "追踪一部文献如何产生、变化并抵达读者。", chapters: "第三章", chapterIds: ["ch03"], outcomes: ["区分形成方式", "比较五种流布媒介", "分析传播中的文本变化"], color: "#52705f" },
  { id: "collection", number: "04", title: "收藏、散佚与再发现", subtitle: "在保存与毁灭之间追踪文献命运。", chapters: "第四章", chapterIds: ["ch04"], outcomes: ["比较公藏与私藏", "分析散佚原因", "绘制藏书史时间线"], color: "#5f6f88" },
  { id: "criticism", number: "05", title: "判断与整理文本", subtitle: "把版本、校勘、辑佚与辨伪组成证据推理链。", chapters: "第五、六、八章", chapterIds: ["ch05", "ch06", "ch08"], outcomes: ["完成版本证据判断", "选择合适校勘方法", "区分辑佚与辨伪任务"], color: "#843d4c" },
  { id: "organization", number: "06", title: "组织与检索知识", subtitle: "用目录、类书和丛书理解古代知识秩序。", chapters: "第七、九章", chapterIds: ["ch07", "ch09"], outcomes: ["读懂目录著录字段", "理解古籍分类", "比较类书与丛书"], color: "#76613f" },
  { id: "special", number: "07", title: "专门文献世界", subtitle: "进入方志、家谱、集部、出土与敦煌文献的专题现场。", chapters: "第十至十四章", chapterIds: ["ch10", "ch11", "ch12", "ch13", "ch14"], outcomes: ["区分主要专门文献类型", "评估不同史料价值", "建立出土文献档案链"], color: "#536b70" },
];

export const games: LabGame[] = [
  { id: "version-detective", title: "版本鉴定侦探", description: "从牌记、避讳、字体、版式和纸张等线索建立证据链。", chapters: "第五章", status: "可体验", icon: "鉴" },
  { id: "four-fold", title: "四部分类挑战", description: "根据典籍内容与传统部类判断经、史、子、集，并阅读边界解释。", chapters: "第七章", status: "可体验", icon: "目" },
  { id: "collation-clinic", title: "校勘诊所", description: "拖动重排从记录异文、核查版本到形成校记的完整流程。", chapters: "第六章", status: "可体验", icon: "校" },
  { id: "carrier-museum", title: "载体博物馆", description: "把物质与形制线索送回五类载体标本柜。", chapters: "第二章", status: "可体验", icon: "材" },
  { id: "binding-puzzle", title: "装帧演变拼图", description: "亲手重建卷子装至线装的学习序列。", chapters: "第二章", status: "可体验", icon: "装" },
  { id: "leishu-congshu", title: "类书还是丛书", description: "按组织单位把典籍放入正确的工具书类别。", chapters: "第九章", status: "可体验", icon: "类" },
];

export const graphStats = [
  { value: "14", label: "全书章节" },
  { value: "176", label: "概念词条" },
  { value: "98", label: "证据关系" },
  { value: "15", label: "章节案例" },
];

export const chapterCoverage = chapters.map((chapter) => {
  const path = learningPaths.find((item) => chapter.pathIds.includes(item.id));
  return [chapter.number, chapter.title, path?.title ?? "待编排", chapter.review] as const;
});

export function getPath(id: string) {
  return learningPaths.find((path) => path.id === id);
}

export function getChapters(ids: string[]) {
  return ids.map((id) => chapters.find((chapter) => chapter.id === id)).filter(Boolean) as Chapter[];
}
