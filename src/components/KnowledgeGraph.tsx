import { useMemo, useRef, useState } from "react";

type Node = {
  id: string;
  label: string;
  type: "概念" | "物质" | "方法" | "工具" | "过程" | "文献类型";
  chapter: string;
  chapterId: string;
  x: number;
  y: number;
  detail: string;
};

const initialNodes: Node[] = [
  { id: "wenxian", label: "文献", type: "概念", chapter: "第一章", chapterId: "ch01", x: 50, y: 47, detail: "承载知识与信息的记录，是全书各类问题共同指向的中心对象。" },
  { id: "carrier", label: "载体", type: "物质", chapter: "第二章", chapterId: "ch02", x: 19, y: 23, detail: "甲骨、金石、竹木、帛、纸等材料，直接影响制作、保存和解读。" },
  { id: "version", label: "版本", type: "概念", chapter: "第五章", chapterId: "ch05", x: 76, y: 23, detail: "同一文献在抄写、刊刻与流传过程中形成的不同文本和物质形态。" },
  { id: "collation", label: "校勘", type: "方法", chapter: "第六章", chapterId: "ch06", x: 82, y: 58, detail: "比较异同、考订讹误，并说明判断依据与保留意见的方法。" },
  { id: "catalog", label: "目录", type: "工具", chapter: "第七章", chapterId: "ch07", x: 55, y: 80, detail: "通过分类、著录和提要组织文献，建立知识秩序与检索入口。" },
  { id: "circulation", label: "流布", type: "过程", chapter: "第三章", chapterId: "ch03", x: 18, y: 69, detail: "文献经讲唱、抄写、镌刻、印刷、摄影等方式抵达不同读者。" },
  { id: "paper", label: "纸", type: "物质", chapter: "第二章", chapterId: "ch02", x: 7, y: 40, detail: "纸张特征与装潢形制可成为版本鉴定、修复和保存的重要证据。" },
  { id: "forgery", label: "辨伪", type: "方法", chapter: "第八章", chapterId: "ch08", x: 92, y: 39, detail: "综合源流、语言、制度、地理和思想等线索判断文献真伪问题。" },
  { id: "leishu", label: "类书", type: "工具", chapter: "第九章", chapterId: "ch09", x: 36, y: 91, detail: "分类汇集旧文献材料，可用于检索史料、校勘和辑佚。" },
  { id: "excavated", label: "出土文献", type: "文献类型", chapter: "第十二、十三章", chapterId: "ch12", x: 29, y: 8, detail: "经考古或其他途径重新发现，并保留物质现场信息的文献。" },
  { id: "gazetteer", label: "地方志", type: "文献类型", chapter: "第十章", chapterId: "ch10", x: 67, y: 93, detail: "系统记录特定地域沿革、人物、物产与制度的重要专门文献。" },
  { id: "dunhuang", label: "敦煌文献", type: "文献类型", chapter: "第十四章", chapterId: "ch14", x: 10, y: 88, detail: "以藏经洞遗书为核心，涉及发现、流散、目录、整理和多语种内容。" },
];

const edges = [
  ["wenxian", "carrier", "依托"], ["wenxian", "version", "形成"], ["version", "collation", "需要"],
  ["collation", "forgery", "互证"], ["wenxian", "catalog", "被组织"], ["wenxian", "circulation", "经历"],
  ["carrier", "paper", "包括"], ["catalog", "leishu", "检索"], ["carrier", "excavated", "保存现场"],
  ["excavated", "version", "提供早期形态"], ["circulation", "version", "造成差异"],
  ["catalog", "gazetteer", "著录"], ["excavated", "dunhuang", "相关"], ["dunhuang", "catalog", "需要编目"],
] as const;

const colors: Record<Node["type"], string> = {
  概念: "#a84537", 物质: "#a77734", 方法: "#4f7865", 工具: "#687b9b", 过程: "#9a6377", 文献类型: "#63747c",
};

