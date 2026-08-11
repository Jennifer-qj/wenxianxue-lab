import { useEffect, useMemo, useRef, useState } from "react";

type ConceptType = "concept" | "material" | "work" | "person" | "event" | "method";
type Concept = { id: string; label: string; type: ConceptType; definition: string; chapter_ids: string[]; status: string };
type Edge = { id: string; source: string; target: string; type: string; evidence: string; confidence: "confirmed" | "pedagogical" | "doubtful" };
type PositionedNode = Concept & { x: number; y: number; degree: number };

const WIDTH = 1100;
const HEIGHT = 720;
const typeLabels: Record<ConceptType, string> = { concept: "概念", material: "载体", work: "典籍", person: "人物", event: "事件", method: "方法" };
const typeColors: Record<ConceptType, string> = { concept: "#a84537", material: "#b08038", work: "#687b9b", person: "#9a6377", event: "#816a9a", method: "#4f7865" };
const relationLabels: Record<string, string> = { isA: "属于", isPartOf: "组成", usesMethod: "使用方法", produces: "产生", evidenceFor: "支持", affectedBy: "受影响", relatedTo: "相关" };
const confidenceLabels = { confirmed: "原书确认", pedagogical: "教学归纳", doubtful: "待考关系" } as const;
const statusLabels: Record<string, string> = { not_started: "未开始", drafting: "整理中", pending_review: "待复核", reviewed: "已复核", verified: "已核验" };

function chapterNumber(node: Concept) {
  const match = node.chapter_ids[0]?.match(/\d+/);
  return match ? Number(match[0]) : 1;
}

function createLayout(concepts: Concept[], edges: Edge[]): PositionedNode[] {
  const degree = new Map<string, number>();
  edges.forEach((edge) => {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  });
  const groups = new Map<number, Concept[]>();
  concepts.forEach((node) => {
    const chapter = chapterNumber(node);
    groups.set(chapter, [...(groups.get(chapter) ?? []), node]);
  });
  return concepts.map((node) => {
    const chapter = chapterNumber(node);
    const group = groups.get(chapter) ?? [node];
    const index = group.findIndex((item) => item.id === node.id);
    const column = (chapter - 1) % 7;
    const row = Math.floor((chapter - 1) / 7);
    const centerX = 85 + column * 155;
    const centerY = 185 + row * 350;
    const angle = (index / group.length) * Math.PI * 2 - Math.PI / 2;
    const ring = 25 + (index % 3) * 16;
    return { ...node, degree: degree.get(node.id) ?? 0, x: centerX + Math.cos(angle) * ring, y: centerY + Math.sin(angle) * ring };
  });
}

