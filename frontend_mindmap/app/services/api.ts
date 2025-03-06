/**
 * API service for communicating with the backend
 */

import { v4 as uuidv4 } from 'uuid';

// Types for API requests and responses
export interface NodeData {
  id: string;
  type: string;
  data: {
    label: string;
    content: string;
  };
  position: { x: number; y: number };
  status?: string;
}

export interface QuestionData {
  id: string;
  text: string;
  status: 'unanswered' | 'passed' | 'failed';
  attempts: number;
  last_answer?: string;
  feedback?: string;
  grade?: number;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface SessionData {
  session_id: string;
  nodes: Record<string, NodeData>;
  edges: EdgeData[];
  progress: Record<string, any>;
}

export interface GenerateQuestionsParams {
  session_id: string;
  node_id: string;
  node_label: string;
  node_content: string;
  parent_nodes?: { id: string; label: string; content: string }[];
  child_nodes?: { id: string; label: string; content: string }[];
}

export interface AnswerQuestionParams {
  session_id: string;
  node_id: string;
  question_id: string;
  answer: string;
}

export interface UnlockCheckParams {
  session_id: string;
  node_id: string;
}

export interface GraphDataParams {
  session_id: string;
  nodes: any[];
  edges: any[];
}

export interface NodeProgressData {
  status: 'not_started' | 'in_progress' | 'completed' | 'locked';
  questions: QuestionData[];
  unlockable: boolean;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface AnswerResult {
  correct: boolean;
  feedback: string;
  nextQuestion: string | null;
}

export interface NodeContent {
  id: string;
  title: string;
  content: string;
  type: string;
}

export interface MindMapData {
  nodes: NodeData[];
  edges: EdgeData[];
}

// Mock data for development
const mockData: MindMapData = {
  nodes: [
    {
      id: 'root',
      type: 'mindmap',
      data: { 
        label: 'Transformer Architecture', 
        content: 'The transformer architecture is a neural network architecture introduced in the paper "Attention Is All You Need" (2017). It has become the foundation for many state-of-the-art models in NLP and beyond.'
      },
      position: { x: 0, y: 0 },
    },
    {
      id: 'input-processing',
      type: 'mindmap',
      data: { 
        label: 'Input Processing', 
        content: 'How raw data (e.g., text) is prepared for the transformer.'
      },
      position: { x: -350, y: -200 },
    },
    {
      id: 'encoder',
      type: 'mindmap',
      data: { 
        label: 'Encoder', 
        content: 'Processes the input sequence into a rich representation.'
      },
      position: { x: -150, y: -200 },
    },
    {
      id: 'decoder',
      type: 'mindmap',
      data: { 
        label: 'Decoder', 
        content: 'Generates output sequence using encoder output.'
      },
      position: { x: 150, y: -200 },
    }
  ],
  edges: [
    { id: 'e1', source: 'root', target: 'input-processing', type: 'mindmap' },
    { id: 'e2', source: 'root', target: 'encoder', type: 'mindmap' },
    { id: 'e3', source: 'root', target: 'decoder', type: 'mindmap' }
  ]
};

// API Service
export const ApiService = {
  // Initialize a new learning session
  initializeSession: async (): Promise<string> => {
    const sessionId = localStorage.getItem('learningSessionId') || uuidv4();
    localStorage.setItem('learningSessionId', sessionId);
    return sessionId;
  },

  // Get the mind map data
  getMindMap: async (): Promise<MindMapData> => {
    return mockData;
  },

  // Get progress data
  getProgress: async (): Promise<Record<string, NodeProgressData>> => {
    // Return mock progress data
    return {
      root: {
        status: 'not_started',
        questions: [],
        unlockable: true
      },
      'input-processing': {
        status: 'locked',
        questions: [],
        unlockable: false
      },
      encoder: {
        status: 'locked',
        questions: [],
        unlockable: false
      },
      decoder: {
        status: 'locked',
        questions: [],
        unlockable: false
      }
    };
  },

  // Generate questions for a node
  generateQuestions: async (): Promise<QuestionData[]> => {
    return [
      {
        id: uuidv4(),
        text: 'What is the main purpose of this component?',
        status: 'unanswered',
        attempts: 0
      },
      {
        id: uuidv4(),
        text: 'How does this component interact with other parts of the architecture?',
        status: 'unanswered',
        attempts: 0
      }
    ];
  },

  // Submit an answer
  submitAnswer: async (): Promise<AnswerResult> => {
    return {
      correct: true,
      feedback: 'Good answer! You have demonstrated understanding of the concept.',
      nextQuestion: null
    };
  },

  // Check if a node is unlockable
  checkNodeUnlockable: async (): Promise<boolean> => {
    return true;
  },

  // Update node status
  updateNodeStatus: async (): Promise<boolean> => {
    return true;
  },

  // Create a new mind map
  createMindMap: async (): Promise<MindMapData> => {
    return mockData;
  }
};

export default ApiService; 