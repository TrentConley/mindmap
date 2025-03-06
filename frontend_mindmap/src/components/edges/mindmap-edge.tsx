import { memo } from 'react';
import { EdgeProps, getStraightPath, BaseEdge } from '@xyflow/react';

interface MindMapEdgeProps extends EdgeProps {
  isHighlighted?: boolean;
}

const MindMapEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
  isHighlighted = false
}: MindMapEdgeProps) => {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        ...style,
        strokeWidth: isHighlighted ? 3 : 2,
        stroke: isHighlighted ? '#3b82f6' : '#94a3b8'
      }}
      markerEnd={markerEnd}
      className={`mindmap-edge ${isHighlighted ? 'highlighted' : ''}`}
    />
  );
});

MindMapEdge.displayName = 'MindMapEdge';

export default MindMapEdge;