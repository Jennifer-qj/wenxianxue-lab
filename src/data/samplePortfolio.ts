export const sampleJourneys = {
  ch01: {
    mode: "standard",
    completed: ["orientation", "structure", "method", "reflection"],
    reflection: {
      takeaway: "我以前把文献理解成“写下来的材料”，现在更愿意先问：什么被记录、怎样流传、研究者凭什么把它当作证据。",
      boundary: "这只是帮助我进入全书的工作框架，不能代替不同学科、不同历史阶段对“文献”边界的具体讨论。",
      question: "如果一项口述材料还没有形成稳定文本，它从什么时候开始进入文献学的研究视野？",
    },
    updatedAt: "2026-08-18T13:20:00.000Z",
  },
  ch02: {
    mode: "deep",
    completed: ["orientation", "structure", "method", "reflection"],
    reflection: {
      takeaway: "载体不是装文字的空盒子。材料、尺寸和装潢会限制书怎样制作、保存和阅读，也会留下可以核查的历史痕迹。",
      boundary: "纸张或装帧特征只能成为证据链的一部分，不能仅凭一种外观就断定年代和版本。",
      question: "一部书经过后世修补、改装以后，哪些物质特征属于原来，哪些属于后加，应怎样分层记录？",
    },
    updatedAt: "2026-08-20T09:40:00.000Z",
  },
  ch05: {
    mode: "deep",
    completed: ["orientation", "structure", "method", "reflection"],
    reflection: {
      takeaway: "版本鉴定不是寻找一个“一锤定音”的特征，而是比较牌记、版式、字体、纸张和递藏等线索能分别证明什么。",
      boundary: "书上出现早期信息，不等于眼前这部书就是早期刻印；翻刻、配补和后印都可能保留旧线索。",
      question: "当牌记与纸张、字体给出的年代指向不一致时，应该怎样记录证据权重，而不是只挑符合预期的一项？",
    },
    updatedAt: "2026-08-22T15:10:00.000Z",
  },
  ch06: {
    mode: "deep",
    completed: ["orientation", "structure", "method", "reflection"],
    reflection: {
      takeaway: "校勘不只是把不通顺的字改顺，而是保存异文、说明依据，并让后来的人能够复查这次判断。",
      boundary: "更通顺的文本不一定更早或更可靠；在证据不足时，保留疑问比强行改定更诚实。",
      question: "对校、本校与他校得到的结论互相冲突时，一条完整校勘记应怎样呈现没有被采用的证据？",
    },
    updatedAt: "2026-08-24T11:30:00.000Z",
  },
  ch07: {
    mode: "standard",
    completed: ["orientation", "structure", "method", "reflection"],
    reflection: {
      takeaway: "目录并不是书名清单。分类、著录和提要都在告诉读者：编目者怎样识别这部书，又把它放进怎样的知识秩序。",
      boundary: "目录记录的是特定时间和机构看到的对象，不能不加核查地推成今天仍然存在的同一部版本。",
      question: "不同目录用相同书名著录时，怎样借助卷数、撰人和版本信息判断它们说的是不是同一个对象？",
    },
    updatedAt: "2026-08-25T08:50:00.000Z",
  },
  ch14: {
    mode: "deep",
    completed: ["orientation", "structure", "reflection"],
    reflection: {
      takeaway: "读敦煌文献时，编号不是材料自身原有的名字，而是今天追踪收藏、残片和整理成果所必需的检索入口。",
      boundary: "一个编号只能帮助定位当前收藏记录，不能自动解决残片归属、写卷关系和文本年代等问题。",
      question: "分藏各地的残片被判断可以缀合时，文字连续、纸张形态和旧收藏记录分别能提供多强的证据？",
    },
    updatedAt: "2026-08-26T16:15:00.000Z",
  },
} as const;

export const sampleProgress = {
  "ch01-structured-practice": { completed: true, score: 11, total: 12, updatedAt: "2026-08-18T13:10:00.000Z", title: "第一章综合练习" },
  "deep-ch01": { completed: true, score: 3, total: 3, updatedAt: "2026-08-18T13:15:00.000Z", title: "第一章深度研读" },
  "ch02-structured-practice": { completed: true, score: 8, total: 12, updatedAt: "2026-08-20T09:30:00.000Z", title: "第二章综合练习" },
  "deep-ch02": { completed: true, score: 3, total: 3, updatedAt: "2026-08-20T09:35:00.000Z", title: "第二章深度研读" },
  "ch05-structured-practice": { completed: true, score: 9, total: 12, updatedAt: "2026-08-22T15:00:00.000Z", title: "第五章综合练习" },
  "deep-ch05": { completed: true, score: 3, total: 3, updatedAt: "2026-08-22T15:05:00.000Z", title: "第五章深度研读" },
  "ch06-structured-practice": { completed: true, score: 6, total: 8, updatedAt: "2026-08-24T11:20:00.000Z", title: "第六章综合练习" },
  "deep-ch06": { completed: true, score: 3, total: 3, updatedAt: "2026-08-24T11:25:00.000Z", title: "第六章深度研读" },
  "ch07-structured-practice": { completed: true, score: 7, total: 8, updatedAt: "2026-08-25T08:40:00.000Z", title: "第七章综合练习" },
  "ch14-structured-practice": { completed: true, score: 5, total: 8, updatedAt: "2026-08-26T16:05:00.000Z", title: "第十四章综合练习" },
  "deep-ch14": { completed: true, score: 2, total: 3, updatedAt: "2026-08-26T16:10:00.000Z", title: "第十四章深度研读" },
} as const;
