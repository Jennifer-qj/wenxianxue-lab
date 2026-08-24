import { getCollection } from "astro:content";

export const prerender = true;

const root = "https://jennifer-qj.github.io/wenxianxue-lab/";
const staticRoutes = ["", "about/", "audit/", "concepts/", "coverage/", "graph/", "guide/", "lab/", "notebook/", "paths/", "progress/", "search/", "updates/"];
const pathRoutes = ["intro", "material", "circulation", "collection", "criticism", "organization", "special"].map((id) => `paths/${id}/`);
const chapterRoutes = Array.from({ length: 14 }, (_, index) => `chapters/ch${String(index + 1).padStart(2, "0")}/`);

export async function GET() {
  const conceptFiles = await getCollection("concepts");
  const conceptRoutes = conceptFiles.flatMap((entry) => entry.data.items.map((item) => `concepts/${item.id}/`));
  const routes = [...new Set([...staticRoutes, ...pathRoutes, ...chapterRoutes, ...conceptRoutes])];
  const body = routes.map((route) => `  <url><loc>${root}${route}</loc></url>`).join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
