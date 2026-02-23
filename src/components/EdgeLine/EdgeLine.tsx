/**
 * @file EdgeLine component — renders a single directed edge (arrow) on the SVG canvas.
 *
 * Displays:
 *   - A curved path from source node center to target node center
 *   - An arrowhead marker at the end
 *   - A type badge/label at the midpoint (if the edge has a type or label)
 *   - A transparent wide hit area for easy click selection
 *
 * @param props.edge - The graph edge data.
 * @param props.sourceCenter - Center coordinates of the source node.
 * @param props.targetCenter - Center coordinates of the target node.
 * @param props.isSelected - Whether this edge is currently selected.
 * @param props.isDark - Whether dark theme is active.
 * @param props.onClick - Handler for selecting the edge.
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
}

/**
 * Compute a quadratic Bezier curve path between two points.
 * The control point is offset perpendicular to the line for a slight arc.
 */
function getCurve(sx: number, sy: number, tx: number, ty: number): string {
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return `M ${sx} ${sy} L ${tx} ${ty}`;
  const ox = (-dy / len) * Math.min(40, len * 0.25);
  const oy = (dx / len) * Math.min(40, len * 0.25);
  return `M ${sx} ${sy} Q ${mx + ox} ${my + oy} ${tx} ${ty}`;
}

export function EdgeLine({
  edge,
  sourceCenter,
  targetCenter,
  isSelected,
  isDark,
  onClick,
}: EdgeLineProps) {
  const { x: sx, y: sy } = sourceCenter;
  const { x: tx, y: ty } = targetCenter;
  const path = getCurve(sx, sy, tx, ty);
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;

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

      {/* Type badge or label at midpoint */}
      {displayLabel && (
        <g transform={`translate(${mx}, ${my - 10})`}>
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
    </g>
  );
}
