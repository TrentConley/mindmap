import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  NodeTypes,
  EdgeTypes,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import MindMapNode from '@/components/nodes/mindmap-node';
import MindMapEdge from '@/components/edges/mindmap-edge';
import NodeDetailModal from '@/components/node-detail-modal';
import TopicSelector from '@/components/topic-selector';
import { Button } from '@/components/ui/button';
import { Question, generateQuestions, submitAnswer, getProgress, createMindMap, initializeSession, updateNodeStatus } from '@/lib/api';
import { generateSessionId } from '@/lib/utils';
import { transformerMindMap } from '@/data/transformer-mindmap';
import PathNavigator from '@/components/path-navigator';

interface MindMapApiResponse {
  nodes: Array<{
    id: string;
    data: {
      label: string;
      content: string;
      status?: string;
    };
    position: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

// Type assertion to make the component compatible with NodeTypes
const nodeTypes = {
  mindmap: MindMapNode as any
} as NodeTypes;

const edgeTypes: EdgeTypes = {
  mindmap: MindMapEdge
};

// Export our internal data type for components that need it
export interface NodeDataType {
  label: string;
  content: string;
  status?: string;
}

// For simplicity and to work around TypeScript issues, we'll use any for our nodes
type MindMapNode = any;

const MindMap: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [topic, setTopic] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [focusedNode, setFocusedNode] = useState<string | null>(null);
  const [nodeQuestions, setNodeQuestions] = useState<Question[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fullNodes, setFullNodes] = useState<any[]>([]);
  const [fullEdges, setFullEdges] = useState<any[]>([]);
  const [lastClickedNode, setLastClickedNode] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [nodePath, setNodePath] = useState<Array<{id: string, label: string}>>([]);
  
  // Initialize session when component mounts
  useEffect(() => {
    if (!sessionId) {
      setSessionId(generateSessionId());
    }
  }, [sessionId]);

  // Function to build the path from root to the current node
  const buildNodePath = useCallback((nodeId: string) => {
    if (!fullNodes.length || !fullEdges.length) return [];
    
    const path: Array<{id: string, label: string}> = [];
    let currentNodeId = nodeId;
    
    // Add the current node to the path (unless it's the root, which we'll add last)
    if (nodeId !== 'root') {
      const currentNode = fullNodes.find(n => n.id === currentNodeId);
      if (currentNode) {
        path.unshift({ id: currentNodeId, label: currentNode.data.label });
      }
    }
    
    // Traverse up to find all ancestors
    while (currentNodeId !== 'root') {
      const parentEdge = fullEdges.find(edge => edge.target === currentNodeId);
      if (!parentEdge) break;
      
      const parentNode = fullNodes.find(n => n.id === parentEdge.source);
      if (!parentNode) break;
      
      currentNodeId = parentEdge.source;
      path.unshift({ id: currentNodeId, label: parentNode.data.label });
    }
    
    // Always make sure root is at the beginning if it's not already there
    if (path.length > 0 && path[0].id !== 'root') {
      const rootNode = fullNodes.find(n => n.id === 'root');
      if (rootNode) {
        path.unshift({ id: 'root', label: rootNode.data.label });
      }
    }
    
    return path;
  }, [fullNodes, fullEdges]);

  // Function to focus on a specific node and show its direct children + parent
  const focusOnNode = useCallback((nodeId: string) => {
    if (!nodeId || !fullNodes.length || !fullEdges.length) {
      console.warn(`Cannot focus on node ${nodeId}: fullNodes or fullEdges is empty`);
      console.log('fullNodes:', fullNodes);
      console.log('fullEdges:', fullEdges);
      return;
    }
    
    console.log(`Focusing on node: ${nodeId}`);
    
    setFocusedNode(nodeId);
    
    // Update the node path
    const path = buildNodePath(nodeId);
    setNodePath(path);
    
    // Find all direct children of the focused node
    const directChildren = fullEdges
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target);
    
    console.log(`Direct children of ${nodeId}:`, directChildren);
    
    // Find parent node (if it exists)
    const parentEdge = fullEdges.find(edge => edge.target === nodeId);
    const parentId = parentEdge?.source;
    
    console.log(`Parent of ${nodeId}:`, parentId);
    
    // Filter nodes to include the focused node, its direct children, and its parent
    const visibleNodes = fullNodes.filter(
      node => node.id === nodeId || 
              directChildren.includes(node.id) || 
              (parentId && node.id === parentId)
    );
    
    // Filter edges to include connections from focused node to its children
    // AND the edge from parent to focused node (if it exists)
    const visibleEdges = fullEdges.filter(
      edge => edge.source === nodeId || 
              (parentId && edge.source === parentId && edge.target === nodeId)
    );
    
    console.log(`Setting ${visibleNodes.length} visible nodes and ${visibleEdges.length} visible edges`);
    
    // Ensure all visible nodes have proper statuses
    const updatedVisibleNodes = visibleNodes.map(node => {
      // Make sure child nodes are properly unlocked if needed
      if (node.id !== nodeId && directChildren.includes(node.id) && node.data.status === 'locked') {
        const parentCompleted = fullNodes.find(n => n.id === nodeId)?.data.status === 'completed';
        if (parentCompleted) {
          return {
            ...node,
            data: {
              ...node.data,
              status: 'not_started'
            }
          };
        }
      }
      
      // Add special styling to parent node
      if (parentId && node.id === parentId) {
        return {
          ...node,
          data: {
            ...node.data,
            isParent: true // Mark as parent for special styling
          }
        };
      }
      
      return node;
    });
    
    // Position nodes with good spacing
    let finalVisibleNodes = [...updatedVisibleNodes];
    
    // Get the focused node
    const focusedNodeObj = finalVisibleNodes.find(n => n.id === nodeId);
    if (focusedNodeObj) {
      // Position the focused node at the center
      const centerPosition = { x: 0, y: 0 };
      
      // Calculate positions for children in a radial layout below the focused node
      const childPositions: Record<string, {x: number, y: number}> = {};
      
      if (directChildren.length > 0) {
        // Calculate optimal layout based on number of children
        if (directChildren.length === 1) {
          // Single child - place directly below
          childPositions[directChildren[0]] = {
            x: 0,
            y: 300
          };
        } else if (directChildren.length <= 3) {
          // 2-3 children - arrange horizontally with adequate spacing
          const width = 300; // Width between each node
          const startX = -((directChildren.length - 1) * width) / 2;
          
          directChildren.forEach((childId, index) => {
            childPositions[childId] = {
              x: startX + index * width,
              y: 250
            };
          });
        } else if (directChildren.length <= 6) {
          // 4-6 children - arrange in two rows
          const colSpacing = 320;
          const rowSpacing = 250;
          
          // Top row has ceiling(n/2) nodes, bottom row has floor(n/2) nodes
          const topRowCount = Math.ceil(directChildren.length / 2);
          const bottomRowCount = Math.floor(directChildren.length / 2);
          
          // Center both rows
          const topRowWidth = (topRowCount - 1) * colSpacing;
          const bottomRowWidth = (bottomRowCount - 1) * colSpacing;
          
          const topRowStartX = -topRowWidth / 2;
          const bottomRowStartX = -bottomRowWidth / 2;
          
          directChildren.forEach((childId, index) => {
            if (index < topRowCount) {
              // Top row
              childPositions[childId] = {
                x: topRowStartX + index * colSpacing,
                y: 230
              };
            } else {
              // Bottom row
              const bottomIndex = index - topRowCount;
              childPositions[childId] = {
                x: bottomRowStartX + bottomIndex * colSpacing,
                y: 230 + rowSpacing
              };
            }
          });
        } else {
          // 7+ children - use grid layout with max 3 per row
          const maxPerRow = 3;
          const colSpacing = 320;
          const rowSpacing = 250;
          
          // Calculate number of rows
          const numRows = Math.ceil(directChildren.length / maxPerRow);
          
          directChildren.forEach((childId, index) => {
            const row = Math.floor(index / maxPerRow);
            const col = index % maxPerRow;
            
            // For each row, calculate how many nodes it has
            const nodesInThisRow = (row === numRows - 1 && directChildren.length % maxPerRow !== 0)
              ? (directChildren.length % maxPerRow)
              : maxPerRow;
            
            // Center this row horizontally
            const rowWidth = (nodesInThisRow - 1) * colSpacing;
            const startX = -rowWidth / 2;
            
            childPositions[childId] = {
              x: startX + col * colSpacing,
              y: 230 + row * rowSpacing
            };
          });
        }
      }
      
      // Position parent node above focused node if it exists
      const parentPosition = parentId ? { x: 0, y: -200 } : null;
      
      // Apply positions to all nodes
      finalVisibleNodes = finalVisibleNodes.map(node => {
        if (node.id === nodeId) {
          // Focused node at center
          return {
            ...node,
            position: centerPosition
          };
        } else if (directChildren.includes(node.id)) {
          // Child nodes in semi-circle
          return {
            ...node,
            position: childPositions[node.id]
          };
        } else if (parentId && node.id === parentId) {
          // Parent node above
          return {
            ...node,
            position: parentPosition,
            data: {
              ...node.data,
              isParent: true // Mark as parent for special styling
            }
          };
        }
        return node;
      });
    }
    
    // Update the visible nodes and edges
    setNodes(finalVisibleNodes);
    setEdges(visibleEdges);
    
    // Log the final node positions
    console.log('Node positions:', finalVisibleNodes.map(n => ({
      id: n.id,
      label: n.data.label,
      x: n.position.x,
      y: n.position.y
    })));
  }, [fullNodes, fullEdges, setNodes, setEdges]);
  
