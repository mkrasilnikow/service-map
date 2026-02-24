/**
 * @file Canvas component — the main SVG drawing area.
 *
 * Renders all nodes and edges on an SVG element with:
 *   - Dot-grid background pattern
 *   - Pan & zoom via <g transform="translate(panX, panY) scale(zoom)">
 *   - Arrow markers for edge endpoints
 *   - Namespace group rectangles (dashed outlines with labels)
 *   - Mouse event handlers for drag and click
 *   - Connect-mode visual indicator (pulsing circle)
 */

import { useMemo } from 'react';
import type { GraphNode, GraphEdge, Selection, InteractionMode } from '../../types';
import { NODE_TYPES, getNodeSize } from '../../constants/nodeTypes';
import { NodeCard } from '../NodeCard';
import { EdgeLine } from '../EdgeLine';

/** Padding around namespace group rectangles */
const NS_PADDING = 20;
/** Space reserved for the namespace label above the group */
const NS_LABEL_HEIGHT = 20;

interface CanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selected: Selection | null;
  mode: InteractionMode;
  connectFrom: string | null;
  isDark: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  panX: number;
  panY: number;
  zoom: number;
  isPanLocked: boolean;
  onNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onNodeClick: (e: React.MouseEvent, nodeId: string) => void;
  onEdgeClick: (e: React.MouseEvent, edgeId: string) => void;
  onEdgeControlDragStart: (e: React.MouseEvent, edgeId: string) => void;
  onResizeStart: (e: React.MouseEvent, nodeId: string) => void;
  onSvgMouseMove: (e: React.MouseEvent) => void;
  onSvgMouseUp: () => void;
  onSvgMouseDown: (e: React.MouseEvent) => void;
  onSvgClick: () => void;
}

/** Computed bounding box for a namespace group */
interface NamespaceGroup {
  namespace: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Get the center coordinates of a node */
function getNodeCenter(nodes: GraphNode[], nodeId: string): { x: number; y: number } {
  const n = nodes.find(nd => nd.id === nodeId);
  if (!n) return { x: 0, y: 0 };
  const { w, h } = getNodeSize(n);
  return { x: n.x + w / 2, y: n.y + h / 2 };
}

/**
 * Compute bounding rectangles for each namespace group.
 */
function computeNamespaceGroups(nodes: GraphNode[]): NamespaceGroup[] {
  const groups = new Map<string, GraphNode[]>();

  for (const node of nodes) {
    if (node.namespace) {
      if (!groups.has(node.namespace)) groups.set(node.namespace, []);
      groups.get(node.namespace)!.push(node);
    }
  }

  const result: NamespaceGroup[] = [];

  for (const [namespace, nsNodes] of groups) {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const n of nsNodes) {
      const { w, h } = getNodeSize(n);
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + w);
      maxY = Math.max(maxY, n.y + h);
    }

    result.push({
      namespace,
      x: minX - NS_PADDING,
      y: minY - NS_PADDING - NS_LABEL_HEIGHT,
      width: maxX - minX + NS_PADDING * 2,
      height: maxY - minY + NS_PADDING * 2 + NS_LABEL_HEIGHT,
    });
  }

  return result;
}

export function Canvas({
  nodes,
  edges,
  selected,
  mode,
  connectFrom,
  isDark,
  svgRef,
  panX,
  panY,
  zoom,
  isPanLocked,
  onNodeMouseDown,
  onNodeClick,
  onEdgeClick,
  onEdgeControlDragStart,
  onResizeStart,
  onSvgMouseMove,
  onSvgMouseUp,
  onSvgMouseDown,
  onSvgClick,
}: CanvasProps) {
  const arrowFill = isDark ? '#334155' : '#94a3b8';
  const nsGroups = useMemo(() => computeNamespaceGroups(nodes), [nodes]);
  const dotColor = isDark ? '#1e3a5f' : '#cbd5e1';

  const cursor = mode === 'connect'
    ? (connectFrom ? 'crosshair' : 'copy')
    : isPanLocked ? 'default' : 'grab';

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      style={{ flex: 1, cursor }}
      onMouseMove={onSvgMouseMove}
      onMouseUp={onSvgMouseUp}
      onMouseLeave={onSvgMouseUp}
      onMouseDown={onSvgMouseDown}
      onClick={onSvgClick}
      onContextMenu={e => e.preventDefault()}
    >
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={arrowFill} />
        </marker>
        <marker
          id="arrow-selected"
          markerWidth="8"
          markerHeight="8"
          refX="8"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L8,3 z" fill="#60a5fa" />
        </marker>
        <pattern id="dot-grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="14" cy="14" r="1" fill={dotColor} opacity="0.15" />
        </pattern>
      </defs>

      {/* Transform group: all canvas content lives here */}
      <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
        {/* Background grid */}
        <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#dot-grid)" />

        {/* Namespace group rectangles */}
        {nsGroups.map(group => (
          <g key={`ns-${group.namespace}`}>
            <rect
              x={group.x}
              y={group.y}
              width={group.width}
              height={group.height}
              rx={8}
              ry={8}
              fill="none"
              stroke={isDark ? '#1e3a5f' : '#94a3b8'}
              strokeWidth={1}
              strokeDasharray="6,4"
              opacity={0.6}
            />
            <text
              x={group.x + 8}
              y={group.y + 14}
              fill={isDark ? '#475569' : '#64748b'}
              fontSize={11}
              fontFamily="inherit"
              letterSpacing="0.06em"
              fontWeight={500}
            >
              {group.namespace}
            </text>
          </g>
        ))}

        {/* Edges */}
        {edges.map(edge => {
          const sourceCenter = getNodeCenter(nodes, edge.source);
          const targetCenter = getNodeCenter(nodes, edge.target);
          return (
            <EdgeLine
              key={edge.id}
              edge={edge}
              sourceCenter={sourceCenter}
              targetCenter={targetCenter}
              isSelected={selected?.id === edge.id}
              isDark={isDark}
              onClick={onEdgeClick}
              onControlDragStart={onEdgeControlDragStart}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const config = NODE_TYPES[node.type];
          return (
            <NodeCard
              key={node.id}
              node={node}
              config={config}
              isSelected={selected?.id === node.id}
              isConnectSource={connectFrom === node.id}
              isDark={isDark}
              mode={mode}
              onMouseDown={onNodeMouseDown}
              onClick={onNodeClick}
              onResizeStart={onResizeStart}
            />
          );
        })}

        {/* Connect mode: pulsing circle on source node */}
        {connectFrom &&
          (() => {
            const cn = getNodeCenter(nodes, connectFrom);
            return (
              <circle
                cx={cn.x}
                cy={cn.y}
                r={10}
                fill="none"
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="4,3"
                opacity={0.8}
              />
            );
          })()}
      </g>
    </svg>
  );
}
