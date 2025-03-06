import { NodeData, EdgeData } from '../services/api';

interface MindMapData {
  nodes: NodeData[];
  edges: EdgeData[];
}

export const defaultTransformerMindMap: MindMapData = {
  nodes: [
    {
      id: 'transformer',
      type: 'mindmap',
      data: { 
        label: 'Transformer Architecture', 
        content: 'A neural network architecture that uses self-attention to process sequential data. Revolutionized NLP and beyond.'
      },
      position: { x: 0, y: 0 },
      status: 'not_started'
    },
    {
      id: 'encoder',
      type: 'mindmap',
      data: { 
        label: 'Encoder', 
        content: 'Processes the input sequence using self-attention and feed-forward layers. Creates contextual representations of input.'
      },
      position: { x: -150, y: -200 },
      status: 'locked'
    },
    {
      id: 'self-attention',
      type: 'mindmap',
      data: { 
        label: 'Self-Attention', 
        content: 'Allows each token to attend to all other tokens. Uses queries, keys, and values to compute attention scores.'
      },
      position: { x: -150, y: -350 },
      status: 'locked'
    },
    {
      id: 'feed-forward',
      type: 'mindmap',
      data: { 
        label: 'Feed-Forward Network', 
        content: 'Applied position-wise (same network, different inputs per token). Typically has two linear layers with a ReLU activation in between.'
      },
      position: { x: -150, y: -50 },
      status: 'locked'
    },
    {
      id: 'decoder',
      type: 'mindmap',
      data: { 
        label: 'Decoder', 
        content: 'Generates output sequence autoregressively, attending to both itself and encoder output. Also uses N layers.'
      },
      position: { x: 150, y: -200 },
      status: 'locked'
    },
    {
      id: 'masked-attention',
      type: 'mindmap',
      data: { 
        label: 'Masked Self-Attention', 
        content: 'Same as encoder\'s self-attention but masked to prevent attending to future tokens (causal attention).'
      },
      position: { x: 150, y: -350 },
      status: 'locked'
    },
    {
      id: 'cross-attention',
      type: 'mindmap',
      data: { 
        label: 'Cross-Attention', 
        content: 'Attends to encoder output. Q comes from decoder, K and V from encoder, allowing the decoder to focus on relevant parts of the input.'
      },
      position: { x: 150, y: -50 },
      status: 'locked'
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