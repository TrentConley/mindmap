import axios from 'axios';
import { Node, Edge } from '@xyflow/react';

// Define the base URL for the API
// For local development, use the backend server URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
console.log('BACKEND_URL:', BACKEND_URL);
const API_URL = `${BACKEND_URL}/api`;

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