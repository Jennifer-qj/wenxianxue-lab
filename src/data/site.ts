export type LearningPath = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  chapters: string;
  color: string;
  progress: number;
};

export type LabGame = {
  id: string;
  title: string;
  description: string;
  chapters: string;
  status: "可体验" | "制作中" | "待开发";
  icon: string;
};

export const learningPaths: LearningPath[] = [
  { id: "intro", number: "01", title: "走进文献学", subtitle: "文献是什么，我们为何要研究它？", chapters: "第一章", color: "#9c4738", progress: 35 },
  { id: "material", number: "02", title: "文献的物质生命", subtitle: "从甲骨、金石到纸张与装帧", chapters: "第二章", color: "#a57435", progress: 12 },
  { id: "circulation", number: "03", title: "形成、翻译与流布", subtitle: "一部文献如何产生，又如何抵达读者", chapters: "第三章", color: "#52705f", progress: 8 },
  { id: "collection", number: "04", title: "收藏、散佚与再发现", subtitle: "在保存与毁灭之间追踪文献命运", chapters: "第四章", color: "#5f6f88", progress: 5 },
  { id: "criticism", number: "05", title: "判断与整理文本", subtitle: "版本、校勘、辑佚与辨伪", chapters: "第五、六、八章", color: "#843d4c", progress: 18 },
  { id: "organization", number: "06", title: "组织与检索知识", subtitle: "目录、类书和丛书的知识秩序", chapters: "第七、九章", color: "#76613f", progress: 15 },
  { id: "special", number: "07", title: "专门文献世界", subtitle: "方志、家谱、总别集与出土文献", chapters: "第十至十四章", color: "#536b70", progress: 4 },
];

export const games: LabGame[] = [
  { id: "version-detective", title: "版本鉴定侦探", description: "从牌记、避讳、字体、版式、纸张等线索判断版本。", chapters: "第五章", status: "可体验", icon: "鉴" },
  { id: "collation-clinic", title: "校勘诊所", description: "诊断讹、脱、衍、倒、错乱，并选择合适的校勘方法。", chapters: "第六章", status: "制作中", icon: "校" },
  { id: "four-fold", title: "四部分类挑战", description: "把典籍放入经、史、子、集，理解分类边界。", chapters: "第七章", status: "制作中", icon: "目" },
  { id: "carrier-museum", title: "载体博物馆", description: "辨认甲骨、金石、竹木、帛、贝叶与纸的物质特征。", chapters: "第二章", status: "待开发", icon: "材" },
  { id: "binding-puzzle", title: "装帧演变拼图", description: "重建卷子装至线装的形制演变。", chapters: "第二章", status: "待开发", icon: "装" },
  { id: "circulation-simulator", title: "文献流布模拟器", description: "在成本、速度、误差和传播范围之间作选择。", chapters: "第三章", status: "待开发", icon: "流" },
  { id: "library-guardian", title: "藏书守护时间轴", description: "把重要散佚事件放回历史序列，寻找保存策略。", chapters: "第四章", status: "待开发", icon: "藏" },
  { id: "forgery-board", title: "辨伪推理板", description: "利用语言、制度、地理、称谓与思想线索识别疑点。", chapters: "第八章", status: "待开发", icon: "伪" },
  { id: "leishu-congshu", title: "类书还是丛书", description: "比较两类工具的组织方式、用途和检索逻辑。", chapters: "第九章", status: "待开发", icon: "类" },
  { id: "gazetteer-genealogy", title: "方志与家谱采集站", description: "从模拟文献中提取地理、人物、人口和宗族资料。", chapters: "第十章", status: "待开发", icon: "志" },
  { id: "fragment-restoration", title: "出土残片复原", description: "根据字形、文意和物质线索拼接残片。", chapters: "第十二、十三章", status: "待开发", icon: "简" },
  { id: "dunhuang-archive", title: "敦煌文献档案室", description: "为模拟残卷判断语言、形制、内容与档案字段。", chapters: "第十四章", status: "待开发", icon: "敦" },
];

export const graphStats = [
  { value: "14", label: "原书章节" },
  { value: "7", label: "学习路径" },
  { value: "12", label: "互动实验" },
  { value: "10", label: "节点类型" },
];

export const chapterCoverage = [
  ["第一章", "文献与文献学", "走进文献学"],
  ["第二章", "文献的载体", "文献的物质生命"],
  ["第三章", "文献的形成与流布", "形成、翻译与流布"],
  ["第四章", "文献的收藏与散佚", "收藏、散佚与再发现"],
  ["第五章", "文献的版本", "判断与整理文本"],
  ["第六章", "文献的校勘", "判断与整理文本"],
  ["第七章", "文献目录", "组织与检索知识"],
  ["第八章", "文献的辑佚与辨伪", "判断与整理文本"],
  ["第九章", "类书与丛书", "组织与检索知识"],
  ["第十章", "地方志与家谱", "专门文献世界"],
  ["第十一章", "总集与别集", "专门文献世界"],
  ["第十二章", "出土文献概述（上）", "专门文献世界"],
  ["第十三章", "出土文献概述（下）", "专门文献世界"],
  ["第十四章", "敦煌文献概述", "专门文献世界"],
] as const;
