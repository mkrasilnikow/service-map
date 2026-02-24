/**
 * @file Root application component for the Service Map Editor.
 *
 * Orchestrates all child components and hooks:
 *   - useGraph — manages nodes, edges, selection
 *   - useDrag — handles node and edge control point dragging
 *   - useCanvas — pan, zoom, and coordinate transform (g-transform approach)
 *   - useKeyboard — global keyboard shortcuts
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { InteractionMode, NodeTypeKey, GraphNode, GraphEdge } from './types';
import { useGraph } from './hooks/useGraph';
import { useDrag } from './hooks/useDrag';
import { useCanvas } from './hooks/useCanvas';
import { useKeyboard } from './hooks/useKeyboard';
import { toMermaid, toSchemaExport } from './utils/export';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { CanvasControls } from './components/CanvasControls';
import { AddNodeModal } from './components/modals/AddNodeModal';
import { ExportModal } from './components/modals/ExportModal';
import { ImportModal } from './components/modals/ImportModal';

const THEME_KEY = 'service-map-theme';

export default function App() {
  /* --- Graph state --- */
  const {
    nodes,
    edges,
    selected,
    setNodes,
    setEdges,
    setSelected,
    addNode,
    updateNode,
    updateEdge,
    addEdge,
    deleteSelected,
  } = useGraph();

  /* --- Interaction mode --- */
  const [mode, setMode] = useState<InteractionMode>('select');
  const [connectFrom, setConnectFrom] = useState<string | null>(null);

  /* --- Modals --- */
  const [showAddNode, setShowAddNode] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

  /* --- Theme --- */
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored ? stored === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  /* --- Canvas (pan & zoom via g-transform) --- */
  const svgRef = useRef<SVGSVGElement | null>(null);
  const {
    canvas,
    isPanLocked,
    screenToCanvas,
    onPanStart,
    isPanning,
    zoomIn,
    zoomOut,
    fitView,
    toggleLock,
  } = useCanvas(svgRef);

  /* --- Drag (nodes + edge control points) --- */
  const {
    onNodeMouseDown: dragMouseDown,
    onEdgeControlMouseDown,
    onSvgMouseMove: dragMouseMove,
    onSvgMouseUp: dragMouseUp,
    isDragging,
  } = useDrag(nodes, edges, updateNode, updateEdge, screenToCanvas);

  /* --- Combined mouse move for drag --- */
  const onSvgMouseMove = useCallback(
    (e: React.MouseEvent) => {
      dragMouseMove(e);
    },
    [dragMouseMove],
  );

  const onSvgMouseUp = useCallback(() => {
    dragMouseUp();
  }, [dragMouseUp]);

  /* --- Keyboard --- */
  const resetMode = useCallback(() => {
    setMode('select');
    setConnectFrom(null);
    setSelected(null);
  }, [setSelected]);

  useKeyboard(deleteSelected, resetMode, !!selected);

  /* --- Node mouse down: start drag (only in select mode) --- */
  const onNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      if (mode === 'connect') return;
      dragMouseDown(e, nodeId);
      setSelected({ kind: 'node', id: nodeId });
    },
    [mode, dragMouseDown, setSelected],
  );

  /* --- Node click: select or connect --- */
  const onNodeClick = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      if (mode !== 'connect') {
        setSelected({ kind: 'node', id: nodeId });
        return;
      }
      if (!connectFrom) {
        setConnectFrom(nodeId);
      } else {
        if (connectFrom !== nodeId) {
          addEdge(connectFrom, nodeId);
        }
        setConnectFrom(null);
      }
    },
    [mode, connectFrom, setSelected, addEdge],
  );

  /* --- Edge click: select --- */
  const onEdgeClick = useCallback(
    (e: React.MouseEvent, edgeId: string) => {
      e.stopPropagation();
      setSelected({ kind: 'edge', id: edgeId });
    },
    [setSelected],
  );

  /* --- Canvas click: deselect (only if not panning/dragging) --- */
  const onSvgClick = useCallback(() => {
    if (!isPanning() && !isDragging()) {
      setSelected(null);
    }
  }, [setSelected, isPanning, isDragging]);

  /* --- Canvas mouse down: start pan on left click on empty area --- */
  const onSvgMouseDown = useCallback(
    (e: React.MouseEvent) => {
      /* Only left button, only in select mode, and only on empty canvas */
      if (e.button !== 0 || mode === 'connect') return;
      onPanStart(e.clientX, e.clientY);
    },
    [mode, onPanStart],
  );

  /* --- Mode change --- */
  const handleModeChange = useCallback(
    (newMode: InteractionMode) => {
      setMode(newMode);
      setConnectFrom(null);
      if (newMode === 'connect') setSelected(null);
    },
    [setSelected],
  );

  /* --- Add node from modal --- */
  const handleAddNode = useCallback(
    (name: string, type: NodeTypeKey, namespace?: string) => {
      addNode(name, type, namespace);
      setShowAddNode(false);
    },
    [addNode],
  );

  /* --- Import handler --- */
  const handleImport = useCallback(
    (importedNodes: GraphNode[], importedEdges: GraphEdge[]) => {
      setNodes(importedNodes);
      setEdges(importedEdges);
      setSelected(null);
      setShowImport(false);
    },
    [setNodes, setEdges, setSelected],
  );

  /* --- Resolved selected elements --- */
  const selectedNode =
    selected?.kind === 'node' ? (nodes.find(n => n.id === selected.id) ?? null) : null;
  const selectedEdge =
    selected?.kind === 'edge' ? (edges.find(e => e.id === selected.id) ?? null) : null;

  return (
    <div className="app-root">
      <Toolbar
        mode={mode}
        connectFrom={connectFrom}
        hasSelection={!!selected}
        selectedKind={selected?.kind ?? null}
        nodeCount={nodes.length}
        edgeCount={edges.length}
        isDark={isDark}
        onModeChange={handleModeChange}
        onAddNode={() => setShowAddNode(true)}
        onDelete={deleteSelected}
        onExport={() => setShowExport(true)}
        onImport={() => setShowImport(true)}
        onToggleTheme={() => setIsDark(prev => !prev)}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Canvas
          nodes={nodes}
          edges={edges}
          selected={selected}
          mode={mode}
          connectFrom={connectFrom}
          isDark={isDark}
          svgRef={svgRef}
          panX={canvas.panX}
          panY={canvas.panY}
          zoom={canvas.zoom}
          isPanLocked={isPanLocked}
          onNodeMouseDown={onNodeMouseDown}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onEdgeControlDragStart={onEdgeControlMouseDown}
          onSvgMouseMove={onSvgMouseMove}
          onSvgMouseUp={onSvgMouseUp}
          onSvgMouseDown={onSvgMouseDown}
          onSvgClick={onSvgClick}
        />

        <CanvasControls
          zoom={canvas.zoom}
          isPanLocked={isPanLocked}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFitView={() => fitView(nodes)}
          onToggleLock={toggleLock}
        />

        <Sidebar
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          nodes={nodes}
          edges={edges}
          isDark={isDark}
          onUpdateNode={updateNode}
          onUpdateEdge={updateEdge}
          onDelete={deleteSelected}
        />
      </div>

      {showAddNode && (
        <AddNodeModal
          onAdd={handleAddNode}
          onClose={() => setShowAddNode(false)}
          isDark={isDark}
        />
      )}

      {showExport && (
        <ExportModal
          mermaid={toMermaid(nodes, edges)}
          schemaExport={toSchemaExport(nodes, edges)}
          svgRef={svgRef}
          onClose={() => setShowExport(false)}
        />
      )}

      {showImport && (
        <ImportModal onImport={handleImport} onClose={() => setShowImport(false)} />
      )}
    </div>
  );
}
