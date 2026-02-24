/**
 * @file NodeCard component — renders a single service node on the SVG canvas.
 *
 * Displays:
 *   - A colored card with top accent bar
 *   - An icon and the service name (single line, truncated if long)
 *   - A type label (e.g. "SPRING BOOT")
 *   - Selection glow / connect-mode highlight
 */

import type { GraphNode, InteractionMode, NodeTypeConfig } from '../../types';
import { NODE_W, NODE_H } from '../../constants/nodeTypes';

/** Max characters before truncation */
const MAX_NAME_LEN = 18;

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

  const displayName =
    node.name.length > MAX_NAME_LEN
      ? node.name.slice(0, MAX_NAME_LEN - 1) + '\u2026'
      : node.name;

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

      {/* Service name (single line, truncated) */}
      <text
        x={42}
        y={28}
        fill={config.color}
        fontSize={12}
        fontWeight={500}
        fontFamily="inherit"
      >
        {displayName}
      </text>

      {/* Type label */}
      <text
        x={42}
        y={44}
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
