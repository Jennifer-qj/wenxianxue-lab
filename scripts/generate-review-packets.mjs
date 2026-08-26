import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import yaml from "js-yaml";

const root = resolve(import.meta.dirname, "..");
const edition = "杜泽逊《文献学概要（修订本）》，中华书局2008年版";
const chapterRules = {
  3: ["核对著、述、编、译等形成方式的责任主体及相互边界", "核对传播技术的历史条件，避免把媒介优势写成绝对结论", "检查译经角色、传播环节和差错类型等术语是否准确"],
  4: ["核对藏书家、藏书楼、目录和机构名称及活动年代", "对战乱、火灾、禁毁和散佚数量逐项寻找纸本依据", "区分递藏事实、后人推测与项目提出的保存风险解释"],
  5: ["核对版本类型、印刷工艺和装帧术语的识别条件", "核对刻工、牌记、避讳、序跋、纸墨等断代证据的效力", "避免以单一特征直接判定年代、价值或真伪"],
  6: ["核对讹、脱、衍、倒等错误类型及原书例证", "核对对校、本校、他校、理校等方法的适用范围", "区分发现异文、解释异文和决定改字三个判断层次"],
  7: ["核对目录类型、分类体系、著录项目和提要功能", "核对历代目录书名、作者、卷数、时代与存佚情况", "区分目录事实、分类判断和由目录推导出的研究结论"],
  8: ["核对辑佚对象、材料来源和辑录程序的术语", "核对佚书、佚文、存目与残本等相邻概念边界", "检查辑佚成果是否保留出处、版本和可靠性差异"],
  9: ["核对辨伪史中的人物、书名、年代与代表性主张", "区分作伪动机、作伪手段和后世流传结果", "检查结论是否允许真伪混合、层累形成和暂缓判断"],
  10: ["核对类书与丛书的定义、编排方式和使用目的", "核对代表性类书、丛书的书名、时代、规模和存佚", "区分保存佚文的价值与转引、删改、底本不明等风险"],
  11: ["核对总集、选集、全集、别集等术语与收录边界", "核对编者、作者、成书与刊刻年代以及版本源流", "区分作品归属、编选目的和后世重编造成的文本层次"],
  12: ["核对甲骨、青铜器的发现、发掘、收藏与整理年代", "核对著录书、编号体系、材料数量和重要人物专名", "区分科学出土语境、传世来源和早期收藏叙事"],
  13: ["核对简帛、石刻及其他材料的遗址、墓葬、年代和批次", "避免把宽泛材料类别当作同一文本系统", "区分出土本的早出、具体文本价值与作者原本三个层次"],
  14: ["核对敦煌、敦煌石窟、莫高窟与藏经洞的层级", "核对发现、封闭、流散、收藏机构和编号系统", "对封闭原因、残卷缀合及材料比例保留竞争解释"],
};

for (let chapter = 3; chapter <= 14; chapter += 1) {
  const id = String(chapter).padStart(2, "0");
  const outline = yaml.load(await readFile(resolve(root, `content/outline/ch${id}.yaml`), "utf8"));
  const rules = chapterRules[chapter];
  const items = outline.items.map((unit, index) => {
    const label = unit.subsection ?? unit.section;
    const focus = [
      `核对「${label}」的纸本页码边界、核心定义和原书例证`,
      rules[index % rules.length],
      `检查项目对“${unit.key_question}”的回答是否保持原书限定`,
    ];
    if (unit.status === "drafting") focus.push("本单元含教学建模内容，须明确区分教材框架与项目新增推演");
    return {
      unit_id: unit.id,
      page_start: unit.page_start,
      page_end: unit.page_end ?? unit.page_start,
      focus,
      required_checks: ["page_range", "names_dates", "summary_fidelity", "boundary_strength", "linked_content"],
      status: "queued",
      reviewer: null,
      reviewed_at: null,
      evidence_note: null,
    };
  });
  const packet = {
    chapter,
    edition,
    source_requirement: "paper_copy",
    note: `第${chapter}章复核包按本章知识风险拆分；提示只用于定位、提问和留痕，任何条目都必须回到纸本后才能改为已核验。`,
    items,
  };
  await writeFile(resolve(root, `content/reviews/ch${id}.yaml`), yaml.dump(packet, { noRefs: true, lineWidth: -1, sortKeys: false }), "utf8");
}

console.log("已生成第3—14章专属纸本复核包。")
