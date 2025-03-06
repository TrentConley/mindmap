import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow as Flow,
  Node, 
  Edge,
  Controls, 
  Background, 
  BackgroundVariant,
  useNodesState, 
  useEdgesState, 
  ConnectionLineType, 
  addEdge,
  OnConnect,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Panel } from './Panel';
import MindMapNode from './MindMapNode';
import MindMapEdge from './MindMapEdge';
import QuestionPanel from './QuestionPanel';
import { useLearning } from '../context/LearningContext';
import { ApiService, NodeData, EdgeData } from '../services/api';

// Define our node data type
interface MindMapNodeData extends Record<string, unknown> {
  label: string;
  content: string;
  status?: string;
}

// Register custom node and edge types
const nodeTypes: NodeTypes = {
  mindmap: MindMapNode,
};

const edgeTypes: EdgeTypes = {
  mindmap: MindMapEdge,
};

// Default edge options
const defaultEdgeOptions = {
  type: 'mindmap',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#888',
  },
};

// Function to arrange nodes in a hierarchical layout
const arrangeNodesHierarchically = (nodes: Node<MindMapNodeData>[], edges: Edge[]) => {
  // Create a map to store node information
  interface NodeInfo {
    node: Node<MindMapNodeData>;
    level: number;
    children: NodeInfo[];
    parents: NodeInfo[];
  }
  
  const nodeMap = new Map<string, NodeInfo>();
  nodes.forEach(node => {
    nodeMap.set(node.id, { 
      node, 
      level: 0, 
      children: [], 
      parents: [] 
    });
  });
  
  // Create parent-child relationships
  edges.forEach(edge => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    
    if (source && target) {
      source.children.push(target);
      target.parents.push(source);
    }
  });
  
  // Find root nodes (nodes with no parents)
  const rootNodes = Array.from(nodeMap.values()).filter(info => info.parents.length === 0);
  
  // Calculate levels using BFS
  const queue = [...rootNodes];
  while (queue.length > 0) {
    const current = queue.shift() as NodeInfo;
    
    // Add children to queue with incremented level
    current.children.forEach((child: NodeInfo) => {
      // Only update level if the new level is higher
      if (child.level <= current.level) {
        child.level = current.level + 1;
      }
      queue.push(child);
    });
  }
  
  // Group nodes by level
  const levelGroups = new Map();
  nodeMap.forEach(info => {
    if (!levelGroups.has(info.level)) {
      levelGroups.set(info.level, []);
    }
    levelGroups.get(info.level).push(info);
  });
  
  // Position nodes
  const LEVEL_HEIGHT = 200;
  const NODE_WIDTH = 250;
  
  // For each level
  Array.from(levelGroups.keys()).sort().forEach(level => {
    const nodesInLevel = levelGroups.get(level);
    const levelWidth = nodesInLevel.length * NODE_WIDTH;
    const startX = -levelWidth / 2;
    
    // Position each node in the level
    nodesInLevel.forEach((nodeInfo: NodeInfo, index: number) => {
      const x = startX + index * NODE_WIDTH;
      const y = level * LEVEL_HEIGHT;
      
      // Update node position
      nodeInfo.node.position = { x, y };
    });
  });
  
  return nodes.map(node => ({ ...node }));
};

