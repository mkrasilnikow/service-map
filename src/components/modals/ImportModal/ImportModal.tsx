/**
 * @file ImportModal — modal dialog for importing graph data from JSON.
 *
 * Supports three import formats:
 *   - service-schema  — high-level service definitions with auto-layout.
 *   - schema-export   — legacy full graph snapshot with positions.
 *   - flow (RF)       — React Flow native save/restore format.
 */

import { useRef, useState } from 'react';
import type { GraphNode, GraphEdge, RFServiceNode, RFServiceEdge, RFFlowExport } from '../../../types';
import { importServiceSchema, importSchemaExport } from '../../../utils/import';

const LABELS = {
  TITLE: '⬡ IMPORT',
  FORMAT: 'FORMAT',
  SERVICE_SCHEMA: 'service-schema',
  SCHEMA_EXPORT: 'schema-export (legacy)',
  FLOW: 'flow (RF native)',
  JSON_INPUT: 'PASTE JSON OR LOAD FILE',
  PLACEHOLDER: 'Paste your JSON here...',
  LOAD_FILE: 'LOAD FILE',
  CANCEL: 'CANCEL',
  IMPORT: 'IMPORT',
} as const;

type ImportFormat = 'service-schema' | 'schema-export' | 'flow';

export type ImportResult =
  | { format: 'service-schema' | 'schema-export'; nodes: GraphNode[]; edges: GraphEdge[] }
  | { format: 'flow'; nodes: RFServiceNode[]; edges: RFServiceEdge[]; viewport: RFFlowExport['viewport'] };

interface ImportModalProps {
  onImport: (result: ImportResult) => void;
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
    e.target.value = '';
  };

  const handleImport = () => {
    setError(null);
    try {
      if (format === 'flow') {
        let data: unknown;
        try {
          data = JSON.parse(json);
        } catch {
          throw new Error('Invalid JSON: could not parse the input.');
        }
        if (typeof data !== 'object' || data === null || !Array.isArray((data as any).nodes)) {
          throw new Error('Invalid flow format: expected { nodes, edges, viewport }.');
        }
        const flow = data as { nodes: RFServiceNode[]; edges: RFServiceEdge[]; viewport: RFFlowExport['viewport'] };
        onImport({ format: 'flow', nodes: flow.nodes ?? [], edges: flow.edges ?? [], viewport: flow.viewport ?? { x: 0, y: 0, zoom: 1 } });
      } else {
        const result =
          format === 'service-schema'
            ? importServiceSchema(json)
            : importSchemaExport(json);
        onImport({ format, nodes: result.nodes, edges: result.edges });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ minWidth: 520 }} onClick={e => e.stopPropagation()}>
        <h3>{LABELS.TITLE}</h3>

        <label>{LABELS.FORMAT}</label>
        <select
          className="sidebar-input"
          value={format}
          onChange={e => setFormat(e.target.value as ImportFormat)}
          style={{ marginBottom: 12 }}
        >
          <option value="service-schema">{LABELS.SERVICE_SCHEMA}</option>
          <option value="schema-export">{LABELS.SCHEMA_EXPORT}</option>
          <option value="flow">{LABELS.FLOW}</option>
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
          <div style={{ fontSize: 11, color: '#86efac', marginBottom: 4 }}>{fileName}</div>
        )}

        <textarea
          style={{ height: 200, resize: 'vertical', fontFamily: 'inherit', fontSize: 11 }}
          value={json}
          onChange={e => {
            setJson(e.target.value);
            setFileName(null);
          }}
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
              whiteSpace: 'pre-wrap',
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
