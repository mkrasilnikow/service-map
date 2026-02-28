import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { EDGE_TYPES } from '../../constants/edgeTypes';
import { useTheme } from '../../context/ThemeContext';
import type { RFServiceEdge, IntegrationTypeKey } from '../../types';

export function ServiceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<RFServiceEdge>) {
  const { isDark } = useTheme();

  const parallelIndex = typeof data?.parallelIndex === 'number' ? data.parallelIndex : 0;
  const parallelTotal = typeof data?.parallelTotal === 'number' ? data.parallelTotal : 1;
  // Offset curvature so parallel edges fan out visually (0.1 → 0.7 range).
  const curvature =
    parallelTotal > 1
      ? 0.1 + (parallelIndex / Math.max(parallelTotal - 1, 1)) * 0.6
      : 0.25;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature,
  });

  const intType = data?.integrationType as IntegrationTypeKey | undefined;
  const edgeConfig = intType ? EDGE_TYPES[intType] : null;
  const customLabel = data?.label;

  const strokeColor = selected ? '#f97316' : isDark ? '#334155' : '#94a3b8';
  const strokeWidth = selected ? 2 : 1.5;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: selected ? undefined : '5 4',
        }}
      />

      {(edgeConfig || customLabel) && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
              fontFamily: "'JetBrains Mono', monospace",
              ...(edgeConfig
                ? {
                    background: edgeConfig.bg,
                    color: edgeConfig.color,
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    border: `1px solid ${edgeConfig.color}30`,
                  }
                : {
                    color: isDark ? '#475569' : '#94a3b8',
                    fontSize: 10,
                  }),
            }}
          >
            {edgeConfig ? edgeConfig.label : customLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
