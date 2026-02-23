/**
 * @file AddNodeModal — modal dialog for creating a new service node.
 *
 * Presents a form with:
 *   - Service name text input
 *   - Namespace text input (optional, for grouping)
 *   - Node type selector (visual grid of type cards)
 *   - Cancel / Add buttons
 *
 * Pressing Enter in the name field submits the form.
 *
 * @param props.onAdd - Callback with (name, type, namespace?) when the user confirms.
 * @param props.onClose - Callback to close the modal.
 * @param props.isDark - Whether dark theme is active.
 */

import { useState } from 'react';
import type { NodeTypeKey } from '../../../types';
import { NODE_TYPES } from '../../../constants/nodeTypes';

/** UI string constants */
const LABELS = {
  TITLE: '+ ADD NEW NODE',
  SERVICE_NAME: 'SERVICE NAME',
  NAMESPACE: 'NAMESPACE (OPTIONAL)',
  NAMESPACE_PLACEHOLDER: 'e.g. backend, infra',
  TYPE: 'TYPE',
  PLACEHOLDER: 'e.g. payment-service',
  CANCEL: 'CANCEL',
  ADD: 'ADD NODE',
} as const;

interface AddNodeModalProps {
  onAdd: (name: string, type: NodeTypeKey, namespace?: string) => void;
  onClose: () => void;
  isDark: boolean;
}

export function AddNodeModal({ onAdd, onClose, isDark }: AddNodeModalProps) {
  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState('');
  const [type, setType] = useState<NodeTypeKey>('spring-boot');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name, type, namespace.trim() || undefined);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{LABELS.TITLE}</h3>

        <label>{LABELS.SERVICE_NAME}</label>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={LABELS.PLACEHOLDER}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />

        <label>{LABELS.NAMESPACE}</label>
        <input
          value={namespace}
          onChange={e => setNamespace(e.target.value)}
          placeholder={LABELS.NAMESPACE_PLACEHOLDER}
        />

        <label>{LABELS.TYPE}</label>
        <div className="type-grid" style={{ marginBottom: 16 }}>
          {Object.entries(NODE_TYPES).map(([key, config]) => (
            <div
              key={key}
              className="type-card"
              style={{
                borderColor:
                  type === key
                    ? config.color
                    : (isDark ? config.borderDark : config.borderLight) + '40',
                background:
                  type === key ? (isDark ? config.bgDark : config.bgLight) : 'var(--bg)',
                color: config.color,
                fontSize: 11,
              }}
              onClick={() => setType(key as NodeTypeKey)}
            >
              <div style={{ fontSize: 18 }}>{config.icon}</div>
              <div style={{ letterSpacing: '0.03em', marginTop: 3 }}>{config.label}</div>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="toolbar-btn" onClick={onClose}>
            {LABELS.CANCEL}
          </button>
          <button className="toolbar-btn success" onClick={handleAdd}>
            {LABELS.ADD}
          </button>
        </div>
      </div>
    </div>
  );
}
