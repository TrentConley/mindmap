from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from dotenv import load_dotenv
import anthropic
from anthropic.types import ContentBlockDeltaEvent, MessageDeltaEvent, MessageStartEvent
import logging
import uuid
from pathlib import Path
import httpx
from datetime import datetime
from typing import Dict, List, Optional, Set, Any

# Import models and utilities
from models import (
    Question, NodeStatus, NodeInfo, EdgeInfo, NodeRelationships, SessionData,
    GenerateQuestionsRequest, AnswerRequest, UnlockCheckRequest, GraphDataRequest,
    ProgressResponse, QuestionResponse, AnswerResponse, UnlockCheckResponse,
    CreateMindMapRequest, MindMapNode, GeneratedMindMap, UpdateNodeStatusRequest
)
from utils import check_children_completed, check_node_unlockable, build_node_relationships

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Mind Map Learning API")

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000", "http://localhost:5173", allowed_origins, "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Anthropic client
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    logger.warning("ANTHROPIC_API_KEY not found in environment variables")

client = anthropic.Anthropic(
    api_key=ANTHROPIC_API_KEY,
)

# Session-based storage (will be replaced with PostgreSQL later)
# Using a simple dictionary for now
session_data = {}

# Helper functions
def get_session_data(session_id: str) -> Dict:
    """Get session data or initialize it if it doesn't exist."""
    if session_id not in session_data:
        session_data[session_id] = {
            "nodes": {},        # Node progress data
            "graph_nodes": {},  # Actual node data with content
            "graph_edges": [],  # Edge data
            "relationships": {
                "parents": {},
                "children": {}
            }
        }
    return session_data[session_id]

def generate_questions_prompt(node_content: str, node_label: str, 
                             parent_nodes: List[Dict[str, str]], 
                             child_nodes: List[Dict[str, str]]) -> str:
    """Generate a prompt for Claude to create questions about a node."""
    
    context = f"""
    You are an educational assessment expert creating questions to test knowledge about: "{node_label}".
    
    Here is the content about this topic:
    "{node_content}"
    
    """
    
    if parent_nodes:
        context += "This topic is related to the following parent topics:\n"
        for node in parent_nodes:
            context += f"- {node.get('label', 'Unknown')}: {node.get('content', 'No content')}\n"
    
    if child_nodes:
        context += "This topic has the following subtopics:\n"
        for node in child_nodes:
            context += f"- {node.get('label', 'Unknown')}: {node.get('content', 'No content')}\n"
    
    prompt = f"""{context}

    Based on this content, create 1-3 open-ended questions that test understanding of "{node_label}".
    
    Guidelines:
    - Questions should test deep understanding, not just recall
    - Questions should be answerable from the provided content
    - Questions should encourage critical thinking
    - Include a variety of difficulty levels
    
    Format your response as a JSON array of questions with this structure:
    [
      {{
        "text": "Your first question here?"
      }},
      {{
        "text": "Your second question here?"
      }}
    ]
    
    Only return the valid JSON array, nothing else.
    """
    
    return prompt

def evaluate_answer_prompt(question: str, answer: str, node_content: str) -> str:
    """Generate a prompt for Claude to evaluate a user's answer."""
    
    prompt = f"""
    You are an expert educational evaluator. Your task is to evaluate a student's answer to a question about a specific topic.
    
    Topic content: "{node_content}"
    
    Question: "{question}"
    
    Student's answer: "{answer}"
    
    First, evaluate the student's answer. Consider:
    - Is the answer factually correct?
    - Does it demonstrate understanding of the topic?
    - Is it complete?
    - Does it show critical thinking?
    
    Then, assign a grade from 0 to 100 where:
    - 0-60: Poor understanding
    - 61-79: Partial understanding
    - 80-89: Good understanding
    - 90-100: Excellent understanding
    
    Provide your feedback as a JSON object with this structure:
    {{
      "feedback": "Your detailed feedback here, explaining strengths and weaknesses of the answer, and how it could be improved.",
      "grade": 85,
      "passed": true
    }}
    
    The "passed" field should be true if the grade is 80 or above, false otherwise.
    Only return the valid JSON object, nothing else.
    """
    
    return prompt

