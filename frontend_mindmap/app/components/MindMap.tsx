import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow as Flow,
  Node, 
  Edge,
  Controls, 
  Background, 
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
import { ApiService } from '../services/api';

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
  
  // Get context values and functions
  const learningContext = useLearning();
  
  // Add a ref to track previous progress state
  const prevProgressRef = useRef(learningContext.nodeProgress);
  
  // Initialize MindMap data on component mount
  useEffect(() => {
    const initializeMindMap = async () => {
      setIsLoading(true);
      try {
        // Initialize the session
        await learningContext.initializeSession();
        
        // Convert context nodes to React Flow nodes
        if (learningContext.nodes && learningContext.nodes.length > 0) {
          const flowNodes = learningContext.nodes.map((node: any) => ({
            id: node.id,
            type: 'mindmap',
            position: node.position || { x: 0, y: 0 },
            data: {
              label: node.data?.label || 'Untitled',
              content: node.data?.content || '',
              status: learningContext.nodeProgress[node.id]?.status || 'not_started'
            }
          })) as Node<MindMapNodeData>[];
          
          setNodes(flowNodes);
          
          // Set edges
          if (learningContext.edges && learningContext.edges.length > 0) {
            setEdges(learningContext.edges as Edge[]);
          }
        }
      } catch (error) {
        console.error('Failed to initialize mind map:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeMindMap();
  }, []);
  
  // Update nodes when node progress changes
  useEffect(() => {
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
  }, [learningContext.nodeProgress, setNodes]);
  
  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
  }, []);
  
  // Close question panel
  const closeQuestionPanel = useCallback(() => {
    setSelectedNode(null);
  }, []);
  
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
  
  const showCreateMindMapModal = () => {
    setIsCreateModalOpen(true);
  };
  
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
    <div className="h-full w-full relative" style={{ minHeight: '500px' }}>
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="h-full w-full border border-gray-200 rounded">
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
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2, includeHiddenNodes: true }}
            minZoom={0.5}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            style={{ background: '#f5f8fa', minHeight: '100%' }}
            panOnDrag={true}
            zoomOnScroll={true}
          >
            <Controls />
            <Background color="#aaa" gap={16} />
            <Panel position="top-right" className="z-10">
              <div className="bg-white p-2 rounded shadow-lg border border-gray-300">
                <h3 className="font-bold text-lg text-gray-800">Mind Map Learning</h3>
                <p className="text-sm text-gray-600">Click on a node to start learning</p>
                <button 
                  className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded text-sm cursor-pointer"
                  onClick={showCreateMindMapModal}
                >
                  Create New Mindmap
                </button>
              </div>
            </Panel>
          </Flow>
        </div>
      )}
      
      {selectedNode && (
        <QuestionPanel 
          nodeId={selectedNode} 
          onClose={closeQuestionPanel}
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