// MindMap component
export default function MindMap() {
  // Explicitly type the React Flow node and edge states with proper generics
  const [nodes, setNodes] = useNodesState<Node<MindMapNodeData>>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get context values and functions
  const learningContext = useLearning();
  
  // Add a ref to track previous progress state
  const prevProgressRef = useRef(learningContext.nodeProgress);
  
  // Initialize MindMap data on component mount
  useEffect(() => {
    const initializeMindMap = async () => {
      if (isInitialized) return;
      
      setIsLoading(true);
      try {
        // Initialize the session
        await learningContext.initializeSession();
        
        // Convert context nodes to React Flow nodes
        if (learningContext.nodes && learningContext.nodes.length > 0) {
          const flowNodes = learningContext.nodes.map((node: NodeData) => ({
            id: node.id,
            type: 'mindmap',
            position: node.position || { x: 0, y: 0 },
            data: {
              label: node.data?.label || 'Untitled',
              content: node.data?.content || '',
              status: learningContext.nodeProgress[node.id]?.status || 'not_started'
            }
          })) as Node<MindMapNodeData>[];
          
          // Convert context edges to React Flow edges
          const flowEdges = learningContext.edges.map((edge: EdgeData) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: 'mindmap',
            animated: true
          })) as Edge[];
          
          // Apply hierarchical layout
          const arrangedNodes = arrangeNodesHierarchically(flowNodes, flowEdges);
          
          setNodes(arrangedNodes);
          setEdges(flowEdges);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize mind map:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeMindMap();
  }, []); // Empty dependency array since we're using isInitialized flag
  
  // Update nodes when node progress changes
  useEffect(() => {
    if (!isInitialized) return;
    
    if (Object.keys(learningContext.nodeProgress).length > 0) {
      // Compare with previous progress state
      const needsUpdate = Object.entries(learningContext.nodeProgress).some(([nodeId, progress]) => {
        const prevStatus = prevProgressRef.current[nodeId]?.status;
        return prevStatus !== progress.status;
      });
      
      if (needsUpdate) {
        setNodes((currentNodes) => 
          currentNodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              status: learningContext.nodeProgress[node.id]?.status || 'not_started'
            }
          }))
        );
      }
      
      // Update the ref with current progress
      prevProgressRef.current = learningContext.nodeProgress;
    }
  }, [learningContext.nodeProgress, setNodes, isInitialized]);
  
  // Handle connection
  const onConnect: OnConnect = useCallback((params) => {
    setEdges((eds) => addEdge({ ...params, type: 'mindmap' }, eds));
  }, []);
  
  // Handle node changes
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds) as Node<MindMapNodeData>[]);
  }, []);

  // Handle edge changes
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds) as Edge[]);
  }, []);
  
  const showCreateMindMapModal = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);
  
  const createNewMindMap = async () => {
    setIsGenerating(true);
    try {
      // Call the API to generate a new mindmap
      const result = await ApiService.createMindMap(newTopic);
      
      // Update the context with the new mindmap
      learningContext.setMindMap(result.nodes, result.edges);
      
      // Clear the input and close the modal
      setNewTopic('');
      
      // Show success message or notification
      alert('Mindmap successfully created!');
    } catch (error) {
      console.error('Failed to create new mind map:', error);
      alert(`Failed to create mindmap: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
      setIsCreateModalOpen(false);
    }
  };
  
  return (
    <div className="w-full h-full bg-[#121212]">
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            <p className="mt-4 text-indigo-500">Loading your mind map...</p>
          </div>
        </div>
      ) : (
        <Flow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionLineType={ConnectionLineType.Straight}
          className="w-full h-full"
          fitView
          attributionPosition="bottom-right"
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={12}
            size={1}
            color="rgba(255, 255, 255, 0.1)"
            style={{ backgroundColor: '#121212' }}
          />
          <Controls />
          <Panel position="top-right" className="bg-[#2a2a2a] p-3 rounded-md shadow-lg">
            <button 
              onClick={showCreateMindMapModal}
              className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Create New Mind Map
            </button>
          </Panel>
          <Panel position="top-right" className="z-10">
            <div className="bg-white p-2 rounded shadow-lg border border-gray-300">
              <h3 className="font-bold text-lg text-gray-800">Mind Map Learning</h3>
              <p className="text-sm text-gray-600">Click on a node to start learning</p>
            </div>
          </Panel>
        </Flow>
      )}
      
      {selectedNode && (
        <QuestionPanel 
          nodeId={selectedNode} 
          onClose={() => setSelectedNode(null)}
        />
      )}
      
      {/* New Mindmap Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Create New Mindmap</h2>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium" htmlFor="topicInput">
                Enter a topic for your mindmap:
              </label>
              <input
                id="topicInput"
                type="text"
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="e.g., Machine Learning, Web Development, Quantum Physics"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded cursor-pointer"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className={`bg-blue-500 text-white font-semibold py-2 px-6 rounded ${
                  isGenerating || !newTopic.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600 cursor-pointer'
                }`}
                onClick={createNewMindMap}
                disabled={isGenerating || !newTopic.trim()}
              >
                {isGenerating ? 'Generating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 