/**
 * @file NodeCard component — renders a single service node on the SVG canvas.
 *
 * Displays:
 *   - A colored card with top accent bar
 *   - An icon and the service name (auto-wrapped and font-reduced for long names)
 *   - A type label (e.g. "SPRING BOOT")
 *   - Selection glow / connect-mode highlight
 *
 * Name display logic:
 *   - Names up to 15 chars: single line, 12px font
 *   - Names 16-30 chars: split into 2 lines, 10px font
 *   - Names 31+ chars: split into 2 lines, 9px font, second line truncated with "…"
 *
 * @param props.node - The graph node data to render.
 * @param props.config - Visual configuration for the node's type.
 * @param props.isSelected - Whether this node is currently selected.
 * @param props.isConnectSource - Whether this node is the connect-mode source.
 * @param props.isDark - Whether dark theme is active.
 * @param props.mode - Current interaction mode ("select" | "connect").
 * @param props.onMouseDown - Handler for starting a drag.
 * @param props.onClick - Handler for selecting or connecting.
 */

import { useMemo } from 'react';
import type { GraphNode, InteractionMode, NodeTypeConfig } from '../../types';
import { NODE_W, NODE_H } from '../../constants/nodeTypes';

/** Max characters that fit on one line at normal (12px) font */
const SINGLE_LINE_MAX = 15;
/** Max characters per line at reduced (10px) font */
const REDUCED_LINE_MAX = 19;
/** Horizontal start for text (after icon) */
const TEXT_X = 42;

interface NodeCardProps {
  node: GraphNode;
  config: NodeTypeConfig;
  isSelected: boolean;
  isConnectSource: boolean;
  isDark: boolean;
  mode: InteractionMode;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onClick: (e: React.MouseEvent, nodeId: string) => void;
}

interface NameLayout {
  lines: string[];
  fontSize: number;
  lineHeight: number;
  startY: number;
}

/**
 * Compute how to display the node name:
 * - Short names: single line, normal font
 * - Medium names: 2 lines, smaller font
 * - Long names: 2 lines, smallest font, truncated
 */
function computeNameLayout(name: string): NameLayout {
  if (name.length <= SINGLE_LINE_MAX) {
    return { lines: [name], fontSize: 12, lineHeight: 0, startY: 28 };
  }

  /* Find a good break point near the middle */
  const fontSize = name.length <= 30 ? 10 : 9;
  const maxPerLine = fontSize === 10 ? REDUCED_LINE_MAX : REDUCED_LINE_MAX + 3;

  let breakIdx = -1;
  const mid = Math.ceil(name.length / 2);

  /* Prefer breaking at hyphen, space, dot, or underscore near the middle */
  for (let delta = 0; delta < mid; delta++) {
    for (const offset of [mid + delta, mid - delta]) {
      if (offset > 0 && offset < name.length) {
        const ch = name[offset];
        if (ch === '-' || ch === ' ' || ch === '.' || ch === '_') {
          breakIdx = offset;
          break;
        }
      }
    }
    if (breakIdx !== -1) break;
  }

  /* If no natural break found, split at maxPerLine */
  if (breakIdx === -1) breakIdx = maxPerLine;

  let line1 = name.slice(0, breakIdx + 1).trim();
  let line2 = name.slice(breakIdx + 1).trim();

  /* Truncate lines if still too long */
  if (line1.length > maxPerLine) {
    line1 = line1.slice(0, maxPerLine - 1) + '…';
  }
  if (line2.length > maxPerLine) {
    line2 = line2.slice(0, maxPerLine - 1) + '…';
  }

  const lines = line2 ? [line1, line2] : [line1];
  return {
    lines,
    fontSize,
    lineHeight: fontSize + 2,
    startY: lines.length === 2 ? 22 : 26,
  };
}

export function NodeCard({
  node,
  config,
  isSelected,
  isConnectSource,
  isDark,
  mode,
  onMouseDown,
  onClick,
}: NodeCardProps) {
  const bg = isDark ? config.bgDark : config.bgLight;
  const border = isDark ? config.borderDark : config.borderLight;
  const highlighted = isSelected || isConnectSource;
  const strokeColor = highlighted ? config.color : border + '60';

  const nameLayout = useMemo(() => computeNameLayout(node.name), [node.name]);

  /* Type label Y: push down if name has 2 lines */
  const typeLabelY = nameLayout.lines.length === 2
    ? nameLayout.startY + nameLayout.lineHeight + 8
    : 44;

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onMouseDown={e => onMouseDown(e, node.id)}
      onClick={e => onClick(e, node.id)}
      style={{ cursor: mode === 'connect' ? 'pointer' : 'grab', userSelect: 'none' }}
    >
      {/* Selection / connect-source glow */}
      {highlighted && (
        <rect
          x={-3}
          y={-3}
          width={NODE_W + 6}
          height={NODE_H + 6}
          rx={11}
          ry={11}
          fill="none"
          stroke={isConnectSource ? '#f97316' : config.color}
          strokeWidth={2}
          opacity={0.5}
          style={{ filter: `drop-shadow(0 0 8px ${isConnectSource ? '#f97316' : config.color})` }}
        />
      )}

      {/* Card background */}
      <rect
        className="node-rect"
        width={NODE_W}
        height={NODE_H}
        rx={8}
        ry={8}
        fill={bg}
        stroke={strokeColor}
        strokeWidth={isSelected ? 1.5 : 1}
        strokeDasharray={config.dashed ? '6,3' : undefined}
      />

      {/* Top accent bars */}
      <rect width={NODE_W} height={3} fill={config.color} opacity={0.7} />
      <rect width={40} height={3} fill={config.color} />

      {/* Icon */}
      <text x={16} y={36} fontSize={18} dominantBaseline="middle">
        {config.icon}
      </text>

      {/* Service name (auto-wrapped) */}
      {nameLayout.lines.map((line, i) => (
        <text
          key={i}
          x={TEXT_X}
          y={nameLayout.startY + i * nameLayout.lineHeight}
          fill={config.color}
          fontSize={nameLayout.fontSize}
          fontWeight={500}
          fontFamily="inherit"
        >
          {line}
        </text>
      ))}

      {/* Type label */}
      <text
        x={TEXT_X}
        y={typeLabelY}
        fill={config.color + '80'}
        fontSize={9}
        fontFamily="inherit"
        letterSpacing="0.06em"
      >
        {config.label.toUpperCase()}
      </text>
    </g>
  );
}