  const handleNodeClick = useCallback(async (_: React.MouseEvent, node: any) => {
    // Prevent interaction with locked nodes
    if (node.data && node.data.status === 'locked') {
      return;
    }
    
    const nodeId = node.id as string;
    setSelectedNode(nodeId);
    const now = Date.now();
    
    // First, make sure node status is updated
    if (node.data.status !== 'completed' && node.data.status !== 'in_progress') {
      try {
        await updateNodeStatus(sessionId, nodeId, 'in_progress');
        
        // Update both full nodes and visible nodes
        setFullNodes(prevNodes => {
          const updated = prevNodes.map(n => 
            n.id === nodeId 
              ? { ...n, data: { ...n.data, status: 'in_progress' } } 
              : n
          );
          console.log(`Updated fullNodes status for ${nodeId}`, updated.find(n => n.id === nodeId)?.data);
          return updated;
        });
        
        setNodes(prevNodes => {
          const updated = prevNodes.map(n => 
            n.id === nodeId 
              ? { ...n, data: { ...n.data, status: 'in_progress' } } 
              : n
          );
          console.log(`Updated visible nodes status for ${nodeId}`, updated.find(n => n.id === nodeId)?.data);
          return updated;
        });
      } catch (error) {
        console.error('Error updating node status:', error);
      }
    }
    
    // Check if this is a double click (same node clicked within 300ms)
    const isDoubleClick = nodeId === lastClickedNode && (now - lastClickTime) < 300;
    
    // Update tracking variables
    setLastClickedNode(nodeId);
    setLastClickTime(now);
    
    // If double-clicked, show the questions modal
    if (isDoubleClick) {
      try {
        // Generate questions for the node
        const questionsResponse = await generateQuestions(
          sessionId,
          nodeId,
          node.data?.content || '',
          node.data?.label || ''
        );
        
        setNodeQuestions(questionsResponse.questions || []);
        setIsModalOpen(true);
      } catch (error) {
        console.error('Error getting node questions:', error);
      }
    } 
    // On first click, just focus on the node
    else {
      console.log(`Focusing on node ${nodeId}`);
      
      // Make sure we have the node in fullNodes
      if (!fullNodes.some(n => n.id === nodeId)) {
        console.error(`Node ${nodeId} not found in fullNodes!`);
        console.log('Available nodes:', fullNodes.map(n => n.id));
      }
      
      // Make sure there are edges for this node
      const nodeEdges = fullEdges.filter(e => e.source === nodeId);
      console.log(`Edges for node ${nodeId}:`, nodeEdges);
      
      focusOnNode(nodeId);
    }
  }, [sessionId, lastClickedNode, lastClickTime, focusOnNode, setNodes, setFullNodes, fullNodes, fullEdges]);