# Define the tool schema for Anthropic to use for creating mindmaps
CREATE_MINDMAP_TOOL = {
    "name": "create_mindmap",
    "description": "Create a hierarchical mindmap structure about a topic",
    "input_schema": {
        "type": "object",
        "properties": {
            "nodes": {
                "type": "array",
                "description": "List of nodes in the mindmap hierarchy",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string", "description": "Unique identifier for the node"},
                        "label": {"type": "string", "description": "Short title for the node (max 50 chars)"},
                        "content": {"type": "string", "description": "Detailed explanation of the concept (100-300 chars)"},
                        "parent_id": {"type": "string", "description": "ID of the parent node, null for root node"}
                    },
                    "required": ["id", "label", "content"]
                }
            }
        },
        "required": ["nodes"]
    }
}

# Function to generate a mindmap using Claude's tool calling
async def generate_mindmap_with_claude(topic: str, max_nodes: int = 15, max_depth: int = 3) -> List[MindMapNode]:
    """Generate a hierarchical mindmap on a topic using Claude's tool calling."""
    
    # Create the prompt for Claude
    prompt = f"""
    Create a comprehensive, educational mindmap about "{topic}".
    
    The mindmap should have the following characteristics:
    - Hierarchical structure with a root node for the main topic
    - {max_nodes} nodes maximum (including the root)
    - Maximum depth of {max_depth} levels
    - Each node should have a concise label (title) and more detailed content explaining the concept
    - Content should be educational and accurate
    - Structure should be logical and well-organized
    
    Use the create_mindmap tool to structure this information.
    Each node needs:
    1. A unique id (you can use simple identifiers like "1", "1.1", "1.2", "2", etc.)
    2. A short label/title that's clear and descriptive
    3. Content that explains the concept in more detail (100-300 characters)
    4. A parent_id reference (except for the root node)
    
    Make sure the hierarchy is well-structured and the relationships between concepts are clear.
    Create a balanced tree where possible, rather than having all nodes connected directly to the root.
    """
    
    # Make API call to Claude with tool calling
    try:
        message = await client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=4000,
            temperature=0.2,
            system="You are an expert at organizing knowledge into structured, hierarchical mindmaps that are educational and comprehensive.",
            messages=[{"role": "user", "content": prompt}],
            tools=[CREATE_MINDMAP_TOOL]  # Pass the tool as a list
        )
        
        # Extract the tool use from Claude's response
        tool_outputs = []
        for content in message.content:
            if isinstance(content, dict) and content.get("type") == "tool_use":
                tool_outputs.append(content)
        
        if not tool_outputs:
            logger.error(f"Failed to get tool output from Claude for topic: {topic}")
            raise HTTPException(status_code=500, detail="Failed to generate mindmap structure")
            
        # Get the nodes from the tool output
        mindmap_data = json.loads(tool_outputs[0].get("input", "{}"))
        nodes = mindmap_data.get("nodes", [])
        
        # Convert to MindMapNode objects
        return [MindMapNode(**node) for node in nodes]
    
    except Exception as e:
        logger.error(f"Error generating mindmap with Claude: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate mindmap: {str(e)}")

# API Routes
@app.get("/")
async def root():
    return {"message": "Mind Map Learning API is running"}

@app.get("/api")
async def api_root():
    return {"message": "Mind Map Learning API is running"}

