import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import { NODE_TYPES } from '../../constants/nodeTypes';
import { useTheme } from '../../context/ThemeContext';
import type { RFServiceNode, NodeTypeKey } from '../../types';

export function ServiceNode({ data, selected }: NodeProps<RFServiceNode>) {
  const { isDark } = useTheme();
  const config = NODE_TYPES[(data.nodeType as NodeTypeKey) ?? 'external'] ?? NODE_TYPES.external;
  const bg = isDark ? config.bgDark : config.bgLight;
  const borderColor = isDark ? config.borderDark : config.borderLight;

  return (
    <>
      <NodeResizer
        minWidth={120}
        minHeight={48}
        maxWidth={400}
        maxHeight={200}
        isVisible={selected}
        lineStyle={{ borderColor: config.color }}
        handleStyle={{ background: config.color, border: `1px solid ${config.color}` }}
      />

      <Handle type="target" position={Position.Left} className="service-handle" />
      <Handle type="source" position={Position.Right} className="service-handle" />
      <Handle type="target" position={Position.Top} className="service-handle" />
      <Handle type="source" position={Position.Bottom} className="service-handle" />

      <div
        className="service-node-wrap"
        style={{
          background: bg,
          border: `${selected ? 2 : 1.5}px ${config.dashed ? 'dashed' : 'solid'} ${borderColor}`,
          boxShadow: selected
            ? `0 0 0 2px ${config.color}30, 0 4px 20px ${config.color}20`
            : undefined,
        }}
      >
        <div className="service-node-accent" style={{ background: config.color }} />

        <div className="service-node-body">
          <span className="service-node-icon">{config.icon}</span>
          <div className="service-node-info">
            <div className="service-node-name" style={{ color: config.color }}>
              {data.name}
            </div>
            <div
              className="service-node-type"
              style={{ color: config.color + (isDark ? '80' : 'aa') }}
            >
              {config.label.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
