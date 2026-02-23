/**
 * @file Canvas component — the main SVG drawing area.
 *
 * Renders all nodes and edges on an SVG element with:
 *   - Dot-grid background pattern (via SVG pattern, scales with zoom)
 *   - Pan & zoom via viewBox
 *   - Arrow markers for edge endpoints
 *   - Namespace group rectangles (dashed outlines with labels)
 *   - Mouse event handlers for drag, click, pan, and zoom
 *   - Connect-mode visual indicator (pulsing circle)
 *
 * @param props.nodes - Array of all graph nodes.
 * @param props.edges - Array of all graph edges.
 * @param props.selected - Currently selected element (or null).
 * @param props.mode - Current interaction mode.
 * @param props.connectFrom - Source node ID in connect mode (or null).
 * @param props.isDark - Whether dark theme is active.
 * @param props.svgRef - Ref to the SVG element.
 * @param props.viewBox - The viewBox string for pan/zoom.
 * @param props.onNodeMouseDown - Handler for starting a drag on a node.
 * @param props.onNodeClick - Handler for clicking a node.
 * @param props.onEdgeClick - Handler for clicking an edge.
 * @param props.onEdgeControlDragStart - Handler for starting to drag an edge control point.
 * @param props.onSvgMouseMove - Handler for mouse move (drag/pan tracking).
 * @param props.onSvgMouseUp - Handler for mouse up (end drag/pan).
 * @param props.onSvgMouseDown - Handler for mouse down on canvas (pan start).
 * @param props.onSvgClick - Handler for clicking empty canvas area.
 * @param props.onWheel - Handler for mouse wheel (zoom).
 */

import { useMemo } from 'react';
import type { GraphNode, GraphEdge, Selection, InteractionMode } from '../../types';
import { NODE_TYPES, NODE_W, NODE_H } from '../../constants/nodeTypes';
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
  viewBox: string;
  onNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onNodeClick: (e: React.MouseEvent, nodeId: string) => void;
  onEdgeClick: (e: React.MouseEvent, edgeId: string) => void;
  onEdgeControlDragStart: (e: React.MouseEvent, edgeId: string) => void;
  onSvgMouseMove: (e: React.MouseEvent) => void;
  onSvgMouseUp: () => void;
  onSvgMouseDown: (e: React.MouseEvent) => void;
  onSvgClick: () => void;
  onWheel: (e: React.WheelEvent) => void;
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
  return { x: n.x + NODE_W / 2, y: n.y + NODE_H / 2 };
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
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + NODE_W);
      maxY = Math.max(maxY, n.y + NODE_H);
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
  viewBox,
  onNodeMouseDown,
  onNodeClick,
  onEdgeClick,
  onEdgeControlDragStart,
  onSvgMouseMove,
  onSvgMouseUp,
  onSvgMouseDown,
  onSvgClick,
  onWheel,
}: CanvasProps) {
  const arrowFill = isDark ? '#334155' : '#94a3b8';
  const nsGroups = useMemo(() => computeNamespaceGroups(nodes), [nodes]);
  const dotColor = isDark ? '#1e3a5f' : '#cbd5e1';

  return (
    <svg
      ref={svgRef}
      viewBox={viewBox}
      preserveAspectRatio="xMinYMin meet"
      style={{
        flex: 1,
        cursor: mode === 'connect' ? (connectFrom ? 'crosshair' : 'copy') : 'default',
      }}
      onMouseMove={onSvgMouseMove}
      onMouseUp={() => {
        onSvgMouseUp();
      }}
      onMouseLeave={onSvgMouseUp}
      onMouseDown={onSvgMouseDown}
      onClick={onSvgClick}
      onWheel={onWheel}
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
        {/* Dot-grid pattern that scales with viewBox */}
        <pattern id="dot-grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="14" cy="14" r="1" fill={dotColor} opacity="0.15" />
        </pattern>
      </defs>

      {/* Background grid */}
      <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#dot-grid)" />

      {/* Namespace group rectangles (rendered below everything) */}
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

      {/* Edges (rendered below nodes) */}
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
    </svg>
  );
}
