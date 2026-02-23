/**
 * @file ExportModal — modal dialog showing export options.
 *
 * Displays:
 *   - Mermaid diagram output (read-only textarea, copy button)
 *   - Schema-export JSON output (read-only textarea, copy button)
 *   - Close button
 *
 * @param props.mermaid - Pre-generated Mermaid diagram string.
 * @param props.schemaExport - Pre-generated schema-export JSON string.
 * @param props.onClose - Callback to close the modal.
 */

/** UI string constants */
const LABELS = {
  TITLE: '⬡ EXPORT',
  MERMAID: 'MERMAID DIAGRAM',
  SCHEMA_EXPORT: 'SCHEMA-EXPORT (JSON)',
  COPY_MERMAID: 'COPY MERMAID',
  COPY_JSON: 'COPY JSON',
  DOWNLOAD_JSON: 'DOWNLOAD JSON',
  CLOSE: 'CLOSE',
} as const;

interface ExportModalProps {
  mermaid: string;
  schemaExport: string;
  onClose: () => void;
}

export function ExportModal({ mermaid, schemaExport, onClose }: ExportModalProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  const downloadJson = () => {
    const blob = new Blob([schemaExport], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'service-map-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ minWidth: 520 }} onClick={e => e.stopPropagation()}>
        <h3>{LABELS.TITLE}</h3>

        <label>{LABELS.MERMAID}</label>
        <textarea
          style={{ height: 160, resize: 'vertical', fontFamily: 'inherit', fontSize: 11 }}
          readOnly
          value={mermaid}
        />

        <label>{LABELS.SCHEMA_EXPORT}</label>
        <textarea
          style={{ height: 120, resize: 'vertical', fontFamily: 'inherit', fontSize: 11 }}
          readOnly
          value={schemaExport}
        />

        <div className="modal-actions">
          <button className="toolbar-btn" onClick={() => copyToClipboard(mermaid)}>
            {LABELS.COPY_MERMAID}
          </button>
          <button className="toolbar-btn" onClick={() => copyToClipboard(schemaExport)}>
            {LABELS.COPY_JSON}
          </button>
          <button className="toolbar-btn success" onClick={downloadJson}>
            {LABELS.DOWNLOAD_JSON}
          </button>
          <button className="toolbar-btn" onClick={onClose}>
            {LABELS.CLOSE}
          </button>
        </div>
      </div>
    </div>
  );
}
