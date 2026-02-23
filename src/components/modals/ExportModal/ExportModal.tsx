/**
 * @file ExportModal — modal dialog showing export options.
 *
 * Displays:
 *   - Mermaid diagram output (read-only textarea, copy & download buttons)
 *   - Schema-export JSON output (read-only textarea, copy & download buttons)
 *   - PDF export button (renders SVG canvas to A3 landscape PDF)
 *   - Close button
 *
 * @param props.mermaid - Pre-generated Mermaid diagram string.
 * @param props.schemaExport - Pre-generated schema-export JSON string.
 * @param props.svgRef - Ref to the SVG element for PDF export.
 * @param props.onClose - Callback to close the modal.
 */

import { useState } from 'react';
import { toPdf, downloadMermaid } from '../../../utils/export';

/** UI string constants */
const LABELS = {
  TITLE: '⬡ EXPORT',
  MERMAID: 'MERMAID DIAGRAM',
  SCHEMA_EXPORT: 'SCHEMA-EXPORT (JSON)',
  COPY_MERMAID: 'COPY MERMAID',
  COPY_JSON: 'COPY JSON',
  DOWNLOAD_MD: 'DOWNLOAD .MD',
  DOWNLOAD_JSON: 'DOWNLOAD JSON',
  EXPORT_PDF: 'EXPORT PDF',
  EXPORTING_PDF: 'EXPORTING...',
  CLOSE: 'CLOSE',
} as const;

interface ExportModalProps {
  mermaid: string;
  schemaExport: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onClose: () => void;
}

export function ExportModal({ mermaid, schemaExport, svgRef, onClose }: ExportModalProps) {
  const [pdfLoading, setPdfLoading] = useState(false);

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

  const handlePdfExport = async () => {
    if (!svgRef.current || pdfLoading) return;
    setPdfLoading(true);
    try {
      await toPdf(svgRef.current, 'Service Map');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ minWidth: 520 }} onClick={e => e.stopPropagation()}>
        <h3>{LABELS.TITLE}</h3>

        <label>{LABELS.MERMAID}</label>
        <textarea
          style={{ height: 140, resize: 'vertical', fontFamily: 'inherit', fontSize: 11 }}
          readOnly
          value={mermaid}
        />

        <label>{LABELS.SCHEMA_EXPORT}</label>
        <textarea
          style={{ height: 100, resize: 'vertical', fontFamily: 'inherit', fontSize: 11 }}
          readOnly
          value={schemaExport}
        />

        <div className="modal-actions" style={{ flexWrap: 'wrap' }}>
          <button className="toolbar-btn" onClick={() => copyToClipboard(mermaid)}>
            {LABELS.COPY_MERMAID}
          </button>
          <button className="toolbar-btn" onClick={() => downloadMermaid(mermaid)}>
            {LABELS.DOWNLOAD_MD}
          </button>
          <button className="toolbar-btn" onClick={() => copyToClipboard(schemaExport)}>
            {LABELS.COPY_JSON}
          </button>
          <button className="toolbar-btn success" onClick={downloadJson}>
            {LABELS.DOWNLOAD_JSON}
          </button>
          <button
            className="toolbar-btn success"
            onClick={handlePdfExport}
            disabled={pdfLoading}
          >
            {pdfLoading ? LABELS.EXPORTING_PDF : LABELS.EXPORT_PDF}
          </button>
          <button className="toolbar-btn" onClick={onClose}>
            {LABELS.CLOSE}
          </button>
        </div>
      </div>
    </div>
  );
}
