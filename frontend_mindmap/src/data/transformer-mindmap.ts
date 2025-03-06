import { Node, Edge } from '@xyflow/react';

interface NodeData extends Record<string, unknown> {
  label: string;
  content: string;
  status?: string;
}

export const transformerNodes: Node<NodeData>[] = [
  {
    id: 'root',
    type: 'mindmap',
    data: {
      label: 'Transformer Architecture',
      content: 'The Transformer architecture revolutionized natural language processing with its self-attention mechanism. It processes sequences by learning relationships between all elements simultaneously.',
      status: 'not_started'
    },
    position: { x: 0, y: 0 }
  },
  
  // Section 1: Input Processing
  {
    id: 'input_processing',
    type: 'mindmap',
    data: {
      label: 'Input Processing',
      content: 'The input processing stage converts raw text into a format suitable for the model.',
      status: 'locked'
    },
    position: { x: -400, y: 100 }
  },
  {
    id: 'text_input',
    type: 'mindmap',
    data: {
      label: 'Text Input',
      content: 'Raw text input is processed into tokens. For example, "Hello world!" becomes ["Hello", "world", "!"]',
      status: 'locked'
    },
    position: { x: -600, y: 200 }
  },
  {
    id: 'tokenization',
    type: 'mindmap',
    data: {
      label: 'Tokenization',
      content: 'The process of breaking text into tokens. Common approaches include BPE (Byte Pair Encoding) and WordPiece.',
      status: 'locked'
    },
    position: { x: -400, y: 200 }
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
      content: 'Converts tokens into dense vectors. If vocabulary size is $|V|$ and embedding dimension is $d_{model}$, the embedding matrix $E \\in \\mathbb{R}^{|V| \\times d_{model}}$.',
      status: 'locked'
    },
    position: { x: -200, y: 200 }
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
      content: 'Adds position information to embeddings. For position $pos$ and dimension $i$: $PE_{(pos,2i)} = \\sin(pos/10000^{2i/d_{model}})$ $PE_{(pos,2i+1)} = \\cos(pos/10000^{2i/d_{model}})$',
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
      content: 'The encoder processes input sequences using self-attention and feed-forward networks.',
      status: 'locked'
    },
    position: { x: -200, y: 100 }
  },
  {
    id: 'encoder_layer',
    type: 'mindmap',
    data: {
      label: 'Encoder Layer',
      content: 'Each encoder layer has two sub-layers: multi-head self-attention and position-wise feed-forward network.',
      status: 'locked'
    },
    position: { x: -200, y: 300 }
  },
  {
    id: 'multi_head_attention',
    type: 'mindmap',
    data: {
      label: 'Multi-Head Attention',
      content: 'Attention mechanism: $Attention(Q,K,V) = softmax(\\frac{QK^T}{\\sqrt{d_k}})V$ where Q=Query, K=Key, V=Value matrices.',
      status: 'locked'
    },
    position: { x: -400, y: 400 }
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
      label: 'Add & Norm 1',
      content: 'Layer normalization after residual connection: $LayerNorm(x + Sublayer(x))$',
      status: 'locked'
    },
    position: { x: -200, y: 400 }
  },
  {
    id: 'feed_forward',
    type: 'mindmap',
    data: {
      label: 'Feed Forward',
      content: 'Two linear transformations with ReLU: $FFN(x) = max(0, xW_1 + b_1)W_2 + b_2$',
      status: 'locked'
    },
    position: { x: 0, y: 400 }
  },
  {
    id: 'add_norm_2',
    type: 'mindmap',
    data: {
      label: 'Add & Norm 2',
      content: 'Second layer normalization: $LayerNorm(x + FFN(x))$',
      status: 'locked'
    },
    position: { x: 200, y: 400 }
  },
  
  // Section 3: Decoder
  {
    id: 'decoder',
    type: 'mindmap',
    data: {
      label: 'Decoder',
      content: 'The decoder generates output sequences using both self-attention and encoder attention.',
      status: 'locked'
    },
    position: { x: 200, y: 100 }
  },
  {
    id: 'decoder_layer',
    type: 'mindmap',
    data: {
      label: 'Decoder Layer',
      content: 'Similar to encoder layer but with an additional cross-attention sub-layer.',
      status: 'locked'
    },
    position: { x: 200, y: 300 }
  },
  {
    id: 'masked_attention',
    type: 'mindmap',
    data: {
      label: 'Masked Attention',
      content: 'Prevents attending to future tokens: $Mask(QK^T) = \\begin{cases} -\\infty & \\text{if mask}_{ij} = 0 \\\\ (QK^T)_{ij} & \\text{otherwise} \\end{cases}$',
      status: 'locked'
    },
    position: { x: 400, y: 400 }
  },
  {
    id: 'cross_attention',
    type: 'mindmap',
    data: {
      label: 'Cross Attention',
      content: 'Attends to encoder outputs: $CrossAttention(Q,K,V) = softmax(\\frac{QK^T}{\\sqrt{d_k}})V$ where K,V from encoder.',
      status: 'locked'
    },
    position: { x: 600, y: 400 }
  },
  
  // Section 4: Output
  {
    id: 'output',
    type: 'mindmap',
    data: {
      label: 'Output',
      content: 'The final output processing stage.',
      status: 'locked'
    },
    position: { x: 400, y: 100 }
  },
  {
    id: 'linear_layer',
    type: 'mindmap',
    data: {
      label: 'Linear Layer',
      content: 'Projects to vocabulary size: $O = XW + b$ where $W \\in \\mathbb{R}^{d_{model} \\times |V|}$',
      status: 'locked'
    },
    position: { x: 400, y: 200 }
  },
  {
    id: 'softmax',
    type: 'mindmap',
    data: {
      label: 'Softmax',
      content: 'Converts logits to probabilities: $p_i = \\frac{e^{x_i}}{\\sum_j e^{x_j}}$',
      status: 'locked'
    },
    position: { x: 600, y: 200 }
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
  { id: 'e-declayer-mask', source: 'decoder_layer', target: 'masked_attention', type: 'mindmap' },
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