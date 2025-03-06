/**
 * API service for communicating with the backend
 */

import { v4 as uuidv4 } from 'uuid';

// Types for API requests and responses
export interface NodeData {
  id: string;
  label: string;
  content: string;
  type?: string;
  status?: string;
  position?: { x: number; y: number };
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

// Base API URL
const API_BASE_URL = 'http://localhost:8000/api';

// Helper function to handle API errors
const handleApiError = (error: any): ApiResponse => {
  console.error('API Error:', error);
  return {
    success: false,
    error: error.message || 'An unknown error occurred',
  };
};

// Helper function for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'API request failed',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

// API Service
export const ApiService = {
  // Initialize a new learning session
  initializeSession: async (): Promise<string> => {
    try {
      const sessionId = localStorage.getItem('learningSessionId') || uuidv4();
      
      const response = await apiCall('/session/init', {
        method: 'POST',
        body: JSON.stringify({ 
          session_id: sessionId, 
          nodes: [], 
          edges: [] 
        }),
      });

      if (response.success) {
        localStorage.setItem('learningSessionId', sessionId);
        return sessionId;
      } else {
        throw new Error(response.error || 'Failed to initialize session');
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      throw error;
    }
  },

  // Get the mind map data
  getMindMap: async (): Promise<{ nodes: any[]; edges: any[] }> => {
    // Return a transformer architecture mindmap
    const nodes = [
      {
        id: 'root',
        type: 'mindmap',
        data: { 
          label: 'Transformer Architecture', 
          content: 'The transformer architecture is a neural network architecture introduced in the paper "Attention Is All You Need" (2017). It has become the foundation for many state-of-the-art models in NLP and beyond.'
        },
        position: { x: 0, y: 0 },
      },
      // 1. Input Processing nodes
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
        id: 'tokenization',
        type: 'mindmap',
        data: { 
          label: 'Tokenization', 
          content: 'Converting text into smaller units (tokens). Examples include WordPiece, Byte-Pair Encoding (BPE), and SentencePiece.'
        },
        position: { x: -550, y: -300 },
      },
      {
        id: 'embedding',
        type: 'mindmap',
        data: { 
          label: 'Embedding Layer', 
          content: 'Maps tokens to dense vectors. Each token ID is assigned a learnable embedding vector (e.g., 512 dimensions).'
        },
        position: { x: -550, y: -150 },
      },
      {
        id: 'positional-encoding',
        type: 'mindmap',
        data: { 
          label: 'Positional Encoding', 
          content: 'Adds information about token positions since transformers lack inherent order. Often uses sine and cosine functions of different frequencies.'
        },
        position: { x: -550, y: -0 },
      },
      
      // 2. Encoder nodes
      {
        id: 'encoder',
        type: 'mindmap',
        data: { 
          label: 'Encoder', 
          content: 'Processes the input sequence into a rich representation. Typically consists of N identical layers (e.g., N=6).'
        },
        position: { x: -150, y: -200 },
      },
      {
        id: 'self-attention',
        type: 'mindmap',
        data: { 
          label: 'Multi-Head Self-Attention', 
          content: 'Allows the model to focus on different parts of the input simultaneously. Uses Query (Q), Key (K), and Value (V) projections.'
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
      
      // 3. Decoder nodes
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
      
      // 4. Output nodes
      {
        id: 'output',
        type: 'mindmap',
        data: { 
          label: 'Output', 
          content: 'Transforms the decoder (or encoder) output into final predictions through a linear layer and softmax.'
        },
        position: { x: 350, y: -200 },
      },
      
      // 5. Key Mechanisms
      {
        id: 'key-mechanisms',
        type: 'mindmap',
        data: { 
          label: 'Key Mechanisms', 
          content: 'Core concepts that define transformer functionality: attention, positional encoding, and residual connections.'
        },
        position: { x: 0, y: 200 },
      },
      
      // 6. Training
      {
        id: 'training',
        type: 'mindmap',
        data: { 
          label: 'Training', 
          content: 'How transformers learn their parameters: pretraining objectives, optimization techniques, and regularization methods.'
        },
        position: { x: -200, y: 300 },
      },
      
      // 7. Inference
      {
        id: 'inference',
        type: 'mindmap',
        data: { 
          label: 'Inference', 
          content: 'How the trained model generates or classifies output: greedy decoding, beam search, sampling, etc.'
        },
        position: { x: 200, y: 300 },
      }
    ];
    
    const edges = [
      // Connect root to main sections
      { id: 'e-root-input', source: 'root', target: 'input-processing', type: 'mindmap' },
      { id: 'e-root-encoder', source: 'root', target: 'encoder', type: 'mindmap' },
      { id: 'e-root-decoder', source: 'root', target: 'decoder', type: 'mindmap' },
      { id: 'e-root-output', source: 'root', target: 'output', type: 'mindmap' },
      { id: 'e-root-key', source: 'root', target: 'key-mechanisms', type: 'mindmap' },
      { id: 'e-root-training', source: 'root', target: 'training', type: 'mindmap' },
      { id: 'e-root-inference', source: 'root', target: 'inference', type: 'mindmap' },
      
      // Connect Input Processing to its components
      { id: 'e-input-token', source: 'input-processing', target: 'tokenization', type: 'mindmap' },
      { id: 'e-input-embed', source: 'input-processing', target: 'embedding', type: 'mindmap' },
      { id: 'e-input-pos', source: 'input-processing', target: 'positional-encoding', type: 'mindmap' },
      
      // Connect Encoder to its components
      { id: 'e-encoder-attn', source: 'encoder', target: 'self-attention', type: 'mindmap' },
      { id: 'e-encoder-ffn', source: 'encoder', target: 'feed-forward', type: 'mindmap' },
      
      // Connect Decoder to its components
      { id: 'e-decoder-mask', source: 'decoder', target: 'masked-attention', type: 'mindmap' },
      { id: 'e-decoder-cross', source: 'decoder', target: 'cross-attention', type: 'mindmap' },
      
      // Connect the data flow
      { id: 'e-flow-1', source: 'input-processing', target: 'encoder', type: 'mindmap' },
      { id: 'e-flow-2', source: 'encoder', target: 'decoder', type: 'mindmap' },
      { id: 'e-flow-3', source: 'decoder', target: 'output', type: 'mindmap' }
    ];
    
    return { nodes, edges };
  },

  // Get progress data for all nodes
  getProgress: async (sessionId: string): Promise<Record<string, NodeProgressData>> => {
    // Create progress data for transformer architecture mindmap
    return {
      'root': {
        status: 'completed',
        questions: [],
        unlockable: true
      },
      'input-processing': {
        status: 'not_started',
        questions: [],
        unlockable: true
      },
      'tokenization': {
        status: 'locked',
        questions: [],
        unlockable: false
      },
      'embedding': {
        status: 'locked',
        questions: [],
        unlockable: false
      },
      'positional-encoding': {
        status: 'locked',
        questions: [],
        unlockable: false
      },
      'encoder': {
        status: 'locked',
        questions: [],
        unlockable: false
      },
      'self-attention': {
        status: 'locked',
        questions: [],
        unlockable: false
      },
      'feed-forward': {
        status: 'locked',
        questions: [],
        unlockable: false
      },
      'decoder': {
        status: 'locked',
        questions: [],
        unlockable: false
      },
      'masked-attention': {
        status: 'locked',
        questions: [],
        unlockable: false
      },
      'cross-attention': {
        status: 'locked',
        questions: [],
        unlockable: false
      },
      'output': {
        status: 'locked',
        questions: [],
        unlockable: false
      },
      'key-mechanisms': {
        status: 'locked',
        questions: [],
        unlockable: false
      },
      'training': {
        status: 'locked',
        questions: [],
        unlockable: false
      },
      'inference': {
        status: 'locked',
        questions: [],
        unlockable: false
      }
    };
  },

  // Create a new mind map with Anthropic
  createMindMap: async (topic: string): Promise<{ nodes: any[]; edges: any[] }> => {
    try {
      const sessionId = localStorage.getItem('learningSessionId');
      
      if (!sessionId) {
        throw new Error('No active session. Please reload the page.');
      }
      
      const response = await apiCall('/mindmap/create', {
        method: 'POST',
        body: JSON.stringify({ 
          session_id: sessionId, 
          topic
        }),
      });

      if (response.success) {
        return {
          nodes: response.data.nodes || [],
          edges: response.data.edges || []
        };
      } else {
        throw new Error(response.error || 'Failed to create mindmap');
      }
    } catch (error) {
      console.error('Failed to create mindmap:', error);
      throw error;
    }
  },

  // Generate questions for a node
  generateQuestions: async (sessionId: string, nodeId: string): Promise<QuestionData[]> => {
    // Mock questions for transformer architecture nodes
    const questionsMap: Record<string, QuestionData[]> = {
      'root': [
        {
          id: 'q1-root',
          text: 'What paper introduced the transformer architecture?',
          status: 'unanswered',
          attempts: 0
        },
        {
          id: 'q2-root',
          text: 'What problem does the transformer architecture solve compared to RNNs?',
          status: 'unanswered',
          attempts: 0
        }
      ],
      'input-processing': [
        {
          id: 'q1-input',
          text: 'What are the three main steps in input processing for transformers?',
          status: 'unanswered',
          attempts: 0
        },
        {
          id: 'q2-input',
          text: 'Why is input processing important for transformers?',
          status: 'unanswered',
          attempts: 0
        }
      ],
      'tokenization': [
        {
          id: 'q1-tokenization',
          text: 'What is tokenization in the context of transformers?',
          status: 'unanswered',
          attempts: 0
        },
        {
          id: 'q2-tokenization',
          text: 'Name three common subword tokenization methods.',
          status: 'unanswered',
          attempts: 0
        }
      ],
      'embedding': [
        {
          id: 'q1-embedding',
          text: 'What is the purpose of the embedding layer in transformers?',
          status: 'unanswered',
          attempts: 0
        },
        {
          id: 'q2-embedding',
          text: 'What is a typical embedding dimension used in transformer models?',
          status: 'unanswered',
          attempts: 0
        }
      ],
      'positional-encoding': [
        {
          id: 'q1-pos',
          text: 'Why do transformers need positional encoding?',
          status: 'unanswered',
          attempts: 0
        },
        {
          id: 'q2-pos',
          text: 'How are sine and cosine functions used in positional encoding?',
          status: 'unanswered',
          attempts: 0
        }
      ],
      'encoder': [
        {
          id: 'q1-encoder',
          text: 'What are the two main components of an encoder layer?',
          status: 'unanswered',
          attempts: 0
        },
        {
          id: 'q2-encoder',
          text: 'How many encoder layers are typically used in the original transformer?',
          status: 'unanswered',
          attempts: 0
        }
      ],
      'self-attention': [
        {
          id: 'q1-self-attention',
          text: 'What are the three key components in self-attention?',
          status: 'unanswered',
          attempts: 0
        },
        {
          id: 'q2-self-attention',
          text: 'Why is it called "multi-head" attention?',
          status: 'unanswered',
          attempts: 0
        }
      ],
      'feed-forward': [
        {
          id: 'q1-ffn',
          text: 'What is the structure of the feed-forward network in transformers?',
          status: 'unanswered',
          attempts: 0
        },
        {
          id: 'q2-ffn',
          text: 'Why is the feed-forward network applied "position-wise"?',
          status: 'unanswered',
          attempts: 0
        }
      ],
      'decoder': [
        {
          id: 'q1-decoder',
          text: 'How does the decoder differ from the encoder in transformers?',
          status: 'unanswered',
          attempts: 0
        },
        {
          id: 'q2-decoder',
          text: 'What are the three main components of a decoder layer?',
          status: 'unanswered',
          attempts: 0
        }
      ],
      'masked-attention': [
        {
          id: 'q1-masked',
          text: 'Why is masking used in the decoder self-attention?',
          status: 'unanswered',
          attempts: 0
        },
        {
          id: 'q2-masked',
          text: 'How is the masking implemented technically?',
          status: 'unanswered',
          attempts: 0
        }
      ],
      'cross-attention': [
        {
          id: 'q1-cross',
          text: 'What is cross-attention and how does it differ from self-attention?',
          status: 'unanswered',
          attempts: 0
        },
        {
          id: 'q2-cross',
          text: 'Where do the Query, Key, and Value come from in cross-attention?',
          status: 'unanswered',
          attempts: 0
        }
      ],
      'output': [
        {
          id: 'q1-output',
          text: 'What are the components of the output layer in transformers?',
          status: 'unanswered',
          attempts: 0
        },
        {
          id: 'q2-output',
          text: 'Why is softmax used in the output layer?',
          status: 'unanswered',
          attempts: 0
        }
      ],
      'key-mechanisms': [
        {
          id: 'q1-key',
          text: 'What are the three key mechanisms that define transformer functionality?',
          status: 'unanswered',
          attempts: 0
        },
        {
          id: 'q2-key',
          text: 'Why are residual connections important in transformers?',
          status: 'unanswered',
          attempts: 0
        }
      ],
      'training': [
        {
          id: 'q1-training',
          text: 'What are some common pretraining objectives for transformers?',
          status: 'unanswered',
          attempts: 0
        },
        {
          id: 'q2-training',
          text: 'What optimizer is typically used for training transformers?',
          status: 'unanswered',
          attempts: 0
        }
      ],
      'inference': [
        {
          id: 'q1-inference',
          text: 'What is beam search in the context of transformer inference?',
          status: 'unanswered',
          attempts: 0
        },
        {
          id: 'q2-inference',
          text: 'Compare greedy decoding and sampling methods for generation.',
          status: 'unanswered',
          attempts: 0
        }
      ]
    };
    
    // Return questions for the requested node
    return questionsMap[nodeId] || [];
  },

  // Submit an answer to a question
  submitAnswer: async (sessionId: string, questionId: string, answer: string): Promise<AnswerResult> => {
    console.log(`Submitting answer for question ${questionId}: ${answer}`);
    
    // Mock correct answers for transformer architecture questions
    const correctAnswers: Record<string, string[]> = {
      'q1-root': ['attention is all you need'],
      'q2-root': ['parallelization', 'long-range dependencies'],
      'q1-input': ['tokenization', 'embedding', 'positional encoding'],
      'q2-input': ['context understanding', 'semantic representation'],
      'q1-tokenization': ['breaking text into tokens', 'converting text to ids'],
      'q2-tokenization': ['byte pair encoding', 'wordpiece', 'sentencepiece', 'unigram', 'bpe'],
      'q1-embedding': ['convert tokens to vectors', 'create numerical representations'],
      'q2-embedding': ['512', '768', '1024'],
      'q1-pos': ['sequence order', 'position information'],
      'q2-pos': ['different frequencies', 'unique position pattern'],
      'q1-encoder': ['self-attention', 'feed-forward network'],
      'q2-encoder': ['6', 'six'],
      'q1-self-attention': ['query', 'key', 'value'],
      'q2-self-attention': ['parallel attention heads', 'multiple attention mechanisms'],
      'q1-ffn': ['two linear layers', 'relu activation'],
      'q2-ffn': ['independently on each position', 'token-wise'],
      'q1-decoder': ['masked self-attention', 'cross-attention'],
      'q2-decoder': ['masked self-attention', 'cross-attention', 'feed-forward network'],
      'q1-masked': ['prevent looking ahead', 'autoregressive generation'],
      'q2-masked': ['setting future positions to negative infinity', 'masking matrix'],
      'q1-cross': ['connects decoder to encoder', 'attends to encoder output'],
      'q2-cross': ['query from decoder', 'key and value from encoder'],
      'q1-output': ['linear layer', 'softmax'],
      'q2-output': ['probability distribution', 'normalized scores'],
      'q1-key': ['self-attention', 'residual connections', 'layer normalization'],
      'q2-key': ['gradient flow', 'training stability'],
      'q1-training': ['masked language modeling', 'next sentence prediction', 'causal language modeling'],
      'q2-training': ['adam', 'adamw'],
      'q1-inference': ['exploring multiple possible outputs', 'maintaining top k candidates'],
      'q2-inference': ['deterministic vs probabilistic', 'diversity vs accuracy']
    };
    
    // Check if the answer is correct by seeing if it contains any of the key terms
    const possibleAnswers = correctAnswers[questionId] || [];
    const isCorrect = possibleAnswers.some(correct => 
      answer.toLowerCase().includes(correct.toLowerCase())
    );
    
    // Return feedback
    return {
      correct: isCorrect,
      feedback: isCorrect 
        ? "Correct! Well done."
        : "Not quite. Try again or review the content for hints.",
      nextQuestion: null // In a real app, this might point to the next question
    };
  },

  // Check if a node is unlockable
  checkNodeUnlockable: async (sessionId: string, nodeId: string): Promise<boolean> => {
    try {
      const response = await apiCall(`/nodes/check-unlockable`, {
        method: 'POST',
        body: JSON.stringify({ 
          session_id: sessionId,
          node_id: nodeId 
        }),
      });
      
      if (response.success && response.data) {
        return response.data.unlockable || false;
      } else {
        throw new Error(response.error || 'Failed to check if node is unlockable');
      }
    } catch (error) {
      console.error('Failed to check if node is unlockable:', error);
      return false;
    }
  },

  // Update node status
  updateNodeStatus: async (
    sessionId: string,
    nodeId: string,
    status: 'not_started' | 'in_progress' | 'completed' | 'locked'
  ): Promise<boolean> => {
    try {
      const response = await apiCall(`/nodes/update-status`, {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          node_id: nodeId,
          status,
        }),
      });
      
      return response.success;
    } catch (error) {
      console.error('Failed to update node status:', error);
      return false;
    }
  },

  // Save graph data
  saveGraphData: async (
    sessionId: string,
    nodes: any[],
    edges: any[]
  ): Promise<boolean> => {
    try {
      const response = await apiCall(`/session/update`, {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          nodes,
          edges,
        }),
      });
      
      return response.success;
    } catch (error) {
      console.error('Failed to save graph data:', error);
      return false;
    }
  },

  // Get content for a specific node
  getNodeContent: async (sessionId: string, nodeId: string): Promise<NodeContent> => {
    // Mock content for transformer architecture nodes
    const nodeContents: Record<string, NodeContent> = {
      'root': {
        id: 'root',
        title: 'Transformer Architecture',
        content: `
# Transformer Architecture

The Transformer architecture was introduced in the 2017 paper "Attention is All You Need" by Vaswani et al. It has revolutionized natural language processing and many other domains of AI.

Transformers solve two major limitations of recurrent neural networks (RNNs):
1. They can process all input tokens in parallel, enabling much faster training
2. They can more effectively capture long-range dependencies in sequences

This mindmap explores the core components and mechanisms of the Transformer architecture.
        `,
        type: 'markdown'
      },
      'input-processing': {
        id: 'input-processing',
        title: 'Input Processing',
        content: `
# Input Processing in Transformers

Before a sequence can be processed by the transformer architecture, it needs to go through several preprocessing steps:

1. **Tokenization**: Converting raw text into tokens (words, subwords, or characters)
2. **Embedding**: Converting tokens into dense vector representations
3. **Positional Encoding**: Adding information about the position of each token in the sequence

These steps are crucial for preparing the input in a way that the transformer can effectively process it.
        `,
        type: 'markdown'
      },
      'tokenization': {
        id: 'tokenization',
        title: 'Tokenization',
        content: `
# Tokenization

Tokenization is the process of breaking text into smaller units called tokens. For transformers, subword tokenization methods are typically used:

- **Byte Pair Encoding (BPE)**: Used in GPT models
- **WordPiece**: Used in BERT
- **SentencePiece**: Used in models like T5
- **Unigram Language Model**: Another subword tokenization approach

These methods balance vocabulary size with the ability to handle rare words by breaking them into subword units.

After tokenization, each token is converted to a numerical ID using a vocabulary lookup table.
        `,
        type: 'markdown'
      },
      'embedding': {
        id: 'embedding',
        title: 'Embedding',
        content: `
# Token Embeddings

The embedding layer converts token IDs into dense vector representations. Typical embedding dimensions include:

- 512 (original Transformer)
- 768 (BERT base)
- 1024 (BERT large, GPT-2)
- 2048 or larger for very large models

These embeddings are learned during training and capture semantic relationships between tokens. Similar words end up with similar vector representations in the embedding space.

The embedding layer is usually shared with the output layer in many transformer implementations to tie the input and output representations.
        `,
        type: 'markdown'
      },
      'positional-encoding': {
        id: 'positional-encoding',
        title: 'Positional Encoding',
        content: `
# Positional Encoding

Unlike RNNs, transformers process all tokens in parallel, losing information about their order. Positional encoding solves this by adding position information to each token embedding.

The original transformer uses sine and cosine functions of different frequencies:

$PE_{(pos,2i)} = sin(pos/10000^{2i/d_{model}})$
$PE_{(pos,2i+1)} = cos(pos/10000^{2i/d_{model}})$

Where:
- pos is the position
- i is the dimension
- d_model is the embedding dimension

This creates a unique pattern for each position that the model can learn to interpret.

Some modern transformers use learned positional encodings instead of the fixed sinusoidal ones.
        `,
        type: 'markdown'
      },
      'encoder': {
        id: 'encoder',
        title: 'Encoder',
        content: `
# Transformer Encoder

The encoder processes the input sequence and creates a representation that captures the meaning of each token in context. The original transformer used 6 identical encoder layers stacked on top of each other.

Each encoder layer consists of two main components:
1. **Multi-Head Self-Attention**: Allows each token to attend to all other tokens
2. **Position-wise Feed-Forward Network**: Processes each position independently

These components are wrapped with residual connections and layer normalization to facilitate training of deep networks.

The encoder is bidirectional, meaning each token can attend to all other tokens in the input sequence.
        `,
        type: 'markdown'
      },
      'self-attention': {
        id: 'self-attention',
        title: 'Self-Attention',
        content: `
# Multi-Head Self-Attention

Self-attention is the core mechanism that allows transformers to capture relationships between tokens regardless of their distance in the sequence.

For each token, three vectors are created:
- **Query (Q)**: What the token is looking for
- **Key (K)**: What the token offers to others
- **Value (V)**: The information the token contains

Attention scores are computed as: $Attention(Q, K, V) = softmax(\\frac{QK^T}{\\sqrt{d_k}})V$

It's called "multi-head" attention because this process is repeated multiple times in parallel (typically 8-16 heads), allowing the model to focus on different aspects of the input.
        `,
        type: 'markdown'
      },
      'feed-forward': {
        id: 'feed-forward',
        title: 'Feed-Forward Network',
        content: `
# Position-wise Feed-Forward Network

After self-attention, each token goes through a feed-forward network applied identically to each position (hence "position-wise").

The feed-forward network consists of two linear transformations with a ReLU activation in between:

$FFN(x) = max(0, xW_1 + b_1)W_2 + b_2$

The inner dimension is typically 4 times larger than the model dimension (e.g., if embedding dimension is 512, the FFN inner dimension is 2048).

This component allows the model to transform the representations further, increasing its capacity to model complex functions.
        `,
        type: 'markdown'
      },
      'decoder': {
        id: 'decoder',
        title: 'Decoder',
        content: `
# Transformer Decoder

The decoder generates output sequences based on the encoder's representations and previously generated tokens. Like the encoder, the original transformer used 6 identical decoder layers.

Each decoder layer has three main components:
1. **Masked Multi-Head Self-Attention**: Attends only to previous positions
2. **Cross-Attention**: Attends to the encoder output
3. **Position-wise Feed-Forward Network**: Same as in the encoder

The decoder is auto-regressive, generating one token at a time and using previously generated tokens as input for the next prediction.
        `,
        type: 'markdown'
      },
      'masked-attention': {
        id: 'masked-attention',
        title: 'Masked Self-Attention',
        content: `
# Masked Self-Attention

In the decoder, self-attention is modified to prevent tokens from attending to future positions. This is necessary because during training, the decoder sees the entire target sequence, but during inference, it can only access what it has generated so far.

The masking is implemented by setting all values in the attention matrix corresponding to future positions to negative infinity before applying the softmax. This ensures those positions get zero attention.

This masking turns the self-attention mechanism into a causal (or autoregressive) process, where each position can only attend to itself and previous positions.
        `,
        type: 'markdown'
      },
      'cross-attention': {
        id: 'cross-attention',
        title: 'Cross-Attention',
        content: `
# Cross-Attention

Cross-attention (or encoder-decoder attention) connects the decoder to the encoder. It works similarly to self-attention, but with a key difference in where Q, K, and V come from:

- Queries (Q) come from the previous decoder layer
- Keys (K) and Values (V) come from the encoder output

This allows each decoder position to attend to all positions in the input sequence, helping the model focus on relevant input tokens when generating each output token.

Cross-attention is what allows the decoder to condition its outputs on the entire input sequence processed by the encoder.
        `,
        type: 'markdown'
      },
      'output': {
        id: 'output',
        title: 'Output Processing',
        content: `
# Output Processing

The final output of the decoder goes through:

1. A linear projection to the vocabulary size
2. A softmax layer to convert scores into probabilities

During training, these probabilities are compared to the true next tokens using cross-entropy loss.

During inference, various decoding strategies can be used:
- Greedy decoding (taking the highest probability token at each step)
- Beam search (maintaining multiple candidate sequences)
- Sampling-based methods (for more diverse outputs)

In many implementations, the output projection layer shares weights with the input embedding layer.
        `,
        type: 'markdown'
      },
      'key-mechanisms': {
        id: 'key-mechanisms',
        title: 'Key Mechanisms',
        content: `
# Key Mechanisms in Transformers

Three architectural features are crucial for transformer functionality:

1. **Self-Attention**: Allows modeling dependencies between any input positions regardless of distance.

2. **Residual Connections**: Each sublayer (attention and feed-forward) is wrapped in a residual connection. This helps with gradient flow during training and allows the model to bypass certain layers when needed.

3. **Layer Normalization**: Applied after residual connections, normalizing the activations to have zero mean and unit variance. This stabilizes training and reduces the number of training steps required.

Together, these mechanisms enable transformers to learn complex patterns while remaining trainable despite their depth.
        `,
        type: 'markdown'
      },
      'training': {
        id: 'training',
        title: 'Training',
        content: `
# Training Transformers

Transformers are typically trained using:

**Pretraining Objectives**:
- Masked Language Modeling (BERT): Predict randomly masked tokens
- Causal Language Modeling (GPT): Predict the next token
- Span Corruption (T5): Reconstruct randomly removed spans of text
- Contrastive Learning: Learn similarities between related pieces of content

**Optimization**:
- Adam or AdamW optimizer with β₁ = 0.9, β₂ = 0.98, ε = 10⁻⁹
- Learning rate scheduling with warmup and decay
- Dropout for regularization (typically 0.1)
- Label smoothing

Training large transformers requires significant computational resources, often using distributed training across multiple GPUs or TPUs.
        `,
        type: 'markdown'
      },
      'inference': {
        id: 'inference',
        title: 'Inference',
        content: `
# Inference with Transformers

During inference, transformers generate sequences using various decoding strategies:

**Greedy Decoding**:
- At each step, select the token with the highest probability
- Fast but can lead to suboptimal sequences

**Beam Search**:
- Maintain top-k candidate sequences at each step
- Balance between quality and diversity
- Common beam sizes: 4-10

**Sampling Methods**:
- Temperature sampling: Control randomness with a temperature parameter
- Top-k sampling: Sample from k most likely tokens
- Top-p (nucleus) sampling: Sample from tokens comprising top p probability mass

Inference speed is a challenge for large transformers, leading to optimizations like distillation, pruning, quantization, and various attention approximations.
        `,
        type: 'markdown'
      }
    };
    
    // Return content for the requested node
    return nodeContents[nodeId] || {
      id: nodeId,
      title: 'Unknown Node',
      content: 'Content not found for this node.',
      type: 'markdown'
    };
  },

  // Unlock a node
  unlockNode: async (sessionId: string, nodeId: string): Promise<boolean> => {
    console.log(`Unlocking node ${nodeId} in session ${sessionId}`);
    
    // Define prerequisites for unlocking nodes
    const prerequisites: Record<string, string[]> = {
      'tokenization': ['input-processing'],
      'embedding': ['input-processing'],
      'positional-encoding': ['input-processing'],
      'encoder': ['tokenization', 'embedding', 'positional-encoding'],
      'self-attention': ['encoder'],
      'feed-forward': ['encoder'],
      'decoder': ['encoder'],
      'masked-attention': ['decoder'],
      'cross-attention': ['decoder', 'encoder'],
      'output': ['decoder'],
      'key-mechanisms': ['self-attention', 'feed-forward'],
      'training': ['key-mechanisms'],
      'inference': ['output', 'training']
    };
    
    // Check if prerequisites are met
    // In a real implementation, this would check the user's progress
    // For now, we'll just return true to simulate successful unlocking
    
    return true;
  },

  // Update progress for a node
  updateProgress: async (sessionId: string, nodeId: string, status: 'not_started' | 'in_progress' | 'completed'): Promise<boolean> => {
    console.log(`Updating progress for node ${nodeId} to ${status} in session ${sessionId}`);
    
    // In a real implementation, this would update the progress in a database
    // For now, we'll just return true to simulate successful update
    
    return true;
  },
};

export default ApiService; 