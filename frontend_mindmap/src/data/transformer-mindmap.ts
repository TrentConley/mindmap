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
      content: 'The Transformer architecture, introduced in the seminal paper "Attention Is All You Need" by Vaswani et al. (2017), revolutionized natural language processing (NLP) by discarding recurrent and convolutional neural network components entirely in favor of attention mechanisms. This architecture efficiently processes sequences by enabling direct modeling of relationships between all tokens simultaneously, rather than sequentially. The parallel nature of its computation makes it more efficient for training on modern hardware accelerators (GPUs/TPUs) and provides a foundation for state-of-the-art models like BERT, GPT, T5, and others that have dramatically advanced capabilities in language understanding, generation, translation, and numerous other NLP tasks. Its impact extends beyond NLP to computer vision, audio processing, reinforcement learning, and multimodal applications.',
      status: 'not_started'
    },
    position: { x: 0, y: 0 }
  },
  
  // New category nodes
  {
    id: 'architecture',
    type: 'mindmap',
    data: {
      label: 'Core Components',
      content: 'The transformer architecture consists of several main components working together to process and generate sequences. These include the input processing pipeline, encoder stack, decoder stack, and output layer, each playing a specific role in the model\'s ability to understand and generate language.',
      status: 'locked'
    },
    position: { x: -300, y: 100 }
  },
  {
    id: 'processing',
    type: 'mindmap',
    data: {
      label: 'Key Mechanisms',
      content: 'The transformer\'s success relies on several key mechanisms that enable efficient sequence processing. Attention mechanisms allow direct modeling of relationships between tokens, positional encoding adds sequence order information, and residual connections with layer normalization enable stable training of deep networks.',
      status: 'locked'
    },
    position: { x: -100, y: 100 }
  },
  {
    id: 'training',
    type: 'mindmap',
    data: {
      label: 'Training Approach',
      content: 'Transformer models are trained using specialized objectives and optimization techniques. Pretraining on large text corpora followed by fine-tuning on specific tasks enables these models to develop powerful language understanding capabilities.',
      status: 'locked'
    },
    position: { x: 100, y: 100 }
  },
  {
    id: 'applications',
    type: 'mindmap',
    data: {
      label: 'Applications',
      content: 'Transformer models excel at a wide range of natural language processing tasks, from text generation and summarization to classification and information extraction, making them versatile tools for language understanding and generation.',
      status: 'locked'
    },
    position: { x: 300, y: 100 }
  },
  
  // Section 1: Input Processing
  {
    id: 'input_processing',
    type: 'mindmap',
    data: {
      label: 'Input Processing',
      content: 'The input processing stage in transformer architectures converts raw text data into a numerical representation suitable for neural computation. This critical preprocessing pipeline involves multiple steps that transform unstructured text into structured, information-rich token embeddings. The process begins with tokenization, which segments text into meaningful units, followed by embedding these tokens into a high-dimensional vector space where semantic relationships can be mathematically represented. Finally, positional encoding injects sequence order information, compensating for the transformer\'s inherent lack of sequential processing. This sophisticated input preparation enables the model to capture complex linguistic patterns and contextual relationships necessary for high-quality language understanding and generation. The design choices made in this stage—such as tokenization strategy, embedding dimension, and positional encoding method—significantly influence the model\'s performance, efficiency, and ability to handle various languages and domains.',
      status: 'locked'
    },
    position: { x: -400, y: 200 }
  },
  {
    id: 'text_input',
    type: 'mindmap',
    data: {
      label: 'Text Input',
      content: 'Text input is the raw linguistic data that enters the transformer pipeline before any processing occurs. This can come in various forms depending on the application—from single sentences or phrases to entire documents, conversations, or code snippets. The transformer architecture is designed to process sequences of arbitrary length (though practical implementations often impose limits). For example, when processing the sentence "Hello world!" in the initial stage, it\'s simply a string of characters that hasn\'t yet been decomposed into computational units. This raw text may undergo preprocessing steps like lowercase conversion, punctuation normalization, or special character handling before entering the tokenization phase. The handling of this raw text significantly affects downstream processing, especially for multilingual applications or specialized domains (like scientific or legal text) where conventions may differ. Modern transformer implementations typically handle this diversity through specialized tokenizers designed for their specific use cases.',
      status: 'locked'
    },
    position: { x: -600, y: 200 }
  },
  {
    id: 'tokenization',
    type: 'mindmap',
    data: {
      label: 'Tokenization',
      content: 'Tokenization divides text into discrete units (tokens) that serve as the fundamental processing elements for transformer models. This crucial step bridges the gap between human-readable text and machine-processable numerical representations. Modern transformers predominantly employ subword tokenization methods like Byte-Pair Encoding (BPE), WordPiece, or SentencePiece, which strike a balance between character-level and word-level approaches. These algorithms iteratively merge common character sequences to form a vocabulary of subword units, enabling models to handle rare words by decomposing them into meaningful subcomponents while keeping common words intact. For instance, "unhappiness" might be split into "un" + "happiness" rather than treated as an out-of-vocabulary word. This subword approach significantly reduces vocabulary size (typically 30,000-50,000 tokens versus millions for word-level tokenization) while maintaining semantic granularity and providing robustness across languages, domains, and for handling previously unseen words. The resulting token IDs serve as indices into the embedding layer, forming the foundation for all subsequent transformer operations.',
      status: 'locked'
    },
    position: { x: -350, y: 300 }
  },
  {
    id: 'subword_tokenization',
    type: 'mindmap',
    data: {
      label: 'Subword Tokenization',
      content: 'Subword tokenization represents a sophisticated compromise between character-level and word-level tokenization, addressing vocabulary explosion and out-of-vocabulary challenges while preserving semantic units. Popular implementations include WordPiece (used by BERT), Byte-Pair Encoding (BPE, used by GPT models), and SentencePiece (used by T5 and XLM-R). These algorithms typically start with individual characters or bytes and iteratively merge the most frequent adjacent pairs to build a vocabulary of optimal size. For example, the word "playing" might be tokenized as "play" + "##ing" in WordPiece (where "##" indicates a subword continuation) or as "play" + "ing" in BPE. This approach offers several advantages: it maintains morphological awareness (recognizing prefixes, suffixes, and stems), handles compound words effectively, and gracefully manages rare words by decomposing them into recognizable components. Additionally, it significantly reduces vocabulary size requirements (typically 30K-50K tokens versus millions for pure word-level approaches), enables cross-lingual transfer by identifying shared subwords across languages, and efficiently represents the long tail of rare terms without resorting to a catch-all "unknown" token. The vocabulary composition process typically involves training on a large corpus to identify the most useful subword units for the intended domain and languages, making it a critical design choice that influences the model\'s linguistic capabilities.',
      status: 'locked'
    },
    position: { x: -200, y: 300 }
  },
  {
    id: 'embedding_layer',
    type: 'mindmap',
    data: {
      label: 'Embedding Layer',
      content: 'The embedding layer transforms discrete token IDs into continuous vector representations that capture semantic relationships in a high-dimensional space. For a vocabulary of size $|V|$ and an embedding dimension of $d_{model}$ (typically 512-1024), the embedding matrix $E \\in \\mathbb{R}^{|V| \\times d_{model}}$ maps each token to its unique vector representation. This critical transformation powers the model\'s ability to understand language semantics by positioning similar words or subwords near each other in the embedding space. The embedding vectors are initialized randomly and then refined through backpropagation during training, learning to encode complex linguistic properties and relationships. Importantly, transformers typically scale these embeddings by multiplying by $\\sqrt{d_{model}}$ to stabilize gradient flow during training. Modern implementations often tie the embedding weights with the output layer weights to reduce parameter count and improve generalization. For large models, embedding parameters can constitute a significant portion of the model size (e.g., in a model with 50K vocabulary and 768-dimensional embeddings, the embedding layer alone contains 38.4 million parameters). The quality of these learned representations directly impacts the model\'s language understanding capabilities, making the embedding layer a foundational component of transformer architectures.',
      status: 'locked'
    },
    position: { x: -200, y: 200 }
  },
  {
    id: 'learnable_embeddings',
    type: 'mindmap',
    data: {
      label: 'Learnable Embeddings',
      content: 'Learnable embeddings form the cornerstone of a transformer\'s ability to understand language semantics by mapping discrete tokens to rich, contextual vector representations. Each token in the vocabulary is assigned a unique, trainable vector (typically 512-1024 dimensions), initialized randomly and continuously refined during the training process. These embeddings evolve to encode profound linguistic properties—semantic relationships, syntactic roles, and even certain world knowledge—as the model processes vast amounts of text data. Unlike static word embeddings (such as Word2Vec or GloVe), transformer embeddings become contextually aware through the subsequent attention mechanisms. The embedding process transforms a sequence of token IDs into a matrix of shape $[sequence\\_length, embedding\\_dim]$, where each row represents the distributed representation of a token. In modern transformer designs, the embedding operation is often followed by a scaling factor of $\\sqrt{d_{model}}$ to normalize the magnitude of embedding vectors, promoting stable gradient flow during training. Additionally, parameter sharing between the embedding layer and output projection layer (weight tying) is a common optimization that reduces model size while improving generalization. The learned embeddings effectively serve as the "semantic memory" of the model, forming a rich representational foundation upon which all higher-level language understanding capabilities are built.',
      status: 'locked'
    },
    position: { x: -100, y: 300 }
  },
  {
    id: 'positional_encoding',
    type: 'mindmap',
    data: {
      label: 'Positional Encoding',
      content: 'Positional encoding addresses a fundamental limitation of transformer architectures: their lack of inherent sequence awareness. Unlike recurrent neural networks that process tokens sequentially, transformers compute attention in parallel across all tokens, requiring explicit position information to distinguish between identical tokens appearing in different positions. The original transformer implementation uses sinusoidal positional encodings, a clever mathematical solution that adds position-dependent patterns to each token embedding. For a token at position $pos$ and dimension $i$, the encoding is defined as: $PE_{(pos,2i)} = \\sin(pos/10000^{2i/d_{model}})$ for even dimensions and $PE_{(pos,2i+1)} = \\cos(pos/10000^{2i/d_{model}})$ for odd dimensions. This formula creates unique positional signatures with several advantageous properties: 1) it provides a unique encoding for each position, 2) the relative distance between positions can be easily computed through linear transformations, 3) it can extrapolate to sequence lengths not seen during training, and 4) the encodings have consistent magnitude across positions and dimensions. These position-aware embeddings enable the transformer to comprehend sequence order—essential for tasks from basic syntax understanding to complex reasoning over lengthy contexts. While the original sinusoidal encoding remains widely used, variants like learned absolute positional embeddings (as in BERT) and relative positional encoding schemes (as in TransformerXL and more recent models) offer alternative approaches with their own performance characteristics for different tasks and sequence lengths.',
      status: 'locked'
    },
    position: { x: 0, y: 200 }
  },
  {
    id: 'sine_cosine',
    type: 'mindmap',
    data: {
      label: 'Sine and Cosine Functions',
      content: 'The sine-cosine positional encoding scheme employs trigonometric functions to create unique, position-dependent patterns that are added to token embeddings. This elegant mathematical approach generates position signatures through the formulas: $PE(pos, 2i) = \\sin\\left(\\frac{pos}{10000^{2i/d}}\\right)$ for even indices and $PE(pos, 2i+1) = \\cos\\left(\\frac{pos}{10000^{2i/d}}\\right)$ for odd indices, where $pos$ is the token position and $i$ indexes the embedding dimension. The genius of this approach lies in its carefully constructed properties: the wavelengths form a geometric progression from $2\\pi$ to $10000 \\cdot 2\\pi$ across dimensions, creating a multi-scale representation where different embedding dimensions capture position information at different resolutions. This design enables the model to attend to both local patterns (via high-frequency components) and global structures (via low-frequency components). Additionally, the sine-cosine encoding guarantees unique representations for each position while maintaining consistent vector magnitude, which stabilizes training. Perhaps most importantly, this fixed encoding scheme allows transformers to generalize to sequence lengths beyond those seen during training—a critical capability for practical applications. The model learns to utilize these positional signatures through its attention mechanisms and feed-forward networks, effectively gaining the ability to reason about sequence order without sacrificing the parallelism that makes transformers computationally efficient.',
      status: 'locked'
    },
    position: { x: -50, y: 300 }
  },
  {
    id: 'pos_alternatives',
    type: 'mindmap',
    data: {
      label: 'Alternatives',
      content: 'While the original transformer paper introduced sinusoidal positional encodings, the field has since developed several alternative approaches to incorporating positional information. Learned absolute positional embeddings, first popularized in BERT, replace the fixed trigonometric functions with trainable position vectors that are directly optimized during model training. This approach can potentially adapt better to specific language patterns but may struggle to generalize to positions beyond the training sequence length. Relative positional encoding, implemented in models like Transformer-XL, Music Transformer, and T5, focuses on encoding the relative distances between tokens rather than absolute positions, which often improves performance on tasks requiring long-range dependencies. More recent innovations include ALiBi (Attention with Linear Biases), which modifies attention scores based on the distance between tokens using a simple linear penalty; RoPE (Rotary Position Embedding), which incorporates positional information through rotation matrices applied to query and key vectors; and hybrid approaches that combine multiple techniques. Each alternative offers different trade-offs between computational efficiency, training stability, performance on various tasks, and ability to handle varying sequence lengths. Some models like XLNet and BERT also incorporate segment embeddings alongside positional embeddings to distinguish between different parts of the input (e.g., separate sentences in a pair). The choice of positional encoding significantly impacts a transformer\'s behavior and capabilities, making it an active area of research and optimization.',
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
      content: 'The encoder component forms a core architectural pillar of transformer models, responsible for transforming input sequences into contextual representations that capture complex linguistic patterns and relationships. Composed of a stack of identical layers (typically 6-24 in modern implementations), each encoder layer processes the entire sequence in parallel through two main sublayers: multi-head self-attention and a position-wise feed-forward network. The self-attention mechanism allows each token to gather information from all other tokens in the sequence, creating rich contextual representations where each position encodes relevant information from the entire context. These representations become progressively more refined as they flow through the encoder stack, with early layers often capturing syntactic patterns while deeper layers encode more abstract semantic relationships. Each encoder layer maintains the sequence length and embedding dimensionality, ensuring consistent tensor shapes throughout the stack. The encoder\'s bidirectional nature (each token can attend to all other tokens in both directions) makes it particularly powerful for understanding context and is extensively leveraged in encoder-only models like BERT and RoBERTa that excel at tasks requiring deep language understanding. The final output of the encoder stack provides a sequence of highly contextualized token representations that can either serve as input to a decoder (in encoder-decoder architectures) or be directly used for downstream tasks like classification, named entity recognition, or question answering.',
      status: 'locked'
    },
    position: { x: -200, y: 200 }
  },
  {
    id: 'encoder_layer',
    type: 'mindmap',
    data: {
      label: 'Encoder Layer',
      content: 'Each encoder layer in a transformer architecture performs a sophisticated sequence transformation through two primary sublayers, all while preserving the input\'s dimensional structure. The first sublayer implements multi-head self-attention, allowing each position to gather relevant information from the entire sequence through parallel attention heads that focus on different representation subspaces. The output of this attention computation passes through a residual connection followed by layer normalization, expressed as $LayerNorm(x + MultiHeadAttention(x))$, which stabilizes training and mitigates the vanishing gradient problem. The second sublayer applies a position-wise feed-forward network—essentially a two-layer neural network with a ReLU activation—independently to each position, enabling the model to process the contextualized representations with additional non-linearity. This is again followed by a residual connection and layer normalization, written as $LayerNorm(x + FFN(x))$. The dimensionality of the representations remains consistent throughout the layer (typically 512-1024), facilitating the stacking of multiple encoder layers. Each successive encoder layer in the stack refines the contextual representations, with early layers often capturing more surface-level patterns and deeper layers developing increasingly abstract and task-relevant features. The dual application of attention (for contextual information gathering) and feed-forward processing (for representation transformation) creates a powerful mechanism for modeling complex linguistic phenomena across various languages and domains.',
      status: 'locked'
    },
    position: { x: -250, y: 350 }
  },
  {
    id: 'multi_head_attention',
    type: 'mindmap',
    data: {
      label: 'Multi-Head Attention',
      content: 'Multi-head attention represents one of the most powerful innovations in the transformer architecture, enabling models to simultaneously attend to information from different representation subspaces at different positions. The mechanism is built upon the scaled dot-product attention formula: $Attention(Q,K,V) = softmax(\\frac{QK^T}{\\sqrt{d_k}})V$, where Q, K, and V are query, key, and value matrices derived from the input sequence. Rather than performing a single attention operation, multi-head attention projects the queries, keys, and values into $h$ different subspaces (typically 8-16 heads) with lower dimensionality ($d_k = d_v = d_{model}/h$), computes attention separately in each subspace, and then concatenates and transforms the results. This parallel attention computation allows the model to jointly attend to different types of relationships—some heads might focus on syntactic dependencies, others on semantic relationships, and others on long-distance co-references—greatly enhancing the model\'s representational power. The scaling factor $\\sqrt{d_k}$ prevents the dot products from growing too large in magnitude as dimensionality increases, which would push the softmax function into regions of extremely small gradients. In self-attention specifically, the queries, keys, and values all come from the same source sequence, enabling each token to gather information from all other tokens. The parallelizable nature of this operation—requiring only matrix multiplications—makes transformers significantly more efficient than recurrent architectures for sequence processing, especially on modern hardware accelerators like GPUs and TPUs.',
      status: 'locked'
    },
    position: { x: -400, y: 400 }
  },
  {
    id: 'single_attention_head',
    type: 'mindmap',
    data: {
      label: 'Single Attention Head',
      content: 'A single attention head within the multi-head attention mechanism performs a complete attention operation in its own dedicated representation subspace. The process begins by projecting the input sequence $X$ into query, key, and value representations using learned weight matrices: $Q = XW_Q$, $K = XW_K$, and $V = XW_V$, where each projection matrix typically reduces the embedding dimension from $d_{model}$ to $d_k = d_v = d_{model}/h$ (for $h$ heads). These projections allow the model to transform the same input into different representation spaces that capture various aspects of the data. The core computation then applies scaled dot-product attention: $Attention(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$. This operation first calculates compatibility scores between all query-key pairs, scales them by $\\sqrt{d_k}$ to stabilize gradients, applies softmax to obtain attention weights summing to 1, and finally computes a weighted sum of values based on these attention distributions. The attention weights effectively determine how much each token should attend to every other token in the sequence, creating dynamically computed contextual representations. Visualizing these attention weights often reveals interpretable patterns—heads specializing in syntax might highlight subject-verb relationships, while others might emphasize topical or semantic connections. Each head learns its unique attention patterns during training, and the diversity of these learned relationships across multiple heads contributes significantly to the transformer\'s remarkable language understanding capabilities.',
      status: 'locked'
    },
    position: { x: -150, y: -500 }
  },
  {
    id: 'multi_head_mechanism',
    type: 'mindmap',
    data: {
      label: 'Multi-Head Mechanism',
      content: 'The multi-head mechanism expands the representational power of transformer attention by running multiple attention operations in parallel, each with different learned parameter matrices. Instead of performing a single attention function with $d_{model}$-dimensional keys, queries, and values, the model projects these inputs $h$ times (typically 8-16) into different representation subspaces. Each head computes: $head_i = Attention(XW_i^Q, XW_i^K, XW_i^V)$ with its own set of projection matrices $W_i^Q \\in \\mathbb{R}^{d_{model} \\times d_k}$, $W_i^K \\in \\mathbb{R}^{d_{model} \\times d_k}$, and $W_i^V \\in \\mathbb{R}^{d_{model} \\times d_v}$, where typically $d_k = d_v = d_{model}/h$. After computing attention independently in these separate subspaces, the outputs are concatenated and linearly transformed: $MultiHead = Concat(head_1, \\dots, head_h)W_O$, where $W_O \\in \\mathbb{R}^{hd_v \\times d_{model}}$. This approach offers several advantages: it allows the model to attend to different aspects of the input simultaneously (some heads might focus on local syntactic patterns while others capture long-range dependencies); it stabilizes training by providing multiple paths for gradient flow; and it enables ensemble-like effects where different heads can specialize in complementary patterns. Analysis of trained models reveals that different heads indeed develop distinct behaviors—some attend primarily to adjacent tokens, others to distant but semantically related terms, and others to structural linguistic relationships. This division of labor across multiple attention mechanisms significantly contributes to the transformer\'s ability to model complex language phenomena with remarkable effectiveness.',
      status: 'locked'
    },
    position: { x: 0, y: -500 }
  },
  {
    id: 'add_norm_1',
    type: 'mindmap',
    data: {
      label: 'Add & Norm',
      content: 'The Add & Norm operation, applied after each sublayer in the transformer, combines residual connections with layer normalization to facilitate stable and effective training of deep transformer networks. Formally expressed as $LayerNorm(x + Sublayer(x))$, this operation first adds the sublayer\'s output to its input (forming a residual connection), then applies layer normalization to the result. The residual connection creates a direct path for gradients to flow through the network, mitigating the vanishing gradient problem that traditionally plagued deep neural networks. Meanwhile, layer normalization, which normalizes each feature across the feature dimension independently for each token, helps stabilize the activations\' distributions throughout training. This combination of residual connections and layer normalization is crucial for transformers\' success, allowing models to grow to hundreds of layers in recent architectures while maintaining trainability.',
      status: 'locked'
    },
    position: { x: 0, y: 400 }
  },
  {
    id: 'feed_forward',
    type: 'mindmap',
    data: {
      label: 'Feed Forward',
      content: 'The position-wise feed-forward network (FFN) in each transformer layer provides crucial non-linear processing capacity that complements the attention mechanism\'s ability to relate different positions. Each FFN is identical across all sequence positions but operates on each position independently, functioning essentially as a token-wise multi-layer perceptron. Formally defined as $FFN(x) = max(0, xW_1 + b_1)W_2 + b_2$, it consists of two linear transformations with a ReLU activation in between. The internal dimension $d_{ff}$ (typically 2048-4096) is significantly larger than the model dimension $d_{model}$ (typically 512-1024), creating an expansion-contraction pattern that increases the network\'s representational capacity. This design serves multiple purposes: it adds non-linearity to the model, enabling more complex function approximation than attention alone can provide; it processes the contextualized representations from the attention sublayer to extract higher-level features; and it allows each position to integrate the gathered contextual information in a position-specific manner. Despite its simplicity, the FFN sublayer typically contains the majority of a transformer\'s parameters—approximately two-thirds in the original architecture—highlighting its importance to the model\'s overall expressivity. Some recent variants replace the standard FFN with alternative formulations, such as gated linear units (GLUs) or mixture-of-experts (MoE) designs, further enhancing performance while maintaining the core principle of position-wise feature transformation. The interleaving of attention (for context gathering) and feed-forward layers (for feature processing) creates the powerful representational capacity that makes transformers so effective across a wide range of sequence modeling tasks.',
      status: 'locked'
    },
    position: { x: -50, y: 450 }
  },
  
  // Section 3: Decoder
  {
    id: 'decoder',
    type: 'mindmap',
    data: {
      label: 'Decoder',
      content: 'The decoder component of transformer architectures generates output sequences by building upon the contextualized representations produced by the encoder. Like the encoder, it consists of a stack of identical layers (typically 6-24), but with a critical architectural difference: each decoder layer contains three sublayers instead of two, introducing a cross-attention mechanism that connects the decoder to the encoder. This design enables the decoder to generate outputs that are informed by both the previously generated sequence and the full input context encoded by the encoder. The decoder operates auto-regressively during generation, producing one token at a time while attending only to previously generated tokens—a behavior enforced by masking future positions in its self-attention mechanism. This causal (left-to-right) attention pattern differs fundamentally from the encoder\'s bidirectional attention, making decoders particularly suited for generative tasks like text completion, translation, and summarization. The decoder\'s self-attention layers capture relationships between output tokens, the cross-attention layers integrate relevant information from the input sequence, and the feed-forward networks transform these contextual representations. In decoder-only architectures like GPT models, the design is simplified to include only masked self-attention without cross-attention, focusing purely on predicting the next token in a sequence. The decoder culminates in an output layer that projects to vocabulary size and applies softmax to produce probability distributions over possible next tokens, enabling both training (via teacher forcing with known targets) and inference (via auto-regressive generation).',
      status: 'locked'
    },
    position: { x: 0, y: 200 }
  },
  {
    id: 'decoder_layer',
    type: 'mindmap',
    data: {
      label: 'Decoder Layer',
      content: 'Each decoder layer extends the encoder layer architecture with an additional sublayer: masked self-attention, cross-attention, and a position-wise feed-forward network, all integrated with residual connections and layer normalization. The first sublayer implements masked multi-head self-attention, which restricts each position from attending to future positions by applying a causal mask to attention scores, enforcing the auto-regressive property necessary for generation tasks. After a residual connection and layer normalization, the second sublayer performs cross-attention, where queries come from the previous decoder sublayer while keys and values come from the encoder\'s output—this critical connection allows each decoder position to attend to all positions in the input sequence, integrating relevant source information for tasks like translation. The third sublayer applies the same position-wise feed-forward network as in encoder layers, transforming the representation with additional non-linearity. Each sublayer is followed by a residual connection and layer normalization, expressed as $LayerNorm(x + Sublayer(x))$, maintaining the model\'s trainability while allowing for significant depth. This three-sublayer pattern creates a sophisticated information flow: self-attention captures output sequence relationships (with masking to enforce proper generation order), cross-attention integrates input context, and the feed-forward network transforms these contextualizations with additional capacity. Decoder layers preserve dimensionality throughout, with each position maintaining a consistent embedding dimension (typically 512-1024) as it flows through the layer. The multi-step processing in each layer, repeated across the decoder stack, enables the model to generate highly contextual and coherent outputs conditioned on both previously generated tokens and the complete input representation.',
      status: 'locked'
    },
    position: { x: 200, y: 300 }
  },
  {
    id: 'masked_attention',
    type: 'mindmap',
    data: {
      label: 'Masked Attention',
      content: 'Masked attention enforces the auto-regressive property in transformer decoders by preventing positions from attending to future positions during self-attention computation. This is implemented through a triangular (or causal) mask applied to the attention scores before the softmax operation: $Mask(QK^T) = \\begin{cases} -\\infty & \\text{if mask}_{ij} = 0 \\\\ (QK^T)_{ij} & \\text{otherwise} \\end{cases}$. The mask is constructed so that $mask_{ij} = 0$ whenever position $j$ comes after position $i$ in the sequence, effectively setting those attention weights to zero after softmax (as $e^{-\\infty} \\approx 0$). This elegant solution ensures each position can only incorporate information from itself and preceding positions, which is essential for proper sequence generation. During training with teacher forcing, the entire output sequence is processed in parallel, but the masking guarantees the model never cheats by looking ahead. During inference, tokens are generated one by one, with each new token attending only to previously generated ones. The masked self-attention mechanism maintains most of the computational advantages of regular self-attention while enforcing the directional constraints necessary for language modeling and generation tasks. This architectural design choice creates a fundamental distinction between transformer encoders (which use bidirectional attention for understanding tasks) and decoders (which use unidirectional attention for generation tasks). Models like GPT are essentially decoder-only transformers that rely exclusively on this masked attention mechanism to model the probability distribution of the next token given previous tokens, forming the basis for their remarkable text generation capabilities.',
      status: 'locked'
    },
    position: { x: 400, y: 400 }
  },
  {
    id: 'cross_attention',
    type: 'mindmap',
    data: {
      label: 'Cross Attention',
      content: 'Cross-attention (also called encoder-decoder attention) forms the crucial bridge between the encoder and decoder in transformer architectures, enabling the model to condition its outputs on the full input context. Formally defined as $CrossAttention(Q,K,V) = softmax(\\frac{QK^T}{\\sqrt{d_k}})V$, it differs from self-attention in its information sources: queries ($Q$) are derived from the decoder\'s previous sublayer, while keys ($K$) and values ($V$) come from the encoder\'s output. This asymmetric pattern allows each decoder position to focus on relevant parts of the input sequence when generating corresponding outputs. For instance, in machine translation, cross-attention enables each generated word to focus on the most relevant words from the source language sentence, effectively creating an implicit, soft alignment between source and target languages. Like self-attention, cross-attention employs multiple heads operating in parallel, allowing the model to focus on different aspects of the source-target relationship simultaneously. The attention weights produced by the softmax operation can be visualized as a heat map showing which source tokens most influence each target token, often revealing interpretable patterns like word alignments or semantic correspondences. This mechanism is central to encoder-decoder transformer models like the original transformer, T5, and BART, making them particularly effective for sequence-to-sequence tasks including translation, summarization, and question answering. The cross-attention sublayer effectively transforms the decoder from a simple language model into a conditional language model, generating text that coherently responds to or transforms the input while maintaining fluency and grammaticality.',
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
      content: 'The output processing stage transforms the decoder\'s high-dimensional representations into task-specific predictions through a series of carefully designed computational steps. For language generation tasks, this typically involves a linear projection followed by a softmax activation, converting each token\'s representation into a probability distribution over the vocabulary. In the original transformer design, the output embedding matrix is often tied (weight sharing) with the input embedding matrix, reducing parameter count while leveraging the semantic knowledge encoded in both directions. Beyond basic token prediction, modern transformer architectures implement a diverse array of output mechanisms tailored to specific tasks—classification heads for sentiment analysis or topic classification, span prediction for question answering, regression outputs for rating prediction, or specialized multi-token output formats for structured generation. The final layer design significantly impacts model performance and determines how the rich contextual representations developed through the transformer layers are ultimately applied to solve practical language tasks. This stage may also implement specialized decoding strategies like beam search, nucleus sampling, or constrained generation to control output quality and characteristics. For encoder-only models like BERT, the output stage typically involves task-specific heads attached to particular token representations (often the [CLS] token for classification tasks). The flexibility of this output stage allows the same underlying transformer architecture to be adapted for an extraordinarily diverse range of NLP applications through relatively minor modifications to the final layers, contributing significantly to the architecture\'s remarkable versatility.',
      status: 'locked'
    },
    position: { x: 200, y: 200 }
  },
  {
    id: 'linear_layer',
    type: 'mindmap',
    data: {
      label: 'Linear Layer',
      content: 'The linear layer in the transformer\'s output stage projects the high-dimensional token representations from the decoder\'s final layer into the vocabulary space, essentially scoring each possible output token. Mathematically represented as $O = XW + b$, where $X$ is the decoder output and $W \\in \\mathbb{R}^{d_{model} \\times |V|}$ is a weight matrix mapping from the model dimension to vocabulary size, this linear transformation produces logits (unnormalized scores) for each token in the vocabulary. For efficiency and improved generalization, many transformer implementations share weights between this projection matrix and the input embedding matrix (weight tying), leveraging the intuition that the process of mapping from tokens to representations and back should utilize the same semantic knowledge. The dimensionality of this operation is significant—for a model with embedding dimension 768 and vocabulary size 50,000, the projection matrix contains 38.4 million parameters, often constituting 10-20% of the model\'s total parameter count. Despite its conceptual simplicity, this layer plays a crucial role in determining the model\'s output distribution over possible tokens. The linear projection captures correlations between latent features in the decoder\'s representation and specific vocabulary items, effectively translating the model\'s internal language understanding into concrete token predictions. During generation, these logits serve as the basis for sampling from the vocabulary, with various strategies (greedy, beam search, temperature sampling, etc.) determining how the model\'s probabilistic knowledge is converted into discrete token selections.',
      status: 'locked'
    },
    position: { x: 400, y: 200 }
  },
  {
    id: 'softmax',
    type: 'mindmap',
    data: {
      label: 'Softmax',
      content: 'The softmax function serves as the final transformation in the transformer\'s output pathway, converting raw logits from the linear layer into a proper probability distribution over the vocabulary. Formally defined as $p_i = \\frac{e^{x_i}}{\\sum_j e^{x_j}}$, where $x_i$ is the logit for token $i$, softmax exponentiates each score and then normalizes by the sum of all exponentiated scores, ensuring that all probabilities are positive and sum to exactly 1. This non-linear activation introduces a crucial competitive dynamic among vocabulary items—increasing the score for one token necessarily decreases the relative probability of others. During training, these probabilities are used with cross-entropy loss, comparing the model\'s predicted distribution against the one-hot encoded target tokens: $Loss = -\\sum_i y_i \\log(p_i)$, where $y_i$ is 1 for the correct token and 0 for all others. This loss formulation encourages the model to assign high probability to correct tokens while minimizing probability for incorrect ones. During inference, the softmax output enables various sampling strategies: greedy decoding simply selects the highest probability token, while temperature sampling (using $p_i = \\frac{e^{x_i/T}}{\\sum_j e^{x_j/T}}$ with temperature parameter $T$) allows controlling the randomness of generations. More sophisticated approaches like top-k or nucleus (top-p) sampling restrict selection to the most probable tokens, balancing diversity and quality. The softmax operation transforms abstract neural representations into interpretable probabilities that directly guide the model\'s language generation process, forming the critical interface between the transformer\'s internal representations and its observable outputs.',
      status: 'locked'
    },
    position: { x: 600, y: 200 }
  },
  {
    id: 'task_heads',
    type: 'mindmap',
    data: {
      label: 'Task-Specific Heads',
      content: 'Task-specific heads adapt transformer models to diverse NLP applications by attaching specialized output layers to the contextual representations. For classification tasks, models like BERT typically insert a special [CLS] token at the sequence start, whose final representation is processed through a task-specific feed-forward layer to predict class labels. This approach works for sentiment analysis, topic classification, natural language inference, and similar tasks requiring whole-sequence understanding. For token-level tasks like named entity recognition or part-of-speech tagging, each token\'s representation is independently classified, allowing fine-grained analysis across the sequence. More complex tasks employ specialized architectures: question answering systems typically predict start and end positions of answer spans within text, using two separate classifiers operating on each token; summarization and translation leverage the full encoder-decoder architecture to generate entirely new sequences; regression tasks replace softmax with linear outputs to predict continuous values like ratings or scores. Modern approaches increasingly employ multi-task learning with shared transformer backbones but separate task heads, or prompt-based methods that reframe diverse tasks as text generation problems, reducing the need for specialized heads. The remarkable adaptability of transformer representations allows these task-specific heads to be relatively simple—often just one or two feed-forward layers—while achieving state-of-the-art performance across an extraordinarily wide range of language tasks, demonstrating the architecture\'s versatility as a foundation model for language understanding and generation.',
      status: 'locked'
    },
    position: { x: 800, y: -300 }
  },
  
  // Key Mechanisms
  {
    id: 'attention_mechanism',
    type: 'mindmap',
    data: {
      label: 'Attention Mechanism',
      content: 'Attention mechanisms form the revolutionary core of transformer architectures, enabling models to dynamically focus on relevant parts of the input when producing each element of the output. At its essence, attention is a content-based addressing mechanism that computes a weighted sum of values (V) based on the compatibility between queries (Q) and keys (K). The canonical scaled dot-product attention, expressed as $Attention(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$, first calculates similarity scores between query and key vectors, scales them by $\\sqrt{d_k}$ to manage variance, applies softmax to obtain a probability distribution, and finally aggregates value vectors according to these weights. This elegant formulation allows every token to gather information from all other tokens based on learned relevance, creating dynamic, input-dependent computational pathways through the network. Transformers implement self-attention (where queries, keys, and values all derive from the same sequence) and, in encoder-decoder models, cross-attention (where queries come from the decoder while keys and values come from the encoder). The multi-head extension further enhances this mechanism by performing attention in multiple representation subspaces simultaneously, enabling the model to capture different types of relationships in parallel. Unlike recurrent or convolutional operations, attention has no inherent distance bias—tokens can interact directly regardless of their separation in the sequence. This property enables superior modeling of long-range dependencies, while the parallelizable nature of attention computation (requiring only matrix multiplication rather than sequential processing) allows for significant computational efficiency on modern hardware. The introduction of this mechanism in the 2017 "Attention Is All You Need" paper marked a paradigm shift in sequence modeling, replacing traditional recurrent and convolutional architectures with attention-based designs that now dominate the field.',
      status: 'locked'
    },
    position: { x: -300, y: 300 }
  },
  {
    id: 'pos_encoding_key',
    type: 'mindmap',
    data: {
      label: 'Positional Encoding',
      content: 'Positional encoding addresses a fundamental limitation of pure attention-based architectures: their lack of inherent sequence awareness. Since attention operations process all tokens in parallel without built-in ordering, transformers require explicit position information to distinguish between identical tokens appearing at different positions. The classic solution employs sinusoidal functions of varying frequencies to create unique positional signatures: $PE_{(pos,2i)} = \\sin(pos/10000^{2i/d_{model}})$ and $PE_{(pos,2i+1)} = \\cos(pos/10000^{2i/d_{model}})$. These mathematical expressions generate patterns with carefully designed properties: they produce unique encodings for each position while maintaining consistent magnitude; enable the model to generalize to sequence lengths beyond those seen during training; and allow relative position computation through linear combinations of these features. Alternative approaches include learned absolute positional embeddings (as used in BERT), which can better adapt to language-specific patterns but may struggle with extrapolation, and relative positional encoding schemes (as in Transformer-XL and T5) that directly model position relationships rather than absolute positions. Recent innovations like RoPE (Rotary Position Embedding) and ALiBi (Attention with Linear Biases) offer different trade-offs between computational efficiency and modeling capacity. The integration of positional information—whether through fixed mathematical functions or learned parameters—enables transformers to reason about sequence order despite their inherently parallel computation, combining the benefits of position-aware processing with the computational efficiency of attention mechanisms. This carefully designed architectural feature exemplifies the thoughtful engineering decisions that enable transformers to achieve their remarkable performance across diverse sequence modeling tasks.',
      status: 'locked'
    },
    position: { x: -100, y: 300 }
  },
  {
    id: 'residual_norm',
    type: 'mindmap',
    data: {
      label: 'Residual Connections & Layer Normalization',
      content: 'Residual connections and layer normalization form critical architectural elements that enable stable training of deep transformer networks. Residual connections, expressed as $x + Sublayer(x)$, create direct paths for gradient flow by adding each sublayer\'s input to its output. This elegant solution mitigates the vanishing gradient problem that traditionally limited neural network depth, allowing information and gradients to bypass sublayers when necessary. By providing shortcut connections through the network, residuals enable significantly deeper architectures while maintaining trainability, which is essential for capturing the hierarchical patterns present in language data. Layer normalization complements residual connections by stabilizing the statistical distribution of activations. Applied as $LayerNorm(x) = \\gamma \\cdot \\frac{x - \\mu}{\\sigma + \\epsilon} + \\beta$, where $\\mu$ and $\\sigma$ are the mean and standard deviation computed across the feature dimension for each token independently, normalization reduces internal covariate shift during training. Unlike batch normalization, layer normalization operates independently for each sequence position, making it particularly suitable for variable-length sequences and small batch sizes often used with transformers. The transformer\'s characteristic processing pattern of sublayer followed by Add & Norm (i.e., $LayerNorm(x + Sublayer(x))$) creates a rhythmic, regularized information flow that balances feature transformation with representational stability. This carefully engineered combination of techniques enables transformers to scale to hundreds of layers in modern architectures while maintaining effective training dynamics, contributing significantly to their unprecedented performance on language tasks. The success of these normalization strategies has inspired ongoing research into alternatives like RMSNorm (Root Mean Square Normalization) and Pre-LN (Pre-Layer Normalization) arrangements that further improve training stability and performance.',
      status: 'locked'
    },
    position: { x: 100, y: 300 }
  },
  
  // Training and Applications
  {
    id: 'pretrain_objectives',
    type: 'mindmap',
    data: {
      label: 'Pretraining Objectives',
      content: 'Pretraining objectives define the self-supervised learning tasks that enable transformers to develop sophisticated language understanding from raw text data before fine-tuning on downstream applications. Masked Language Modeling (MLM), pioneered by BERT, randomly masks approximately 15% of input tokens and trains the model to reconstruct them based on surrounding context. This bidirectional prediction task forces the model to develop rich contextual representations capturing syntactic and semantic patterns. Causal Language Modeling (CLM), used by GPT models, adopts a left-to-right autoregressive approach where the model predicts each token based solely on previous tokens, optimizing for the probability distribution $P(x_t | x_{<t})$. This unidirectional objective naturally aligns with text generation tasks but can limit bidirectional understanding. Sequence-to-Sequence objectives, employed by T5 and BART, corrupt input sequences (through masking, deletion, rotation, or other transformations) and train encoder-decoder models to reconstruct the original text, combining aspects of both MLM and CLM. More recent objectives include contrastive learning (as in CLIP, SimCSE), where models learn to identify related versus unrelated content; replaced token detection (as in ELECTRA), where models learn to distinguish original tokens from plausible replacements; and span prediction objectives like those in SpanBERT, which mask contiguous spans rather than individual tokens. The choice of pretraining objective fundamentally shapes a model\'s capabilities—MLM excels at understanding tasks, CLM at generation tasks, and seq2seq at translation-like transformations. Modern approaches increasingly combine multiple objectives during pretraining to develop more versatile representations, while scaling laws research demonstrates that larger models trained on more data with these objectives continue to improve in a predictable manner, contributing to the remarkable advances in transformer-based language models in recent years.',
      status: 'locked'
    },
    position: { x: 50, y: 300 }
  },
  {
    id: 'optimization',
    type: 'mindmap',
    data: {
      label: 'Optimization',
      content: 'Transformer optimization employs specialized techniques to navigate the challenging loss landscapes of these deep, parameter-rich architectures. The Adam optimizer (Adaptive Moment Estimation) serves as the standard choice for transformer training, combining the benefits of momentum and RMSProp by maintaining both first-moment (mean) and second-moment (uncentered variance) estimates of gradients. This adaptive learning rate approach significantly accelerates convergence compared to standard stochastic gradient descent, especially for the sparse gradients common in language tasks. Equally critical is the learning rate schedule, typically following a warmup phase where the rate linearly increases for several thousand steps, followed by a decay phase using inverse square root, linear, or cosine schedules. This warmup period prevents early instability in the Adam optimizer\'s second-moment estimates, while the subsequent decay ensures convergence to high-quality solutions. Regularization techniques—including dropout applied to attention weights, hidden states, and embeddings (typically at rates of 0.1-0.3); weight decay (often at 0.01); and sometimes label smoothing for classification outputs—help prevent overfitting despite the models\' massive capacity. For extremely large models, more advanced approaches become necessary: gradient accumulation enables effective training with limited hardware by accumulating gradients across multiple forward passes before updating; mixed-precision training accelerates computation by using lower-precision formats (e.g., FP16) where appropriate while maintaining stability; techniques like gradient checkpointing trade computation for reduced memory usage by recomputing certain activations during backpropagation rather than storing them; and distributed training strategies like data parallelism, pipeline parallelism, and tensor parallelism enable scaling to models with billions or trillions of parameters. These carefully engineered optimization strategies enable transformers to learn effectively despite their unprecedented scale, contributing significantly to their remarkable performance across language tasks.',
      status: 'locked'
    },
    position: { x: 200, y: 200 }
  },
  {
    id: 'generative_tasks',
    type: 'mindmap',
    data: {
      label: 'Generative Tasks',
      content: 'Transformer models excel at generative tasks through sophisticated decoding strategies that convert their probabilistic outputs into coherent text sequences. Greedy decoding simply selects the highest-probability token at each step ($argmax_w P(w|context)$), producing deterministic but often repetitive outputs. Beam search, a more advanced approach, maintains a beam of $k$ most probable partial sequences (typically $k=4$ to $10$), expanding each with all possible next tokens and keeping only the $k$ most probable extended sequences. This wider exploration of the probability space often produces higher-quality outputs at the cost of increased computation. Temperature sampling introduces controlled randomness by adjusting the sharpness of the output distribution according to a temperature parameter $T$: $P(w|context) \\propto \\exp(logits_w/T)$. Lower values (e.g., $T=0.7$) make the distribution more peaked around high-probability tokens, while higher values (e.g., $T=1.2$) flatten it for more diversity. Top-$k$ sampling restricts selection to only the $k$ highest-probability tokens before normalization, preventing the model from choosing very low-probability outputs. Nucleus (top-$p$) sampling, a dynamic variant, selects from the smallest set of tokens whose cumulative probability exceeds threshold $p$ (typically 0.9-0.95), adapting the candidate pool size based on the certainty of the model\'s predictions. Modern systems often combine these techniques with additional constraints like repetition penalties that reduce the probability of recently generated n-grams, minimum length requirements, or task-specific filters. The development of increasingly sophisticated decoding strategies has dramatically improved transformer-generated text quality, enabling applications from summarization and translation to creative writing and dialogue systems. These generation methods effectively translate the rich contextual knowledge captured during pretraining into coherent, fluent, and increasingly reliable text outputs across diverse applications.',
      status: 'locked'
    },
    position: { x: 200, y: 300 }
  },
  {
    id: 'classification_tasks',
    type: 'mindmap',
    data: {
      label: 'Classification Tasks',
      content: 'Transformer models approach classification tasks by mapping sequence representations to categorical outputs through specialized classification heads. For sequence-level tasks like sentiment analysis, topic classification, or natural language inference, the common pattern involves inserting a special token (typically [CLS] in BERT-derived models) at the sequence start. This token\'s final-layer representation, which captures information from the entire sequence through self-attention, is then processed through a task-specific feed-forward neural network: $y = softmax(W \\cdot h_{[CLS]} + b)$, where $h_{[CLS]}$ is the [CLS] token\'s representation. During fine-tuning, the entire model—both the transformer backbone and classification head—is optimized to minimize cross-entropy loss between predicted and true labels. Alternative approaches include pooling operations (mean, max, or attention-weighted) over all token representations before classification, which can sometimes capture sequence information more effectively than the [CLS] token alone. For token-level classification tasks like named entity recognition, part-of-speech tagging, or semantic role labeling, each token\'s contextual representation is independently classified: $y_i = softmax(W \\cdot h_i + b)$ for each token $i$. This token-wise classification, informed by bidirectional context through self-attention, enables fine-grained sequence labeling with state-of-the-art accuracy. Modern transformer training often employs techniques like gradual unfreezing (starting with only the classification head and progressively unfreezing earlier layers) and discriminative fine-tuning (using different learning rates for different layers) to efficiently adapt pretrained representations to specific tasks. Classification performance typically improves with model scale, as larger transformer backbones provide richer contextual representations that capture more nuanced features relevant to the task. The combination of powerful pretrained representations and relatively simple classification heads has pushed performance boundaries across virtually all text classification benchmarks, demonstrating the remarkable effectiveness of the transformer architecture for understanding-focused tasks.',
      status: 'locked'
    },
    position: { x: 300, y: 300 }
  }
];

