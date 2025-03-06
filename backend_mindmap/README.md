# Mind Map Learning API

A backend API service for interactive learning with mind maps.

## Overview

This API provides functionality for creating interactive mind maps for learning purposes. The main features include:

- Generating questions for mind map nodes based on content
- Evaluating user answers to questions using Claude
- Tracking progress through the mind map
- Managing node dependencies and unlocking new nodes based on completion

## Getting Started

### Prerequisites

- Python 3.9+
- An Anthropic API key (for Claude)

### Installation

1. Clone the repository
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and add your Anthropic API key

### Running the Server

```bash
# For development with automatic reloading
uvicorn main:app --reload --port 8000

# Or use the provided run script
chmod +x run.sh
./run.sh
```

## API Endpoints

### Session Management

- `POST /api/session/init`: Initialize a session with mind map data
- `GET /api/session/data`: Get the full graph data for a session

### Questions

- `POST /api/questions/generate`: Generate questions for a specific node
- `POST /api/questions/answer`: Submit and evaluate an answer to a question
- `POST /api/questions/regenerate`: Regenerate questions for a node

### Progress Tracking

- `GET /api/progress`: Get the current progress for a session
- `POST /api/nodes/check-unlockable`: Check if a node is unlockable
- `GET /api/node/{node_id}`: Get data for a specific node

## Data Models

### Node

Represents a node in the mind map with learning content.

### Edge

Represents a connection between two nodes, establishing prerequisites.

### Question

Questions generated for each node to test understanding.

## Architecture

The backend is built with FastAPI and leverages Claude to generate questions and evaluate answers based on node content.

The data flow is as follows:

1. User creates or loads a mind map
2. Backend stores the mind map structure
3. As the user interacts with nodes, questions are generated
4. User answers are evaluated by Claude
5. Node completion unlocks dependent nodes

## Development

### Project Structure

- `main.py`: FastAPI application and routes
- `models.py`: Pydantic models for data validation
- `utils.py`: Utility functions for node relationships
- `requirements.txt`: Project dependencies 