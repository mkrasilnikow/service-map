/**
 * @file Sidebar component — properties panel shown on the right side.
 *
 * Three states:
 *   1. Node selected → shows node name (editable), type selector, ID, connections count.
 *   2. Edge selected → shows source, target, type selector, label (editable).
 *   3. Nothing selected → shows legend, usage hints, and type stats.
 *
 * @param props.selectedNode - The currently selected node (or null).
 * @param props.selectedEdge - The currently selected edge (or null).
 * @param props.nodes - All graph nodes (for stats).
 * @param props.edges - All graph edges (for connection count).
 * @param props.isDark - Whether dark theme is active.
 * @param props.onUpdateNode - Callback to update a node's properties.
 * @param props.onUpdateEdge - Callback to update an edge's properties.
 * @param props.onDelete - Callback to delete the selected element.
 */

import type { GraphNode, GraphEdge, NodeTypeKey, IntegrationTypeKey } from '../../types';
import { NODE_TYPES, NODE_W, NODE_H } from '../../constants/nodeTypes';
import { EDGE_TYPES, EDGE_TYPE_KEYS } from '../../constants/edgeTypes';

/** UI string constants */
const LABELS = {
  NODE_PROPS: 'NODE PROPERTIES',
  EDGE_PROPS: 'EDGE PROPERTIES',
  LEGEND: 'LEGEND',
  HOW_TO_USE: 'HOW TO USE',
  STATS: 'STATS',
  NAME: 'NAME',
  TYPE: 'TYPE',
  ID: 'ID',
  CONNECTIONS: 'CONNECTIONS',
  SOURCE: 'SOURCE',
  TARGET: 'TARGET',
  LABEL: 'LABEL',
  INTEGRATION_TYPE: 'INTEGRATION TYPE',
  NAMESPACE: 'NAMESPACE',
  NAMESPACE_PLACEHOLDER: 'e.g. backend, infra',
  SIZE: 'SIZE',
  WIDTH: 'W',
  HEIGHT: 'H',
  RESET_SIZE: '↺ Reset',
  REMOVE_NODE: '✕ REMOVE NODE',
  REMOVE_EDGE: '✕ REMOVE EDGE',
  NONE: '— none —',
  HINT_SELECT: '↖ SELECT — click node/edge to edit. Drag to move.',
  HINT_CONNECT: '⟿ CONNECT — click source, then target node.',
  HINT_ADD: '+ ADD NODE — create a new service.',
  HINT_DELETE: '⌦ Delete/Backspace — remove selected.',
} as const;

interface SidebarProps {
  selectedNode: GraphNode | null;
  selectedEdge: GraphEdge | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  isDark: boolean;
  onUpdateNode: (id: string, patch: Partial<GraphNode>) => void;
  onUpdateEdge: (id: string, patch: Partial<GraphEdge>) => void;
  onDelete: () => void;
}

