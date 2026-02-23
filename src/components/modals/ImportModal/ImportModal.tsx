/**
 * @file ImportModal — modal dialog for importing graph data from JSON.
 *
 * Supports two import formats:
 *   - service-schema — high-level service definitions with auto-layout.
 *   - schema-export — full graph snapshot with positions.
 *
 * Displays a textarea for pasting JSON, a format selector, and
 * validation error messages.
 *
 * @param props.onImport - Callback with parsed (nodes, edges) on success.
 * @param props.onClose - Callback to close the modal.
 */

import { useState } from 'react';
import type { GraphNode, GraphEdge } from '../../../types';
import { importServiceSchema, importSchemaExport } from '../../../utils/import';

/** UI string constants */
const LABELS = {
  TITLE: '⬡ IMPORT',
  FORMAT: 'FORMAT',
  SERVICE_SCHEMA: 'service-schema',
  SCHEMA_EXPORT: 'schema-export',
  JSON_INPUT: 'PASTE JSON',
  PLACEHOLDER: 'Paste your JSON here...',
  CANCEL: 'CANCEL',
  IMPORT: 'IMPORT',
} as const;

type ImportFormat = 'service-schema' | 'schema-export';

interface ImportModalProps {
  onImport: (nodes: GraphNode[], edges: GraphEdge[]) => void;
  onClose: () => void;
}

export function ImportModal({ onImport, onClose }: ImportModalProps) {
  const [format, setFormat] = useState<ImportFormat>('service-schema');
  const [json, setJson] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    setError(null);
    try {
      const result =
        format === 'service-schema'
          ? importServiceSchema(json)
          : importSchemaExport(json);
      onImport(result.nodes, result.edges);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ minWidth: 520 }} onClick={e => e.stopPropagation()}>
        <h3>{LABELS.TITLE}</h3>

        <label>{LABELS.FORMAT}</label>
        <select value={format} onChange={e => setFormat(e.target.value as ImportFormat)}>
          <option value="service-schema">{LABELS.SERVICE_SCHEMA}</option>
          <option value="schema-export">{LABELS.SCHEMA_EXPORT}</option>
        </select>

        <label>{LABELS.JSON_INPUT}</label>
        <textarea
          style={{ height: 200, resize: 'vertical', fontFamily: 'inherit', fontSize: 11 }}
          value={json}
          onChange={e => setJson(e.target.value)}
          placeholder={LABELS.PLACEHOLDER}
        />

        {error && (
          <div
            style={{
              color: '#f87171',
              fontSize: 11,
              padding: '8px 12px',
              background: '#2a0f0f',
              borderRadius: 6,
              border: '1px solid #7f1d1d',
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button className="toolbar-btn" onClick={onClose}>
            {LABELS.CANCEL}
          </button>
          <button className="toolbar-btn success" onClick={handleImport}>
            {LABELS.IMPORT}
          </button>
        </div>
      </div>
    </div>
  );
}
