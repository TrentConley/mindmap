'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ApiService, 
  NodeData, 
  EdgeData, 
  QuestionData,
  NodeProgressData
} from '../services/api';

// Define context type
interface LearningContextType {
  sessionId: string | null;
  nodes: any[]; // Using any[] to match React Flow node type
  edges: any[]; // Using any[] to match React Flow edge type
  nodeProgress: Record<string, NodeProgressData>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initializeSession: () => Promise<void>;
  generateQuestions: (nodeId: string) => Promise<QuestionData[] | null>;
  answerQuestion: (nodeId: string, questionId: string, answer: string) => Promise<boolean>;
  checkNodeUnlockable: (nodeId: string) => Promise<boolean>;
  updateNodeStatus: (nodeId: string, status: 'not_started' | 'in_progress' | 'completed' | 'locked') => Promise<boolean>;
  getNodeData: (nodeId: string) => any | null; // Using any to match React Flow node type
  refreshProgress: () => Promise<void>;
  setMindMap: (newNodes: any[], newEdges: any[]) => void;
}

// Create context with default values
const LearningContext = createContext<LearningContextType>({
  sessionId: null,
  nodes: [],
  edges: [],
  nodeProgress: {},
  isLoading: false,
  error: null,
  
  initializeSession: async () => {},
  generateQuestions: async () => null,
  answerQuestion: async () => false,
  checkNodeUnlockable: async () => false,
  updateNodeStatus: async () => false,
  getNodeData: () => null,
  refreshProgress: async () => {},
  setMindMap: () => {},
});

// Define default transformer mindmap data
const defaultTransformerMindMap = {
  nodes: [
    {
      id: 'transformer',
      type: 'mindmap',
      data: { 
        label: 'Transformer Architecture', 
        content: 'A neural network architecture that uses self-attention to process sequential data. Revolutionized NLP and beyond.'
      },
      position: { x: 0, y: 0 },
    },
    {
      id: 'encoder',
      type: 'mindmap',
      data: { 
        label: 'Encoder', 
        content: 'Processes the input sequence using self-attention and feed-forward layers. Creates contextual representations of input.'
      },
      position: { x: -150, y: -200 },
    },
    {
      id: 'self-attention',
      type: 'mindmap',
      data: { 
        label: 'Self-Attention', 
        content: 'Allows each token to attend to all other tokens. Uses queries, keys, and values to compute attention scores.'
      },
      position: { x: -150, y: -350 },
    },
    {
      id: 'feed-forward',
      type: 'mindmap',
      data: { 
        label: 'Feed-Forward Network', 
        content: 'Applied position-wise (same network, different inputs per token). Typically has two linear layers with a ReLU activation in between.'
      },
      position: { x: -150, y: -50 },
    },
    {
      id: 'decoder',
      type: 'mindmap',
      data: { 
        label: 'Decoder', 
        content: 'Generates output sequence autoregressively, attending to both itself and encoder output. Also uses N layers.'
      },
      position: { x: 150, y: -200 },
    },
    {
      id: 'masked-attention',
      type: 'mindmap',
      data: { 
        label: 'Masked Self-Attention', 
        content: 'Same as encoder\'s self-attention but masked to prevent attending to future tokens (causal attention).'
      },
      position: { x: 150, y: -350 },
    },
    {
      id: 'cross-attention',
      type: 'mindmap',
      data: { 
        label: 'Cross-Attention', 
        content: 'Attends to encoder output. Q comes from decoder, K and V from encoder, allowing the decoder to focus on relevant parts of the input.'
      },
      position: { x: 150, y: -50 },
    },
  ],
  edges: [
    { id: 'e1', source: 'transformer', target: 'encoder', type: 'mindmap' },
    { id: 'e2', source: 'transformer', target: 'decoder', type: 'mindmap' },
    { id: 'e3', source: 'encoder', target: 'self-attention', type: 'mindmap' },
    { id: 'e4', source: 'encoder', target: 'feed-forward', type: 'mindmap' },
    { id: 'e5', source: 'decoder', target: 'masked-attention', type: 'mindmap' },
    { id: 'e6', source: 'decoder', target: 'cross-attention', type: 'mindmap' },
  ]
};

