/**
 * @file Drag-and-drop hook for moving nodes on the SVG canvas.
 *
 * Tracks mouse events to compute position deltas and update
 * the dragged node's coordinates in real time.
 *
 * @param updateNode - Function to patch a node's properties by ID.
 */

import { useRef, useCallback } from 'react';
import type { DragState, GraphNode } from '../types';

/**
 * Hook that provides mouse event handlers for dragging nodes.
 *
 * @param nodes - Current list of graph nodes (used to read original position).
 * @param updateNode - Callback to update a node's x/y.
 * @param svgRef - Ref to the SVG element for coordinate conversion.
 * @returns Object with onNodeMouseDown, onSvgMouseMove, onSvgMouseUp handlers.
 */
export function useDrag(
  nodes: GraphNode[],
  updateNode: (id: string, patch: Partial<GraphNode>) => void,
  svgRef: React.RefObject<SVGSVGElement | null>,
) {
  const dragRef = useRef<DragState | null>(null);

  /** Convert a browser MouseEvent to SVG-local coordinates */
  const svgCoords = useCallback(
    (e: React.MouseEvent): { x: number; y: number } => {
      const rect = svgRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    [svgRef],
  );

  /**
   * Start dragging a node.
   * Records the initial mouse position and the node's original coordinates.
   */
  const onNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      const { x, y } = svgCoords(e);
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      dragRef.current = {
        nodeId,
        startX: x,
        startY: y,
        origX: node.x,
        origY: node.y,
      };
    },
    [nodes, svgCoords],
  );

  /** Update the node position based on current mouse offset from drag start */
  const onSvgMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragRef.current) return;
      const { x, y } = svgCoords(e);
      const dx = x - dragRef.current.startX;
      const dy = y - dragRef.current.startY;
      updateNode(dragRef.current.nodeId, {
        x: dragRef.current.origX + dx,
        y: dragRef.current.origY + dy,
      });
    },
    [svgCoords, updateNode],
  );

  /** End the current drag operation */
  const onSvgMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  return { onNodeMouseDown, onSvgMouseMove, onSvgMouseUp };
}
