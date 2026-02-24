/**
 * @file ExportModal — modal dialog showing export options.
 *
 * Options:
 *   - Mermaid diagram output (copy & download as .md)
 *   - RF native flow JSON (copy & download as .json) — Save/Restore format
 *   - Download PNG image of the current canvas
 */

import { useState } from 'react';
import { downloadMermaid, downloadJson, downloadImage } from '../../../utils/export';

const LABELS = {
  TITLE: '⬡ EXPORT',
  MERMAID: 'MERMAID DIAGRAM',
  FLOW_JSON: 'FLOW JSON (SAVE / RESTORE)',
  COPY_MERMAID: 'COPY MERMAID',
  COPY_JSON: 'COPY JSON',
  DOWNLOAD_MD: 'DOWNLOAD .MD',
  DOWNLOAD_JSON: 'DOWNLOAD JSON',
  DOWNLOAD_IMAGE: '⬇ DOWNLOAD IMAGE',
  DOWNLOADING: 'SAVING...',
  CLOSE: 'CLOSE',
} as const;

interface ExportModalProps {
  mermaid: string;
  flowJson: string;
  isDark: boolean;
  onClose: () => void;
}

export function ExportModal({ mermaid, flowJson, isDark, onClose }: ExportModalProps) {
  const [imageLoading, setImageLoading] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  const handleDownloadImage = async () => {
    if (imageLoading) return;
    setImageLoading(true);
    try {
      await downloadImage(isDark);
    } finally {
      setImageLoading(false);
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

        <label>{LABELS.FLOW_JSON}</label>
        <textarea
          style={{ height: 100, resize: 'vertical', fontFamily: 'inherit', fontSize: 11 }}
          readOnly
          value={flowJson}
        />

        <div className="modal-actions" style={{ flexWrap: 'wrap' }}>
          <button className="toolbar-btn" onClick={() => copyToClipboard(mermaid)}>
            {LABELS.COPY_MERMAID}
          </button>
          <button className="toolbar-btn" onClick={() => downloadMermaid(mermaid)}>
            {LABELS.DOWNLOAD_MD}
          </button>
          <button className="toolbar-btn" onClick={() => copyToClipboard(flowJson)}>
            {LABELS.COPY_JSON}
          </button>
          <button
            className="toolbar-btn success"
            onClick={() => downloadJson(flowJson, 'service-map.json')}
          >
            {LABELS.DOWNLOAD_JSON}
          </button>
          <button
            className="toolbar-btn success"
            onClick={handleDownloadImage}
            disabled={imageLoading}
          >
            {imageLoading ? LABELS.DOWNLOADING : LABELS.DOWNLOAD_IMAGE}
          </button>
          <button className="toolbar-btn" onClick={onClose}>
            {LABELS.CLOSE}
          </button>
        </div>
      </div>
    </div>
  );
}
