/**
 * @file Node type configuration registry.
 *
 * Defines the visual properties for every supported node type.
 * To add a new node type:
 *   1. Add a new key to the NodeTypeKey union in types/index.ts.
 *   2. Add a corresponding entry in NODE_TYPES below.
 *   No component changes are required — the UI reads from this config.
 */

import type { NodeTypeConfig, NodeTypeKey } from '../types';

/**
 * Registry of all available node types with their visual configuration.
 * Each entry maps a NodeTypeKey to colors, icons, and labels
 * used by NodeCard and the sidebar legend.
 */
export const NODE_TYPES: Record<NodeTypeKey, NodeTypeConfig> = {
  'spring-boot': {
    label: 'Spring Boot',
    color: '#60a5fa',
    bgLight: '#dbeafe',
    bgDark: '#0f2044',
    borderLight: '#3b82f6',
    borderDark: '#3b82f6',
    icon: '☕',
  },
  nodejs: {
    label: 'Node.js',
    color: '#4ade80',
    bgLight: '#dcfce7',
    bgDark: '#0a2010',
    borderLight: '#22c55e',
    borderDark: '#22c55e',
    icon: '⬡',
  },
  mongodb: {
    label: 'MongoDB',
    color: '#86efac',
    bgLight: '#d1fae5',
    bgDark: '#0a2010',
    borderLight: '#4ade80',
    borderDark: '#4ade80',
    icon: '🌿',
  },
  kafka: {
    label: 'Kafka',
    color: '#fb923c',
    bgLight: '#ffedd5',
    bgDark: '#2a1500',
    borderLight: '#f97316',
    borderDark: '#f97316',
    icon: '⇌',
  },
  redis: {
    label: 'Redis',
    color: '#f87171',
    bgLight: '#fee2e2',
    bgDark: '#2a0f0f',
    borderLight: '#ef4444',
    borderDark: '#ef4444',
    icon: '⚡',
  },
  postgresql: {
    label: 'PostgreSQL',
    color: '#38bdf8',
    bgLight: '#e0f2fe',
    bgDark: '#0a1e2e',
    borderLight: '#0ea5e9',
    borderDark: '#0ea5e9',
    icon: '🗄',
  },
  external: {
    label: 'External',
    color: '#94a3b8',
    bgLight: '#f1f5f9',
    bgDark: '#1e293b',
    borderLight: '#94a3b8',
    borderDark: '#64748b',
    icon: '🌐',
    dashed: true,
  },
};

/** Width of a node card in pixels */
export const NODE_W = 172;

/** Height of a node card in pixels */
export const NODE_H = 58;

