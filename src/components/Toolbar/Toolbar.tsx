/**
 * @file Toolbar component — top bar with action buttons.
 *
 * Connection mode is handled natively by React Flow (drag from node handle).
 * The toolbar provides: add node, delete selected, import, export, theme toggle.
 */

const LABELS = {
  TITLE: '◈ SERVICE MAP',
  ADD_NODE: '+ ADD NODE',
  DELETE_NODE: '✕ DELETE NODE',
  DELETE_EDGE: '✕ DELETE EDGE',
  EXPORT: '⬡ EXPORT',
  IMPORT: '⬡ IMPORT',
} as const;

interface ToolbarProps {
  hasSelection: boolean;
  selectedKind: 'node' | 'edge' | null;
  nodeCount: number;
  edgeCount: number;
  isDark: boolean;
  onAddNode: () => void;
  onDelete: () => void;
  onExport: () => void;
  onImport: () => void;
  onToggleTheme: () => void;
}

export function Toolbar({
  hasSelection,
  selectedKind,
  nodeCount,
  edgeCount,
  isDark,
  onAddNode,
  onDelete,
  onExport,
  onImport,
  onToggleTheme,
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
