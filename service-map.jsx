import { useState, useRef, useCallback, useEffect } from "react";

const NODE_TYPES = {
  spring:   { label: "Spring Boot",  color: "#60a5fa", bg: "#0f2044", border: "#3b82f6", icon: "☕" },
  nodejs:   { label: "Node.js",      color: "#4ade80", bg: "#0a2010", border: "#22c55e", icon: "⬡" },
  redis:    { label: "Redis",        color: "#f87171", bg: "#2a0f0f", border: "#ef4444", icon: "⚡" },
  kafka:    { label: "Kafka",        color: "#fb923c", bg: "#2a1500", border: "#f97316", icon: "⇌" },
  postgres: { label: "PostgreSQL",   color: "#38bdf8", bg: "#0a1e2e", border: "#0ea5e9", icon: "🗄" },
  mongodb:  { label: "MongoDB",      color: "#86efac", bg: "#0a2010", border: "#4ade80", icon: "🌿" },
};

const DEMO_NODES = [
  { id: "api-gateway",            name: "api-gateway",            type: "spring",   x: 380, y: 60  },
  { id: "user-service",           name: "user-service",           type: "spring",   x: 120, y: 200 },
  { id: "order-service",          name: "order-service",          type: "spring",   x: 380, y: 200 },
  { id: "notification-service",   name: "notification-service",   type: "nodejs",   x: 640, y: 200 },
  { id: "redis-cache",            name: "redis-cache",            type: "redis",    x: 120, y: 360 },
  { id: "kafka-cluster",          name: "kafka-cluster",          type: "kafka",    x: 380, y: 360 },
  { id: "postgres-users",         name: "postgres-users",         type: "postgres", x: 120, y: 500 },
  { id: "postgres-orders",        name: "postgres-orders",        type: "postgres", x: 380, y: 500 },
  { id: "mongodb-notifications",  name: "mongodb-notifications",  type: "mongodb",  x: 640, y: 360 },
];

const DEMO_EDGES = [
  { id: "e1",  source: "api-gateway",          target: "user-service"          },
  { id: "e2",  source: "api-gateway",          target: "order-service"         },
  { id: "e3",  source: "api-gateway",          target: "notification-service"  },
  { id: "e4",  source: "user-service",         target: "redis-cache"           },
  { id: "e5",  source: "user-service",         target: "postgres-users"        },
  { id: "e6",  source: "order-service",        target: "postgres-orders"       },
  { id: "e7",  source: "order-service",        target: "kafka-cluster"         },
  { id: "e8",  source: "kafka-cluster",        target: "notification-service"  },
  { id: "e9",  source: "notification-service", target: "mongodb-notifications" },
];

const NODE_W = 172;
const NODE_H  = 58;

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function getCurve(sx, sy, tx, ty) {
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ox = (-dy / len) * Math.min(40, len * 0.25);
  const oy = ( dx / len) * Math.min(40, len * 0.25);
  return `M ${sx} ${sy} Q ${mx + ox} ${my + oy} ${tx} ${ty}`;
}

