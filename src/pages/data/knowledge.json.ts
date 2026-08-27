import { getCollection } from "astro:content";
import { EDITION, PROJECT_RELEASE } from "../../consts";

export const prerender = true;

export async function GET() {
  const [conceptFiles, graphFiles, outlineFiles] = await Promise.all([
    getCollection("concepts"), getCollection("graph"), getCollection("outline"),
  ]);
  const concepts = conceptFiles.flatMap((entry) => entry.data.items);
  const edges = graphFiles.flatMap((entry) => entry.data.items);
  const units = outlineFiles.flatMap((entry) => entry.data.items);
  return new Response(JSON.stringify({
    schema_version: "1.1",
    project: "文献学实验室 / Wenxianxue Lab",
    source_note: "本数据集为参考杜泽逊《文献学概要（修订本）》制作的原创学习元数据，不含原书全文。",
    license_note: "原书权利归相应权利人；项目数据的再利用请先联系项目作者。",
    counts: { concepts: concepts.length, edges: edges.length, learning_units: units.length },
    concepts,
    edges,
    learning_units: units.map(({ summary: _summary, boundary: _boundary, ...unit }) => ({
      ...unit,
      provenance: {
        content_kind: "educational_summary",
        source_work: `${EDITION.author}《${EDITION.book}》`,
        source_edition: `${EDITION.publisher} ${EDITION.year} 年修订本`,
        source_anchor: `第 ${unit.chapter} 章 · ${unit.section}${unit.subsection ? ` · ${unit.subsection}` : ""}`,
        page_locator_status: unit.status === "verified" ? "paper_verified" : "awaiting_paper_verification",
        derivative_note: "项目原创学习概括，不是原书逐字引文",
        release: PROJECT_RELEASE.version,
        updated: PROJECT_RELEASE.updated,
      },
    })),
  }, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
