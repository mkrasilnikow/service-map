/**
 * @file Central graph state management hook (React Flow implementation).
 *
 * Manages two separate state collections:
 *   - serviceNodes — the actual service nodes (RF Node with ServiceNodeData)
 *   - edges       — service connections (RF Edge with ServiceEdgeData)
 *
 * Namespace nodes are derived (computed) from serviceNodes and merged into
 * the `nodes` array passed to <ReactFlow>. They are never stored in state.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import type {
  NodeTypeKey,
  GraphNode,
  GraphEdge,
  RFServiceNode,
  RFServiceEdge,
  RFNamespaceNode,
  RFFlowNode,
  ServiceNodeData,
  ServiceEdgeData,
} from '../types';
import { NODE_W, NODE_H } from '../constants/nodeTypes';

const NS_PADDING = 24;
const NS_ID_PREFIX = '__ns__';

/** Compute namespace background nodes from current service nodes */
function computeNamespaceNodes(serviceNodes: RFServiceNode[]): RFNamespaceNode[] {
  const groups = new Map<string, RFServiceNode[]>();

  for (const node of serviceNodes) {
    const ns = node.data.namespace;
    if (ns) {
      const g = groups.get(ns) ?? [];
      g.push(node);
      groups.set(ns, g);
    }
  }

  const result: RFNamespaceNode[] = [];
  for (const [label, members] of groups) {
    const minX = Math.min(...members.map(n => n.position.x)) - NS_PADDING;
    const minY = Math.min(...members.map(n => n.position.y)) - NS_PADDING;
    const maxX =
      Math.max(...members.map(n => n.position.x + (n.width ?? NODE_W))) + NS_PADDING;
    const maxY =
      Math.max(...members.map(n => n.position.y + (n.height ?? NODE_H))) + NS_PADDING;

    result.push({
      id: `${NS_ID_PREFIX}${label}`,
      type: 'namespace' as const,
      position: { x: minX, y: minY },
      data: { label },
      width: maxX - minX,
      height: maxY - minY,
      selectable: false,
      draggable: false,
      connectable: false,
      zIndex: -1,
    });
  }

  return result;
}

/** Convert canonical GraphNode array to RF service nodes */
function graphNodesToRF(graphNodes: GraphNode[]): RFServiceNode[] {
  return graphNodes.map(n => ({
    id: n.id,
    type: 'service' as const,
    position: { x: n.x, y: n.y },
    data: {
      name: n.name,
      nodeType: n.type,
      namespace: n.namespace,
    } satisfies ServiceNodeData,
    width: n.width ?? NODE_W,
    height: n.height ?? NODE_H,
  }));
}

/** Convert canonical GraphEdge array to RF service edges */
function graphEdgesToRF(graphEdges: GraphEdge[]): RFServiceEdge[] {
  return graphEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'service' as const,
    data: {
      integrationType: e.type,
      label: e.label,
    } satisfies ServiceEdgeData,
    markerEnd: { type: MarkerType.ArrowClosed },
  }));
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_GRAPH_NODES: GraphNode[] = [
  { id: 'api-gateway',           name: 'api-gateway',           type: 'spring-boot', x: 380,  y: 60  },
  { id: 'user-service',          name: 'user-service',          type: 'spring-boot', x: 120,  y: 220 },
  { id: 'order-service',         name: 'order-service',         type: 'spring-boot', x: 380,  y: 220 },
  { id: 'notification-service',  name: 'notification-service',  type: 'nodejs',      x: 640,  y: 220 },
  { id: 'redis-cache',           name: 'redis-cache',           type: 'redis',       x: 120,  y: 390 },
  { id: 'kafka-cluster',         name: 'kafka-cluster',         type: 'kafka',       x: 380,  y: 390 },
  { id: 'postgres-users',        name: 'postgres-users',        type: 'postgresql',  x: 120,  y: 540 },
  { id: 'postgres-orders',       name: 'postgres-orders',       type: 'postgresql',  x: 380,  y: 540 },
  { id: 'mongodb-notifications', name: 'mongodb-notifications', type: 'mongodb',     x: 640,  y: 390 },
];

const DEMO_GRAPH_EDGES: GraphEdge[] = [
  { id: 'e1', source: 'api-gateway',          target: 'user-service',          type: 'REST'    },
  { id: 'e2', source: 'api-gateway',          target: 'order-service',         type: 'REST'    },
  { id: 'e3', source: 'api-gateway',          target: 'notification-service',  type: 'REST'    },
  { id: 'e4', source: 'user-service',         target: 'redis-cache',           type: 'cache'   },
  { id: 'e5', source: 'user-service',         target: 'postgres-users',        type: 'db'      },
  { id: 'e6', source: 'order-service',        target: 'postgres-orders',       type: 'db'      },
  { id: 'e7', source: 'order-service',        target: 'kafka-cluster',         type: 'pub/sub' },
  { id: 'e8', source: 'kafka-cluster',        target: 'notification-service',  type: 'pub/sub' },
  { id: 'e9', source: 'notification-service', target: 'mongodb-notifications', type: 'db'      },
];

