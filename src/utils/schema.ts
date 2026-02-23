/**
 * @file JSON Schema definition for the service-schema input format.
 *
 * Provides a JSON Schema object and a validate function that checks
 * incoming service-schema data and returns human-readable error messages.
 *
 * The service-schema format is used to describe a microservice architecture
 * at a high level (services and their integrations), which is then
 * auto-laid out on the canvas.
 */

import { NODE_TYPES } from '../constants/nodeTypes';
import { EDGE_TYPES } from '../constants/edgeTypes';

/** All valid node type keys */
const validNodeTypes = Object.keys(NODE_TYPES);
/** All valid integration type keys */
const validEdgeTypes = Object.keys(EDGE_TYPES);

/**
 * JSON Schema for the service-schema input format.
 * Can be used for external tooling or documentation.
 */
export const SERVICE_SCHEMA_JSON_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'ServiceSchema',
  description: 'Input format for describing a microservice architecture in Service Map Editor.',
  type: 'object',
  required: ['services'],
  properties: {
    version: {
      type: 'string',
      description: 'Schema version (e.g. "1.0").',
    },
    services: {
      type: 'array',
      description: 'List of service definitions.',
      items: {
        type: 'object',
        required: ['id', 'name', 'type'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the service.',
          },
          name: {
            type: 'string',
            description: 'Human-readable display name.',
          },
          type: {
            type: 'string',
            enum: validNodeTypes,
            description: 'Service type (determines visual appearance).',
          },
          namespace: {
            type: 'string',
            description: 'Optional namespace for visual grouping.',
          },
          integrations: {
            type: 'array',
            description: 'List of outgoing integrations.',
            items: {
              type: 'object',
              required: ['target'],
              properties: {
                target: {
                  type: 'string',
                  description: 'ID of the target service.',
                },
                type: {
                  type: 'string',
                  enum: validEdgeTypes,
                  description: 'Integration type (determines badge style).',
                },
                label: {
                  type: 'string',
                  description: 'Optional text label for the connection.',
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

/**
 * Validation error with a path and message.
 */
export interface ValidationError {
  path: string;
  message: string;
}

/**
 * Validate a parsed JSON object against the service-schema format.
 * Returns an array of human-readable validation errors (empty if valid).
 *
 * @param data - The parsed JSON value to validate.
 * @returns Array of validation errors. Empty array means valid.
 */
export function validateServiceSchema(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof data !== 'object' || data === null) {
    errors.push({ path: '/', message: 'Root must be a JSON object.' });
    return errors;
  }

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.services)) {
    errors.push({ path: '/services', message: '"services" must be an array.' });
    return errors;
  }

  const seenIds = new Set<string>();

  for (let i = 0; i < obj.services.length; i++) {
    const svc = obj.services[i];
    const path = `/services[${i}]`;

    if (typeof svc !== 'object' || svc === null) {
      errors.push({ path, message: 'Each service must be an object.' });
      continue;
    }

    const s = svc as Record<string, unknown>;

    /* id */
    if (!s.id || typeof s.id !== 'string') {
      errors.push({ path: `${path}/id`, message: '"id" is required and must be a string.' });
    } else {
      if (seenIds.has(s.id)) {
        errors.push({ path: `${path}/id`, message: `Duplicate service id "${s.id}".` });
      }
      seenIds.add(s.id);
    }

    /* name */
    if (!s.name || typeof s.name !== 'string') {
      errors.push({ path: `${path}/name`, message: '"name" is required and must be a string.' });
    }

    /* type */
    if (!s.type || typeof s.type !== 'string') {
      errors.push({ path: `${path}/type`, message: '"type" is required and must be a string.' });
    } else if (!validNodeTypes.includes(s.type)) {
      errors.push({
        path: `${path}/type`,
        message: `Invalid type "${s.type}". Valid types: ${validNodeTypes.join(', ')}.`,
      });
    }

    /* namespace (optional) */
    if (s.namespace !== undefined && typeof s.namespace !== 'string') {
      errors.push({
        path: `${path}/namespace`,
        message: '"namespace" must be a string if provided.',
      });
    }

    /* integrations (optional) */
    if (s.integrations !== undefined) {
      if (!Array.isArray(s.integrations)) {
        errors.push({
          path: `${path}/integrations`,
          message: '"integrations" must be an array.',
        });
      } else {
        for (let j = 0; j < s.integrations.length; j++) {
          const integ = s.integrations[j];
          const iPath = `${path}/integrations[${j}]`;

          if (typeof integ !== 'object' || integ === null) {
            errors.push({ path: iPath, message: 'Each integration must be an object.' });
            continue;
          }

          const ig = integ as Record<string, unknown>;

          if (!ig.target || typeof ig.target !== 'string') {
            errors.push({
              path: `${iPath}/target`,
              message: '"target" is required and must be a string.',
            });
          }

          if (ig.type !== undefined) {
            if (typeof ig.type !== 'string' || !validEdgeTypes.includes(ig.type)) {
              errors.push({
                path: `${iPath}/type`,
                message: `Invalid integration type "${String(ig.type)}". Valid types: ${validEdgeTypes.join(', ')}.`,
              });
            }
          }

          if (ig.label !== undefined && typeof ig.label !== 'string') {
            errors.push({
              path: `${iPath}/label`,
              message: '"label" must be a string if provided.',
            });
          }
        }
      }
    }
  }

  return errors;
}
