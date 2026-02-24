import type { NodeProps } from '@xyflow/react';
import { useTheme } from '../../context/ThemeContext';
import type { RFNamespaceNode } from '../../types';

export function NamespaceNode({ data }: NodeProps<RFNamespaceNode>) {
  const { isDark } = useTheme();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: `2px dashed ${isDark ? '#1e3a5f' : '#cbd5e1'}`,
        borderRadius: 12,
        position: 'relative',
        background: isDark ? 'rgba(15, 23, 42, 0.35)' : 'rgba(241, 245, 249, 0.5)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -10,
          left: 14,
          background: isDark ? '#060b14' : '#f8fafc',
          padding: '0 6px',
          fontSize: 10,
          color: isDark ? '#334155' : '#94a3b8',
          letterSpacing: '0.06em',
          fontFamily: "'JetBrains Mono', monospace",
          userSelect: 'none',
        }}
      >
        {data.label}
      </div>
    </div>
  );
}