export default function ServiceMap() {
  const [nodes, setNodes] = useState(DEMO_NODES);
  const [edges, setEdges] = useState(DEMO_EDGES);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("select");
  const [connectFrom, setConnectFrom] = useState(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [newNode, setNewNode] = useState({ name: "", type: "spring" });
  const [edgeLabel, setEdgeLabel] = useState("");

  const dragRef = useRef(null);
  const svgRef = useRef(null);

  // --- Delete selected ---
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selected) {
        if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") return;
        if (selected.type === "node") {
          setNodes(ns => ns.filter(n => n.id !== selected.id));
          setEdges(es => es.filter(e => e.source !== selected.id && e.target !== selected.id));
        } else {
          setEdges(es => es.filter(e => e.id !== selected.id));
        }
        setSelected(null);
      }
      if (e.key === "Escape") {
        setMode("select");
        setConnectFrom(null);
        setSelected(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // --- SVG coord helper ---
  const svgCoords = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // --- Drag ---
  const onNodeMouseDown = (e, nodeId) => {
    if (mode === "connect") return;
    e.stopPropagation();
    const { x, y } = svgCoords(e);
    const node = nodes.find(n => n.id === nodeId);
    dragRef.current = { nodeId, startX: x, startY: y, origX: node.x, origY: node.y };
    setSelected({ type: "node", id: nodeId });
  };

  const onSvgMouseMove = (e) => {
    if (!dragRef.current) return;
    const { x, y } = svgCoords(e);
    const dx = x - dragRef.current.startX;
    const dy = y - dragRef.current.startY;
    setNodes(ns => ns.map(n =>
      n.id === dragRef.current.nodeId
        ? { ...n, x: dragRef.current.origX + dx, y: dragRef.current.origY + dy }
        : n
    ));
  };

  const onSvgMouseUp = () => { dragRef.current = null; };

  // --- Connect mode click on node ---
  const onNodeClick = (e, nodeId) => {
    e.stopPropagation();
    if (mode !== "connect") {
      setSelected({ type: "node", id: nodeId });
      return;
    }
    if (!connectFrom) {
      setConnectFrom(nodeId);
    } else {
      if (connectFrom !== nodeId) {
        const exists = edges.find(ed =>
          (ed.source === connectFrom && ed.target === nodeId) ||
          (ed.source === nodeId && ed.target === connectFrom)
        );
        if (!exists) {
          setEdges(es => [...es, { id: genId(), source: connectFrom, target: nodeId, label: "" }]);
        }
      }
      setConnectFrom(null);
    }
  };

  const onEdgeClick = (e, edgeId) => {
    e.stopPropagation();
    setSelected({ type: "edge", id: edgeId });
  };

  const onSvgClick = () => {
    setSelected(null);
    if (mode !== "connect") return;
  };

  // --- Add Node ---
  const addNode = () => {
    if (!newNode.name.trim()) return;
    const id = newNode.name.trim().toLowerCase().replace(/\s+/g, "-") + "-" + genId();
    setNodes(ns => [...ns, { id, name: newNode.name.trim(), type: newNode.type, x: 300, y: 300 }]);
    setNewNode({ name: "", type: "spring" });
    setShowAddNode(false);
  };

  // --- Delete selected ---
  const deleteSelected = () => {
    if (!selected) return;
    if (selected.type === "node") {
      setNodes(ns => ns.filter(n => n.id !== selected.id));
      setEdges(es => es.filter(e => e.source !== selected.id && e.target !== selected.id));
    } else {
      setEdges(es => es.filter(e => e.id !== selected.id));
    }
    setSelected(null);
  };

  // --- Export ---
  const toMermaid = () => {
    const lines = ["graph TD"];
    nodes.forEach(n => {
      const t = NODE_TYPES[n.type].label;
      lines.push(`  ${n.id}["${n.name}<br/><small>${t}</small>"]`);
    });
    edges.forEach(e => {
      lines.push(`  ${e.source} --> ${e.target}`);
    });
    return lines.join("\n");
  };

  const toJSON = () => JSON.stringify({ nodes, edges }, null, 2);

  // --- Edge midpoints for labels ---
  const getNodeCenter = (nodeId) => {
    const n = nodes.find(nd => nd.id === nodeId);
    if (!n) return { x: 0, y: 0 };
    return { x: n.x + NODE_W / 2, y: n.y + NODE_H / 2 };
  };

  const getEdgeEndpoints = (edge) => {
    const s = getNodeCenter(edge.source);
    const t = getNodeCenter(edge.target);
    return { sx: s.x, sy: s.y, tx: t.x, ty: t.y };
  };

  const selectedNode = selected?.type === "node" ? nodes.find(n => n.id === selected.id) : null;
  const selectedEdge = selected?.type === "edge" ? edges.find(e => e.id === selected.id) : null;

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      background: "#060b14",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      color: "#cbd5e1",
      overflow: "hidden",
    }}>
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0f1a; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 3px; }
        .toolbar-btn {
          padding: 6px 14px;
          border-radius: 6px;
          border: 1px solid #1e3a5f;
          background: #0d1b2e;
          color: #94a3b8;
          font-family: inherit;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 0.03em;
        }
        .toolbar-btn:hover { background: #162540; color: #e2e8f0; border-color: #2563eb; }
        .toolbar-btn.active { background: #1d3d7a; color: #60a5fa; border-color: #3b82f6; }
        .toolbar-btn.danger { border-color: #7f1d1d; color: #f87171; }
        .toolbar-btn.danger:hover { background: #2a0f0f; }
        .toolbar-btn.success { border-color: #14532d; color: #4ade80; }
        .toolbar-btn.success:hover { background: #0a2010; }
        .node-rect:hover { filter: brightness(1.15); }
        .edge-hit { cursor: pointer; }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.75);
          display: flex; align-items: center; justify-content: center; z-index: 100;
        }
        .modal {
          background: #0d1b2e; border: 1px solid #1e3a5f; border-radius: 12px;
          padding: 28px; min-width: 340px; font-family: inherit;
        }
        .modal h3 { margin: 0 0 20px; font-size: 14px; color: #93c5fd; letter-spacing: 0.05em; }
        .modal input, .modal select, .modal textarea {
          width: 100%; background: #060b14; border: 1px solid #1e3a5f;
          color: #e2e8f0; font-family: inherit; font-size: 13px;
          padding: 9px 12px; border-radius: 6px; outline: none; margin-bottom: 12px;
        }
        .modal input:focus, .modal select:focus, .modal textarea:focus { border-color: #3b82f6; }
        .modal label { display: block; font-size: 11px; color: #64748b; margin-bottom: 4px; letter-spacing: 0.05em; }
        .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
        .badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 2px 8px; border-radius: 4px; font-size: 10px;
          letter-spacing: 0.04em; border: 1px solid;
        }
        .sidebar { 
          width: 240px; background: #080f1a; border-left: 1px solid #0f2040;
          padding: 16px; overflow-y: auto; flex-shrink: 0;
        }
        .sidebar h4 { margin: 0 0 12px; font-size: 11px; color: #475569; letter-spacing: 0.08em; text-transform: uppercase; }
        .prop-row { margin-bottom: 10px; }
        .prop-row label { font-size: 10px; color: #475569; display: block; margin-bottom: 3px; letter-spacing: 0.06em; }
        .prop-row span { font-size: 12px; color: #94a3b8; }
        .type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 16px; }
        .type-card {
          padding: 8px; border-radius: 6px; border: 1px solid;
          cursor: pointer; transition: all 0.15s; text-align: center;
        }
        .legend-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 11px; color: #64748b; }
        .legend-dot { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
        .hint { font-size: 10px; color: #334155; line-height: 1.6; }
      `}</style>

      {/* TOOLBAR */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 16px", borderBottom: "1px solid #0f2040",
        background: "#080f1a", flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, color: "#3b82f6", fontWeight: 600, marginRight: 8, letterSpacing: "0.04em" }}>
          ◈ SERVICE MAP
        </span>
        <div style={{ width: 1, height: 20, background: "#1e3a5f", margin: "0 4px" }} />
        <button className={`toolbar-btn ${mode === "select" ? "active" : ""}`} onClick={() => { setMode("select"); setConnectFrom(null); }}>
          ↖ SELECT
        </button>
        <button className={`toolbar-btn ${mode === "connect" ? "active" : ""}`} onClick={() => { setMode("connect"); setSelected(null); }}>
          ⟿ CONNECT {connectFrom ? "→ click target" : ""}
        </button>
        <button className="toolbar-btn success" onClick={() => setShowAddNode(true)}>
          + ADD NODE
        </button>
        {selected && (
          <button className="toolbar-btn danger" onClick={deleteSelected}>
            ✕ DELETE {selected.type === "node" ? "NODE" : "EDGE"}
          </button>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: "#334155" }}>
          {nodes.length} nodes · {edges.length} edges
        </span>
        <div style={{ width: 1, height: 20, background: "#1e3a5f", margin: "0 4px" }} />
        <button className="toolbar-btn" onClick={() => setShowExport(true)}>⬡ EXPORT</button>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* SVG CANVAS */}
        <svg
          ref={svgRef}
          style={{
            flex: 1,
            cursor: mode === "connect" ? (connectFrom ? "crosshair" : "copy") : "default",
            backgroundImage: "radial-gradient(circle, #1e3a5f22 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          onMouseMove={onSvgMouseMove}
          onMouseUp={onSvgMouseUp}
          onMouseLeave={onSvgMouseUp}
          onClick={onSvgClick}
        >
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#334155" />
            </marker>
            <marker id="arrow-selected" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#60a5fa" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* EDGES */}
          {edges.map(edge => {
            const { sx, sy, tx, ty } = getEdgeEndpoints(edge);
            const isSelected = selected?.id === edge.id;
            const path = getCurve(sx, sy, tx, ty);
            const mx = (sx + tx) / 2;
            const my = (sy + ty) / 2;
            return (
              <g key={edge.id}>
                {/* Hit area */}
                <path
                  d={path}
                  stroke="transparent"
                  strokeWidth={16}
                  fill="none"
                  className="edge-hit"
                  onClick={e => onEdgeClick(e, edge.id)}
                />
                <path
                  d={path}
                  stroke={isSelected ? "#60a5fa" : "#1e3a5f"}
                  strokeWidth={isSelected ? 2 : 1.5}
                  fill="none"
                  strokeDasharray={isSelected ? "none" : "5,4"}
                  markerEnd={isSelected ? "url(#arrow-selected)" : "url(#arrow)"}
                  style={isSelected ? { filter: "drop-shadow(0 0 4px #3b82f6)" } : {}}
                />
                {edge.label && (
                  <text x={mx} y={my - 6} textAnchor="middle" fill="#475569" fontSize={10}>{edge.label}</text>
                )}
              </g>
            );
          })}

          {/* NODES */}
          {nodes.map(node => {
            const nt = NODE_TYPES[node.type];
            const isSelected = selected?.id === node.id;
            const isConnectFrom = connectFrom === node.id;
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={e => onNodeMouseDown(e, node.id)}
                onClick={e => onNodeClick(e, node.id)}
                style={{ cursor: mode === "connect" ? "pointer" : "grab", userSelect: "none" }}
              >
                {/* Glow when selected */}
                {(isSelected || isConnectFrom) && (
                  <rect
                    x={-3} y={-3}
                    width={NODE_W + 6} height={NODE_H + 6}
                    rx={11} ry={11}
                    fill="none"
                    stroke={isConnectFrom ? "#f97316" : nt.color}
                    strokeWidth={2}
                    opacity={0.5}
                    style={{ filter: `drop-shadow(0 0 8px ${isConnectFrom ? "#f97316" : nt.color})` }}
                  />
                )}
                {/* Card */}
                <rect
                  className="node-rect"
                  width={NODE_W} height={NODE_H}
                  rx={8} ry={8}
                  fill={nt.bg}
                  stroke={isSelected || isConnectFrom ? nt.color : nt.border + "60"}
                  strokeWidth={isSelected ? 1.5 : 1}
                />
                {/* Top accent bar */}
                <rect width={NODE_W} height={3} rx={0} ry={0}
                  fill={nt.color} opacity={0.7}
                  style={{ borderRadius: "8px 8px 0 0" }}
                />
                <rect width={40} height={3} rx={0} fill={nt.color} />
                {/* Icon */}
                <text x={16} y={36} fontSize={18} dominantBaseline="middle">{nt.icon}</text>
                {/* Name */}
                <text x={42} y={28} fill={nt.color} fontSize={12} fontWeight={500} fontFamily="inherit">
                  {node.name.length > 17 ? node.name.slice(0, 16) + "…" : node.name}
                </text>
                {/* Type label */}
                <text x={42} y={44} fill={nt.color + "80"} fontSize={9} fontFamily="inherit" letterSpacing="0.06em">
                  {nt.label.toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Connect mode hint line */}
          {connectFrom && (() => {
            const cn = getNodeCenter(connectFrom);
            return (
              <circle cx={cn.x} cy={cn.y} r={10} fill="none" stroke="#f97316" strokeWidth={2} strokeDasharray="4,3" opacity={0.8} />
            );
          })()}
        </svg>

        {/* SIDEBAR */}
        <div className="sidebar">
          {selectedNode ? (
            <>
              <h4>NODE PROPERTIES</h4>
              <div className="prop-row">
                <label>NAME</label>
                <input
                  style={{ width: "100%", background: "#060b14", border: "1px solid #1e3a5f", color: "#e2e8f0", fontFamily: "inherit", fontSize: 12, padding: "6px 10px", borderRadius: 6, outline: "none" }}
                  value={selectedNode.name}
                  onChange={e => setNodes(ns => ns.map(n => n.id === selectedNode.id ? { ...n, name: e.target.value } : n))}
                />
              </div>
              <div className="prop-row">
                <label>TYPE</label>
                <div className="type-grid">
                  {Object.entries(NODE_TYPES).map(([k, v]) => (
                    <div
                      key={k}
                      className="type-card"
                      style={{
                        borderColor: selectedNode.type === k ? v.color : v.border + "40",
                        background: selectedNode.type === k ? v.bg : "#060b14",
                        color: v.color,
                        fontSize: 10,
                      }}
                      onClick={() => setNodes(ns => ns.map(n => n.id === selectedNode.id ? { ...n, type: k } : n))}
                    >
                      <div style={{ fontSize: 14 }}>{v.icon}</div>
                      <div style={{ letterSpacing: "0.03em", marginTop: 2 }}>{v.label.split(" ")[0]}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="prop-row">
                <label>ID</label>
                <span style={{ fontSize: 10, color: "#334155" }}>{selectedNode.id}</span>
              </div>
              <div className="prop-row">
                <label>CONNECTIONS</label>
                <span>{edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length}</span>
              </div>
              <div style={{ borderTop: "1px solid #0f2040", marginTop: 12, paddingTop: 12 }}>
                <button className="toolbar-btn danger" style={{ width: "100%" }} onClick={deleteSelected}>
                  ✕ REMOVE NODE
                </button>
              </div>
            </>
          ) : selectedEdge ? (
            <>
              <h4>EDGE PROPERTIES</h4>
              <div className="prop-row">
                <label>SOURCE</label>
                <span>{selectedEdge.source}</span>
              </div>
              <div className="prop-row">
                <label>TARGET</label>
                <span>{selectedEdge.target}</span>
              </div>
              <div className="prop-row">
                <label>LABEL</label>
                <input
                  style={{ width: "100%", background: "#060b14", border: "1px solid #1e3a5f", color: "#e2e8f0", fontFamily: "inherit", fontSize: 12, padding: "6px 10px", borderRadius: 6, outline: "none" }}
                  value={selectedEdge.label || ""}
                  placeholder="e.g. HTTP, gRPC, pub/sub"
                  onChange={e => setEdges(es => es.map(ed => ed.id === selectedEdge.id ? { ...ed, label: e.target.value } : ed))}
                />
              </div>
              <div style={{ borderTop: "1px solid #0f2040", marginTop: 12, paddingTop: 12 }}>
                <button className="toolbar-btn danger" style={{ width: "100%" }} onClick={deleteSelected}>
                  ✕ REMOVE EDGE
                </button>
              </div>
            </>
          ) : (
            <>
              <h4>LEGEND</h4>
              {Object.entries(NODE_TYPES).map(([k, v]) => (
                <div className="legend-item" key={k}>
                  <div className="legend-dot" style={{ background: v.color + "90", border: `1px solid ${v.color}` }} />
                  <span>{v.icon} {v.label}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #0f2040", marginTop: 12, paddingTop: 12 }}>
                <h4>HOW TO USE</h4>
                <div className="hint">
                  <div style={{ marginBottom: 4 }}>↖ <b style={{ color: "#475569" }}>SELECT</b> — click node/edge to edit. Drag to move.</div>
                  <div style={{ marginBottom: 4 }}>⟿ <b style={{ color: "#475569" }}>CONNECT</b> — click source, then target node.</div>
                  <div style={{ marginBottom: 4 }}>+ <b style={{ color: "#475569" }}>ADD NODE</b> — create a new service.</div>
                  <div>⌦ <b style={{ color: "#475569" }}>Delete/Backspace</b> — remove selected.</div>
                </div>
              </div>
              <div style={{ borderTop: "1px solid #0f2040", marginTop: 12, paddingTop: 12 }}>
                <h4>STATS</h4>
                <div className="hint">
                  {Object.entries(NODE_TYPES).map(([k, v]) => {
                    const count = nodes.filter(n => n.type === k).length;
                    return count > 0 ? (
                      <div key={k} style={{ marginBottom: 3 }}>
                        <span style={{ color: v.color }}>{v.icon} {v.label}</span>
                        <span style={{ color: "#334155", marginLeft: 6 }}>×{count}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ADD NODE MODAL */}
      {showAddNode && (
        <div className="modal-overlay" onClick={() => setShowAddNode(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>+ ADD NEW NODE</h3>
            <label>SERVICE NAME</label>
            <input
              autoFocus
              value={newNode.name}
              onChange={e => setNewNode(n => ({ ...n, name: e.target.value }))}
              placeholder="e.g. payment-service"
              onKeyDown={e => e.key === "Enter" && addNode()}
            />
            <label>TYPE</label>
            <div className="type-grid" style={{ marginBottom: 16 }}>
              {Object.entries(NODE_TYPES).map(([k, v]) => (
                <div
                  key={k}
                  className="type-card"
                  style={{
                    borderColor: newNode.type === k ? v.color : v.border + "40",
                    background: newNode.type === k ? v.bg : "#060b14",
                    color: v.color,
                    fontSize: 11,
                  }}
                  onClick={() => setNewNode(n => ({ ...n, type: k }))}
                >
                  <div style={{ fontSize: 18 }}>{v.icon}</div>
                  <div style={{ letterSpacing: "0.03em", marginTop: 3 }}>{v.label}</div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="toolbar-btn" onClick={() => setShowAddNode(false)}>CANCEL</button>
              <button className="toolbar-btn success" onClick={addNode}>ADD NODE</button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT MODAL */}
      {showExport && (
        <div className="modal-overlay" onClick={() => setShowExport(false)}>
          <div className="modal" style={{ minWidth: 520 }} onClick={e => e.stopPropagation()}>
            <h3>⬡ EXPORT</h3>
            <label>MERMAID DIAGRAM</label>
            <textarea
              style={{ height: 160, resize: "vertical", fontFamily: "inherit", fontSize: 11 }}
              readOnly
              value={toMermaid()}
            />
            <label>JSON</label>
            <textarea
              style={{ height: 120, resize: "vertical", fontFamily: "inherit", fontSize: 11 }}
              readOnly
              value={toJSON()}
            />
            <div className="modal-actions">
              <button className="toolbar-btn" onClick={() => { navigator.clipboard?.writeText(toMermaid()); }}>COPY MERMAID</button>
              <button className="toolbar-btn" onClick={() => { navigator.clipboard?.writeText(toJSON()); }}>COPY JSON</button>
              <button className="toolbar-btn" onClick={() => setShowExport(false)}>CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
