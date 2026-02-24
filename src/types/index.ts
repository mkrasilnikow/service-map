import type { Node, Edge } from '@xyflow/react';

/** Unique identifier for nodes and edges */
export type NodeId = string;
export type EdgeId = string;

/** Supported node type keys — must match keys in nodeTypes config */
export type NodeTypeKey =
  | 'spring-boot'
  | 'nodejs'
  | 'mongodb'
  | 'kafka'
  | 'redis'
  | 'postgresql'
  | 'external';

/** Supported integration type keys — must match keys in edgeTypes config */
export type IntegrationTypeKey =
  | 'REST'
  | 'SOAP'
  | 'gRPC'
  | 'GraphQL'
  | 'pub/sub'
  | 'db'
  | 'cache';

/**
 * Visual configuration for a single node type.
 */
export interface NodeTypeConfig {
  label: string;
  color: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  icon: string;
  dashed?: boolean;
}

/**
 * Visual configuration for an integration (edge) type.
 */
export interface EdgeTypeConfig {
  label: string;
  color: string;
  bg: string;
}

/**
 * Canonical graph node used by import/export utilities and the Sidebar interface.
 * Not stored in React Flow state directly — App.tsx converts to/from RFServiceNode.
 */
export interface GraphNode {
  id: NodeId;
  name: string;
  type: NodeTypeKey;
  x: number;
  y: number;
  namespace?: string;
  width?: number;
  height?: number;
}

/**
 * Canonical graph edge used by import/export utilities and the Sidebar interface.
 */
export interface GraphEdge {
  id: EdgeId;
  source: NodeId;
  target: NodeId;
  type?: IntegrationTypeKey;
  label?: string;
}

/** Currently selected element on the canvas */
export interface Selection {
  kind: 'node' | 'edge';
  id: string;
}

// ─── React Flow node/edge data types ──────────────────────────────────────────

/** Data stored inside a service node (extends Record for RF compatibility) */
export interface ServiceNodeData extends Record<string, unknown> {
  name: string;
  nodeType: NodeTypeKey;
  namespace?: string;
}

/** Data stored inside a service edge */
export interface ServiceEdgeData extends Record<string, unknown> {
  integrationType?: IntegrationTypeKey;
  label?: string;
}

/** Data stored inside a namespace background node */
export interface NamespaceNodeData extends Record<string, unknown> {
  label: string;
}

/** React Flow node type for services */
export type RFServiceNode = Node<ServiceNodeData, 'service'>;

/** React Flow edge type for service integrations */
export type RFServiceEdge = Edge<ServiceEdgeData, 'service'>;

/** React Flow node type for namespace background rectangles */
export type RFNamespaceNode = Node<NamespaceNodeData, 'namespace'>;

/** Union of all RF node types used by ReactFlow `nodes` prop */
export type RFFlowNode = RFServiceNode | RFNamespaceNode;

/** Shape of a saved React Flow file (native save/restore format) */
export interface RFFlowExport {
  nodes: RFServiceNode[];
  edges: RFServiceEdge[];
  viewport: { x: number; y: number; zoom: number };
}
