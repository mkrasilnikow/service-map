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

  // Assign remaining nodes that might be in cycles or disconnected
  for (const node of nodes) {
    if (!depth.has(node.id)) {
      depth.set(node.id, 0);
      queue.push(node.id);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    const currentDepth = depth.get(current)!;
    for (const target of outgoing.get(current) ?? []) {
      const existingDepth = depth.get(target) ?? -1;
      if (currentDepth + 1 > existingDepth) {
        depth.set(target, currentDepth + 1);
        queue.push(target);
      }
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

  for (const colIdx of sortedCols) {
    const colNodes = columns.get(colIdx)!;
    const x = 60 + colIdx * (NODE_W + COL_GAP);

    for (let row = 0; row < colNodes.length; row++) {
      const y = 60 + row * (NODE_H + ROW_GAP);
      result.push({ ...colNodes[row], x, y });
    }
  }

  return result;
}