  // Handle viewing of a node
  const handleViewNode = useCallback((nodeId: string) => {
    console.log(`Viewing node: ${nodeId}`);
    
    // Find the node in our nodes array
    const node = fullNodes.find(n => n.id === nodeId);
    if (node) {
      console.log('Node details:', {
        label: node.data.label,
        content: node.data.content,
        status: node.data.status
      });

      // Set this as the selected node
      setSelectedNode(nodeId);
      
      // Focus the view on this node and its children
      focusOnNode(nodeId);
      
      // Simulate a double click to show questions
      handleNodeClick({} as React.MouseEvent, node);
    } else {
      console.warn(`Node ${nodeId} not found in fullNodes`);
    }
  }, [fullNodes, focusOnNode, handleNodeClick, setSelectedNode]);

  // Create nodeTypes with the view handler - memoized to prevent recreation on each render
  const nodeTypesWithHandlers = useMemo(() => ({
    mindmap: (props: any) => (
      <MindMapNode
        {...props}
        onView={handleViewNode}
      />
    )
  }), [handleViewNode]);

  // Update the node processing to remove onView from data
  const processNodes = useCallback((inputNodes: any[]) => {
    return inputNodes.map(node => ({
      ...node,
      type: 'mindmap',
      data: {
        ...node.data,
        status: node.id === 'root' ? 'in_progress' : node.data.status || 'locked'
      },
      draggable: true
    }));
  }, []);

