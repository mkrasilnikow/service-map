/**
 * @file Viewport hook for pan and zoom on the SVG canvas.
 *
 * Provides:
 *   - Wheel zoom (centered on cursor position)
 *   - Middle-click / right-click drag to pan
 *   - Zoom in / zoom out / reset functions for toolbar buttons
 *   - viewBox string for the SVG element
 *   - Coordinate transform from screen to SVG space (for drag/click)
 *
 * The viewport is stored as { x, y, width, height } representing the SVG viewBox.
 */

import { useState, useCallback, useRef } from 'react';

/** Min/max zoom levels expressed as viewBox width relative to container */
const MIN_SCALE = 0.15;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.1;
const WHEEL_ZOOM_FACTOR = 0.001;

export interface ViewportState {
  /** Left edge of the viewBox in SVG coordinates */
  x: number;
  /** Top edge of the viewBox in SVG coordinates */
  y: number;
  /** Current zoom scale (1 = 100%, smaller = zoomed in) */
  scale: number;
}

interface PanState {
  startX: number;
  startY: number;
  origVpX: number;
  origVpY: number;
}

/**
 * Hook that manages canvas pan and zoom via SVG viewBox.
 *
 * @param svgRef - Ref to the SVG element.
 * @returns viewport state, event handlers, viewBox string, coordinate helpers.
 */
export function useViewport(svgRef: React.RefObject<SVGSVGElement | null>) {
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, scale: 1 });
  const panRef = useRef<PanState | null>(null);

  /** Get the SVG container dimensions in pixels */
  const getSvgSize = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return { w: 1200, h: 800 };
    const rect = svg.getBoundingClientRect();
    return { w: rect.width, h: rect.height };
  }, [svgRef]);

  /** Generate the viewBox string for the SVG element */
  const getViewBox = useCallback(() => {
    const { w, h } = getSvgSize();
    const vw = w * viewport.scale;
    const vh = h * viewport.scale;
    return `${viewport.x} ${viewport.y} ${vw} ${vh}`;
  }, [viewport, getSvgSize]);

  /**
   * Convert screen pixel coordinates to SVG viewBox coordinates.
   * Used by drag and click handlers to get correct positions after zoom/pan.
   */
  const screenToSvg = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: clientX, y: clientY };
      const rect = svg.getBoundingClientRect();
      const { w, h } = getSvgSize();
      const vw = w * viewport.scale;
      const vh = h * viewport.scale;
      const rx = (clientX - rect.left) / rect.width;
      const ry = (clientY - rect.top) / rect.height;
      return {
        x: viewport.x + rx * vw,
        y: viewport.y + ry * vh,
      };
    },
    [svgRef, viewport, getSvgSize],
  );

  /** Handle mouse wheel: zoom centered on cursor */
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const { w, h } = getSvgSize();

      /* Cursor position as fraction of SVG container */
      const rx = (e.clientX - rect.left) / rect.width;
      const ry = (e.clientY - rect.top) / rect.height;

      setViewport(prev => {
        const oldVW = w * prev.scale;
        const oldVH = h * prev.scale;

        /* Compute new scale */
        const delta = e.deltaY * WHEEL_ZOOM_FACTOR;
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * (1 + delta)));

        const newVW = w * newScale;
        const newVH = h * newScale;

        /* Keep the point under the cursor fixed */
        const newX = prev.x + rx * (oldVW - newVW);
        const newY = prev.y + ry * (oldVH - newVH);

        return { x: newX, y: newY, scale: newScale };
      });
    },
    [svgRef, getSvgSize],
  );

  /** Start panning on middle-click or when Space is held */
  const onPanStart = useCallback(
    (e: React.MouseEvent) => {
      /* Middle mouse button (1) or right button with alt */
      if (e.button !== 1 && !(e.button === 2 && e.altKey)) return;
      e.preventDefault();
      panRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origVpX: viewport.x,
        origVpY: viewport.y,
      };
    },
    [viewport],
  );

  /** Continue panning */
  const onPanMove = useCallback(
    (e: React.MouseEvent) => {
      if (!panRef.current) return;
      const { w } = getSvgSize();
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();

      /* Convert pixel delta to SVG coordinate delta */
      const pixelToSvg = (w * viewport.scale) / rect.width;
      const dx = (e.clientX - panRef.current.startX) * pixelToSvg;
      const dy = (e.clientY - panRef.current.startY) * pixelToSvg;

      setViewport(prev => ({
        ...prev,
        x: panRef.current!.origVpX - dx,
        y: panRef.current!.origVpY - dy,
      }));
    },
    [svgRef, viewport.scale, getSvgSize],
  );

  /** End panning */
  const onPanEnd = useCallback(() => {
    panRef.current = null;
  }, []);

  /** Zoom in by one step (centered on viewport middle) */
  const zoomIn = useCallback(() => {
    const { w, h } = getSvgSize();
    setViewport(prev => {
      const oldVW = w * prev.scale;
      const oldVH = h * prev.scale;
      const newScale = Math.max(MIN_SCALE, prev.scale * (1 - ZOOM_STEP));
      const newVW = w * newScale;
      const newVH = h * newScale;
      return {
        x: prev.x + (oldVW - newVW) / 2,
        y: prev.y + (oldVH - newVH) / 2,
        scale: newScale,
      };
    });
  }, [getSvgSize]);

  /** Zoom out by one step */
  const zoomOut = useCallback(() => {
    const { w, h } = getSvgSize();
    setViewport(prev => {
      const oldVW = w * prev.scale;
      const oldVH = h * prev.scale;
      const newScale = Math.min(MAX_SCALE, prev.scale * (1 + ZOOM_STEP));
      const newVW = w * newScale;
      const newVH = h * newScale;
      return {
        x: prev.x + (oldVW - newVW) / 2,
        y: prev.y + (oldVH - newVH) / 2,
        scale: newScale,
      };
    });
  }, [getSvgSize]);

  /** Reset viewport to default (no zoom, no pan) */
  const resetZoom = useCallback(() => {
    setViewport({ x: 0, y: 0, scale: 1 });
  }, []);

  /** Whether a pan operation is active */
  const isPanning = panRef.current !== null;

  return {
    viewport,
    getViewBox,
    screenToSvg,
    onWheel,
    onPanStart,
    onPanMove,
    onPanEnd,
    isPanning,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
