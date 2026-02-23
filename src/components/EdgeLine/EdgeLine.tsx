/**
 * @file EdgeLine component — renders a single directed edge (arrow) on the SVG canvas.
 *
 * Displays:
 *   - A quadratic Bezier curve from source to target node center
 *   - An arrowhead marker at the end
 *   - A type badge/label at the curve midpoint
 *   - A transparent wide hit area for easy click selection
 *   - A draggable control-point handle (visible when selected) to reshape the curve
 *
 * The curve shape can be manually adjusted by dragging the control handle,
 * which stores an offset in edge.controlOffsetX / controlOffsetY.
 *
 * @param props.edge - The graph edge data.
 * @param props.sourceCenter - Center coordinates of the source node.
 * @param props.targetCenter - Center coordinates of the target node.
 * @param props.isSelected - Whether this edge is currently selected.
 * @param props.isDark - Whether dark theme is active.
 * @param props.onClick - Handler for selecting the edge.
 * @param props.onControlDragStart - Handler to begin dragging the control point.
 */

import type { GraphEdge } from '../../types';
import { EDGE_TYPES } from '../../constants/edgeTypes';

interface EdgeLineProps {
  edge: GraphEdge;
  sourceCenter: { x: number; y: number };
  targetCenter: { x: number; y: number };
  isSelected: boolean;
  isDark: boolean;
  onClick: (e: React.MouseEvent, edgeId: string) => void;
  onControlDragStart?: (e: React.MouseEvent, edgeId: string) => void;
}

/**
 * Compute the control point for a quadratic Bezier curve.
 * Uses the default perpendicular offset plus any manual user offset.
 */
function getControlPoint(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  offsetX: number,
  offsetY: number,
): { cx: number; cy: number } {
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { cx: mx + offsetX, cy: my + offsetY };
  const ox = (-dy / len) * Math.min(40, len * 0.25);
  const oy = (dx / len) * Math.min(40, len * 0.25);
  return { cx: mx + ox + offsetX, cy: my + oy + offsetY };
}

export function EdgeLine({
  edge,
  sourceCenter,
  targetCenter,
  isSelected,
  isDark,
  onClick,
  onControlDragStart,
}: EdgeLineProps) {
  const { x: sx, y: sy } = sourceCenter;
  const { x: tx, y: ty } = targetCenter;
  const ofsX = edge.controlOffsetX ?? 0;
  const ofsY = edge.controlOffsetY ?? 0;

  const { cx, cy } = getControlPoint(sx, sy, tx, ty, ofsX, ofsY);
  const path = `M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`;

  /* Label position at the curve midpoint (t=0.5 on quadratic Bezier) */
  const labelX = 0.25 * sx + 0.5 * cx + 0.25 * tx;
  const labelY = 0.25 * sy + 0.5 * cy + 0.25 * ty;

  const edgeTypeConfig = edge.type ? EDGE_TYPES[edge.type] : null;
  const displayLabel = edge.type || edge.label;

  const lineColor = isSelected ? '#60a5fa' : isDark ? '#1e3a5f' : '#94a3b8';

  return (
    <g>
      {/* Wide transparent hit area for easy clicking */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth={16}
        fill="none"
        style={{ cursor: 'pointer' }}
        onClick={e => onClick(e, edge.id)}
      />

      {/* Visible edge line */}
      <path
        d={path}
        stroke={lineColor}
        strokeWidth={isSelected ? 2 : 1.5}
        fill="none"
        strokeDasharray={isSelected ? 'none' : '5,4'}
        markerEnd={isSelected ? 'url(#arrow-selected)' : 'url(#arrow)'}
        style={isSelected ? { filter: 'drop-shadow(0 0 4px #3b82f6)' } : {}}
      />

      {/* Type badge or label at curve midpoint */}
      {displayLabel && (
        <g transform={`translate(${labelX}, ${labelY - 10})`}>
          {edgeTypeConfig ? (
            <>
              <rect
                x={-displayLabel.length * 3.5 - 6}
                y={-8}
                width={displayLabel.length * 7 + 12}
                height={16}
                rx={4}
                fill={edgeTypeConfig.bg}
                stroke={edgeTypeConfig.color + '40'}
                strokeWidth={0.5}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill={edgeTypeConfig.color}
                fontSize={9}
                fontFamily="inherit"
                letterSpacing="0.04em"
              >
                {displayLabel}
              </text>
            </>
          ) : (
            <text
              textAnchor="middle"
              fill={isDark ? '#475569' : '#64748b'}
              fontSize={10}
            >
              {displayLabel}
            </text>
          )}
        </g>
      )}

      {/* Draggable control point handle (only when edge is selected) */}
      {isSelected && onControlDragStart && (
        <g
          onMouseDown={e => {
            e.stopPropagation();
            onControlDragStart(e, edge.id);
          }}
          style={{ cursor: 'grab' }}
        >
          {/* Larger invisible hit area */}
          <circle cx={cx} cy={cy} r={12} fill="transparent" />
          {/* Visible handle */}
          <circle
            cx={cx}
            cy={cy}
            r={5}
            fill={isDark ? '#1e3a5f' : '#dbeafe'}
            stroke="#60a5fa"
            strokeWidth={1.5}
          />
          {/* Inner dot */}
          <circle cx={cx} cy={cy} r={2} fill="#60a5fa" />
        </g>
      )}
    </g>
  );
}
