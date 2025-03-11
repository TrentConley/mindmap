import axios from 'axios';
import { Node, Edge } from '@xyflow/react';

// Define the base URL for the API
// Check if we're in production mode and if we should use a relative or absolute URL
const isProd = import.meta.env.PROD;
const PRODUCTION_URL = 'https://api.themindmap.ai';

// In production, we'll use the production URL; in development, the proxy handles routing
let baseUrl = '';
let apiPath = '/api';

// If we have an environment variable set, use that (useful for testing different backends)
if (import.meta.env.VITE_BACKEND_URL) {
  baseUrl = import.meta.env.VITE_BACKEND_URL;
  console.log('Using environment BACKEND_URL:', baseUrl);
} 
// Otherwise use production URL in production, and relative path in development
else if (isProd) {
  baseUrl = PRODUCTION_URL;
  console.log('Using production backend URL:', baseUrl);
} else {
  // In development, the proxy in vite.config.ts will handle the routing
  console.log('Using development proxy for API calls');
}

// Construct the full API URL
const API_URL = `${baseUrl}${apiPath}`;
console.log('Final API_URL:', API_URL);

// Type definitions
export interface Question {
  id: string;
  text: string;
  status: string;
  attempts: number;
  last_answer?: string;
  feedback?: string;
  grade?: number;
}

export interface NodeProgress {
  node_id: string;
  status: string;
  questions: Question[];
  unlockable: boolean;
}

export interface NodeData {
  label: string;
  content: string;
  status?: string;
  [key: string]: any; // Add index signature for compatibility
}

export interface MindMapResponse {
  nodes: Node<NodeData>[];
  edges: Edge[];
}

// Helper function for error handling
const handleApiError = (error: any, functionName: string) => {
  const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
  console.error(`Error in ${functionName}:`, errorMessage, error);
  throw new Error(`API Error (${functionName}): ${errorMessage}`);
};

// API functions
export async function initializeSession(sessionId: string, nodes: Node<NodeData>[], edges: Edge[]) {
  try {
    // Prepare the data in the format the backend expects
    const formattedNodes = nodes.map(node => ({
      id: node.id,
      data: {
        label: node.data.label,
        content: node.data.content,
        status: node.data.status || 'locked'
      },
      position: node.position || { x: 0, y: 0 },
      type: node.type || 'mindmap'
    }));

    const formattedEdges = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'mindmap'
    }));

    console.log('Initializing session with backend:', {
      session_id: sessionId,
      nodeCount: formattedNodes.length,
      edgeCount: formattedEdges.length
    });
    console.log('API_URL:', API_URL);
    const response = await axios.post(`${API_URL}/session/init`, {
      session_id: sessionId,
      nodes: formattedNodes,
      edges: formattedEdges
    });

    console.log('Session initialized successfully:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, 'initializeSession');
  }
}

export async function createMindMap(sessionId: string, topic: string, maxNodes = 15, maxDepth = 3) {
  try {
    console.log(`Creating mindmap for topic: ${topic} with sessionId: ${sessionId}`);
    const response = await axios.post<MindMapResponse>(`${API_URL}/mindmap/create`, {
      session_id: sessionId,
      topic,
      max_nodes: maxNodes,
      max_depth: maxDepth
    });
    console.log('Mindmap created successfully:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, 'createMindMap');
  }
}

export async function generateChildNodes(sessionId: string, nodeId: string, maxChildren = 4) {
  try {
    console.log(`Generating child nodes for node: ${nodeId} in session: ${sessionId}`);
    const response = await axios.post<MindMapResponse>(`${API_URL}/mindmap/generate-child-nodes`, {
      session_id: sessionId,
      node_id: nodeId,
      max_children: maxChildren
    });
    console.log('Child nodes generated successfully:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, 'generateChildNodes');
  }
}

export async function generateQuestions(sessionId: string, nodeId: string, nodeContent: string, nodeLabel: string) {
  try {
    console.log(`Generating questions for node: ${nodeId} - ${nodeLabel}`);
    const response = await axios.post(`${API_URL}/questions/generate`, {
      session_id: sessionId,
      node_id: nodeId,
      node_content: nodeContent,
      node_label: nodeLabel,
      parent_nodes: [],
      child_nodes: []
    });
    console.log('Questions generated successfully:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, 'generateQuestions');
  }
}

export async function submitAnswer(sessionId: string, nodeId: string, questionId: string, answer: string) {
  try {
    console.log(`Submitting answer for question: ${questionId} in node: ${nodeId}`);
    const response = await axios.post(`${API_URL}/questions/answer`, {
      session_id: sessionId,
      node_id: nodeId,
      question_id: questionId,
      answer
    });
    console.log('Answer submitted successfully:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, 'submitAnswer');
  }
}

export async function checkNodeUnlockable(sessionId: string, nodeId: string) {
  try {
    console.log(`Checking if node ${nodeId} is unlockable`);
    const response = await axios.post(`${API_URL}/nodes/check-unlockable`, {
      session_id: sessionId,
      node_id: nodeId
    });
    console.log('Node unlockable check result:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, 'checkNodeUnlockable');
  }
}

export async function updateNodeStatus(sessionId: string, nodeId: string, status: string) {
  try {
    console.log(`Updating node ${nodeId} status to: ${status}`);
    const response = await axios.post(`${API_URL}/nodes/update-status`, {
      session_id: sessionId,
      node_id: nodeId,
      status
    });
    console.log('Node status updated:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, 'updateNodeStatus');
  }
}

export async function getSessionData(sessionId: string) {
  try {
    console.log(`Getting session data for: ${sessionId}`);
    const response = await axios.get(`${API_URL}/session/data`, {
      params: { session_id: sessionId }
    });
    console.log('Session data retrieved:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, 'getSessionData');
  }
}

export async function getNodeData(sessionId: string, nodeId: string) {
  try {
    console.log(`Getting data for node: ${nodeId}`);
    const response = await axios.get(`${API_URL}/nodes/${nodeId}`, {
      params: { session_id: sessionId }
    });
    console.log('Node data retrieved:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, 'getNodeData');
  }
}

export async function getProgress(sessionId: string) {
  try {
    console.log(`Getting progress for session: ${sessionId}`);
    const response = await axios.get(`${API_URL}/progress`, {
      params: { session_id: sessionId }
    });
    console.log('Progress retrieved:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, 'getProgress');
  }
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatHistory {
  node_id: string;
  messages: ChatMessage[];
}

export async function getChatHistory(sessionId: string, nodeId: string) {
  try {
    console.log(`Getting chat history for node: ${nodeId}`);
    const response = await axios.get<ChatHistory>(`${API_URL}/chat/${nodeId}`, {
      params: { session_id: sessionId }
    });
    console.log('Chat history retrieved:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, 'getChatHistory');
  }
}

export async function sendChatMessage(sessionId: string, nodeId: string, message: string) {
  try {
    console.log(`Sending chat message for node: ${nodeId}`);
    const response = await axios.post<ChatHistory>(`${API_URL}/chat/${nodeId}`, {
      session_id: sessionId,
      node_id: nodeId,
      message
    });
    console.log('Chat response received:', response.data);
    return response.data;
  } catch (error) {
    handleApiError(error, 'sendChatMessage');
  }
}