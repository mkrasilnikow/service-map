/**
 * @file Edge (integration) type configuration registry.
 *
 * Defines the visual properties for every supported integration type.
 * To add a new integration type:
 *   1. Add a new key to the IntegrationTypeKey union in types/index.ts.
 *   2. Add a corresponding entry in EDGE_TYPES below.
 *   No component changes are required — the UI reads from this config.
 */

import type { EdgeTypeConfig, IntegrationTypeKey } from '../types';

/**
 * Registry of all available integration (edge) types with badge styling.
 * Used by EdgeLine to render a colored badge on the arrow.
 */
export const EDGE_TYPES: Record<IntegrationTypeKey, EdgeTypeConfig> = {
  REST: {
    label: 'REST',
    color: '#60a5fa',
    bg: '#1e3a5f',
  },
  SOAP: {
    label: 'SOAP',
    color: '#c084fc',
    bg: '#3b1f6e',
  },
  gRPC: {
    label: 'gRPC',
    color: '#34d399',
    bg: '#064e3b',
  },
  GraphQL: {
    label: 'GraphQL',
    color: '#f472b6',
    bg: '#831843',
  },
  'pub/sub': {
    label: 'pub/sub',
    color: '#fb923c',
    bg: '#7c2d12',
  },
  db: {
    label: 'db',
    color: '#38bdf8',
    bg: '#0c4a6e',
  },
  cache: {
    label: 'cache',
    color: '#f87171',
    bg: '#7f1d1d',
  },
};

/** All integration type keys as an array for select dropdowns */
export const EDGE_TYPE_KEYS: IntegrationTypeKey[] = Object.keys(EDGE_TYPES) as IntegrationTypeKey[];