const INITIAL_SERVICE_NODES = graphNodesToRF(DEMO_GRAPH_NODES);
const INITIAL_EDGES = graphEdgesToRF(DEMO_GRAPH_EDGES);

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGraph() {
  const [serviceNodes, setServiceNodes] = useState<RFServiceNode[]>(INITIAL_SERVICE_NODES);
  const [edges, setEdges] = useState<RFServiceEdge[]>(INITIAL_EDGES);

  /** Namespace background nodes derived from serviceNodes */
  const namespaceNodes = useMemo(() => computeNamespaceNodes(serviceNodes), [serviceNodes]);

  /** All nodes passed to <ReactFlow>: namespace backgrounds first (lower z-index) */
  const nodes = useMemo(
    (): RFFlowNode[] => [...namespaceNodes, ...serviceNodes],
    [namespaceNodes, serviceNodes],
  );

  /** Handle node changes from ReactFlow (position, selection, resize, remove) */
  const onNodesChange = useCallback((changes: NodeChange<RFFlowNode>[]) => {
    // Ignore changes to computed namespace nodes
    const serviceChanges = changes.filter(
      c => !('id' in c) || !(c.id as string).startsWith(NS_ID_PREFIX),
    ) as NodeChange<RFServiceNode>[];

    if (serviceChanges.length === 0) return;

    // Cascade edge removal when a node is removed
    const removedIds = serviceChanges
      .filter(c => c.type === 'remove')
      .map(c => c.id);

    if (removedIds.length > 0) {
      setEdges(eds =>
        eds.filter(e => !removedIds.includes(e.source) && !removedIds.includes(e.target)),
      );
    }

    setServiceNodes(nds => applyNodeChanges(serviceChanges, nds));
  }, []);

  /** Handle edge changes from ReactFlow (selection, remove) */
  const onEdgesChange = useCallback((changes: EdgeChange<RFServiceEdge>[]) => {
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, []);

  /** Handle new connection drawn by user (drag from Handle to Handle) */
  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => {
      // Only block exact duplicates (same source handle → same target handle).
      // A→B and B→A, or multiple edges between the same pair, are allowed.
      const alreadyExists = eds.some(
        e =>
          e.source === connection.source &&
          e.target === connection.target &&
          (e.sourceHandle ?? null) === (connection.sourceHandle ?? null) &&
          (e.targetHandle ?? null) === (connection.targetHandle ?? null),
      );
      if (alreadyExists) return eds;
      const newEdge: RFServiceEdge = {
        ...connection,
        id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'service' as const,
        data: {},
        markerEnd: { type: MarkerType.ArrowClosed },
      };
      return [...eds, newEdge];
    });
  }, []);

  /** Add a new service node at position (300, 300) */
  const addNode = useCallback((name: string, nodeType: NodeTypeKey, namespace?: string) => {
    const id =
      name.trim().toLowerCase().replace(/\s+/g, '-') +
      '-' +
      Math.random().toString(36).slice(2, 7);
    const newNode: RFServiceNode = {
      id,
      type: 'service' as const,
      position: { x: 300, y: 300 },
      data: { name: name.trim(), nodeType, namespace },
      width: NODE_W,
      height: NODE_H,
    };
    setServiceNodes(nds => [...nds, newNode]);
  }, []);

  /**
   * Update a service node's properties.
   * Accepts the same `Partial<GraphNode>` shape used by Sidebar so that
   * Sidebar.tsx requires no changes.
   */
  const updateNode = useCallback((id: string, patch: Partial<GraphNode>) => {
    setServiceNodes(nds =>
      nds.map(n => {
        if (n.id !== id) return n;
        const updated = { ...n, data: { ...n.data } };
        if (patch.name !== undefined) updated.data.name = patch.name;
        if (patch.type !== undefined) updated.data.nodeType = patch.type;
        if ('namespace' in patch)
          updated.data.namespace = patch.namespace || undefined;
        if ('width' in patch) updated.width = patch.width;
        if ('height' in patch) updated.height = patch.height;
        return updated;
      }),
    );
  }, []);

  /**
   * Update a service edge's properties.
   * Accepts the same `Partial<GraphEdge>` shape used by Sidebar.
   */
  const updateEdge = useCallback((id: string, patch: Partial<GraphEdge>) => {
    setEdges(eds =>
      eds.map(e => {
        if (e.id !== id) return e;
        const updated = { ...e, data: { ...e.data } };
        if ('type' in patch) updated.data!.integrationType = patch.type;
        if ('label' in patch) updated.data!.label = patch.label;
        return updated;
      }),
    );
  }, []);

  /**
   * Batch-import from canonical GraphNode[]/GraphEdge[] format.
   * Used after importing service-schema or schema-export JSON.
   */
  const importGraphData = useCallback((graphNodes: GraphNode[], graphEdges: GraphEdge[]) => {
    setServiceNodes(graphNodesToRF(graphNodes));
    setEdges(graphEdgesToRF(graphEdges));
  }, []);

  /**
   * Batch-restore from a React Flow native flow export.
   * Used by the Save/Restore (RF native JSON) import format.
   */
  const restoreFlow = useCallback((rfNodes: RFServiceNode[], rfEdges: RFServiceEdge[]) => {
    // Ensure all edges have the correct type and markerEnd
    const restoredEdges = rfEdges.map(e => ({
      ...e,
      type: 'service' as const,
      markerEnd: e.markerEnd ?? { type: MarkerType.ArrowClosed },
    }));
    setServiceNodes(rfNodes.map(n => ({ ...n, type: 'service' as const })));
    setEdges(restoredEdges);
  }, []);

  return {
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
  };
}
