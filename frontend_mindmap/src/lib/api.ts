import axios from 'axios';
import { Node, Edge } from '@xyflow/react';

const API_URL = '/api';

// Flag to determine if the backend is available
let backendAvailable = false;

// Helper function to detect if backend is available
const checkBackendAvailability = async () => {
  try {
    await axios.get('/', { timeout: 2000 });
    console.log('Backend is available! Using real API.');
    backendAvailable = true;
  } catch (error) {
    console.warn('Backend not available, using mock API responses');
    backendAvailable = false;
  }
};

// Call this immediately to check backend
checkBackendAvailability();

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

// API functions
// Helper for mocking successful responses
const mockSuccess = (data: any) => {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), 100);
  });
};

// Store session data in memory when offline
const mockSessionData: Record<string, any> = {};

export async function initializeSession(sessionId: string, nodes: Node<NodeData>[], edges: Edge[]) {
  if (backendAvailable) {
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
      console.error('Failed to initialize session:', error);
      backendAvailable = false; // Switch to mock mode on first error
    }
  }
  
  // If backend is not available, use mock data
  mockSessionData[sessionId] = {
    nodes: nodes.reduce((acc: Record<string, any>, node) => {
      acc[node.id] = { 
        status: node.data.status || 'locked',
        questions: []
      };
      return acc;
    }, {}),
    edges
  };
  
  return mockSuccess({ status: 'success' });
}

export async function createMindMap(sessionId: string, topic: string, maxNodes = 15, maxDepth = 3) {
  if (backendAvailable) {
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
      console.error('Failed to create mindmap:', error);
      backendAvailable = false;
    }
  }
  
  // If backend is not available, create a simple mock mindmap
  const mockNodes: Node<NodeData>[] = [
    {
      id: 'root',
      data: { label: topic, content: `Basic overview of ${topic}`, status: 'not_started' },
      position: { x: 0, y: -300 },
    },
    {
      id: 'child1',
      data: { label: 'Definition', content: `Definition and basic concepts of ${topic}`, status: 'locked' },
      position: { x: -200, y: 0 },
    },
    {
      id: 'child2',
      data: { label: 'History', content: `Historical development of ${topic}`, status: 'locked' },
      position: { x: 0, y: 0 },
    },
    {
      id: 'child3',
      data: { label: 'Applications', content: `Real-world applications of ${topic}`, status: 'locked' },
      position: { x: 200, y: 0 },
    }
  ];
  
  const mockEdges: Edge[] = [
    { id: 'e1', source: 'root', target: 'child1' },
    { id: 'e2', source: 'root', target: 'child2' },
    { id: 'e3', source: 'root', target: 'child3' }
  ];
  
  return mockSuccess({ nodes: mockNodes, edges: mockEdges });
}

export async function generateQuestions(sessionId: string, nodeId: string, nodeContent: string, nodeLabel: string) {
  if (backendAvailable) {
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
      console.error('Failed to generate questions:', error);
      backendAvailable = false;
    }
  }
  
  // Generate mock questions based on the node content
  const questions = [
    {
      id: `q1-${nodeId}`,
      text: `What is the main purpose of ${nodeLabel}?`,
      status: 'not_started',
      attempts: 0
    },
    {
      id: `q2-${nodeId}`,
      text: `Explain how ${nodeLabel} works in the transformer architecture.`,
      status: 'not_started',
      attempts: 0
    },
    {
      id: `q3-${nodeId}`,
      text: `Why is ${nodeLabel} important in the transformer model?`,
      status: 'not_started',
      attempts: 0
    }
  ];
  
  // Store questions in mock session data
  if (mockSessionData[sessionId] && mockSessionData[sessionId].nodes[nodeId]) {
    mockSessionData[sessionId].nodes[nodeId].questions = questions;
  }
  
  return mockSuccess({ questions });
}

