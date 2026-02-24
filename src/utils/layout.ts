/**
 * @file Auto-layout algorithm for positioning nodes on the canvas.
 *
 * Uses a left-to-right (LR) layered layout:
 *   1. Computes dependency depth for each node via BFS from sources.
 *   2. Assigns nodes to columns based on their depth.
 *   3. Groups nodes within each column by namespace.
 *   4. Spaces nodes vertically with a minimum gap to prevent overlap.
 *
 * Exported function: computeLayout
 */

import type { GraphNode, GraphEdge } from '../types';
import { NODE_W, NODE_H } from '../constants/nodeTypes';

function getNodeSize(node: GraphNode): { w: number; h: number } {
  return { w: node.width ?? NODE_W, h: node.height ?? NODE_H };
}

/** Minimum horizontal gap between columns */
const COL_GAP = 80;
/** Minimum vertical gap between nodes */
const ROW_GAP = 40;

/**
 * Compute auto-layout positions for a set of nodes based on their edges.
 *
 * Algorithm:
 *   1. Build an adjacency list from edges.
 *   2. Identify source nodes (no incoming edges).
 *   3. BFS to assign each node a "depth" (column index).
 *   4. Sort nodes within each column by namespace for visual grouping.
 *   5. Assign x/y coordinates with spacing to prevent overlaps.
 *
 * @param nodes - Array of graph nodes (positions will be overwritten).
 * @param edges - Array of graph edges defining dependencies.
 * @returns New array of nodes with updated x/y positions.
 */
export function computeLayout(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
  if (nodes.length === 0) return [];

  /* Step 1: Build adjacency structures */
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const node of nodes) {
    outgoing.set(node.id, []);
    incoming.set(node.id, []);
  }
  for (const edge of edges) {
    outgoing.get(edge.source)?.push(edge.target);
    incoming.get(edge.target)?.push(edge.source);
  }

  /* Step 2: Identify source nodes (no incoming edges) */
  const sources = nodes.filter(n => (incoming.get(n.id) ?? []).length === 0);

  /* Step 3: BFS to assign depth (column index) */
  const depth = new Map<string, number>();
  const queue: string[] = [];

  for (const src of sources) {
    depth.set(src.id, 0);
    queue.push(src.id);
  }

  // Each node is enqueued at most once — safe for graphs with cycles
  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    const currentDepth = depth.get(current)!;
    for (const target of outgoing.get(current) ?? []) {
      if (!depth.has(target)) {
        depth.set(target, currentDepth + 1);
        queue.push(target);
      }
    }
  }

  // Assign depth 0 to disconnected nodes or cycle-only components
  for (const node of nodes) {
    if (!depth.has(node.id)) {
      depth.set(node.id, 0);
    }
  }

  /* Step 4: Group by column, sort by namespace within each column */
  const columns = new Map<number, GraphNode[]>();
  for (const node of nodes) {
    const col = depth.get(node.id) ?? 0;
    if (!columns.has(col)) columns.set(col, []);
    columns.get(col)!.push(node);
  }

  for (const col of columns.values()) {
    col.sort((a, b) => (a.namespace ?? '').localeCompare(b.namespace ?? ''));
  }

  /* Step 5: Assign x/y coordinates */
  const sortedCols = [...columns.keys()].sort((a, b) => a - b);
  const result: GraphNode[] = [];

  /* Compute max width for each column to determine x offsets */
  let xOffset = 60;
  for (const colIdx of sortedCols) {
    const colNodes = columns.get(colIdx)!;
    const maxColW = colNodes.reduce((max, n) => Math.max(max, getNodeSize(n).w), NODE_W);

    let yOffset = 60;
    for (let row = 0; row < colNodes.length; row++) {
      const { h } = getNodeSize(colNodes[row]);
      result.push({ ...colNodes[row], x: xOffset, y: yOffset });
      yOffset += h + ROW_GAP;
    }
    xOffset += maxColW + COL_GAP;
  }

  return result;
}