export function Sidebar({
  selectedNode,
  selectedEdge,
  nodes,
  edges,
  isDark,
  onUpdateNode,
  onUpdateEdge,
  onDelete,
}: SidebarProps) {
  if (selectedNode) {
    const connectionCount = edges.filter(
      e => e.source === selectedNode.id || e.target === selectedNode.id,
    ).length;

    return (
      <div className="sidebar">
        <h4>{LABELS.NODE_PROPS}</h4>

        <div className="prop-row">
          <label>{LABELS.NAME}</label>
          <input
            className="sidebar-input"
            value={selectedNode.name}
            onChange={e => onUpdateNode(selectedNode.id, { name: e.target.value })}
          />
        </div>

        <div className="prop-row">
          <label>{LABELS.TYPE}</label>
          <div className="type-grid">
            {Object.entries(NODE_TYPES).map(([key, config]) => (
              <div
                key={key}
                className="type-card"
                style={{
                  borderColor:
                    selectedNode.type === key ? config.color : (isDark ? config.borderDark : config.borderLight) + '40',
                  background:
                    selectedNode.type === key
                      ? (isDark ? config.bgDark : config.bgLight)
                      : 'var(--bg)',
                  color: config.color,
                  fontSize: 10,
                }}
                onClick={() => onUpdateNode(selectedNode.id, { type: key as NodeTypeKey })}
              >
                <div style={{ fontSize: 14 }}>{config.icon}</div>
                <div style={{ letterSpacing: '0.03em', marginTop: 2 }}>
                  {config.label.split(' ')[0]}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="prop-row">
          <label>{LABELS.NAMESPACE}</label>
          <input
            className="sidebar-input"
            value={selectedNode.namespace ?? ''}
            placeholder={LABELS.NAMESPACE_PLACEHOLDER}
            onChange={e =>
              onUpdateNode(selectedNode.id, {
                namespace: e.target.value || undefined,
              })
            }
          />
        </div>

        <div className="prop-row">
          <label>{LABELS.SIZE}</label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: 'var(--muted)' }}>{LABELS.WIDTH}</span>
            <input
              className="sidebar-input"
              type="number"
              style={{ width: 54 }}
              value={selectedNode.width ?? NODE_W}
              min={120}
              max={400}
              onChange={e => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) onUpdateNode(selectedNode.id, { width: Math.min(400, Math.max(120, v)) });
              }}
            />
            <span style={{ fontSize: 9, color: 'var(--muted)' }}>{LABELS.HEIGHT}</span>
            <input
              className="sidebar-input"
              type="number"
              style={{ width: 54 }}
              value={selectedNode.height ?? NODE_H}
              min={48}
              max={200}
              onChange={e => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) onUpdateNode(selectedNode.id, { height: Math.min(200, Math.max(48, v)) });
              }}
            />
            <button
              className="toolbar-btn"
              style={{ fontSize: 9, padding: '2px 6px' }}
              title="Reset to default size"
              onClick={() => onUpdateNode(selectedNode.id, { width: undefined, height: undefined })}
            >
              {LABELS.RESET_SIZE}
            </button>
          </div>
        </div>

        <div className="prop-row">
          <label>{LABELS.ID}</label>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>{selectedNode.id}</span>
        </div>

        <div className="prop-row">
          <label>{LABELS.CONNECTIONS}</label>
          <span>{connectionCount}</span>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
          <button className="toolbar-btn danger" style={{ width: '100%' }} onClick={onDelete}>
            {LABELS.REMOVE_NODE}
          </button>
        </div>
      </div>
    );
  }

  if (selectedEdge) {
    return (
      <div className="sidebar">
        <h4>{LABELS.EDGE_PROPS}</h4>

        <div className="prop-row">
          <label>{LABELS.SOURCE}</label>
          <span>{selectedEdge.source}</span>
        </div>

        <div className="prop-row">
          <label>{LABELS.TARGET}</label>
          <span>{selectedEdge.target}</span>
        </div>

        <div className="prop-row">
          <label>{LABELS.INTEGRATION_TYPE}</label>
          <select
            className="sidebar-input"
            value={selectedEdge.type ?? ''}
            onChange={e =>
              onUpdateEdge(selectedEdge.id, {
                type: (e.target.value || undefined) as IntegrationTypeKey | undefined,
              })
            }
          >
            <option value="">{LABELS.NONE}</option>
            {EDGE_TYPE_KEYS.map(key => (
              <option key={key} value={key}>
                {EDGE_TYPES[key].label}
              </option>
            ))}
          </select>
        </div>

        <div className="prop-row">
          <label>{LABELS.LABEL}</label>
          <input
            className="sidebar-input"
            value={selectedEdge.label ?? ''}
            placeholder="e.g. read/write"
            onChange={e => onUpdateEdge(selectedEdge.id, { label: e.target.value })}
          />
        </div>

        <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
          <button className="toolbar-btn danger" style={{ width: '100%' }} onClick={onDelete}>
            {LABELS.REMOVE_EDGE}
          </button>
        </div>
      </div>
    );
  }

  /* Default: legend + hints + stats */
  return (
    <div className="sidebar">
      <h4>{LABELS.LEGEND}</h4>
      {Object.entries(NODE_TYPES).map(([key, config]) => (
        <div className="legend-item" key={key}>
          <div
            className="legend-dot"
            style={{ background: config.color + '90', border: `1px solid ${config.color}` }}
          />
          <span>
            {config.icon} {config.label}
          </span>
        </div>
      ))}

      <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
        <h4>{LABELS.HOW_TO_USE}</h4>
        <div className="hint">
          <div style={{ marginBottom: 4 }}>{LABELS.HINT_SELECT}</div>
          <div style={{ marginBottom: 4 }}>{LABELS.HINT_CONNECT}</div>
          <div style={{ marginBottom: 4 }}>{LABELS.HINT_ADD}</div>
          <div>{LABELS.HINT_DELETE}</div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
        <h4>{LABELS.STATS}</h4>
        <div className="hint">
          {Object.entries(NODE_TYPES).map(([key, config]) => {
            const count = nodes.filter(n => n.type === key).length;
            if (count === 0) return null;
            return (
              <div key={key} style={{ marginBottom: 3 }}>
                <span style={{ color: config.color }}>
                  {config.icon} {config.label}
                </span>
                <span style={{ color: 'var(--muted)', marginLeft: 6 }}>×{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
