/**
 * @file Root application component for the Service Map Editor.
 *
 * Uses React Flow as the canvas engine:
 *   - Custom ServiceNode and NamespaceNode for visuals
 *   - Custom ServiceEdge for styled connections with type badges
 *   - RF native Save/Restore for JSON export/import
 *   - html-to-image for PNG download
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';

import { ThemeContext } from './context/ThemeContext';
import { ServiceNode } from './components/nodes/ServiceNode';
import { NamespaceNode } from './components/nodes/NamespaceNode';
import { ServiceEdge } from './components/edges/ServiceEdge';
import { useGraph } from './hooks/useGraph';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { AddNodeModal } from './components/modals/AddNodeModal';
import { ExportModal } from './components/modals/ExportModal';
import { ImportModal } from './components/modals/ImportModal';
import type { ImportResult } from './components/modals/ImportModal/ImportModal';
import { toMermaid } from './utils/export';
import type { NodeTypeKey, GraphNode, GraphEdge } from './types';

const THEME_KEY = 'service-map-theme';

const NODE_TYPES: NodeTypes = {
  service: ServiceNode,
  namespace: NamespaceNode,
};

const EDGE_TYPES: EdgeTypes = {
  service: ServiceEdge,
};

// ─── Inner app (needs ReactFlowProvider in scope) ─────────────────────────────

function AppInner() {
  const { toObject, fitView: rfFitView, setViewport } = useReactFlow();

  const {
    nodes,
    serviceNodes,
    edges,
    setServiceNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    updateNode,
    updateEdge,
    importGraphData,
    restoreFlow,
  } = useGraph();

  /* --- Theme --- */
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored ? stored === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  /* --- Modals --- */
  const [showAddNode, setShowAddNode] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

  /* --- Derived selection from RF state --- */
  const selectedServiceNode = serviceNodes.find(n => n.selected) ?? null;
  const selectedEdge = edges.find(e => e.selected) ?? null;
  const hasSelection = !!selectedServiceNode || !!selectedEdge;
  const selectedKind: 'node' | 'edge' | null = selectedServiceNode
    ? 'node'
    : selectedEdge
      ? 'edge'
      : null;

  /* --- Adapt RF nodes/edges to GraphNode/GraphEdge for Sidebar (no Sidebar changes needed) --- */
  const selectedGraphNode = useMemo((): GraphNode | null =>
    selectedServiceNode
      ? {
          id: selectedServiceNode.id,
          name: selectedServiceNode.data.name,
          type: selectedServiceNode.data.nodeType as NodeTypeKey,
          namespace: selectedServiceNode.data.namespace,
          x: selectedServiceNode.position.x,
          y: selectedServiceNode.position.y,
          width: selectedServiceNode.width,
          height: selectedServiceNode.height,
        }
      : null,
    [selectedServiceNode],
  );

  const selectedGraphEdge = useMemo((): GraphEdge | null =>
    selectedEdge
      ? {
          id: selectedEdge.id,
          source: selectedEdge.source,
          target: selectedEdge.target,
          type: selectedEdge.data?.integrationType,
          label: selectedEdge.data?.label,
        }
      : null,
    [selectedEdge],
  );

  const graphNodes = useMemo((): GraphNode[] =>
    serviceNodes.map(n => ({
      id: n.id,
      name: n.data.name,
      type: n.data.nodeType as NodeTypeKey,
      namespace: n.data.namespace,
      x: n.position.x,
      y: n.position.y,
      width: n.width,
      height: n.height,
    })),
    [serviceNodes],
  );

  const graphEdges = useMemo((): GraphEdge[] =>
    edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.data?.integrationType,
      label: e.data?.label,
    })),
    [edges],
  );

  /* --- Delete selected element --- */
  const deleteSelected = useCallback(() => {
    if (selectedServiceNode) {
      const id = selectedServiceNode.id;
      setServiceNodes(nds => nds.filter(n => n.id !== id));
      setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
    } else if (selectedEdge) {
      const id = selectedEdge.id;
      setEdges(eds => eds.filter(e => e.id !== id));
    }
  }, [selectedServiceNode, selectedEdge, setServiceNodes, setEdges]);

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
    (result: ImportResult) => {
      if (result.format === 'flow') {
        restoreFlow(result.nodes, result.edges);
        const vp = result.viewport;
        setTimeout(() => setViewport(vp), 50);
      } else {
        importGraphData(result.nodes, result.edges);
        setTimeout(() => rfFitView({ padding: 0.1, duration: 300 }), 50);
      }
      setShowImport(false);
    },
    [importGraphData, restoreFlow, setViewport, rfFitView],
  );

  const handleOpenExport = useCallback(() => {
    setShowExport(true);
  }, []);

  // Get the real viewport when opening export modal
  const getFlowJsonWithViewport = useCallback(() => {
    const flow = toObject();
    const filtered = {
      ...flow,
      nodes: flow.nodes.filter((n: { type?: string }) => n.type !== 'namespace'),
    };
    return JSON.stringify(filtered, null, 2);
  }, [toObject]);

  const [liveFlowJson, setLiveFlowJson] = useState('');

  useEffect(() => {
    if (showExport) {
      setLiveFlowJson(getFlowJsonWithViewport());
    }
  }, [showExport, getFlowJsonWithViewport]);

  const mermaid = useMemo(() => toMermaid(graphNodes, graphEdges), [graphNodes, graphEdges]);

  return (
    <ThemeContext.Provider value={{ isDark }}>
      <div className="app-root">
        <Toolbar
          hasSelection={hasSelection}
          selectedKind={selectedKind}
          nodeCount={serviceNodes.length}
          edgeCount={edges.length}
          isDark={isDark}
          onAddNode={() => setShowAddNode(true)}
          onDelete={deleteSelected}
          onExport={handleOpenExport}
          onImport={() => setShowImport(true)}
          onToggleTheme={() => setIsDark(prev => !prev)}
        />

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            deleteKeyCode="Delete"
            multiSelectionKeyCode="Shift"
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.1}
            maxZoom={3}
            style={{ background: 'var(--bg)' }}
          >
            <Background
              color={isDark ? '#1e3a5f' : '#cbd5e1'}
              variant={BackgroundVariant.Dots}
              gap={28}
              size={1.5}
            />
            <Controls
              style={{
                background: 'var(--btn-bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            />
          </ReactFlow>

          <Sidebar
            selectedNode={selectedGraphNode}
            selectedEdge={selectedGraphEdge}
            nodes={graphNodes}
            edges={graphEdges}
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
            mermaid={mermaid}
            flowJson={liveFlowJson}
            isDark={isDark}
            onClose={() => setShowExport(false)}
          />
        )}

        {showImport && (
          <ImportModal onImport={handleImport} onClose={() => setShowImport(false)} />
        )}
      </div>
    </ThemeContext.Provider>
  );
}

// ─── Root export wraps with ReactFlowProvider ─────────────────────────────────

export default function App() {
  return (
    <ReactFlowProvider>
      <AppInner />
    </ReactFlowProvider>
  );
}
