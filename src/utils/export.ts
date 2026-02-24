/**
 * @file Export utilities for the Service Map Editor.
 *
 * Formats:
 *   - Mermaid (.md) — graph LR diagram with namespace subgraphs.
 *   - JSON (RF native) — full React Flow snapshot (nodes, edges, viewport).
 *   - PNG image — rasterised snapshot via html-to-image.
 */

import { toPng } from 'html-to-image';
import type { GraphNode, GraphEdge } from '../types';
import { NODE_TYPES } from '../constants/nodeTypes';

/**
 * Generate a Mermaid diagram string.
 * Namespaces are wrapped in `subgraph` blocks.
 */
export function toMermaid(nodes: GraphNode[], edges: GraphEdge[]): string {
  const lines: string[] = ['graph LR'];

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

  for (const [ns, nsNodes] of namespaces) {
    lines.push(`  subgraph ${ns}`);
    for (const n of nsNodes) {
      const typeLabel = NODE_TYPES[n.type]?.label ?? n.type;
      lines.push(`    ${n.id}["${n.name}<br/><small>${typeLabel}</small>"]`);
    }
    lines.push('  end');
  }

  for (const n of ungrouped) {
    const typeLabel = NODE_TYPES[n.type]?.label ?? n.type;
    lines.push(`  ${n.id}["${n.name}<br/><small>${typeLabel}</small>"]`);
  }

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
 * Download a Mermaid diagram as a .md file.
 */
export function downloadMermaid(content: string): void {
  const wrapped = '```mermaid\n' + content + '\n```\n';
  const blob = new Blob([wrapped], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'service-map.md';
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download a JSON string as a .json file.
 */
export function downloadJson(content: string, filename = 'service-map.json'): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download a PNG snapshot of the React Flow canvas.
 *
 * Captures the `.react-flow` container, filtering out UI panels
 * (controls, minimap) so only the diagram is exported.
 *
 * @param isDark - Current theme, used for background fill.
 */
export async function downloadImage(isDark: boolean): Promise<void> {
  const rfEl = document.querySelector('.react-flow') as HTMLElement | null;
  if (!rfEl) return;

  const dataUrl = await toPng(rfEl, {
    backgroundColor: isDark ? '#060b14' : '#f8fafc',
    filter: node => {
      if (!(node instanceof Element)) return true;
      // Exclude control overlays from the exported image
      if (node.classList.contains('react-flow__panel')) return false;
      if (node.classList.contains('react-flow__minimap')) return false;
      if (node.classList.contains('react-flow__controls')) return false;
      return true;
    },
  });

  const a = document.createElement('a');
  a.download = 'service-map.png';
  a.href = dataUrl;
  a.click();
}