@app.post("/api/session/init")
async def initialize_session(graph_data: GraphDataRequest) -> Dict[str, Any]:
    """Initialize or update a session with graph data."""
    try:
        session_id = graph_data.session_id
        session = get_session_data(session_id)
        
        # Store the graph nodes and edges
        for node in graph_data.nodes:
            node_id = node["id"]
            session["graph_nodes"][node_id] = {
                "id": node_id,
                "label": node.get("data", {}).get("label", ""),
                "content": node.get("data", {}).get("content", ""),
                "position": node.get("position", {})
            }
            
            # Initialize the node in the nodes dictionary too
            # This is needed for status updates and progress tracking
            if node_id not in session["nodes"]:
                session["nodes"][node_id] = {
                    "node_id": node_id,
                    "status": node.get("data", {}).get("status", "locked"),
                    "questions": [],
                    "unlockable": False,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
        
        session["graph_edges"] = graph_data.edges
        
        # Build relationships map for efficient access
        relationships = build_node_relationships([
            {"source": edge["source"], "target": edge["target"]} 
            for edge in graph_data.edges
        ])
        
        session["relationships"] = relationships
        
        return {"message": "Session initialized successfully", "session_id": session_id}
        
    except Exception as e:
        logger.error(f"Error initializing session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to initialize session: {str(e)}")

@app.post("/api/questions/generate")
async def generate_questions(request: GenerateQuestionsRequest) -> QuestionResponse:
    """Generate questions for a specific node."""
    try:
        session = get_session_data(request.session_id)
        
        # Store node content in the session for future use
        if request.node_id not in session["graph_nodes"]:
            session["graph_nodes"][request.node_id] = {
                "id": request.node_id,
                "label": request.node_label,
                "content": request.node_content
            }
        
        # Check if we already have questions for this node
        if request.node_id in session["nodes"]:
            node_data = session["nodes"][request.node_id]
            # Only return existing questions if there are any
            if node_data.get("questions", []):
                return QuestionResponse(
                    node_id=request.node_id,
                    questions=node_data["questions"],
                    status=node_data["status"]
                )
        
        # Generate questions using Claude
        prompt = generate_questions_prompt(
            request.node_content,
            request.node_label,
            request.parent_nodes,
            request.child_nodes
        )
        
        response = client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=1024,
            temperature=0.2,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Extract the response text
        response_text = response.content[0].text
        
        # Parse the JSON response
        try:
            questions_data = json.loads(response_text)
            questions = [Question(**q) for q in questions_data]
        except json.JSONDecodeError:
            logger.error(f"Failed to parse Claude response: {response_text}")
            # Fallback: create a default question
            questions = [
                Question(
                    text=f"Explain the key concepts of {request.node_label} in your own words.",
                )
            ]
        
        # Create a node status object
        node_status = NodeStatus(
            node_id=request.node_id,
            status="not_started",
            questions=questions,
            started_at=datetime.utcnow()
        )
        
        # Store in session
        session["nodes"][request.node_id] = node_status.dict()
        
        return QuestionResponse(
            node_id=request.node_id,
            questions=questions,
            status="not_started"
        )
        
    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

@app.post("/api/questions/answer")
async def answer_question(request: AnswerRequest) -> AnswerResponse:
    """Submit and evaluate an answer to a question."""
    try:
        session = get_session_data(request.session_id)
        
        # Check if the node exists in the session
        if request.node_id not in session["nodes"]:
            raise HTTPException(status_code=404, detail="Node not found")
        
        node_data = session["nodes"][request.node_id]
        
        # Find the question
        question_found = False
        for q in node_data["questions"]:
            if q["id"] == request.question_id:
                question = q
                question_found = True
                break
                
        if not question_found:
            raise HTTPException(status_code=404, detail="Question not found")
        
        # Mark the node as in progress if it's not already completed
        if node_data["status"] != "completed":
            node_data["status"] = "in_progress"
            if not node_data.get("started_at"):
                node_data["started_at"] = datetime.utcnow().isoformat()
        
        # Get node content from session
        node_content = session["graph_nodes"].get(request.node_id, {}).get("content", "")
        
        # Evaluate the answer using Claude
        prompt = evaluate_answer_prompt(
            question["text"],
            request.answer,
            node_content
        )
        
        response = client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=1024,
            temperature=0.2,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Extract the response text
        response_text = response.content[0].text
        
        try:
            evaluation = json.loads(response_text)
            
            # Update the question with evaluation results
            question["attempts"] += 1
            question["last_answer"] = request.answer
            question["feedback"] = evaluation.get("feedback", "No feedback provided")
            question["grade"] = evaluation.get("grade", 0)
            question["status"] = "passed" if evaluation.get("passed", False) else "failed"
            question["updated_at"] = datetime.utcnow().isoformat()
            
            # Check if all questions for this node are passed
            all_passed = all(q["status"] == "passed" for q in node_data["questions"])
            if all_passed:
                node_data["status"] = "completed"
                node_data["completed_at"] = datetime.utcnow().isoformat()
            
            return AnswerResponse(
                question_id=request.question_id,
                feedback=question["feedback"],
                grade=question["grade"],
                passed=question["status"] == "passed",
                node_status=node_data["status"],
                all_passed=all_passed
            )
            
        except json.JSONDecodeError:
            logger.error(f"Failed to parse Claude evaluation: {response_text}")
            raise HTTPException(status_code=500, detail="Failed to parse evaluation response")
        
    except Exception as e:
        logger.error(f"Error evaluating answer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to evaluate answer: {str(e)}")

@app.post("/api/questions/regenerate")
async def regenerate_questions(request: UnlockCheckRequest) -> Dict[str, str]:
    """Regenerate questions for a node."""
    try:
        session = get_session_data(request.session_id)
        
        # Check if the node exists in the session
        if request.node_id not in session["nodes"]:
            raise HTTPException(status_code=404, detail="Node not found")
        
        # Reset the node data but keep track of previous attempts
        previous_questions = session["nodes"][request.node_id].get("questions", [])
        previous_status = session["nodes"][request.node_id].get("status", "not_started")
        
        # Create a new node status but archive the old data
        session["nodes"][request.node_id] = {
            "node_id": request.node_id,
            "status": "not_started",
            "questions": [],
            "previous_questions": previous_questions,
            "previous_status": previous_status,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        return {"message": "Questions reset successfully. Generate new questions with the generate endpoint."}
        
    except Exception as e:
        logger.error(f"Error regenerating questions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to regenerate questions: {str(e)}")

@app.get("/api/progress")
async def get_progress(session_id: str) -> ProgressResponse:
    """Get the current progress for a session."""
    try:
        session = get_session_data(session_id)
        return ProgressResponse(nodes=session["nodes"])
        
    except Exception as e:
        logger.error(f"Error getting progress: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get progress: {str(e)}")

@app.post("/api/nodes/check-unlockable")
async def check_node_unlockability(request: UnlockCheckRequest) -> UnlockCheckResponse:
    """Check if a node is unlockable based on its children's completion status."""
    try:
        session = get_session_data(request.session_id)
        
        # Extract edge data and node statuses
        edges = session.get("graph_edges", [])
        
        # Create a map of node IDs to their statuses
        node_statuses = {
            node_id: node_data.get("status", "not_started")
            for node_id, node_data in session.get("nodes", {}).items()
        }
        
        # Check if the node is unlockable
        result = check_node_unlockable(
            request.node_id, 
            [{"source": e["source"], "target": e["target"]} for e in edges],
            node_statuses
        )
        
        # Update the node's unlockable status in the session
        if request.node_id in session["nodes"]:
            session["nodes"][request.node_id]["unlockable"] = result["unlockable"]
        
        return UnlockCheckResponse(unlockable=result["unlockable"], reason="Node is unlockable", incomplete_prerequisites=result.get("children_pending", []))
        
    except Exception as e:
        logger.error(f"Error checking node unlockability: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to check node unlockability: {str(e)}")

@app.post("/api/nodes/update-status")
async def update_node_status(request: UpdateNodeStatusRequest) -> Dict[str, Any]:
    """Update the status of a node."""
    try:
        valid_statuses = ['not_started', 'in_progress', 'completed', 'locked']
        if request.status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        
        session = get_session_data(request.session_id)
        
        # Update the node status
        if request.node_id in session["nodes"]:
            session["nodes"][request.node_id]["status"] = request.status
            session["nodes"][request.node_id]["updated_at"] = datetime.utcnow().isoformat()
            
            # Add timestamp for completed nodes
            if request.status == "completed" and "completed_at" not in session["nodes"][request.node_id]:
                session["nodes"][request.node_id]["completed_at"] = datetime.utcnow().isoformat()
            elif request.status == "in_progress" and "started_at" not in session["nodes"][request.node_id]:
                session["nodes"][request.node_id]["started_at"] = datetime.utcnow().isoformat()
                
            return {"success": True, "status": request.status}
        else:
            # Log more information about the session data to help diagnose
            logger.error(f"Node {request.node_id} not found in session {request.session_id}")
            logger.error(f"Available nodes: {list(session['nodes'].keys())}")
            
            # Return a more descriptive error
            raise HTTPException(
                status_code=404, 
                detail=f"Node {request.node_id} not found in session {request.session_id}. Available nodes: {list(session['nodes'].keys())[:5]}"
            )
    except HTTPException as e:
        # Re-raise HTTP exceptions
        logger.error(f"HTTP error in update_node_status: {e.status_code}: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Error updating node status: {str(e)}")
        # Return a 500 error with more details
        raise HTTPException(status_code=500, detail=f"Failed to update node status: {str(e)}")

@app.get("/api/session/data")
async def get_session_graph_data(session_id: str) -> Dict[str, Any]:
    """Get the full graph data for a session."""
    try:
        session = get_session_data(session_id)
        
        # Return the graph nodes and edges along with progress data
        return {
            "nodes": session.get("graph_nodes", {}),
            "edges": session.get("graph_edges", []),
            "progress": session.get("nodes", {})
        }
        
    except Exception as e:
        logger.error(f"Error getting session graph data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get session graph data: {str(e)}")

@app.get("/api/nodes/{node_id}")
async def get_node_data(session_id: str, node_id: str) -> Dict[str, Any]:
    """Get data for a specific node."""
    try:
        session = get_session_data(session_id)
        
        # Check if the node exists
        if node_id not in session["graph_nodes"]:
            raise HTTPException(status_code=404, detail="Node not found")
            
        # Get node data
        node_data = session["graph_nodes"][node_id]
        
        # Get progress data if it exists
        progress_data = session["nodes"].get(node_id, {})
        
        # Get related nodes
        children = list(session["relationships"]["children"].get(node_id, set()))
        parents = list(session["relationships"]["parents"].get(node_id, set()))
        
        # Combine all data
        result = {
            "node": node_data,
            "progress": progress_data,
            "children": [session["graph_nodes"].get(child_id, {"id": child_id}) for child_id in children],
            "parents": [session["graph_nodes"].get(parent_id, {"id": parent_id}) for parent_id in parents]
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error getting node data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get node data: {str(e)}")

@app.post("/api/mindmap/create")
async def create_mindmap(request: CreateMindMapRequest) -> Dict[str, Any]:
    """Create a new mindmap using Anthropic's Claude with tool calling."""
    session_id = request.session_id
    topic = request.topic
    max_nodes = request.max_nodes
    max_depth = request.max_depth
    
    logger.info(f"Creating mindmap for topic: {topic}")
    
    try:
        # Generate the mindmap nodes using Claude
        mindmap_nodes = await generate_mindmap_with_claude(topic, max_nodes, max_depth)
        
        # Convert to React Flow format
        nodes = []
        edges = []
        
        # Position calculation variables
        levels = {}  # Keep track of nodes at each level
        level_counts = {}  # Count nodes at each level
        
        # First pass: group nodes by level
        for node in mindmap_nodes:
            level = 0
            parent_id = node.parent_id
            
            # Determine level by walking up the tree
            while parent_id:
                level += 1
                parent_node = next((n for n in mindmap_nodes if n.id == parent_id), None)
                parent_id = parent_node.parent_id if parent_node else None
            
            # Initialize level lists if needed
            if level not in levels:
                levels[level] = []
                level_counts[level] = 0
            
            # Add node to appropriate level
            levels[level].append(node)
            level_counts[level] += 1
        
        # Second pass: assign positions and create React Flow nodes
        for level, nodes_at_level in levels.items():
            level_width = len(nodes_at_level)
            
            for i, node in enumerate(nodes_at_level):
                # Calculate position
                x_pos = (i - level_width / 2) * 250  # Horizontal spacing
                y_pos = level * 200  # Vertical spacing
                
                # Create React Flow node
                rf_node = {
                    "id": node.id,
                    "type": "mindmap",
                    "position": {"x": x_pos, "y": y_pos},
                    "data": {
                        "label": node.label,
                        "content": node.content,
                        "status": "not_started"
                    }
                }
                nodes.append(rf_node)
                
                # Create edge if node has a parent
                if node.parent_id:
                    edge_id = f"e-{node.parent_id}-{node.id}"
                    edge = {
                        "id": edge_id,
                        "source": node.parent_id,
                        "target": node.id,
                        "type": "mindmap"
                    }
                    edges.append(edge)
        
        # Store the generated mindmap in the session
        session_data = get_session_data(session_id)
        session_data["graph_nodes"] = {node["id"]: NodeInfo(**node) for node in nodes}
        session_data["graph_edges"] = [EdgeInfo(**edge) for edge in edges]
        
        # Initialize node progress for all nodes
        for node_id in session_data["graph_nodes"]:
            if node_id not in session_data["nodes"]:
                session_data["nodes"][node_id] = NodeStatus(
                    node_id=node_id,
                    status="not_started",
                    questions=[],
                    unlockable=True if node_id == mindmap_nodes[0].id else False  # Only root node is unlocked
                )
        
        # Build node relationships for the new mindmap
        build_node_relationships(session_data)
        
        return {
            "nodes": nodes,
            "edges": edges
        }
    
    except Exception as e:
        logger.error(f"Error creating mindmap: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create mindmap: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 