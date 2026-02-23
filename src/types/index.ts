/**
 * @file Core TypeScript types and interfaces for the Service Map Editor.
 *
 * Defines the data structures used across the application:
 * - Graph elements (nodes, edges)
 * - Configuration types for node and edge styling
 * - Application state interfaces
 * - Selection and interaction mode types
 */

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

/** Interaction mode for the canvas */
export type InteractionMode = 'select' | 'connect';

/**
 * Visual configuration for a single node type.
 * Defines how a node of this type is rendered on the canvas.
 */
export interface NodeTypeConfig {
  /** Human-readable label shown on the node card */
  label: string;
  /** Primary text/accent color (hex) */
  color: string;
  /** Card background color for light theme */
  bgLight: string;
  /** Card background color for dark theme */
  bgDark: string;
  /** Border color for light theme */
  borderLight: string;
  /** Border color for dark theme */
  borderDark: string;
  /** Emoji icon displayed on the card */
  icon: string;
  /** Whether the card border should be dashed */
  dashed?: boolean;
}

/**
 * Visual configuration for an integration (edge) type.
 * Defines how the label/badge is styled on the edge.
 */
export interface EdgeTypeConfig {
  /** Human-readable label shown on the edge */
  label: string;
  /** Badge text color */
  color: string;
  /** Badge background color */
  bg: string;
}

/**
 * A single node on the service map canvas.
 * Represents a microservice, database, message broker, or external system.
 */
export interface GraphNode {
  /** Unique identifier */
  id: NodeId;
  /** Display name shown on the node card */
  name: string;
  /** Node type key referencing nodeTypes config */
  type: NodeTypeKey;
  /** X coordinate on the canvas */
  x: number;
  /** Y coordinate on the canvas */
  y: number;
  /** Optional namespace for grouping */
  namespace?: string;
}

/**
 * A directed edge connecting two nodes on the canvas.
 * Represents an integration between two services.
 */
export interface GraphEdge {
  /** Unique identifier */
  id: EdgeId;
  /** Source node ID */
  source: NodeId;
  /** Target node ID */
  target: NodeId;
  /** Optional integration type */
  type?: IntegrationTypeKey;
  /** Optional human-readable label displayed on the edge */
  label?: string;
  /** Manual X offset for the edge control point (for repositioning the curve) */
  controlOffsetX?: number;
  /** Manual Y offset for the edge control point (for repositioning the curve) */
  controlOffsetY?: number;
}

/**
 * Represents the currently selected element on the canvas.
 * Can be either a node or an edge.
 */
export interface Selection {
  /** Whether the selected element is a node or an edge */
  kind: 'node' | 'edge';
  /** ID of the selected element */
  id: string;
}

/**
 * Internal drag state used by the useDrag hook.
 * Tracks the node being dragged and its original position.
 */
export interface DragState {
  /** ID of the node being dragged */
  nodeId: NodeId;
  /** Mouse X at drag start (SVG coordinates) */
  startX: number;
  /** Mouse Y at drag start (SVG coordinates) */
  startY: number;
  /** Node's original X before drag */
  origX: number;
  /** Node's original Y before drag */
  origY: number;
}