// Provider component
export const LearningProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<any[]>(defaultTransformerMindMap.nodes);
  const [edges, setEdges] = useState<any[]>(defaultTransformerMindMap.edges);
  const [nodeProgress, setNodeProgress] = useState<Record<string, NodeProgressData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load session from localStorage on mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem('learningSessionId');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      initializeSession();
    }
  }, []);
  
  // Initialize learning session
  const initializeSession = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the session ID
      const sid = await ApiService.initializeSession();
      setSessionId(sid);
      
      // Get the mind map data
      const mapData = await ApiService.getMindMap();
      
      // Use default transformer mindmap if no data is available
      if (!mapData.nodes || mapData.nodes.length === 0) {
        setNodes(defaultTransformerMindMap.nodes);
        setEdges(defaultTransformerMindMap.edges);
        
        // Initialize node progress for default nodes
        const initialProgress: Record<string, NodeProgressData> = {};
        defaultTransformerMindMap.nodes.forEach(node => {
          initialProgress[node.id] = {
            status: node.id === 'transformer' ? 'not_started' : 'locked',
            questions: [],
            unlockable: node.id === 'transformer' // Only root node is unlockable initially
          };
        });
        setNodeProgress(initialProgress);
      } else {
        setNodes(mapData.nodes);
        setEdges(mapData.edges);
      }
      
      // Get initial node progress if there's a session ID
      if (sid) {
        try {
          const progress = await ApiService.getProgress(sid);
          setNodeProgress(progress || {});
        } catch (progressError) {
          console.error("Failed to load progress", progressError);
          // Continue with empty progress
          setNodeProgress({});
        }
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to initialize session", err);
      setError("Failed to initialize learning session");
      setIsLoading(false);
    }
  };
  
  // Generate questions for a node
  const generateQuestions = async (nodeId: string): Promise<QuestionData[] | null> => {
    if (!sessionId) {
      setError("No active session. Please reload the page.");
      return null;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Get the node data
      const nodeData = nodes.find(n => n.id === nodeId);
      
      if (!nodeData) {
        throw new Error(`Node ${nodeId} not found`);
      }
      
      // Update the progress to show in_progress
      const updatedProgress = { 
        ...nodeProgress,
        [nodeId]: { 
          ...nodeProgress[nodeId] || {},
          status: 'in_progress' as const,
          unlockable: true
        } 
      };
      setNodeProgress(updatedProgress);
      
      // Try to update the status on the server
      await ApiService.updateNodeStatus(sessionId, nodeId, 'in_progress');
      
      // Generate questions
      const questions = await ApiService.generateQuestions(sessionId, nodeId);
      
      // Update the node progress
      const newProgress = {
        ...updatedProgress,
        [nodeId]: {
          ...updatedProgress[nodeId],
          questions: questions || []
        }
      };
      setNodeProgress(newProgress);
      
      setIsLoading(false);
      return questions;
    } catch (err) {
      console.error(`Failed to generate questions for node ${nodeId}`, err);
      setError(`Failed to generate questions: ${err instanceof Error ? err.message : String(err)}`);
      setIsLoading(false);
      return null;
    }
  };
  
  // Answer a question
  const answerQuestion = async (nodeId: string, questionId: string, answer: string): Promise<boolean> => {
    if (!sessionId) {
      setError("No active session. Please reload the page.");
      return false;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ApiService.submitAnswer(sessionId, questionId, answer);
      
      // Update the question in the node progress
      if (nodeProgress[nodeId]) {
        const updatedQuestions = nodeProgress[nodeId].questions.map((q: QuestionData) => {
          if (q.id === questionId) {
            return {
              ...q,
              status: result.correct ? 'passed' : 'failed',
              feedback: result.feedback,
              last_answer: answer,
              attempts: (q.attempts || 0) + 1
            } as QuestionData;
          }
          return q;
        });
        
        setNodeProgress({
          ...nodeProgress,
          [nodeId]: {
            ...nodeProgress[nodeId],
            questions: updatedQuestions
          }
        });
      }
      
      setIsLoading(false);
      return result.correct;
    } catch (err) {
      console.error(`Failed to answer question ${questionId}`, err);
      setError(`Failed to submit answer: ${err instanceof Error ? err.message : String(err)}`);
      setIsLoading(false);
      return false;
    }
  };
  
  // Check if a node is unlockable
  const checkNodeUnlockable = async (nodeId: string): Promise<boolean> => {
    if (!sessionId) {
      return false;
    }
    
    try {
      return await ApiService.checkNodeUnlockable(sessionId, nodeId);
    } catch (err) {
      console.error(`Failed to check if node ${nodeId} is unlockable`, err);
      return false;
    }
  };
  
  // Update node status
  const updateNodeStatus = async (
    nodeId: string, 
    status: 'not_started' | 'in_progress' | 'completed' | 'locked'
  ): Promise<boolean> => {
    if (!sessionId) {
      return false;
    }
    
    try {
      // Check if we already have this status to avoid unnecessary updates
      if (nodeProgress[nodeId]?.status === status) {
        return true; // Already in desired state
      }
      
      const success = await ApiService.updateNodeStatus(sessionId, nodeId, status);
      
      if (success) {
        // Use functional update to avoid race conditions
        setNodeProgress(prevProgress => ({
          ...prevProgress,
          [nodeId]: {
            ...(prevProgress[nodeId] || { questions: [], unlockable: true }),
            status
          }
        }));
      }
      
      return success;
    } catch (err) {
      console.error(`Failed to update node ${nodeId} status to ${status}`, err);
      return false;
    }
  };
  
  // Get node data
  const getNodeData = (nodeId: string) => {
    return nodes.find(n => n.id === nodeId) || null;
  };
  
  // Refresh progress data
  const refreshProgress = async (): Promise<void> => {
    if (!sessionId) {
      return;
    }
    
    try {
      const progress = await ApiService.getProgress(sessionId);
      setNodeProgress(progress);
    } catch (err) {
      console.error('Failed to refresh progress data', err);
    }
  };
  
  // Set a new mindmap
  const setMindMap = (newNodes: any[], newEdges: any[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
    
    // Reset node progress for new nodes
    const initialProgress: Record<string, NodeProgressData> = {};
    newNodes.forEach(node => {
      initialProgress[node.id] = {
        status: node.id === newNodes[0]?.id ? 'not_started' : 'locked',
        questions: [],
        unlockable: node.id === newNodes[0]?.id // Only root node is unlockable initially
      };
    });
    
    setNodeProgress(initialProgress);
  };
  
  // Context value
  const contextValue: LearningContextType = {
    sessionId,
    nodes,
    edges,
    nodeProgress,
    isLoading,
    error,
    initializeSession,
    generateQuestions,
    answerQuestion,
    checkNodeUnlockable,
    updateNodeStatus,
    getNodeData,
    refreshProgress,
    setMindMap
  };
  
  return (
    <LearningContext.Provider value={contextValue}>
      {children}
    </LearningContext.Provider>
  );
};

// Custom hook for using the context
export const useLearning = () => useContext(LearningContext);

export default LearningContext; 