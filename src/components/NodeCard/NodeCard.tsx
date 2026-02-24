/**
 * @file NodeCard component — renders a single service node on the SVG canvas.
 *
 * Displays:
 *   - A colored card with top accent bar
 *   - An icon and the service name (single line, truncated if long)
 *   - A type label (e.g. "SPRING BOOT")
 *   - Selection glow / connect-mode highlight
 *   - Resize handle at bottom-right (visible when selected)
 */

import type { GraphNode, InteractionMode, NodeTypeConfig } from '../../types';
import { NODE_W, NODE_H } from '../../constants/nodeTypes';

interface NodeCardProps {
  node: GraphNode;
  config: NodeTypeConfig;
  isSelected: boolean;
  isConnectSource: boolean;
  isDark: boolean;
  mode: InteractionMode;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onClick: (e: React.MouseEvent, nodeId: string) => void;
  onResizeStart?: (e: React.MouseEvent, nodeId: string) => void;
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
  onResizeStart,
}: NodeCardProps) {
  const nodeW = node.width ?? NODE_W;
  const nodeH = node.height ?? NODE_H;

  const bg = isDark ? config.bgDark : config.bgLight;
  const border = isDark ? config.borderDark : config.borderLight;
  const highlighted = isSelected || isConnectSource;
  const strokeColor = highlighted ? config.color : border + '60';

  const maxNameLen = Math.floor((nodeW - 46) / 7);
  const displayName =
    node.name.length > maxNameLen
      ? node.name.slice(0, maxNameLen - 1) + '\u2026'
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
          width={nodeW + 6}
          height={nodeH + 6}
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
        width={nodeW}
        height={nodeH}
        rx={8}
        ry={8}
        fill={bg}
        stroke={strokeColor}
        strokeWidth={isSelected ? 1.5 : 1}
        strokeDasharray={config.dashed ? '6,3' : undefined}
      />

      {/* Top accent bars */}
      <rect width={nodeW} height={3} fill={config.color} opacity={0.7} />
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

      {/* Resize handle — visible only when selected */}
      {isSelected && onResizeStart && (
        <g
          onMouseDown={e => {
            e.stopPropagation();
            onResizeStart(e, node.id);
          }}
          style={{ cursor: 'nwse-resize' }}
        >
          <rect
            x={nodeW - 14}
            y={nodeH - 14}
            width={14}
            height={14}
            fill="transparent"
          />
          <path
            d={`M${nodeW - 3} ${nodeH - 10} L${nodeW - 3} ${nodeH - 3} L${nodeW - 10} ${nodeH - 3}`}
            fill="none"
            stroke={config.color}
            strokeWidth={1.5}
            opacity={0.6}
          />
          <path
            d={`M${nodeW - 3} ${nodeH - 6} L${nodeW - 3} ${nodeH - 3} L${nodeW - 6} ${nodeH - 3}`}
            fill="none"
            stroke={config.color}
            strokeWidth={1.5}
            opacity={0.8}
          />
        </g>
      )}
    </g>
  );
}
