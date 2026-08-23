import { getCollection } from "astro:content";

export const prerender = true;

export async function GET() {
  const [conceptFiles, graphFiles, outlineFiles] = await Promise.all([
    getCollection("concepts"), getCollection("graph"), getCollection("outline"),
  ]);
  const concepts = conceptFiles.flatMap((entry) => entry.data.items);
  const edges = graphFiles.flatMap((entry) => entry.data.items);
  const units = outlineFiles.flatMap((entry) => entry.data.items);
  return new Response(JSON.stringify({
    schema_version: "1.0",
    project: "文献学实验室 / Wenxianxue Lab",
    source_note: "本数据集为参考杜泽逊《文献学概要（修订本）》制作的原创学习元数据，不含原书全文。",
    license_note: "原书权利归相应权利人；项目数据的再利用请先联系项目作者。",
    counts: { concepts: concepts.length, edges: edges.length, learning_units: units.length },
    concepts,
    edges,
    learning_units: units.map(({ summary: _summary, boundary: _boundary, ...unit }) => unit),
  }, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
