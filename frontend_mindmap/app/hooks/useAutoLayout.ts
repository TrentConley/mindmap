import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import dagre from 'dagre';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 100;

export function useAutoLayout() {
  const { getNodes, getEdges, setNodes } = useReactFlow();

  const onLayout = useCallback(() => {
    const nodes = getNodes();
    const edges = getEdges();

    // Create a new directed graph
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    // Use a top-to-bottom layout (TB) with increased spacing
    dagreGraph.setGraph({ 
      rankdir: 'TB', 
      ranksep: 120,  // Increased vertical spacing between ranks
      nodesep: 80,   // Increased horizontal spacing between nodes
      align: 'UL',   // Upper left alignment of nodes
      ranker: 'network-simplex' // Best for hierarchical layouts
    });

    // Add nodes to the graph with their dimensions
    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { 
        width: NODE_WIDTH, 
        height: NODE_HEIGHT 
      });
    });

    // Add edges to the graph
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    // Apply the layout
    dagre.layout(dagreGraph);

    // Update node positions
    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - NODE_WIDTH / 2,
          y: nodeWithPosition.y - NODE_HEIGHT / 2,
        },
      };
    });

    setNodes(layoutedNodes);
  }, [getNodes, getEdges, setNodes]);

  return { onLayout };
} 