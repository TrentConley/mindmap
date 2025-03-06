import React, { memo } from 'react';
import { EdgeProps, getStraightPath, BaseEdge } from '@xyflow/react';
import { useLearning } from '../context/LearningContext';

// MindMapEdge component
function MindMapEdge({ 
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const { nodeProgress } = useLearning();
  
  // Get source and target node progress
  const sourceNode = nodeProgress[source] || { status: 'not_started' };
  const targetNode = nodeProgress[target] || { status: 'not_started' };
  
  // Determine the edge styling based on node statuses
  const getEdgeStyle = () => {
    // If target is completed, show a solid line
    if (targetNode.status === 'completed') {
      return {
        strokeWidth: 4,
        stroke: '#2ecc71', // Green
        opacity: 1,
      };
    }
    
    // If source is completed and target is in progress or unlockable
    if (sourceNode.status === 'completed' && 
        (targetNode.status === 'in_progress' || targetNode.unlockable)) {
      return {
        strokeWidth: 4,
        stroke: '#f39c12', // Orange
        opacity: 1,
        strokeDasharray: '6 4', // Dashed line
        animation: 'flow 1s linear infinite',
      };
    }
    
    // If target is locked
    if (targetNode.status === 'locked') {
      return {
        strokeWidth: 3,
        stroke: '#95a5a6', // Gray
        opacity: 0.7,
        strokeDasharray: '4 3', // Dotted line
      };
    }
    
    // Default style
    return {
      strokeWidth: 3,
      stroke: '#3498db', // Default blue 
      opacity: 0.9,
    };
  };
  
  // Get path for the edge
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });
  
  const edgeStyle = getEdgeStyle();
  
  return (
    <>
      <BaseEdge 
        id={id}
        path={edgePath} 
        markerEnd={markerEnd}
        className="mindmap-edge"
        style={{
          ...style,
          ...edgeStyle,
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))',
        }}
      />
      
      {/* Animation for "in progress" edges */}
      {sourceNode.status === 'completed' && 
       (targetNode.status === 'in_progress' || targetNode.unlockable) && (
        <style jsx>{`
          @keyframes flow {
            0% {
              stroke-dashoffset: 10;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }
          .mindmap-edge {
            transition: all 0.3s ease;
          }
        `}</style>
      )}
    </>
  );
}

export default memo(MindMapEdge); 