import { useMemo, useState } from "react";

const nodes = [
  { id: "wenxian", label: "文献", type: "概念", x: 50, y: 46, detail: "记录有知识的一切载体，是本项目知识网络的中心。" },
  { id: "carrier", label: "载体", type: "物质", x: 20, y: 22, detail: "甲骨、金石、竹木、帛、纸等承载文字与图像的材料。" },
  { id: "version", label: "版本", type: "概念", x: 76, y: 24, detail: "同一文献在抄写、刊刻与流传过程中形成的不同文本形态。" },
  { id: "collation", label: "校勘", type: "方法", x: 82, y: 57, detail: "比较异同、考订讹误，以求接近文献原貌的方法。" },
  { id: "catalog", label: "目录", type: "工具", x: 54, y: 78, detail: "以分类、著录和提要组织文献知识与检索路径。" },
  { id: "circulation", label: "流布", type: "过程", x: 17, y: 68, detail: "文献通过讲唱、抄写、镌刻、印刷、摄影等方式传播。" },
  { id: "paper", label: "纸", type: "物质", x: 7, y: 38, detail: "影响文献制作、装潢、保存与版本鉴定的重要载体。" },
  { id: "forgery", label: "辨伪", type: "方法", x: 92, y: 39, detail: "综合时代、语言、制度、思想等线索辨识文献真伪问题。" },
  { id: "leishu", label: "类书", type: "工具", x: 38, y: 91, detail: "分类汇集旧文献材料的资料性工具书。" },
  { id: "excavated", label: "出土文献", type: "类型", x: 28, y: 8, detail: "经考古或其他途径重新发现、具有物质现场信息的文献。" },
];

const edges = [
  ["wenxian", "carrier", "依托"],
  ["wenxian", "version", "形成不同"],
  ["version", "collation", "需要"],
  ["collation", "forgery", "互证"],
  ["wenxian", "catalog", "被组织"],
  ["wenxian", "circulation", "经历"],
  ["carrier", "paper", "包括"],
  ["catalog", "leishu", "帮助检索"],
  ["carrier", "excavated", "保存现场"],
  ["excavated", "version", "提供早期形态"],
  ["circulation", "version", "造成差异"],
];

const colors: Record<string, string> = {
  概念: "#8f352b",
  物质: "#9a7137",
  方法: "#536d61",
  工具: "#66728a",
  过程: "#8b5b6b",
  类型: "#5f6d76",
};

export default function KnowledgeGraph() {
  const [activeType, setActiveType] = useState("全部");
  const [selected, setSelected] = useState(nodes[0]);
  const types = ["全部", ...Array.from(new Set(nodes.map((node) => node.type)))];
  const visible = useMemo(
    () => new Set(nodes.filter((node) => activeType === "全部" || node.type === activeType).map((node) => node.id)),
    [activeType],
  );

  return (
    <div className="graph-shell">
      <div className="graph-toolbar" aria-label="筛选知识图谱">
        {types.map((type) => (
          <button className={activeType === type ? "active" : ""} onClick={() => setActiveType(type)} key={type}>
            {type}
          </button>
        ))}
      </div>
      <div className="graph-stage">
        <svg viewBox="0 0 100 100" role="img" aria-label="文献学概念关系图">
          {edges.map(([from, to, label]) => {
            const a = nodes.find((node) => node.id === from)!;
            const b = nodes.find((node) => node.id === to)!;
            const show = visible.has(from) && visible.has(to);
            return (
              <g key={`${from}-${to}`} opacity={show ? 0.55 : 0.06}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
                <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 1}>{label}</text>
              </g>
            );
          })}
          {nodes.map((node) => (
            <g
              className="graph-node"
              opacity={visible.has(node.id) ? 1 : 0.12}
              transform={`translate(${node.x} ${node.y})`}
              onClick={() => visible.has(node.id) && setSelected(node)}
              role="button"
              tabIndex={visible.has(node.id) ? 0 : -1}
              onKeyDown={(event) => event.key === "Enter" && setSelected(node)}
              key={node.id}
            >
              <circle r={node.id === "wenxian" ? 7 : 5.5} fill={colors[node.type]} />
              <text className="node-label" y="0.7">{node.label}</text>
            </g>
          ))}
        </svg>
        <aside className="graph-detail">
          <span style={{ color: colors[selected.type] }}>{selected.type}</span>
          <h2>{selected.label}</h2>
          <p>{selected.detail}</p>
          <small>演示图谱 · 内容将随全书整理持续扩充</small>
        </aside>
      </div>
    </div>
  );
}