export default function KnowledgeGraph({ concepts, edges, baseUrl }: { concepts: Concept[]; edges: Edge[]; baseUrl: string }) {
  const initialNodes = useMemo(() => createLayout(concepts, edges), [concepts, edges]);
  const [nodes, setNodes] = useState(initialNodes);
  const [activeType, setActiveType] = useState<"all" | ConceptType>("all");
  const [chapter, setChapter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(concepts[0]?.id ?? "");
  const [dragging, setDragging] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => setNodes(initialNodes), [initialNodes]);

  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const adjacent = useMemo(() => {
    const map = new Map<string, Set<string>>();
    edges.forEach((edge) => {
      map.set(edge.source, new Set([...(map.get(edge.source) ?? []), edge.target]));
      map.set(edge.target, new Set([...(map.get(edge.target) ?? []), edge.source]));
    });
    return map;
  }, [edges]);
  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("zh-CN");
    const matches = new Set(nodes.filter((node) => !normalized || `${node.label} ${node.definition}`.toLocaleLowerCase("zh-CN").includes(normalized)).map((node) => node.id));
    if (normalized) for (const id of [...matches]) for (const neighbor of adjacent.get(id) ?? []) matches.add(neighbor);
    return new Set(nodes.filter((node) =>
      (activeType === "all" || node.type === activeType) &&
      (chapter === "all" || node.chapter_ids.includes(chapter)) && matches.has(node.id),
    ).map((node) => node.id));
  }, [activeType, adjacent, chapter, nodes, query]);

  useEffect(() => {
    if (!visible.has(selectedId)) setSelectedId([...visible][0] ?? "");
  }, [selectedId, visible]);

  const selected = nodeMap.get(selectedId);
  const selectedEdges = selected ? edges.filter((edge) => edge.source === selected.id || edge.target === selected.id) : [];
  const connected = new Set(selectedEdges.flatMap((edge) => [edge.source, edge.target]));
  const viewWidth = WIDTH / zoom;
  const viewHeight = HEIGHT / zoom;
  const viewX = (WIDTH - viewWidth) / 2;
  const viewY = (HEIGHT - viewHeight) / 2;

  function point(event: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: viewX + ((event.clientX - rect.left) / rect.width) * viewWidth, y: viewY + ((event.clientY - rect.top) / rect.height) * viewHeight };
  }
  function move(event: React.PointerEvent<SVGSVGElement>) {
    if (!dragging) return;
    const next = point(event);
    setNodes((items) => items.map((node) => node.id === dragging ? { ...node, x: Math.max(20, Math.min(WIDTH - 20, next.x)), y: Math.max(25, Math.min(HEIGHT - 25, next.y)) } : node));
  }
  function reset() {
    setNodes(initialNodes); setActiveType("all"); setChapter("all"); setQuery(""); setZoom(1); setSelectedId(concepts[0]?.id ?? "");
  }

  return <div className="graph-shell graph-shell--full">
    <div className="graph-searchbar">
      <label><span>搜索概念</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：版本、辑佚、敦煌……" /></label>
      <label><span>章节</span><select value={chapter} onChange={(event) => setChapter(event.target.value)}><option value="all">全部十四章</option>{Array.from({ length: 14 }, (_, index) => <option key={index + 1} value={`ch${String(index + 1).padStart(2, "0")}`}>第 {index + 1} 章</option>)}</select></label>
      <div className="graph-count"><strong>{visible.size}</strong><span>个可见节点</span><b>{edges.filter((edge) => visible.has(edge.source) && visible.has(edge.target)).length} 条关系</b></div>
    </div>
    <div className="graph-toolbar">
      <div aria-label="按类型筛选">{(["all", "concept", "material", "work", "person", "event", "method"] as const).map((type) => <button key={type} className={activeType === type ? "active" : ""} onClick={() => setActiveType(type)}>{type === "all" ? "全部类型" : typeLabels[type]}</button>)}</div>
      <div className="graph-controls"><span>拖动节点 · 滚轮缩放</span><button onClick={() => setZoom((value) => Math.max(1, value - .2))}>−</button><b>{Math.round(zoom * 100)}%</b><button onClick={() => setZoom((value) => Math.min(2.4, value + .2))}>＋</button><button onClick={reset}>复位</button></div>
    </div>
    <div className="graph-stage graph-stage--full">
      <svg ref={svgRef} viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`} role="img" aria-label="全书可拖动知识图谱" onPointerMove={move} onPointerUp={() => setDragging(null)} onPointerLeave={() => setDragging(null)} onWheel={(event) => { event.preventDefault(); setZoom((value) => Math.max(1, Math.min(2.4, value + (event.deltaY < 0 ? .1 : -.1)))); }}>
        {Array.from({ length: 14 }, (_, index) => {
          const col = index % 7, row = Math.floor(index / 7);
          return <text key={index} className="chapter-cluster-label" x={85 + col * 155} y={90 + row * 350}>第 {index + 1} 章</text>;
        })}
        {edges.map((edge) => {
          const source = nodeMap.get(edge.source), target = nodeMap.get(edge.target);
          if (!source || !target) return null;
          const show = visible.has(edge.source) && visible.has(edge.target);
          const emphasis = selected ? edge.source === selected.id || edge.target === selected.id : false;
          return <g key={edge.id} opacity={show ? (emphasis ? .95 : .25) : .025} className={emphasis ? "edge-active" : ""}>
            <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} />
            {(emphasis || zoom > 1.65) && <text x={(source.x + target.x) / 2} y={(source.y + target.y) / 2 - 4}>{relationLabels[edge.type] ?? edge.type}</text>}
          </g>;
        })}
        {nodes.map((node) => {
          const show = visible.has(node.id); const selectedNode = node.id === selectedId; const related = connected.has(node.id);
          const radius = Math.min(10, 4.2 + node.degree * .8);
          return <g key={node.id} className={`graph-node ${dragging === node.id ? "dragging" : ""} ${selectedNode ? "selected" : ""}`} opacity={show ? (selected && !related && !selectedNode ? .4 : 1) : .035} transform={`translate(${node.x} ${node.y})`} onPointerDown={(event) => { if (!show) return; event.currentTarget.setPointerCapture(event.pointerId); setDragging(node.id); setSelectedId(node.id); }} onClick={() => show && setSelectedId(node.id)} role="button" tabIndex={show ? 0 : -1} onKeyDown={(event) => event.key === "Enter" && setSelectedId(node.id)}>
            <circle r={radius} fill={typeColors[node.type]} />
            {(selectedNode || related || zoom > 1.25 || (query && show)) && <text className="node-label" y={-radius - 4}>{node.label}</text>}
          </g>;
        })}
      </svg>
      <aside className="graph-detail graph-detail--full">
        {selected ? <>
          <span style={{ color: typeColors[selected.type] }}>{typeLabels[selected.type]} · {selected.chapter_ids.map((id) => `第 ${Number(id.slice(2))} 章`).join("、")}</span>
          <h2>{selected.label}</h2><p>{selected.definition}</p>
          <div className="graph-status">{statusLabels[selected.status] ?? selected.status} · {selected.degree} 条直接关系</div>
          <div className="graph-relations">{selectedEdges.length ? selectedEdges.map((edge) => {
            const otherId = edge.source === selected.id ? edge.target : edge.source; const other = nodeMap.get(otherId);
            return <button key={edge.id} onClick={() => setSelectedId(otherId)}><small>{relationLabels[edge.type] ?? edge.type} · {confidenceLabels[edge.confidence]}</small><strong>{other?.label ?? otherId}</strong><span>{edge.evidence}</span></button>;
          }) : <p>这个概念已录入全书词表，跨概念关系仍待补充。</p>}</div>
          <div className="graph-chapter-links">{selected.chapter_ids.map((id) => <a key={id} href={`${baseUrl}chapters/${id}/`}>阅读第 {Number(id.slice(2))} 章 →</a>)}</div>
        </> : <p>当前筛选条件没有可见节点，请调整章节、类型或搜索词。</p>}
      </aside>
    </div>
  </div>;
}
