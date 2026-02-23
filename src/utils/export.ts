/**
 * @file Export utilities for the Service Map Editor.
 *
 * Supports three export formats:
 *   - Mermaid (.md) — generates a graph LR diagram with subgraphs for namespaces.
 *   - JSON schema-export — full graph state with positions and metadata.
 *   - PDF — placeholder for Part 2 implementation.
 *
 * All functions are pure and take graph data as arguments.
 */

import type { GraphNode, GraphEdge } from '../types';
import { NODE_TYPES } from '../constants/nodeTypes';

/**
 * Generate a Mermaid diagram string from the current graph state.
 * Namespaces are wrapped in `subgraph` blocks.
 *
 * @param nodes - Array of graph nodes.
 * @param edges - Array of graph edges.
 * @returns A Mermaid-formatted string ready for .md export.
 */
export function toMermaid(nodes: GraphNode[], edges: GraphEdge[]): string {
  const lines: string[] = ['graph LR'];

  /* Group nodes by namespace */
  const namespaces = new Map<string, GraphNode[]>();
  const ungrouped: GraphNode[] = [];

  for (const node of nodes) {
    if (node.namespace) {
      if (!namespaces.has(node.namespace)) namespaces.set(node.namespace, []);
      namespaces.get(node.namespace)!.push(node);
    } else {
      ungrouped.push(node);
    }
  }

  /* Render subgraphs for each namespace */
  for (const [ns, nsNodes] of namespaces) {
    lines.push(`  subgraph ${ns}`);
    for (const n of nsNodes) {
      const typeLabel = NODE_TYPES[n.type]?.label ?? n.type;
      lines.push(`    ${n.id}["${n.name}<br/><small>${typeLabel}</small>"]`);
    }
    lines.push('  end');
  }

  /* Render ungrouped nodes */
  for (const n of ungrouped) {
    const typeLabel = NODE_TYPES[n.type]?.label ?? n.type;
    lines.push(`  ${n.id}["${n.name}<br/><small>${typeLabel}</small>"]`);
  }

  /* Render edges */
  for (const e of edges) {
    const label = e.type || e.label;
    if (label) {
      lines.push(`  ${e.source} -->|${label}| ${e.target}`);
    } else {
      lines.push(`  ${e.source} --> ${e.target}`);
    }
  }

  return lines.join('\n');
}

/**
 * Schema-export format — full JSON snapshot of the graph with positions.
 * Can be re-imported to restore the exact canvas state.
 *
 * @param nodes - Array of graph nodes.
 * @param edges - Array of graph edges.
 * @returns A JSON string in schema-export format.
 */
export function toSchemaExport(nodes: GraphNode[], edges: GraphEdge[]): string {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    nodes: nodes.map(n => ({
      id: n.id,
      name: n.name,
      type: n.type,
      namespace: n.namespace ?? null,
      x: n.x,
      y: n.y,
    })),
    edges: edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type ?? null,
      label: e.label ?? null,
    })),
  };
  return JSON.stringify(data, null, 2);
}