export default function KnowledgeGraph() {
  const [nodes, setNodes] = useState(initialNodes);
  const [activeType, setActiveType] = useState("全部");
  const [selectedId, setSelectedId] = useState("wenxian");
  const [dragging, setDragging] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);
  const selected = nodes.find((node) => node.id === selectedId) ?? nodes[0];
  const types = ["全部", ...Array.from(new Set(nodes.map((node) => node.type)))];
  const visible = useMemo(
    () => new Set(nodes.filter((node) => activeType === "全部" || node.type === activeType).map((node) => node.id)),
    [activeType, nodes],
  );

  function point(event: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const width = 100 / zoom;
    const height = 100 / zoom;
    const offset = (100 - width) / 2;
    return {
      x: offset + ((event.clientX - rect.left) / rect.width) * width,
      y: offset + ((event.clientY - rect.top) / rect.height) * height,
    };
  }

  function move(event: React.PointerEvent<SVGSVGElement>) {
    if (!dragging) return;
    const next = point(event);
    setNodes((items) => items.map((node) => node.id === dragging
      ? { ...node, x: Math.max(5, Math.min(95, next.x)), y: Math.max(6, Math.min(94, next.y)) }
      : node));
  }

  const viewSize = 100 / zoom;
  const viewOffset = (100 - viewSize) / 2;

  return (
    <div className="graph-shell">
      <div className="graph-toolbar">
        <div aria-label="筛选知识图谱">
          {types.map((type) => (
            <button className={activeType === type ? "active" : ""} onClick={() => setActiveType(type)} key={type}>{type}</button>
          ))}
        </div>
        <div className="graph-controls">
          <span>拖动节点 · 滚轮或按钮缩放</span>
          <button aria-label="缩小" onClick={() => setZoom((value) => Math.max(1, value - 0.2))}>−</button>
          <b>{Math.round(zoom * 100)}%</b>
          <button aria-label="放大" onClick={() => setZoom((value) => Math.min(2, value + 0.2))}>＋</button>
          <button onClick={() => { setNodes(initialNodes); setZoom(1); }}>复位</button>
        </div>
      </div>
      <div className="graph-stage">
        <svg
          ref={svgRef}
          viewBox={`${viewOffset} ${viewOffset} ${viewSize} ${viewSize}`}
          role="img"
          aria-label="可拖动的文献学概念关系图"
          onPointerMove={move}
          onPointerUp={() => setDragging(null)}
          onPointerLeave={() => setDragging(null)}
          onWheel={(event) => {
            event.preventDefault();
            setZoom((value) => Math.max(1, Math.min(2, value + (event.deltaY < 0 ? 0.1 : -0.1))));
          }}
        >
          {edges.map(([from, to, label]) => {
            const a = nodes.find((node) => node.id === from)!;
            const b = nodes.find((node) => node.id === to)!;
            const show = visible.has(from) && visible.has(to);
            return (
              <g key={`${from}-${to}`} opacity={show ? 0.58 : 0.05}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
                <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 1}>{label}</text>
              </g>
            );
          })}
          {nodes.map((node) => (
            <g
              className={`graph-node ${dragging === node.id ? "dragging" : ""}`}
              opacity={visible.has(node.id) ? 1 : 0.1}
              transform={`translate(${node.x} ${node.y})`}
              onPointerDown={(event) => {
                if (!visible.has(node.id)) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                setDragging(node.id);
                setSelectedId(node.id);
              }}
              onClick={() => visible.has(node.id) && setSelectedId(node.id)}
              role="button"
              tabIndex={visible.has(node.id) ? 0 : -1}
              onKeyDown={(event) => event.key === "Enter" && setSelectedId(node.id)}
              key={node.id}
            >
              <circle r={node.id === "wenxian" ? 7 : 5.6} fill={colors[node.type]} />
              <text className="node-label" y="0.7">{node.label}</text>
            </g>
          ))}
        </svg>
        <aside className="graph-detail">
          <span style={{ color: colors[selected.type] }}>{selected.type} · {selected.chapter}</span>
          <h2>{selected.label}</h2>
          <p>{selected.detail}</p>
          <a className="graph-chapter-link" href={`${import.meta.env.BASE_URL.replace(/\/?$/, "/")}chapters/${selected.chapterId}/`}>阅读对应章节 →</a>
          <small>关系为学习型概念映射，后续将补充出处与复核状态。</small>
        </aside>
      </div>
    </div>
  );
}
