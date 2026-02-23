/**
 * @file Export utilities for the Service Map Editor.
 *
 * Supports three export formats:
 *   - Mermaid (.md) — generates a graph LR diagram with subgraphs for namespaces.
 *   - JSON schema-export — full graph state with positions and metadata.
 *   - PDF — exports the SVG canvas to an A3 landscape PDF with title and date.
 *
 * All functions are pure (except toPdf which accesses the DOM) and take graph data as arguments.
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

/**
 * Export the SVG canvas to a PDF file (A3 landscape).
 * Uses html2canvas to rasterize the SVG, then jsPDF to generate the document.
 *
 * @param svgElement - The SVG DOM element to export.
 * @param title - Title printed at the top of the PDF.
 */
export async function toPdf(svgElement: SVGSVGElement, title: string): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  /* Rasterize the SVG to a canvas */
  const canvas = await html2canvas(svgElement as unknown as HTMLElement, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
  });

  /* A3 landscape dimensions in mm */
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  /* Title + date header */
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  pdf.setFontSize(16);
  pdf.text(title, 15, 15);
  pdf.setFontSize(9);
  pdf.setTextColor(128);
  pdf.text(`Generated: ${dateStr}`, 15, 22);

  /* Fit canvas image into remaining page area with margins */
  const margin = 15;
  const headerHeight = 28;
  const availableW = pageWidth - margin * 2;
  const availableH = pageHeight - headerHeight - margin;
  const imgRatio = canvas.width / canvas.height;
  const areaRatio = availableW / availableH;

  let imgW: number, imgH: number;
  if (imgRatio > areaRatio) {
    imgW = availableW;
    imgH = availableW / imgRatio;
  } else {
    imgH = availableH;
    imgW = availableH * imgRatio;
  }

  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', margin, headerHeight, imgW, imgH);

  pdf.save('service-map.pdf');
}

/**
 * Download a Mermaid diagram as a .md file.
 *
 * @param content - Mermaid markdown content.
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
