/**
 * @file Import utilities for the Service Map Editor.
 *
 * Supports two import formats:
 *   - service-schema — a high-level service definition with integrations.
 *   - schema-export — a full graph snapshot including node positions.
 *
 * Both functions validate the input and return a result with either
 * parsed data or an error message.
 */

import type { GraphNode, GraphEdge, NodeTypeKey, IntegrationTypeKey } from '../types';
import { NODE_TYPES } from '../constants/nodeTypes';
import { EDGE_TYPES } from '../constants/edgeTypes';
import { computeLayout } from './layout';
import { validateServiceSchema } from './schema';

/** Result type for import operations */
interface ImportResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Valid node type keys for validation */
const VALID_NODE_TYPES = new Set(Object.keys(NODE_TYPES));
/** Valid edge type keys for validation */
const VALID_EDGE_TYPES = new Set(Object.keys(EDGE_TYPES));

/**
 * Import a service-schema JSON string.
 * Validates the structure and generates auto-layout positions.
 *
 * @param json - Raw JSON string in service-schema format.
 * @returns Parsed nodes and edges, or throws an Error with a message.
 */
export function importServiceSchema(json: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON: could not parse the input.');
  }

  /* Run JSON Schema validation first */
  const validationErrors = validateServiceSchema(data);
  if (validationErrors.length > 0) {
    const messages = validationErrors.map(e => `${e.path}: ${e.message}`);
    throw new Error('Validation errors:\n' + messages.join('\n'));
  }

  const obj = data as Record<string, unknown>;
  const services = obj.services as Record<string, unknown>[];

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  let edgeCounter = 0;

  for (let i = 0; i < services.length; i++) {
    const svc = services[i];

    if (!svc.id || typeof svc.id !== 'string') {
      throw new Error(`Service at index ${i}: missing or invalid "id".`);
    }
    if (!svc.name || typeof svc.name !== 'string') {
      throw new Error(`Service "${svc.id}": missing or invalid "name".`);
    }
    if (!svc.type || !VALID_NODE_TYPES.has(svc.type as string)) {
      throw new Error(
        `Service "${svc.id}": invalid type "${String(svc.type)}". ` +
        `Valid types: ${[...VALID_NODE_TYPES].join(', ')}.`,
      );
    }

    nodes.push({
      id: svc.id as string,
      name: svc.name as string,
      type: svc.type as NodeTypeKey,
      namespace: typeof svc.namespace === 'string' ? svc.namespace : undefined,
      x: 0,
      y: 0,
    });

    if (Array.isArray(svc.integrations)) {
      for (const integ of svc.integrations as Record<string, unknown>[]) {
        if (!integ.target || typeof integ.target !== 'string') {
          throw new Error(`Service "${svc.id}": integration missing "target".`);
        }

        const edgeType = integ.type as string | undefined;
        if (edgeType && !VALID_EDGE_TYPES.has(edgeType)) {
          throw new Error(
            `Service "${svc.id}": invalid integration type "${edgeType}". ` +
            `Valid types: ${[...VALID_EDGE_TYPES].join(', ')}.`,
          );
        }

        edges.push({
          id: `e-import-${edgeCounter++}`,
          source: svc.id as string,
          target: integ.target as string,
          type: edgeType as IntegrationTypeKey | undefined,
          label: typeof integ.label === 'string' ? integ.label : undefined,
        });
      }
    }
  }

  /* Apply auto-layout */
  const layoutNodes = computeLayout(nodes, edges);
  return { nodes: layoutNodes, edges };
}

/**
 * Import a schema-export JSON string.
 * Restores the full canvas state including node positions.
 *
 * @param json - Raw JSON string in schema-export format.
 * @returns Parsed nodes and edges, or throws an Error with a message.
 */
export function importSchemaExport(json: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON: could not parse the input.');
  }

  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid schema-export: expected a JSON object.');
  }

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.nodes)) {
    throw new Error('Invalid schema-export: missing "nodes" array.');
  }
  if (!Array.isArray(obj.edges)) {
    throw new Error('Invalid schema-export: missing "edges" array.');
  }

  const nodes: GraphNode[] = (obj.nodes as Record<string, unknown>[]).map((n, i) => {
    if (!n.id || typeof n.id !== 'string') throw new Error(`Node at index ${i}: missing "id".`);
    if (!n.name || typeof n.name !== 'string') throw new Error(`Node "${n.id}": missing "name".`);
    if (typeof n.x !== 'number' || typeof n.y !== 'number') {
      throw new Error(`Node "${n.id}": missing x/y coordinates.`);
    }

    return {
      id: n.id as string,
      name: n.name as string,
      type: (VALID_NODE_TYPES.has(n.type as string) ? n.type : 'external') as NodeTypeKey,
      namespace: typeof n.namespace === 'string' ? n.namespace : undefined,
      x: n.x as number,
      y: n.y as number,
    };
  });

  const edges: GraphEdge[] = (obj.edges as Record<string, unknown>[]).map((e, i) => {
    if (!e.id || typeof e.id !== 'string') throw new Error(`Edge at index ${i}: missing "id".`);
    if (!e.source || typeof e.source !== 'string') throw new Error(`Edge "${e.id}": missing "source".`);
    if (!e.target || typeof e.target !== 'string') throw new Error(`Edge "${e.id}": missing "target".`);

    return {
      id: e.id as string,
      source: e.source as string,
      target: e.target as string,
      type: VALID_EDGE_TYPES.has(e.type as string) ? (e.type as IntegrationTypeKey) : undefined,
      label: typeof e.label === 'string' ? e.label : undefined,
    };
  });

  return { nodes, edges };
}
