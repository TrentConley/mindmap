# Mindmap Learning Frontend

This is a React-based frontend for an interactive mindmap learning application. The app allows users to:

- Create mindmaps on various topics
- Explore nodes with educational content
- Answer questions to test knowledge
- Track learning progress through visual cues

## Features

- Interactive mindmap visualization using ReactFlow
- LaTeX formula rendering for mathematical content
- Question and answer system for knowledge testing
- Progressive learning with node unlocking
- Dynamic content generation through backend AI

## Technology Stack

- React with TypeScript
- ReactFlow for node/graph visualization
- TailwindCSS for styling
- Axios for API communication
- React-Latex for rendering equations

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Backend service running (see backend_mindmap folder)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Project Structure

- `src/components/`: React components
  - `nodes/`: Custom node components for ReactFlow
  - `edges/`: Custom edge components for ReactFlow
  - `ui/`: Reusable UI components
- `src/lib/`: Utility functions and API services
- `public/`: Static assets

## Usage

1. Start the backend server first (see backend README)
2. Run the frontend development server
3. Select a topic or enter a custom one
4. Explore the generated mindmap
5. Click on nodes to view content and answer questions
6. Complete nodes to unlock connected topics

## License

MIT

## Acknowledgements

- ReactFlow - For the graph visualization framework
- ChatGPT - For assisting with development