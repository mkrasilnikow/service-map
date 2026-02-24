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

import { useRef, useState } from 'react';
import type { GraphNode, GraphEdge } from '../../../types';
import { importServiceSchema, importSchemaExport } from '../../../utils/import';

/** UI string constants */
const LABELS = {
  TITLE: '⬡ IMPORT',
  FORMAT: 'FORMAT',
  SERVICE_SCHEMA: 'service-schema',
  SCHEMA_EXPORT: 'schema-export',
  JSON_INPUT: 'PASTE JSON OR LOAD FILE',
  PLACEHOLDER: 'Paste your JSON here...',
  LOAD_FILE: 'LOAD FILE',
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
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      setJson((ev.target?.result as string) ?? '');
      setError(null);
    };
    reader.onerror = () => setError('Failed to read file.');
    reader.readAsText(file);
    // Reset so the same file can be loaded again if needed
    e.target.value = '';
  };

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

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <label style={{ margin: 0 }}>{LABELS.JSON_INPUT}</label>
          <button
            className="toolbar-btn"
            style={{ marginLeft: 'auto', padding: '2px 10px', fontSize: 11 }}
            onClick={() => fileInputRef.current?.click()}
          >
            {LABELS.LOAD_FILE}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleFileLoad}
          />
        </div>
        {fileName && (
          <div style={{ fontSize: 11, color: '#86efac', marginBottom: 4 }}>
            {fileName}
          </div>
        )}
        <textarea
          style={{ height: 200, resize: 'vertical', fontFamily: 'inherit', fontSize: 11 }}
          value={json}
          onChange={e => { setJson(e.target.value); setFileName(null); }}
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