  const handleTopicSelect = async (selectedTopic: string) => {
    setIsLoading(true);
    setTopic(selectedTopic);
    
    try {
      console.log(`Selecting topic: ${selectedTopic}`);
      
      // For 'Transformer Architecture', use our local data
      if (selectedTopic === 'Transformer Architecture') {
        console.log('Using local transformer mindmap data');
        
        // Use our predefined transformer mindmap with the new processNodes function
        const processedNodes = processNodes(transformerMindMap.nodes);

        const processedEdges = transformerMindMap.edges.map(edge => ({
          ...edge,
          type: 'mindmap'
        }));
        
        console.log(`Total nodes: ${processedNodes.length}, Total edges: ${processedEdges.length}`);
        
        // Store the full mindmap
        setFullNodes(processedNodes);
        setFullEdges(processedEdges);
        
        // Set the root node as the focused node
        setFocusedNode('root');
        
        // Filter visible nodes (root and its direct children)
        const rootDirectChildren = processedEdges
          .filter(edge => edge.source === 'root')
          .map(edge => edge.target);
        
        console.log('Root direct children:', rootDirectChildren);
          
        const visibleNodes = processedNodes.filter(
          node => node.id === 'root' || rootDirectChildren.includes(node.id)
        );
        
        const visibleEdges = processedEdges.filter(
          edge => edge.source === 'root'
        );
        
        console.log(`Setting visible nodes: ${visibleNodes.length}, visible edges: ${visibleEdges.length}`);
        console.log('Visible node IDs:', visibleNodes.map(node => node.id));
        
        setNodes(visibleNodes);
        setEdges(visibleEdges);
        
        // Initialize session with all nodes and edges
        await initializeSession(sessionId, processedNodes, processedEdges);
        
        // Set the root node as in_progress
        await updateNodeStatus(sessionId, 'root', 'in_progress');
      } else {
        // For other topics, use the API
        const result = await createMindMap(sessionId, selectedTopic) as MindMapApiResponse;
        
        // Process the nodes to include additional props needed by MindMapNode
        const processedNodes = result.nodes.map(node => ({
          ...node,
          type: 'mindmap',
          data: {
            ...node.data,
            status: 'not_started'
          },
          draggable: true, // Enable dragging for all nodes
        }));

        // Process edges to have the correct type
        const processedEdges = result.edges.map(edge => ({
          ...edge,
          type: 'mindmap'
        }));
        
        // Store the full mindmap
        setFullNodes(processedNodes);
        setFullEdges(processedEdges);
        
        // Initialize session with all nodes and edges
        await initializeSession(sessionId, processedNodes, processedEdges);
        
        // Set the root node as unlocked/in_progress
        if (processedNodes.length > 0) {
          const rootNodeId = processedNodes[0].id;
          await updateNodeStatus(sessionId, rootNodeId, 'in_progress');
          
          // Update local state to reflect the change
          setFullNodes(nodes => 
            nodes.map(node => 
              node.id === rootNodeId 
                ? { ...node, data: { ...node.data, status: 'in_progress' } } 
                : node
            )
          );
          
          // Set the root node as the focused node
          setFocusedNode(rootNodeId);
          
          // Filter visible nodes (root and its direct children)
          const rootDirectChildren = processedEdges
            .filter(edge => edge.source === rootNodeId)
            .map(edge => edge.target);
            
          const visibleNodes = processedNodes.filter(
            node => node.id === rootNodeId || rootDirectChildren.includes(node.id)
          );
          
          const visibleEdges = processedEdges.filter(
            edge => edge.source === rootNodeId
          );
          
          setNodes(visibleNodes);
          setEdges(visibleEdges);
        }
      }
      
    } catch (error) {
      console.error('Error creating mindmap:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle node dragging to update positions in both visible and full node sets
  const handleNodeDrag = useCallback((event: React.MouseEvent, node: any, nodes: any[]) => {

    // Update the node positions in the full nodes array
    setFullNodes(prevNodes => 
      prevNodes.map(n => 
        n.id === node.id ? { ...n, position: node.position } : n
      )
    );
  }, []);

  const handleSubmitAnswer = async (questionId: string, answer: string) => {
    if (!selectedNode) return;
    
    try {
      const answerResponse = await submitAnswer(sessionId, selectedNode, questionId, answer);
      
      // Update the questions array with feedback
      setNodeQuestions(questions => 
        questions.map(q => 
          q.id === questionId 
            ? { 
                ...q, 
                status: answerResponse.passed ? 'passed' : 'failed',
                feedback: answerResponse.feedback,
                grade: answerResponse.grade 
              } 
            : q
        )
      );
      
      // If all questions are passed, update node status to completed
      if (answerResponse.all_passed) {
        // Update both full nodes and visible nodes
        setFullNodes(nodes => 
          nodes.map(node => 
            node.id === selectedNode 
              ? { ...node, data: { ...node.data, status: 'completed' } } 
              : node
          )
        );
        
        setNodes(nodes => 
          nodes.map(node => 
            node.id === selectedNode 
              ? { ...node, data: { ...node.data, status: 'completed' } } 
              : node
          )
        );
        
        // Check which nodes can be unlocked now
        await refreshProgress();
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const refreshProgress = async () => {
    try {
      const progressData = await getProgress(sessionId);
      
      // Update full nodes with current progress status
      setFullNodes(nodes => 
        nodes.map(node => {
          const nodeProgress = progressData.nodes[node.id];
          return nodeProgress 
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  status: nodeProgress.status 
                } 
              } 
            : node;
        })
      );
      
      // Also update visible nodes
      setNodes(nodes => 
        nodes.map(node => {
          const nodeProgress = progressData.nodes[node.id];
          return nodeProgress 
            ? { 
                ...node, 
                data: { 
                  ...node.data, 
                  status: nodeProgress.status 
                } 
              } 
            : node;
        })
      );
      
      // If a node has been completed, check if its children can be unlocked
      if (focusedNode) {
        // Refocus on the current node to update the view with the latest node status
        focusOnNode(focusedNode);
      }
      
    } catch (error) {
      console.error('Error refreshing progress:', error);
    }
  };
  
  // Function to navigate to the parent node
  const navigateToParent = useCallback(() => {
    if (!focusedNode || focusedNode === 'root') return;
    
    // Find the parent edge that points to the current focused node
    const parentEdge = fullEdges.find(edge => edge.target === focusedNode);
    
    if (parentEdge) {
      focusOnNode(parentEdge.source);
    }
  }, [focusedNode, fullEdges, focusOnNode]);

  // If no topic is selected, show the topic selector
  if (!topic) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <TopicSelector onSelectTopic={handleTopicSelect} isLoading={isLoading} />
      </div>
    );
  }

  return (
    <div className="h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypesWithHandlers}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        proOptions={{ hideAttribution: true }}
        fitView
        fitViewOptions={{ padding: 0.2, duration: 800 }}
        className="mindmap-container"
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        zoomOnScroll
        onNodeDragStop={handleNodeDrag}
        key={`flow-${focusedNode}-${nodes.length}-${edges.length}`}
      >
        <Background variant={BackgroundVariant.Dots} />
        <Controls />
        <MiniMap />
      </ReactFlow>
      
      {selectedNode && isModalOpen && (
        <NodeDetailModal
          nodeId={selectedNode}
          label={nodes.find(n => n.id === selectedNode)?.data.label || ''}
          content={nodes.find(n => n.id === selectedNode)?.data.content || ''}
          questions={nodeQuestions}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmitAnswer={handleSubmitAnswer}
        />
      )}
      
      {/* Path Navigator in upper right */}
      <div className="absolute top-4 right-4 z-10">
        <PathNavigator path={nodePath} onNavigate={focusOnNode} />
      </div>
      
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button 
          onClick={() => {
            setTopic(null);
            setNodes([]);
            setEdges([]);
            setSessionId(generateSessionId());
          }}
        >
          New Mindmap
        </Button>
        
        {focusedNode && focusedNode !== 'root' && (
          <Button
            variant="outline"
            onClick={navigateToParent}
          >
            ← Back to Parent
          </Button>
        )}
      </div>
    </div>
  );
};

// Wrap with ReactFlowProvider to ensure context is available
const MindMapWithProvider: React.FC = () => (
  <ReactFlowProvider>
    <MindMap />
  </ReactFlowProvider>
);

export default MindMapWithProvider;