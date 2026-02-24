/**
 * @file Toolbar component — top bar with mode switches and action buttons.
 *
 * Displays:
 *   - Application title
 *   - SELECT / CONNECT mode toggles
 *   - ADD NODE button
 *   - DELETE button (when an element is selected)
 *   - Node/edge count stats
 *   - EXPORT / IMPORT buttons
 *   - Theme toggle
 */

import type { InteractionMode } from '../../types';

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
