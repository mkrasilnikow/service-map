/**
 * @file Canvas navigation hook — pan, zoom, and coordinate transform.
 *
 * Uses a `<g transform>` approach instead of SVG viewBox manipulation.
 * State: { panX, panY, zoom }
 *
 * Features:
 *   - Left-click drag on empty canvas to pan
 *   - Wheel zoom centered on cursor
 *   - Lock toggle to disable pan/zoom
 *   - Zoom in / out / fitView / toggleLock for control buttons
 *   - screenToCanvas() coordinate transform for drag operations
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { GraphNode } from '../types';
import { NODE_W, NODE_H } from '../constants/nodeTypes';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3.0;
const ZOOM_FACTOR = 1.2;
const FIT_PADDING = 60;

export interface CanvasState {
  panX: number;
  panY: number;
  zoom: number;
}

interface PanDrag {
  startClientX: number;
  startClientY: number;
  startPanX: number;
  startPanY: number;
}

export function useCanvas(svgRef: React.RefObject<SVGSVGElement | null>) {
  const [canvas, setCanvas] = useState<CanvasState>({ panX: 0, panY: 0, zoom: 1 });
  const [isPanLocked, setIsPanLocked] = useState(false);
  const panDragRef = useRef<PanDrag | null>(null);

  /** Convert screen (client) coordinates to canvas (SVG content) coordinates */
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: clientX, y: clientY };
      const rect = svg.getBoundingClientRect();
      return {
        x: (clientX - rect.left - canvas.panX) / canvas.zoom,
        y: (clientY - rect.top - canvas.panY) / canvas.zoom,
      };
    },
    [svgRef, canvas.panX, canvas.panY, canvas.zoom],
  );

  /** Start panning — called from SVG onMouseDown (only on empty canvas, left button) */
  const onPanStart = useCallback(
    (clientX: number, clientY: number) => {
      if (isPanLocked) return;
      panDragRef.current = {
        startClientX: clientX,
        startClientY: clientY,
        startPanX: canvas.panX,
        startPanY: canvas.panY,
      };
    },
    [isPanLocked, canvas.panX, canvas.panY],
  );

  /** Is a pan drag currently active? */
  const isPanning = useCallback(() => panDragRef.current !== null, []);

  /** Cancel any active pan (used when a click-deselect should happen) */
  const cancelPan = useCallback(() => {
    panDragRef.current = null;
  }, []);

  /* --- Window-level mousemove / mouseup for pan --- */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const pd = panDragRef.current;
      if (!pd) return;
      const dx = e.clientX - pd.startClientX;
      const dy = e.clientY - pd.startClientY;
      setCanvas(prev => ({
        ...prev,
        panX: pd.startPanX + dx,
        panY: pd.startPanY + dy,
      }));
    };

    const onUp = () => {
      panDragRef.current = null;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  /* --- Wheel zoom via native addEventListener (passive: false) --- */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onWheel = (e: WheelEvent) => {
      if (isPanLocked) return;
      e.preventDefault();

      const rect = svg.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      setCanvas(prev => {
        const direction = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom * direction));
        const scale = newZoom / prev.zoom;

        return {
          panX: cursorX - scale * (cursorX - prev.panX),
          panY: cursorY - scale * (cursorY - prev.panY),
          zoom: newZoom,
        };
      });
    };

    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [svgRef, isPanLocked]);

  /** Zoom in by ZOOM_FACTOR, centered on SVG center */
  const zoomIn = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    setCanvas(prev => {
      const newZoom = Math.min(MAX_ZOOM, prev.zoom * ZOOM_FACTOR);
      const scale = newZoom / prev.zoom;
      return {
        panX: cx - scale * (cx - prev.panX),
        panY: cy - scale * (cy - prev.panY),
        zoom: newZoom,
      };
    });
  }, [svgRef]);

  /** Zoom out by ZOOM_FACTOR, centered on SVG center */
  const zoomOut = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    setCanvas(prev => {
      const newZoom = Math.max(MIN_ZOOM, prev.zoom / ZOOM_FACTOR);
      const scale = newZoom / prev.zoom;
      return {
        panX: cx - scale * (cx - prev.panX),
        panY: cy - scale * (cy - prev.panY),
        zoom: newZoom,
      };
    });
  }, [svgRef]);

  /** Fit all nodes into view with padding */
  const fitView = useCallback(
    (nodes: GraphNode[]) => {
      if (nodes.length === 0) {
        setCanvas({ panX: 0, panY: 0, zoom: 1 });
        return;
      }

      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const n of nodes) {
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x + NODE_W);
        maxY = Math.max(maxY, n.y + NODE_H);
      }

      const contentW = maxX - minX + FIT_PADDING * 2;
      const contentH = maxY - minY + FIT_PADDING * 2;

      const zoom = Math.min(
        Math.min(rect.width / contentW, rect.height / contentH),
        MAX_ZOOM,
      );

      const panX = (rect.width - contentW * zoom) / 2 - (minX - FIT_PADDING) * zoom;
      const panY = (rect.height - contentH * zoom) / 2 - (minY - FIT_PADDING) * zoom;

      setCanvas({ panX, panY, zoom });
    },
    [svgRef],
  );

  /** Toggle pan/zoom lock */
  const toggleLock = useCallback(() => {
    setIsPanLocked(prev => !prev);
  }, []);

  return {
    canvas,
    isPanLocked,
    screenToCanvas,
    onPanStart,
    isPanning,
    cancelPan,
    zoomIn,
    zoomOut,
    fitView,
    toggleLock,
  };
}
