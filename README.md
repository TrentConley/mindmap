# Mindmap Learning Application

An interactive mindmap learning application with AI-powered content and question generation.

## Overview

This project consists of two main components:

1. **Backend**: FastAPI server with Anthropic's Claude integration for generating educational content and questions
2. **Frontend**: React application with ReactFlow for interactive mindmap visualization

## Features

- Dynamic mindmap generation on any topic
- Interactive visualization of educational content
- LaTeX rendering for mathematical formulas
- Question and answer system for testing knowledge
- Progressive learning with node unlocking
- Topic exploration through mindmap navigation

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 16+
- Anthropic API key (for the backend)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend_mindmap
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file with your Anthropic API key:
```
ANTHROPIC_API_KEY=your_api_key_here
```

5. Run the server:
```bash
python main.py
```

The backend will be available at http://localhost:8000.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend_mindmap
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:5173.

## Architecture

- **Backend**: FastAPI application that handles:
  - Session management
  - Mindmap generation via Anthropic Claude
  - Question generation and answer evaluation
  - Progress tracking

- **Frontend**: React application that handles:
  - Interactive mindmap visualization
  - User interactions with nodes
  - Question answering interface
  - Progress visualization

## License

MIT