export const transformerEdges: Edge[] = [
  // Root connections - reducing to 4 main categories
  { id: 'e-root-architecture', source: 'root', target: 'architecture', type: 'mindmap' },
  { id: 'e-root-processing', source: 'root', target: 'processing', type: 'mindmap' },
  { id: 'e-root-training', source: 'root', target: 'training', type: 'mindmap' },
  { id: 'e-root-applications', source: 'root', target: 'applications', type: 'mindmap' },
  
  // Architecture connections
  { id: 'e-architecture-input', source: 'architecture', target: 'input_processing', type: 'mindmap' },
  { id: 'e-architecture-encoder', source: 'architecture', target: 'encoder', type: 'mindmap' },
  { id: 'e-architecture-decoder', source: 'architecture', target: 'decoder', type: 'mindmap' },
  { id: 'e-architecture-output', source: 'architecture', target: 'output', type: 'mindmap' },
  
  // Processing connections (key mechanisms of transformer)
  { id: 'e-processing-attention', source: 'processing', target: 'attention_mechanism', type: 'mindmap' },
  { id: 'e-processing-pos', source: 'processing', target: 'pos_encoding_key', type: 'mindmap' },
  { id: 'e-processing-residual', source: 'processing', target: 'residual_norm', type: 'mindmap' },
  
  // Connect processing mechanisms to architecture components
  { id: 'e-attention-encoder', source: 'attention_mechanism', target: 'encoder', type: 'mindmap' },
  { id: 'e-attention-decoder', source: 'attention_mechanism', target: 'decoder', type: 'mindmap' },
  { id: 'e-pos-input', source: 'pos_encoding_key', target: 'input_processing', type: 'mindmap' },
  { id: 'e-residual-encoder', source: 'residual_norm', target: 'encoder_layer', type: 'mindmap' },
  { id: 'e-residual-decoder', source: 'residual_norm', target: 'decoder_layer', type: 'mindmap' },
  
  // Training connections
  { id: 'e-training-pretrain', source: 'training', target: 'pretrain_objectives', type: 'mindmap' },
  { id: 'e-training-opt', source: 'training', target: 'optimization', type: 'mindmap' },
  
  // Application connections
  { id: 'e-applications-gen', source: 'applications', target: 'generative_tasks', type: 'mindmap' },
  { id: 'e-applications-class', source: 'applications', target: 'classification_tasks', type: 'mindmap' },
  { id: 'e-applications-task', source: 'applications', target: 'task_heads', type: 'mindmap' },
  
  // Input Processing connections - kept the same
  { id: 'e-input-text', source: 'input_processing', target: 'text_input', type: 'mindmap' },
  { id: 'e-input-token', source: 'input_processing', target: 'tokenization', type: 'mindmap' },
  { id: 'e-input-embed', source: 'input_processing', target: 'embedding_layer', type: 'mindmap' },
  { id: 'e-input-pos', source: 'input_processing', target: 'positional_encoding', type: 'mindmap' },
  
  // Tokenization connection - limited to one child
  { id: 'e-token-subword', source: 'tokenization', target: 'subword_tokenization', type: 'mindmap' },
  
  // Embedding connection - limited to one child
  { id: 'e-embed-learn', source: 'embedding_layer', target: 'learnable_embeddings', type: 'mindmap' },
  
  // Positional encoding connections - limited to two children
  { id: 'e-pos-sine', source: 'positional_encoding', target: 'sine_cosine', type: 'mindmap' },
  { id: 'e-pos-alt', source: 'positional_encoding', target: 'pos_alternatives', type: 'mindmap' },
  
  // Encoder connections - kept the same
  { id: 'e-encoder-layer', source: 'encoder', target: 'encoder_layer', type: 'mindmap' },
  
  // Encoder layer connections - limited to 3 main components
  { id: 'e-enclayer-mha', source: 'encoder_layer', target: 'multi_head_attention', type: 'mindmap' },
  { id: 'e-enclayer-ffn', source: 'encoder_layer', target: 'feed_forward', type: 'mindmap' },
  { id: 'e-enclayer-an', source: 'encoder_layer', target: 'add_norm_1', type: 'mindmap' },
  
  // Multi-head attention connections - limited to two children
  { id: 'e-mha-sah', source: 'multi_head_attention', target: 'single_attention_head', type: 'mindmap' },
  { id: 'e-mha-mhm', source: 'multi_head_attention', target: 'multi_head_mechanism', type: 'mindmap' },
  
  // Decoder connections
  { id: 'e-decoder-layer', source: 'decoder', target: 'decoder_layer', type: 'mindmap' },
  
  // Decoder layer connections - limited to two key components
  { id: 'e-declayer-mask', source: 'decoder_layer', target: 'masked_attention', type: 'mindmap' },
  { id: 'e-declayer-cross', source: 'decoder_layer', target: 'cross_attention', type: 'mindmap' },
  
  // Output connections - limited to two key components
  { id: 'e-output-linear', source: 'output', target: 'linear_layer', type: 'mindmap' },
  { id: 'e-output-softmax', source: 'output', target: 'softmax', type: 'mindmap' }
];

export const transformerMindMap = {
  nodes: transformerNodes,
  edges: transformerEdges
};