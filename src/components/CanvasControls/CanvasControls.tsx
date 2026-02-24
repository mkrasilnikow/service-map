/**
 * @file Canvas navigation controls — zoom, fit-view, and lock buttons.
 *
 * Positioned absolutely in the bottom-left corner of the canvas area.
 * Styled with existing CSS variables for theme consistency.
 */

interface CanvasControlsProps {
  zoom: number;
  isPanLocked: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onToggleLock: () => void;
}

const btnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid var(--btn-border)',
  background: 'var(--btn-bg)',
  color: 'var(--btn-text)',
  fontFamily: 'inherit',
  fontSize: 14,
  cursor: 'pointer',
  transition: 'all 0.15s',
};

export function CanvasControls({
  zoom,
  isPanLocked,
  onZoomIn,
  onZoomOut,
  onFitView,
  onToggleLock,
}: CanvasControlsProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        zIndex: 10,
      }}
    >
      <button
        style={{ ...btnStyle, borderRadius: '6px 6px 0 0' }}
        onClick={onZoomIn}
        title="Zoom in"
      >
        +
      </button>
      <div
        style={{
          ...btnStyle,
          fontSize: 10,
          cursor: 'default',
          borderTop: 'none',
          borderBottom: 'none',
          color: 'var(--muted)',
          userSelect: 'none',
        }}
      >
        {Math.round(zoom * 100)}%
      </div>
      <button
        style={{ ...btnStyle, borderRadius: '0 0 6px 6px' }}
        onClick={onZoomOut}
        title="Zoom out"
      >
        −
      </button>

      <button
        style={{ ...btnStyle, borderRadius: 6, marginTop: 6 }}
        onClick={onFitView}
        title="Fit view"
      >
        ⛶
      </button>

      <button
        style={{
          ...btnStyle,
          borderRadius: 6,
          marginTop: 2,
          borderColor: isPanLocked ? 'var(--btn-active-border)' : undefined,
          background: isPanLocked ? 'var(--btn-active-bg)' : undefined,
          color: isPanLocked ? 'var(--btn-active-text)' : undefined,
        }}
        onClick={onToggleLock}
        title={isPanLocked ? 'Unlock pan & zoom' : 'Lock pan & zoom'}
      >
        {isPanLocked ? '🔒' : '🔓'}
      </button>
    </div>
  );
}
