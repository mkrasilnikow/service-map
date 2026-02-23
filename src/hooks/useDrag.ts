/**
 * @file Drag-and-drop hook for moving nodes and edge control points on the SVG canvas.
 *
 * Tracks mouse events to compute position deltas and update
 * the dragged element's coordinates in real time.
 * Supports viewport transforms (zoom/pan) via a screenToSvg converter.
 *
 * @param nodes - Current list of graph nodes.
 * @param edges - Current list of graph edges (for edge control dragging).
 * @param updateNode - Function to patch a node's properties by ID.
 * @param updateEdge - Function to patch an edge's properties by ID.
 * @param screenToSvg - Converts screen coordinates to SVG coordinates.
 */

import { useRef, useCallback } from 'react';
import type { DragState, GraphNode, GraphEdge } from '../types';

/** State for dragging an edge control point */
interface EdgeDragState {
  edgeId: string;
  startX: number;
  startY: number;
  origOffsetX: number;
  origOffsetY: number;
}

/**
 * Hook that provides mouse event handlers for dragging nodes and edge control points.
 *
 * @param nodes - Current list of graph nodes (used to read original position).
 * @param edges - Current list of graph edges (used to read original control offset).
 * @param updateNode - Callback to update a node's x/y.
 * @param updateEdge - Callback to update an edge's controlOffsetX/Y.
 * @param screenToSvg - Converts (clientX, clientY) to SVG-space coordinates.
 * @returns Object with handlers for node drag, edge control drag, and shared move/up.
 */
export function useDrag(
  nodes: GraphNode[],
  edges: GraphEdge[],
  updateNode: (id: string, patch: Partial<GraphNode>) => void,
  updateEdge: (id: string, patch: Partial<GraphEdge>) => void,
  screenToSvg: (clientX: number, clientY: number) => { x: number; y: number },
) {
  const nodeDragRef = useRef<DragState | null>(null);
  const edgeDragRef = useRef<EdgeDragState | null>(null);

  /**
   * Start dragging a node.
   * Records the initial SVG position and the node's original coordinates.
   */
  const onNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      const { x, y } = screenToSvg(e.clientX, e.clientY);
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
    [nodes, screenToSvg],
  );

  /**
   * Start dragging an edge control point.
   * Records the initial SVG position and the edge's original offset.
   */
  const onEdgeControlMouseDown = useCallback(
    (e: React.MouseEvent, edgeId: string) => {
      e.stopPropagation();
      const { x, y } = screenToSvg(e.clientX, e.clientY);
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
    [edges, screenToSvg],
  );

  /** Update the dragged element based on current mouse position */
  const onSvgMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (nodeDragRef.current) {
        const { x, y } = screenToSvg(e.clientX, e.clientY);
        const dx = x - nodeDragRef.current.startX;
        const dy = y - nodeDragRef.current.startY;
        updateNode(nodeDragRef.current.nodeId, {
          x: nodeDragRef.current.origX + dx,
          y: nodeDragRef.current.origY + dy,
        });
      } else if (edgeDragRef.current) {
        const { x, y } = screenToSvg(e.clientX, e.clientY);
        const dx = x - edgeDragRef.current.startX;
        const dy = y - edgeDragRef.current.startY;
        updateEdge(edgeDragRef.current.edgeId, {
          controlOffsetX: edgeDragRef.current.origOffsetX + dx,
          controlOffsetY: edgeDragRef.current.origOffsetY + dy,
        });
      }
    },
    [screenToSvg, updateNode, updateEdge],
  );

  /** End any active drag operation */
  const onSvgMouseUp = useCallback(() => {
    nodeDragRef.current = null;
    edgeDragRef.current = null;
  }, []);

  return { onNodeMouseDown, onEdgeControlMouseDown, onSvgMouseMove, onSvgMouseUp };
}
