/**
 * @file Drag-and-drop hook for moving nodes, edge control points, and resizing nodes.
 *
 * Tracks mouse events to compute position deltas and update
 * the dragged element's coordinates in real time.
 * Supports canvas transforms (zoom/pan) via a screenToCanvas converter.
 */

import { useRef, useCallback } from 'react';
import type { DragState, GraphNode, GraphEdge } from '../types';
import { NODE_W, NODE_H } from '../constants/nodeTypes';

/** State for dragging an edge control point */
interface EdgeDragState {
  edgeId: string;
  startX: number;
  startY: number;
  origOffsetX: number;
  origOffsetY: number;
}

/** State for resizing a node */
interface ResizeDragState {
  nodeId: string;
  startX: number;
  startY: number;
  origW: number;
  origH: number;
}

const MIN_W = 120;
const MIN_H = 48;
const MAX_W = 400;
const MAX_H = 200;

/**
 * Hook that provides mouse event handlers for dragging nodes, edge control points, and resizing nodes.
 */
export function useDrag(
  nodes: GraphNode[],
  edges: GraphEdge[],
  updateNode: (id: string, patch: Partial<GraphNode>) => void,
  updateEdge: (id: string, patch: Partial<GraphEdge>) => void,
  screenToCanvas: (clientX: number, clientY: number) => { x: number; y: number },
) {
  const nodeDragRef = useRef<DragState | null>(null);
  const edgeDragRef = useRef<EdgeDragState | null>(null);
  const resizeDragRef = useRef<ResizeDragState | null>(null);

  /** Start dragging a node */
  const onNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      nodeDragRef.current = {
        nodeId,
        startX: x,
        startY: y,
        origX: node.x,
        origY: node.y,
      };
    },
    [nodes, screenToCanvas],
  );

  /** Start dragging an edge control point */
  const onEdgeControlMouseDown = useCallback(
    (e: React.MouseEvent, edgeId: string) => {
      e.stopPropagation();
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const edge = edges.find(ed => ed.id === edgeId);
      if (!edge) return;
      edgeDragRef.current = {
        edgeId,
        startX: x,
        startY: y,
        origOffsetX: edge.controlOffsetX ?? 0,
        origOffsetY: edge.controlOffsetY ?? 0,
      };
    },
    [edges, screenToCanvas],
  );

  /** Start resizing a node */
  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      resizeDragRef.current = {
        nodeId,
        startX: x,
        startY: y,
        origW: node.width ?? NODE_W,
        origH: node.height ?? NODE_H,
      };
    },
    [nodes, screenToCanvas],
  );

  /** Update the dragged element based on current mouse position */
  const onSvgMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (nodeDragRef.current) {
        const { x, y } = screenToCanvas(e.clientX, e.clientY);
        const dx = x - nodeDragRef.current.startX;
        const dy = y - nodeDragRef.current.startY;
        updateNode(nodeDragRef.current.nodeId, {
          x: nodeDragRef.current.origX + dx,
          y: nodeDragRef.current.origY + dy,
        });
      } else if (resizeDragRef.current) {
        const { x, y } = screenToCanvas(e.clientX, e.clientY);
        const dx = x - resizeDragRef.current.startX;
        const dy = y - resizeDragRef.current.startY;
        const newW = Math.min(MAX_W, Math.max(MIN_W, resizeDragRef.current.origW + dx));
        const newH = Math.min(MAX_H, Math.max(MIN_H, resizeDragRef.current.origH + dy));
        updateNode(resizeDragRef.current.nodeId, { width: newW, height: newH });
      } else if (edgeDragRef.current) {
        const { x, y } = screenToCanvas(e.clientX, e.clientY);
        const dx = x - edgeDragRef.current.startX;
        const dy = y - edgeDragRef.current.startY;
        updateEdge(edgeDragRef.current.edgeId, {
          controlOffsetX: edgeDragRef.current.origOffsetX + dx,
          controlOffsetY: edgeDragRef.current.origOffsetY + dy,
        });
      }
    },
    [screenToCanvas, updateNode, updateEdge],
  );

  /** End any active drag operation */
  const onSvgMouseUp = useCallback(() => {
    nodeDragRef.current = null;
    edgeDragRef.current = null;
    resizeDragRef.current = null;
  }, []);

  /** Whether a drag operation is active */
  const isDragging = useCallback(
    () => nodeDragRef.current !== null || edgeDragRef.current !== null || resizeDragRef.current !== null,
    [],
  );

  return { onNodeMouseDown, onEdgeControlMouseDown, onResizeMouseDown, onSvgMouseMove, onSvgMouseUp, isDragging };
}
