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
import { NODE_TYPES, NODE_W, NODE_H } from '../constants/nodeTypes';

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

// ─── Excalidraw export ────────────────────────────────────────────────────────

function exId() {
  return Math.random().toString(36).slice(2, 10);
}
function exSeed() {
  return Math.floor(Math.random() * 1_000_000);
}

/**
 * Returns the point on the border of a rectangle (rx, ry, rw, rh) where a
 * ray from the rectangle's center towards (targetX, targetY) exits, plus an
 * optional outward gap in pixels.
 */
function rectEdgePoint(
  rx: number, ry: number, rw: number, rh: number,
  targetX: number, targetY: number,
  gap = 0,
): { x: number; y: number } {
  const cx = rx + rw / 2;
  const cy = ry + rh / 2;
  const dx = targetX - cx;
  const dy = targetY - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };

  // Scale factors to hit each axis-aligned border
  const scaleX = dx !== 0 ? (rw / 2) / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? (rh / 2) / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);

  const bx = cx + dx * scale;
  const by = cy + dy * scale;

  if (gap === 0) return { x: bx, y: by };

  // Move outward by gap along the direction vector
  const len = Math.sqrt(dx * dx + dy * dy);
  return { x: bx + (dx / len) * gap, y: by + (dy / len) * gap };
}

/**
 * Convert graph nodes and edges to an Excalidraw-compatible JSON string.
 * The result can be saved as a `.excalidraw` file and opened in Excalidraw.
 */
export function toExcalidraw(nodes: GraphNode[], edges: GraphEdge[]): string {
  const now = Date.now();
  const elements: unknown[] = [];
  // Map our node IDs to Excalidraw rectangle element IDs
  const nodeToRectId = new Map<string, string>();
  // Track bound elements per rect (for proper format)
  const rectBound = new Map<string, { type: string; id: string }[]>();

  // ── Rectangles + text labels for nodes ──────────────────────────────────────
  for (const node of nodes) {
    const rectId = exId();
    const textId = exId();
    nodeToRectId.set(node.id, rectId);

    const config = NODE_TYPES[node.type];
    const w = node.width ?? NODE_W;
    const h = node.height ?? NODE_H;
    const label = `${config?.icon ?? '◈'} ${node.name}\n[${config?.label ?? node.type}]`;

    rectBound.set(rectId, [{ type: 'text', id: textId }]);

    elements.push({
      id: rectId,
      type: 'rectangle',
      x: node.x,
      y: node.y,
      width: w,
      height: h,
      angle: 0,
      strokeColor: config?.borderLight ?? '#64748b',
      backgroundColor: config?.bgLight ?? '#f1f5f9',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: config?.dashed ? 'dashed' : 'solid',
      roughness: 0,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: { type: 3 },
      seed: exSeed(),
      version: 1,
      versionNonce: exSeed(),
      isDeleted: false,
      boundElements: [{ type: 'text', id: textId }],
      updated: now,
      link: null,
      locked: false,
    });

    elements.push({
      id: textId,
      type: 'text',
      x: node.x,
      y: node.y,
      width: w,
      height: h,
      angle: 0,
      strokeColor: config?.borderLight ?? '#1e293b',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 0,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: null,
      seed: exSeed(),
      version: 1,
      versionNonce: exSeed(),
      isDeleted: false,
      boundElements: null,
      updated: now,
      link: null,
      locked: false,
      text: label,
      fontSize: 12,
      fontFamily: 3, // monospace
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: rectId,
      originalText: label,
      lineHeight: 1.25,
      autoResize: true,
    });
  }

  // ── Arrows for edges ─────────────────────────────────────────────────────────
  for (const edge of edges) {
    const sourceRectId = nodeToRectId.get(edge.source);
    const targetRectId = nodeToRectId.get(edge.target);
    if (!sourceRectId || !targetRectId) continue;

    const sourceNode = nodes.find(n => n.id === edge.source)!;
    const targetNode = nodes.find(n => n.id === edge.target)!;
    const sw = sourceNode.width ?? NODE_W;
    const sh = sourceNode.height ?? NODE_H;
    const tw = targetNode.width ?? NODE_W;
    const th = targetNode.height ?? NODE_H;

    const sourceCX = sourceNode.x + sw / 2;
    const sourceCY = sourceNode.y + sh / 2;
    const targetCX = targetNode.x + tw / 2;
    const targetCY = targetNode.y + th / 2;

    // Arrow starts at the border of the source rect (pointing toward target),
    // ends at the border of the target rect (pointing toward source).
    const GAP = 6;
    const start = rectEdgePoint(sourceNode.x, sourceNode.y, sw, sh, targetCX, targetCY, GAP);
    const end   = rectEdgePoint(targetNode.x, targetNode.y, tw, th, sourceCX, sourceCY, GAP);

    const dx = end.x - start.x;
    const dy = end.y - start.y;

    const arrowId = exId();
    const edgeLabel = edge.type ?? edge.label;
    const labelId = edgeLabel ? exId() : null;

    // Register arrow as bound element on source and target rects
    rectBound.get(sourceRectId)?.push({ type: 'arrow', id: arrowId });
    rectBound.get(targetRectId)?.push({ type: 'arrow', id: arrowId });

    elements.push({
      id: arrowId,
      type: 'arrow',
      x: start.x,
      y: start.y,
      width: Math.abs(dx),
      height: Math.abs(dy),
      angle: 0,
      strokeColor: '#64748b',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 0,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: { type: 2 },
      seed: exSeed(),
      version: 1,
      versionNonce: exSeed(),
      isDeleted: false,
      boundElements: labelId ? [{ type: 'text', id: labelId }] : null,
      updated: now,
      link: null,
      locked: false,
      points: [[0, 0], [dx, dy]],
      lastCommittedPoint: null,
      startBinding: { elementId: sourceRectId, gap: 6, focus: 0 },
      endBinding: { elementId: targetRectId, gap: 6, focus: 0 },
      startArrowhead: null,
      endArrowhead: 'arrow',
      elbowed: false,
    });

    if (edgeLabel && labelId) {
      elements.push({
        id: labelId,
        type: 'text',
        x: start.x + dx / 2 - 30,
        y: start.y + dy / 2 - 10,
        width: 60,
        height: 20,
        angle: 0,
        strokeColor: '#475569',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 1,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        groupIds: [],
        frameId: null,
        roundness: null,
        seed: exSeed(),
        version: 1,
        versionNonce: exSeed(),
        isDeleted: false,
        boundElements: null,
        updated: now,
        link: null,
        locked: false,
        text: edgeLabel,
        fontSize: 11,
        fontFamily: 3,
        textAlign: 'center',
        verticalAlign: 'middle',
        containerId: arrowId,
        originalText: edgeLabel,
        lineHeight: 1.25,
        autoResize: true,
      });
    }
  }

  // Back-fill boundElements on rectangles with arrow entries
  for (const el of elements as Array<{ id: string; boundElements: unknown[] | null }>) {
    const bound = rectBound.get(el.id);
    if (bound) el.boundElements = bound;
  }

  return JSON.stringify(
    {
      type: 'excalidraw',
      version: 2,
      source: 'https://excalidraw.com',
      elements,
      appState: {
        gridSize: null,
        viewBackgroundColor: '#f8fafc',
      },
      files: {},
    },
    null,
    2,
  );
}

/**
 * Download an Excalidraw file.
 */
export function downloadExcalidraw(content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'service-map.excalidraw';
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