export async function submitAnswer(sessionId: string, nodeId: string, questionId: string, answer: string) {
  if (backendAvailable) {
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
      console.error('Failed to submit answer:', error);
      backendAvailable = false;
    }
  }
  
  // In mock mode, always consider the answer correct if it has at least 5 characters
  const passed = answer.length >= 5;
  
  // Update the question status in mock data
  if (mockSessionData[sessionId]?.nodes[nodeId]?.questions) {
    const questions = mockSessionData[sessionId].nodes[nodeId].questions;
    const questionIndex = questions.findIndex(q => q.id === questionId);
    
    if (questionIndex !== -1) {
      questions[questionIndex].status = passed ? 'passed' : 'failed';
      questions[questionIndex].feedback = passed 
        ? 'Great answer!' 
        : 'Your answer needs more detail. Please try again.';
      questions[questionIndex].grade = passed ? 1 : 0;
      questions[questionIndex].attempts = (questions[questionIndex].attempts || 0) + 1;
      questions[questionIndex].last_answer = answer;
    }
    
    // Check if all questions are passed
    const all_passed = questions.every(q => q.status === 'passed');
    
    if (all_passed) {
      mockSessionData[sessionId].nodes[nodeId].status = 'completed';
      
      // Unlock child nodes
      const childNodeIds = mockSessionData[sessionId].edges
        .filter(edge => edge.source === nodeId)
        .map(edge => edge.target);
        
      childNodeIds.forEach(childId => {
        if (mockSessionData[sessionId].nodes[childId]) {
          mockSessionData[sessionId].nodes[childId].status = 'not_started';
        }
      });
    }
    
    return mockSuccess({
      passed,
      feedback: passed ? 'Great answer!' : 'Your answer needs more detail. Please try again.',
      grade: passed ? 1 : 0,
      all_passed
    });
  }
  
  return mockSuccess({ passed: true, feedback: 'Mock answer accepted', grade: 1, all_passed: true });
}

export async function checkNodeUnlockable(sessionId: string, nodeId: string) {
  if (backendAvailable) {
    try {
      console.log(`Checking if node ${nodeId} is unlockable`);
      const response = await axios.post(`${API_URL}/nodes/check-unlockable`, {
        session_id: sessionId,
        node_id: nodeId
      });
      console.log('Node unlockable check result:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to check if node is unlockable:', error);
      backendAvailable = false;
    }
  }
  
  // In mock mode, check if all parent nodes are completed
  const unlockable = true; // Simplified for mock implementation
  
  return mockSuccess({ unlockable });
}

export async function updateNodeStatus(sessionId: string, nodeId: string, status: string) {
  if (backendAvailable) {
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
      console.error('Failed to update node status:', error);
      backendAvailable = false;
    }
  }
  
  // Update status in mock data
  if (mockSessionData[sessionId]?.nodes[nodeId]) {
    mockSessionData[sessionId].nodes[nodeId].status = status;
    
    // If a node is completed, unlock its child nodes
    if (status === 'completed') {
      const childNodeIds = mockSessionData[sessionId].edges
        .filter(edge => edge.source === nodeId)
        .map(edge => edge.target);
        
      childNodeIds.forEach(childId => {
        if (mockSessionData[sessionId].nodes[childId]) {
          mockSessionData[sessionId].nodes[childId].status = 'not_started';
        }
      });
    }
  }
  
  return mockSuccess({ status: 'success' });
}

export async function getSessionData(sessionId: string) {
  if (backendAvailable) {
    try {
      console.log(`Getting session data for: ${sessionId}`);
      const response = await axios.get(`${API_URL}/session/data`, {
        params: { session_id: sessionId }
      });
      console.log('Session data retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get session data:', error);
      backendAvailable = false;
    }
  }
  
  return mockSuccess(mockSessionData[sessionId] || { nodes: {}, edges: [] });
}

export async function getNodeData(sessionId: string, nodeId: string) {
  if (backendAvailable) {
    try {
      console.log(`Getting data for node: ${nodeId}`);
      const response = await axios.get(`${API_URL}/nodes/${nodeId}`, {
        params: { session_id: sessionId }
      });
      console.log('Node data retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get node data:', error);
      backendAvailable = false;
    }
  }
  
  return mockSuccess(mockSessionData[sessionId]?.nodes[nodeId] || {});
}

export async function getProgress(sessionId: string) {
  if (backendAvailable) {
    try {
      console.log(`Getting progress for session: ${sessionId}`);
      const response = await axios.get(`${API_URL}/progress`, {
        params: { session_id: sessionId }
      });
      console.log('Progress retrieved:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to get progress:', error);
      backendAvailable = false;
    }
  }
  
  // Return the current mock session data as progress
  return mockSuccess({
    nodes: mockSessionData[sessionId]?.nodes || {},
    session_id: sessionId
  });
}