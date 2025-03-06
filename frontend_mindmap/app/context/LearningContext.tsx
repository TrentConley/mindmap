'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ApiService, 
  NodeData, 
  EdgeData, 
  QuestionData,
  NodeProgressData
} from '../services/api';
import { defaultTransformerMindMap } from '../data/defaultMindMap';

// Define context type
interface LearningContextType {
  sessionId: string | null;
  nodes: NodeData[];
  edges: EdgeData[];
  nodeProgress: Record<string, NodeProgressData>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initializeSession: () => Promise<void>;
  generateQuestions: () => Promise<QuestionData[] | null>;
  answerQuestion: () => Promise<boolean>;
  checkNodeUnlockable: () => Promise<boolean>;
  updateNodeStatus: () => Promise<boolean>;
  getNodeData: (nodeId: string) => NodeData | null;
  refreshProgress: () => Promise<void>;
  setMindMap: (newNodes: NodeData[], newEdges: EdgeData[]) => void;
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

// Provider component
export const LearningProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [nodeProgress, setNodeProgress] = useState<Record<string, NodeProgressData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
      const progressData = await ApiService.getProgress();
      
      // Use default transformer mindmap if no data is available
      if (!mapData.nodes || mapData.nodes.length === 0) {
        setNodes(defaultTransformerMindMap.nodes);
        setEdges(defaultTransformerMindMap.edges);
      } else {
        setNodes(mapData.nodes);
        setEdges(mapData.edges);
      }
      
      // Set node progress
      setNodeProgress(progressData);
      
    } catch (err) {
      console.error('Failed to initialize session:', err);
      setError(`Failed to initialize session: ${err instanceof Error ? err.message : String(err)}`);
      
      // Set default data if initialization fails
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
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load session and initialize on mount
  useEffect(() => {
    initializeSession();
  }, []);
  
  // Generate questions for a node
  const generateQuestions = async () => {
    if (!sessionId) {
      setError("No active session. Please reload the page.");
      return null;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const questions = await ApiService.generateQuestions();
      setIsLoading(false);
      return questions;
    } catch (err) {
      console.error(`Failed to generate questions`, err);
      setError(`Failed to generate questions: ${err instanceof Error ? err.message : String(err)}`);
      setIsLoading(false);
      return null;
    }
  };
  
  // Submit an answer
  const answerQuestion = async () => {
    if (!sessionId) {
      setError("No active session. Please reload the page.");
      return false;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ApiService.submitAnswer();
      setIsLoading(false);
      return result.correct;
    } catch (err) {
      console.error(`Failed to submit answer`, err);
      setError(`Failed to submit answer: ${err instanceof Error ? err.message : String(err)}`);
      setIsLoading(false);
      return false;
    }
  };
  
  // Check if a node is unlockable
  const checkNodeUnlockable = async () => {
    if (!sessionId) return false;
    return await ApiService.checkNodeUnlockable();
  };
  
  // Update node status
  const updateNodeStatus = async () => {
    if (!sessionId) return false;
    return await ApiService.updateNodeStatus();
  };
  
  // Get node data
  const getNodeData = (nodeId: string) => {
    return nodes.find(n => n.id === nodeId) || null;
  };
  
  // Refresh progress data
  const refreshProgress = async () => {
    if (!sessionId) return;
    
    try {
      const progress = await ApiService.getProgress();
      setNodeProgress(progress);
    } catch (err) {
      console.error('Failed to refresh progress data', err);
    }
  };
  
  // Set a new mindmap
  const setMindMap = (newNodes: NodeData[], newEdges: EdgeData[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
    
    // Reset node progress for new nodes
    const initialProgress: Record<string, NodeProgressData> = {};
    newNodes.forEach((node: NodeData) => {
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