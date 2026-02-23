/**
 * @file Toolbar component — top bar with mode switches and action buttons.
 *
 * Displays:
 *   - Application title
 *   - SELECT / CONNECT mode toggles
 *   - ADD NODE button
 *   - DELETE button (when an element is selected)
 *   - Node/edge count stats
 *   - EXPORT button
 *   - IMPORT button
 *   - Theme toggle (🌙 / ☀️)
 *
 * @param props.mode - Current interaction mode.
 * @param props.connectFrom - ID of the connect-source node (if in connect mode).
 * @param props.hasSelection - Whether an element is currently selected.
 * @param props.selectedKind - Whether the selected element is a "node" or "edge".
 * @param props.nodeCount - Total number of nodes.
 * @param props.edgeCount - Total number of edges.
 * @param props.isDark - Whether dark theme is active.
 * @param props.onModeChange - Callback to switch interaction mode.
 * @param props.onAddNode - Callback to open the Add Node modal.
 * @param props.onDelete - Callback to delete the selected element.
 * @param props.onExport - Callback to open the Export modal.
 * @param props.onImport - Callback to open the Import modal.
 * @param props.onToggleTheme - Callback to toggle light/dark theme.
 */

import type { InteractionMode } from '../../types';

/** UI string constants */
const LABELS = {
  TITLE: '◈ SERVICE MAP',
  SELECT: '↖ SELECT',
  CONNECT: '⟿ CONNECT',
  CONNECT_HINT: '→ click target',
  ADD_NODE: '+ ADD NODE',
  DELETE_NODE: '✕ DELETE NODE',
  DELETE_EDGE: '✕ DELETE EDGE',
  EXPORT: '⬡ EXPORT',
  IMPORT: '⬡ IMPORT',
  ZOOM_IN: '+',
  ZOOM_OUT: '−',
  ZOOM_RESET: '⊙',
} as const;

interface ToolbarProps {
  mode: InteractionMode;
  connectFrom: string | null;
  hasSelection: boolean;
  selectedKind: 'node' | 'edge' | null;
  nodeCount: number;
  edgeCount: number;
  isDark: boolean;
  onModeChange: (mode: InteractionMode) => void;
  onAddNode: () => void;
  onDelete: () => void;
  onExport: () => void;
  onImport: () => void;
  onToggleTheme: () => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export function Toolbar({
  mode,
  connectFrom,
  hasSelection,
  selectedKind,
  nodeCount,
  edgeCount,
  isDark,
  onModeChange,
  onAddNode,
  onDelete,
  onExport,
  onImport,
  onToggleTheme,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: ToolbarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--toolbar-bg)',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: 13,
          color: 'var(--accent)',
          fontWeight: 600,
          marginRight: 8,
          letterSpacing: '0.04em',
        }}
      >
        {LABELS.TITLE}
      </span>

      <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

      <button
        className={`toolbar-btn ${mode === 'select' ? 'active' : ''}`}
        onClick={() => onModeChange('select')}
      >
        {LABELS.SELECT}
      </button>

      <button
        className={`toolbar-btn ${mode === 'connect' ? 'active' : ''}`}
        onClick={() => onModeChange('connect')}
      >
        {LABELS.CONNECT} {connectFrom ? LABELS.CONNECT_HINT : ''}
      </button>

      <button className="toolbar-btn success" onClick={onAddNode}>
        {LABELS.ADD_NODE}
      </button>

      {hasSelection && (
        <button className="toolbar-btn danger" onClick={onDelete}>
          {selectedKind === 'node' ? LABELS.DELETE_NODE : LABELS.DELETE_EDGE}
        </button>
      )}

      <div style={{ flex: 1 }} />

      <span style={{ fontSize: 10, color: 'var(--muted)' }}>
        {nodeCount} nodes · {edgeCount} edges
      </span>

      <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

      <button className="toolbar-btn" onClick={onImport}>
        {LABELS.IMPORT}
      </button>
      <button className="toolbar-btn" onClick={onExport}>
        {LABELS.EXPORT}
      </button>

      <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

      <button className="toolbar-btn" onClick={onZoomIn} title="Zoom in">
        {LABELS.ZOOM_IN}
      </button>
      <span style={{ fontSize: 10, color: 'var(--muted)', minWidth: 36, textAlign: 'center' }}>
        {Math.round((1 / zoomLevel) * 100)}%
      </span>
      <button className="toolbar-btn" onClick={onZoomOut} title="Zoom out">
        {LABELS.ZOOM_OUT}
      </button>
      <button className="toolbar-btn" onClick={onZoomReset} title="Reset zoom">
        {LABELS.ZOOM_RESET}
      </button>

      <button
        className="toolbar-btn"
        onClick={onToggleTheme}
        title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {isDark ? '☀️' : '🌙'}
      </button>
    </div>
  );
}
