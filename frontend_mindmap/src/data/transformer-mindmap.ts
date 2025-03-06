import { Node, Edge } from '@xyflow/react';
import { NodeDataType } from '@/components/mindmap';

export const transformerNodes: Node<NodeDataType>[] = [
  {
    id: 'root',
    type: 'mindmap',
    data: {
      label: 'Transformer Architecture',
      content: 'A comprehensive overview of the transformer architecture used in modern NLP models.',
      status: 'not_started'
    },
    position: { x: 0, y: -300 }
  },
  
  // Section 1: Input Processing
  {
    id: 'input_processing',
    type: 'mindmap',
    data: {
      label: 'Input Processing',
      content: 'How raw data (e.g., text) is prepared for the transformer.',
      status: 'locked'
    },
    position: { x: -300, y: 0 }
  },
  {
    id: 'text_input',
    type: 'mindmap',
    data: {
      label: 'Text Input',
      content: 'Raw text: e.g., "The cat sat on the mat."',
      status: 'locked'
    },
    position: { x: -300, y: 200 }
  },
  {
    id: 'tokenization',
    type: 'mindmap',
    data: {
      label: 'Tokenization',
      content: 'Converting text into smaller units (tokens).',
      status: 'locked'
    },
    position: { x: -200, y: 200 }
  },
  {
    id: 'subword_tokenization',
    type: 'mindmap',
    data: {
      label: 'Subword Tokenization',
      content: 'Methods: WordPiece, Byte-Pair Encoding (BPE), SentencePiece.\nExample: "playing" → "play" + "##ing".\nPurpose: Balances vocabulary size and meaning.',
      status: 'locked'
    },
    position: { x: -200, y: 300 }
  },
  {
    id: 'embedding_layer',
    type: 'mindmap',
    data: {
      label: 'Embedding Layer',
      content: 'Maps tokens to dense vectors.',
      status: 'locked'
    },
    position: { x: -100, y: 200 }
  },
  {
    id: 'learnable_embeddings',
    type: 'mindmap',
    data: {
      label: 'Learnable Embeddings',
      content: 'Each token ID assigned a vector (e.g., 512 dimensions).\nInitialized randomly, learned during training.\nOutput: Matrix of shape $[sequence\\_length, embedding\\_dim]$.',
      status: 'locked'
    },
    position: { x: -100, y: 300 }
  },
  {
    id: 'positional_encoding',
    type: 'mindmap',
    data: {
      label: 'Positional Encoding',
      content: 'Adds information about token positions since transformers lack inherent order.',
      status: 'locked'
    },
    position: { x: 0, y: 200 }
  },
  {
    id: 'sine_cosine',
    type: 'mindmap',
    data: {
      label: 'Sine and Cosine Functions',
      content: 'Formula:\n$PE(pos, 2i) = \\sin\\left(\\frac{pos}{10000^{2i/d}}\\right)$\n$PE(pos, 2i+1) = \\cos\\left(\\frac{pos}{10000^{2i/d}}\\right)$\n\nProperties: Unique per position, consistent across sequence lengths.',
      status: 'locked'
    },
    position: { x: -50, y: 300 }
  },
  {
    id: 'pos_alternatives',
    type: 'mindmap',
    data: {
      label: 'Alternatives',
      content: 'Learnable positional embeddings (used in some models like BERT).\nOutput: Added to embeddings, same shape $[sequence\\_length, embedding\\_dim]$.',
      status: 'locked'
    },
    position: { x: 50, y: 300 }
  },
  
  // Section 2: Encoder
  {
    id: 'encoder',
    type: 'mindmap',
    data: {
      label: 'Encoder',
      content: 'Processes the input sequence into a rich representation. Typically consists of $N$ identical layers (e.g., $N = 6$).',
      status: 'locked'
    },
    position: { x: -100, y: 0 }
  },
  {
    id: 'encoder_layer',
    type: 'mindmap',
    data: {
      label: 'Encoder Layer',
      content: 'Input: Embedded sequence with positional encodings.\nRepeated $N$ times (typically 6-12 layers).',
      status: 'locked'
    },
    position: { x: 0, y: -300 }
  },
  {
    id: 'multi_head_attention',
    type: 'mindmap',
    data: {
      label: 'Multi-Head Self-Attention',
      content: 'Allows the model to focus on different parts of the input simultaneously.',
      status: 'locked'
    },
    position: { x: -150, y: -400 }
  },
  {
    id: 'single_attention_head',
    type: 'mindmap',
    data: {
      label: 'Single Attention Head',
      content: 'Query (Q), Key (K), Value (V) Projections:\n$Q = XW_Q$\n$K = XW_K$\n$V = XW_V$\n\nScaled Dot-Product Attention:\n$Attention(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$',
      status: 'locked'
    },
    position: { x: -150, y: -500 }
  },
  {
    id: 'multi_head_mechanism',
    type: 'mindmap',
    data: {
      label: 'Multi-Head Mechanism',
      content: 'Multiple heads (e.g., 8) run in parallel, each with different $W_Q$, $W_K$, $W_V$.\nConcatenate outputs:\n$MultiHead = Concat(head_1, \\dots, head_h)W_O$\nPurpose: Captures different relationships in data.',
      status: 'locked'
    },
    position: { x: 0, y: -500 }
  },
  {
    id: 'add_norm_1',
    type: 'mindmap',
    data: {
      label: 'Add & Norm (1)',
      content: 'Residual Connection:\n$x + MultiHead(x)$\nHelps gradient flow in deep networks.\n\nLayer Normalization:\n$LayerNorm(x + MultiHead(x))$\nStabilizes training.',
      status: 'locked'
    },
    position: { x: 100, y: -400 }
  },
  {
    id: 'feed_forward',
    type: 'mindmap',
    data: {
      label: 'Feed-Forward Network',
      content: 'Applied position-wise (same network, different inputs per token).\nStructure: Two linear layers with ReLU.\n$FFN(x) = \\max(0, xW_1 + b_1)W_2 + b_2$\nFirst layer expands (e.g., to 2048 dims), second reduces back.',
      status: 'locked'
    },
    position: { x: 200, y: -400 }
  },
  {
    id: 'add_norm_2',
    type: 'mindmap',
    data: {
      label: 'Add & Norm (2)',
      content: 'Residual: $x + FFN(x)$.\nLayerNorm: $LayerNorm(x + FFN(x))$.\nOutput: Enhanced representation passed to next layer or decoder.',
      status: 'locked'
    },
    position: { x: 300, y: -400 }
  },
  
  // Section 3: Decoder
  {
    id: 'decoder',
    type: 'mindmap',
    data: {
      label: 'Decoder',
      content: 'Generates output sequence autoregressively, attending to both itself and encoder output. Also $N$ layers.',
      status: 'locked'
    },
    position: { x: 100, y: 0 }
  },
  {
    id: 'decoder_layer',
    type: 'mindmap',
    data: {
      label: 'Decoder Layer',
      content: 'Input: Target sequence (shifted right) with embeddings and positional encodings.',
      status: 'locked'
    },
    position: { x: 300, y: -300 }
  },
  {
    id: 'masked_attention',
    type: 'mindmap',
    data: {
      label: 'Masked Multi-Head Self-Attention',
      content: 'Same as encoder\'s self-attention but masked.\nMasking: Prevents attending to future tokens (causal attention).\nPurpose: Ensures autoregressive property (predict next token based on past only).',
      status: 'locked'
    },
    position: { x: 400, y: -400 }
  },
  {
    id: 'cross_attention',
    type: 'mindmap',
    data: {
      label: 'Cross-Attention',
      content: 'Q: From masked self-attention output.\nK, V: From encoder\'s final output.\nComputes cross-attention between target and source sequences.\nPurpose: Aligns target with source (e.g., translation).',
      status: 'locked'
    },
    position: { x: 500, y: -400 }
  },
  
  // Section 4: Output
  {
    id: 'output',
    type: 'mindmap',
    data: {
      label: 'Output',
      content: 'Transforms the decoder (or encoder) output into final predictions.',
      status: 'locked'
    },
    position: { x: 300, y: 0 }
  },
  {
    id: 'linear_layer',
    type: 'mindmap',
    data: {
      label: 'Linear Layer',
      content: 'Projects to vocabulary size:\n$Output = XW + b$\nShape: $[sequence\\_length, vocab\\_size]$.',
      status: 'locked'
    },
    position: { x: 600, y: -300 }
  },
  {
    id: 'softmax',
    type: 'mindmap',
    data: {
      label: 'Softmax',
      content: 'Converts logits to probabilities per token:\n$P(token_i) = \\frac{e^{z_i}}{\\sum_j e^{z_j}}$',
      status: 'locked'
    },
    position: { x: 700, y: -300 }
  },
  {
    id: 'task_heads',
    type: 'mindmap',
    data: {
      label: 'Task-Specific Heads',
      content: 'Classification: Adds a $[CLS]$ token, processes its output.\nOther: Regression, span prediction, etc.',
      status: 'locked'
    },
    position: { x: 800, y: -300 }
  },
  
  // Section 5: Key Mechanisms
  {
    id: 'key_mechanisms',
    type: 'mindmap',
    data: {
      label: 'Key Mechanisms',
      content: 'Core concepts that define transformer functionality.',
      status: 'locked'
    },
    position: { x: 0, y: 100 }
  },
  {
    id: 'attention_mechanism',
    type: 'mindmap',
    data: {
      label: 'Attention Mechanism',
      content: 'Definition: Weighted sum of values based on query-key similarity.\nFormula:\n$Attention(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$\nIntuitively: Focuses on relevant parts of the sequence dynamically.',
      status: 'locked'
    },
    position: { x: -200, y: 300 }
  },
  {
    id: 'pos_encoding_key',
    type: 'mindmap',
    data: {
      label: 'Positional Encoding',
      content: 'Why Needed: Transformers lack recurrence, need positional info.\nImplementation: Sine/cosine or learned embeddings.\nEffect: Enables order-aware processing.',
      status: 'locked'
    },
    position: { x: 0, y: 300 }
  },
  {
    id: 'residual_norm',
    type: 'mindmap',
    data: {
      label: 'Residual Connections & Layer Normalization',
      content: 'Residuals: $x + Sublayer(x)$.\nMitigates vanishing gradients.\n\nLayer Norm: Normalizes each token\'s features.\nImproves training stability.',
      status: 'locked'
    },
    position: { x: 200, y: 300 }
  },
  
  // Section 6: Training
  {
    id: 'training',
    type: 'mindmap',
    data: {
      label: 'Training',
      content: 'How transformers learn their parameters.',
      status: 'locked'
    },
    position: { x: -200, y: 100 }
  },
  {
    id: 'pretrain_objectives',
    type: 'mindmap',
    data: {
      label: 'Pretraining Objectives',
      content: 'Masked Language Modeling (MLM) (BERT):\nMask 15% of tokens, predict them.\n\nCausal Language Modeling (CLM) (GPT):\nPredict next token in sequence.\n\nSequence-to-Sequence (T5, original transformer):\nEncoder-decoder for tasks like translation.',
      status: 'locked'
    },
    position: { x: -400, y: 300 }
  },
  {
    id: 'optimization',
    type: 'mindmap',
    data: {
      label: 'Optimization',
      content: 'Adam Optimizer: Adaptive learning rate.\nLearning Rate Schedule: Warmup then decay.\nRegularization: Dropout (e.g., 0.1), weight decay.',
      status: 'locked'
    },
    position: { x: -300, y: 300 }
  },
  
  // Section 7: Inference
  {
    id: 'inference',
    type: 'mindmap',
    data: {
      label: 'Inference',
      content: 'How the trained model generates or classifies output.',
      status: 'locked'
    },
    position: { x: 200, y: 100 }
  },
  {
    id: 'generative_tasks',
    type: 'mindmap',
    data: {
      label: 'Generative Tasks',
      content: 'Greedy Decoding: Pick highest-probability token.\nBeam Search: Track top-$k$ sequences.\nSampling: Top-$k$, nucleus sampling for diversity.',
      status: 'locked'
    },
    position: { x: 400, y: 300 }
  },
  {
    id: 'classification_tasks',
    type: 'mindmap',
    data: {
      label: 'Classification Tasks',
      content: 'Use final representation (e.g., $[CLS]$ token in BERT) for prediction.',
      status: 'locked'
    },
    position: { x: 300, y: 300 }
  }
];

