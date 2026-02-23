/**
 * @file Central graph state management hook.
 *
 * Provides all CRUD operations for nodes and edges:
 * - addNode / removeNode / updateNode
 * - addEdge / removeEdge / updateEdge
 * - setNodes / setEdges (batch updates for import)
 * - Selection state
 *
 * @returns An object with the current graph state and mutation functions.
 */

import { useState, useCallback } from 'react';
import type {
  GraphNode,
  GraphEdge,
  NodeTypeKey,
  Selection,
  IntegrationTypeKey,
} from '../types';

/** Demo nodes shown on first load */
const DEMO_NODES: GraphNode[] = [
  { id: 'api-gateway',           name: 'api-gateway',           type: 'spring-boot', x: 380, y: 60  },
  { id: 'user-service',          name: 'user-service',          type: 'spring-boot', x: 120, y: 200 },
  { id: 'order-service',         name: 'order-service',         type: 'spring-boot', x: 380, y: 200 },
  { id: 'notification-service',  name: 'notification-service',  type: 'nodejs',      x: 640, y: 200 },
  { id: 'redis-cache',           name: 'redis-cache',           type: 'redis',       x: 120, y: 360 },
  { id: 'kafka-cluster',         name: 'kafka-cluster',         type: 'kafka',       x: 380, y: 360 },
  { id: 'postgres-users',        name: 'postgres-users',        type: 'postgresql',  x: 120, y: 500 },
  { id: 'postgres-orders',       name: 'postgres-orders',       type: 'postgresql',  x: 380, y: 500 },
  { id: 'mongodb-notifications', name: 'mongodb-notifications', type: 'mongodb',     x: 640, y: 360 },
];

/** Demo edges shown on first load */
const DEMO_EDGES: GraphEdge[] = [
  { id: 'e1', source: 'api-gateway',          target: 'user-service',          type: 'REST'   },
  { id: 'e2', source: 'api-gateway',          target: 'order-service',         type: 'REST'   },
  { id: 'e3', source: 'api-gateway',          target: 'notification-service',  type: 'REST'   },
  { id: 'e4', source: 'user-service',         target: 'redis-cache',           type: 'cache'  },
  { id: 'e5', source: 'user-service',         target: 'postgres-users',        type: 'db'     },
  { id: 'e6', source: 'order-service',        target: 'postgres-orders',       type: 'db'     },
  { id: 'e7', source: 'order-service',        target: 'kafka-cluster',         type: 'pub/sub'},
  { id: 'e8', source: 'kafka-cluster',        target: 'notification-service',  type: 'pub/sub'},
  { id: 'e9', source: 'notification-service', target: 'mongodb-notifications', type: 'db'     },
];

/** Generates a short random ID */
function genId(): string {
  return Math.random().toString(36).slice(2, 9);
}

/**
 * Hook that manages the full graph state (nodes, edges, selection).
 *
 * @returns Object containing:
 *   - nodes / edges — current graph data
 *   - selected — currently selected element (node or edge)
 *   - CRUD functions for nodes and edges
 *   - setNodes / setEdges — batch setters for import
 */
export function useGraph() {
  const [nodes, setNodes] = useState<GraphNode[]>(DEMO_NODES);
  const [edges, setEdges] = useState<GraphEdge[]>(DEMO_EDGES);
  const [selected, setSelected] = useState<Selection | null>(null);

  /** Add a new node with the given name and type at position (300, 300) */
  const addNode = useCallback((name: string, type: NodeTypeKey) => {
    const id = name.trim().toLowerCase().replace(/\s+/g, '-') + '-' + genId();
    const node: GraphNode = { id, name: name.trim(), type, x: 300, y: 300 };
    setNodes(prev => [...prev, node]);
    return node;
  }, []);

  /** Remove a node by ID and all connected edges */
  const removeNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelected(prev => (prev?.id === nodeId ? null : prev));
  }, []);

  /** Update properties of a node by ID */
  const updateNode = useCallback((nodeId: string, patch: Partial<GraphNode>) => {
    setNodes(prev => prev.map(n => (n.id === nodeId ? { ...n, ...patch } : n)));
  }, []);

  /** Add a new edge between two nodes (prevents duplicates) */
  const addEdge = useCallback((source: string, target: string, type?: IntegrationTypeKey) => {
    setEdges(prev => {
      const exists = prev.some(
        e =>
          (e.source === source && e.target === target) ||
          (e.source === target && e.target === source),
      );
      if (exists) return prev;
      return [...prev, { id: genId(), source, target, type, label: '' }];
    });
  }, []);

  /** Remove an edge by ID */
  const removeEdge = useCallback((edgeId: string) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
    setSelected(prev => (prev?.id === edgeId ? null : prev));
  }, []);

  /** Update properties of an edge by ID */
  const updateEdge = useCallback((edgeId: string, patch: Partial<GraphEdge>) => {
    setEdges(prev => prev.map(e => (e.id === edgeId ? { ...e, ...patch } : e)));
  }, []);

  /** Delete the currently selected element (node or edge) */
  const deleteSelected = useCallback(() => {
    if (!selected) return;
    if (selected.kind === 'node') {
      removeNode(selected.id);
    } else {
      removeEdge(selected.id);
    }
  }, [selected, removeNode, removeEdge]);

  return {
    nodes,
    edges,
    selected,
    setNodes,
    setEdges,
    setSelected,
    addNode,
    removeNode,
    updateNode,
    addEdge,
    removeEdge,
    updateEdge,
    deleteSelected,
  };
}