export const transformerEdges: Edge[] = [
  // Root connections
  { id: 'e-root-input', source: 'root', target: 'input_processing', type: 'mindmap' },
  { id: 'e-root-encoder', source: 'root', target: 'encoder', type: 'mindmap' },
  { id: 'e-root-decoder', source: 'root', target: 'decoder', type: 'mindmap' },
  { id: 'e-root-output', source: 'root', target: 'output', type: 'mindmap' },
  { id: 'e-root-key_mech', source: 'root', target: 'key_mechanisms', type: 'mindmap' },
  { id: 'e-root-training', source: 'root', target: 'training', type: 'mindmap' },
  { id: 'e-root-inference', source: 'root', target: 'inference', type: 'mindmap' },
  
  // Input Processing connections
  { id: 'e-input-text', source: 'input_processing', target: 'text_input', type: 'mindmap' },
  { id: 'e-input-token', source: 'input_processing', target: 'tokenization', type: 'mindmap' },
  { id: 'e-input-embed', source: 'input_processing', target: 'embedding_layer', type: 'mindmap' },
  { id: 'e-input-pos', source: 'input_processing', target: 'positional_encoding', type: 'mindmap' },
  { id: 'e-token-subword', source: 'tokenization', target: 'subword_tokenization', type: 'mindmap' },
  { id: 'e-embed-learn', source: 'embedding_layer', target: 'learnable_embeddings', type: 'mindmap' },
  { id: 'e-pos-sine', source: 'positional_encoding', target: 'sine_cosine', type: 'mindmap' },
  { id: 'e-pos-alt', source: 'positional_encoding', target: 'pos_alternatives', type: 'mindmap' },
  
  // Encoder connections
  { id: 'e-encoder-layer', source: 'encoder', target: 'encoder_layer', type: 'mindmap' },
  { id: 'e-enclayer-mha', source: 'encoder_layer', target: 'multi_head_attention', type: 'mindmap' },
  { id: 'e-enclayer-an1', source: 'encoder_layer', target: 'add_norm_1', type: 'mindmap' },
  { id: 'e-enclayer-ffn', source: 'encoder_layer', target: 'feed_forward', type: 'mindmap' },
  { id: 'e-enclayer-an2', source: 'encoder_layer', target: 'add_norm_2', type: 'mindmap' },
  { id: 'e-mha-sah', source: 'multi_head_attention', target: 'single_attention_head', type: 'mindmap' },
  { id: 'e-mha-mhm', source: 'multi_head_attention', target: 'multi_head_mechanism', type: 'mindmap' },
  
  // Decoder connections
  { id: 'e-decoder-layer', source: 'decoder', target: 'decoder_layer', type: 'mindmap' },
  { id: 'e-declayer-masked', source: 'decoder_layer', target: 'masked_attention', type: 'mindmap' },
  { id: 'e-declayer-cross', source: 'decoder_layer', target: 'cross_attention', type: 'mindmap' },
  
  // Output connections
  { id: 'e-output-linear', source: 'output', target: 'linear_layer', type: 'mindmap' },
  { id: 'e-output-softmax', source: 'output', target: 'softmax', type: 'mindmap' },
  { id: 'e-output-task', source: 'output', target: 'task_heads', type: 'mindmap' },
  
  // Key Mechanisms connections
  { id: 'e-keymech-att', source: 'key_mechanisms', target: 'attention_mechanism', type: 'mindmap' },
  { id: 'e-keymech-pos', source: 'key_mechanisms', target: 'pos_encoding_key', type: 'mindmap' },
  { id: 'e-keymech-res', source: 'key_mechanisms', target: 'residual_norm', type: 'mindmap' },
  
  // Training connections
  { id: 'e-train-pretrain', source: 'training', target: 'pretrain_objectives', type: 'mindmap' },
  { id: 'e-train-opt', source: 'training', target: 'optimization', type: 'mindmap' },
  
  // Inference connections
  { id: 'e-infer-gen', source: 'inference', target: 'generative_tasks', type: 'mindmap' },
  { id: 'e-infer-class', source: 'inference', target: 'classification_tasks', type: 'mindmap' }
];

export const transformerMindMap = {
  nodes: transformerNodes,
  edges: transformerEdges
};