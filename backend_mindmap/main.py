from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import os
import json
import math
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
    CreateMindMapRequest, MindMapNode, GeneratedMindMap, UpdateNodeStatusRequest,
    GenerateChildNodesRequest, ChatMessageRequest, ChatResponse, ChatMessage
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

# Define the tool schema for Anthropic to use for creating child nodes
CREATE_CHILD_NODES_TOOL = {
    "name": "create_child_nodes",
    "description": "Create child nodes for a specified parent node in a mindmap",
    "input_schema": {
        "type": "object",
        "properties": {
            "nodes": {
                "type": "array",
                "description": "List of child nodes to add to the parent",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string", "description": "Unique identifier for the node"},
                        "label": {"type": "string", "description": "Short title for the node (max 50 chars)"},
                        "content": {"type": "string", "description": "Detailed explanation of the concept (100-300 chars)"},
                        "parent_id": {"type": "string", "description": "ID of the parent node"}
                    },
                    "required": ["id", "label", "content", "parent_id"]
                }
            }
        },
        "required": ["nodes"]
    }
}

# Function to generate child nodes using Claude's tool calling
async def generate_child_nodes_with_claude(parent_id: str, parent_content: str, parent_label: str, max_children: int = 4) -> List[MindMapNode]:
    """Generate child nodes for a specific parent node using Claude's tool calling."""
    
    logger.info(f"Starting child nodes generation for parent: '{parent_label}' (ID: {parent_id}) with max_children={max_children}")
    
    # Create the prompt for Claude
    prompt = f"""
    I have a concept or topic in a mindmap that needs to be expanded with child nodes. 
    The parent node details are:
    
    ID: {parent_id}
    Label: "{parent_label}"
    Content: "{parent_content}"
    
    Please create {max_children} child nodes that expand on this topic in a logical and educational way.
    Each child node should explore a specific aspect, component, or sub-topic of the parent concept.
    
    Use the create_child_nodes tool to structure this information.
    Each child node needs:
    1. A unique id (use the parent id as a prefix, e.g. if parent is "1.2", use "1.2.1", "1.2.2", etc.)
    2. A short label/title that's clear and descriptive (max 50 characters)
    3. Content that explains the concept in more detail (100-300 characters)
    4. The parent_id reference which should be: "{parent_id}"
    
    Make sure the child nodes:
    - Are distinct from each other (cover different aspects)
    - Are directly related to the parent topic
    - Together provide comprehensive coverage of the parent topic
    - Have educational value and accurate content
    - Have an appropriate level of detail (not too broad, not too specific)
    """
    
    logger.info(f"Sending request to Claude API for parent node: '{parent_label}' (ID: {parent_id})")
    
    # Make API call to Claude with tool calling
    try:
        logger.info("Creating message with Claude API")
        message = client.messages.create(
            model="claude-3-7-sonnet-20250219",  # Using Claude 3.7 Sonnet as specified
            max_tokens=2000,
            temperature=0.2,
            system="You are an expert at expanding educational topics into well-structured, comprehensive subtopics.",
            messages=[{"role": "user", "content": prompt}],
            tools=[CREATE_CHILD_NODES_TOOL]
        )
        
        logger.info(f"Received response from Claude API, message ID: {message.id}")
        
        # Debug: log the full message structure
        logger.debug(f"Claude response structure: {type(message)}")
        if hasattr(message, 'content'):
            logger.debug(f"Content types: {[type(c) for c in message.content]}")
            for i, content_block in enumerate(message.content):
                logger.debug(f"Content block {i} type: {type(content_block)}")
                if hasattr(content_block, 'type'):
                    logger.debug(f"Content block {i} 'type' attribute: {content_block.type}")
                elif isinstance(content_block, dict):
                    logger.debug(f"Content block {i} keys: {content_block.keys()}")
        
        # Extract the tool use from Claude's response
        tool_outputs = []
        logger.info("Parsing Claude response to extract tool outputs")
        for content in message.content:
            if hasattr(content, 'type'):
                content_type = content.type
            elif isinstance(content, dict) and 'type' in content:
                content_type = content['type']
            else:
                content_type = str(type(content))
                
            logger.debug(f"Processing content block of type: {content_type}")
            
            # Check for tool_use in different formats
            if isinstance(content, dict) and content.get("type") == "tool_use":
                tool_outputs.append(content)
            elif hasattr(content, 'type') and content.type == "tool_use":
                # Convert to dict if it's an object
                tool_outputs.append(vars(content) if hasattr(content, '__dict__') else content)
        
        if not tool_outputs:
            # Logging the response content for debugging
            logger.warning(f"Failed to get tool output for parent node: {parent_id}. Response content types: {[type(c) for c in message.content]}")
            logger.warning(f"First content block: {message.content[0] if message.content else 'No content'}")
            
            # In this case, we'll create default child nodes
            default_nodes = []
            for i in range(1, max_children + 1):
                child_id = f"{parent_id}.{i}"
                default_nodes.append(MindMapNode(
                    id=child_id,
                    label=f"Aspect {i} of {parent_label}",
                    content=f"This is a key component of {parent_label} that explores important concepts related to this subject.",
                    parent_id=parent_id
                ))
            logger.info(f"Created {len(default_nodes)} default child nodes for parent: {parent_id}")
            return default_nodes
            
        # Get the nodes from the tool output
        logger.info("Extracting child nodes data from tool output")
        try:
            tool_output = tool_outputs[0]
            input_data = tool_output.get("input", "{}")
            if isinstance(input_data, dict):
                child_nodes_data = input_data
            else:
                child_nodes_data = json.loads(input_data)
            
            nodes = child_nodes_data.get("nodes", [])
        except json.JSONDecodeError:
            logger.error(f"Failed to parse tool output as JSON: {tool_outputs[0].get('input')}")
            nodes = []
        except Exception as parse_error:
            logger.error(f"Error parsing tool output: {str(parse_error)}")
            nodes = []
        
        if not nodes:
            logger.warning(f"No nodes returned from Claude for parent: {parent_id}. Creating default child nodes.")
            # Create default child nodes
            default_nodes = []
            for i in range(1, max_children + 1):
                child_id = f"{parent_id}.{i}"
                default_nodes.append(MindMapNode(
                    id=child_id,
                    label=f"Aspect {i} of {parent_label}",
                    content=f"This is a key component of {parent_label} that explores important concepts related to this subject.",
                    parent_id=parent_id
                ))
            logger.info(f"Created {len(default_nodes)} default child nodes after error for parent: {parent_id}")
            return default_nodes
        
        logger.info(f"Successfully generated {len(nodes)} child nodes for parent: '{parent_label}' (ID: {parent_id})")
        
        # Convert to MindMapNode objects
        return [MindMapNode(**node) for node in nodes]
    
    except Exception as e:
        logger.error(f"Error generating child nodes with Claude: {str(e)}", exc_info=True)
        # On error, return some default child nodes instead of failing
        default_nodes = []
        for i in range(1, max_children + 1):
            child_id = f"{parent_id}.{i}"
            default_nodes.append(MindMapNode(
                id=child_id,
                label=f"Aspect {i} of {parent_label}",
                content=f"This is a key component of {parent_label} that explores important concepts related to this subject.",
                parent_id=parent_id
            ))
        logger.info(f"Created {len(default_nodes)} default child nodes after error for parent: {parent_id}")
        return default_nodes

# Function to generate just the root node for a mindmap
async def generate_root_node_with_claude(topic: str) -> MindMapNode:
    """Generate just the root node for a mindmap topic."""
    
    logger.info(f"Generating root node for topic: '{topic}'")
    
    # Create the prompt for Claude
    prompt = f"""
    Create a root node for an educational mindmap about "{topic}".
    
    The root node should:
    - Have a clear, concise label (title) representing the main topic
    - Include a comprehensive but concise content description (100-300 characters)
    - Use the ID "1" for the root node
    - Have no parent_id (it's the root)
    
    Use the create_mindmap tool to return just this single root node.
    """
    
    logger.info(f"Sending request to Claude API for root node creation on topic: '{topic}'")
    
    try:
        # Make API call to Claude
        logger.info("Creating message with Claude API")
        message = client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=1000,
            temperature=0.2,
            system="You are an expert at organizing knowledge into structured, hierarchical mindmaps.",
            messages=[{"role": "user", "content": prompt}],
            tools=[CREATE_MINDMAP_TOOL]
        )
        
        logger.info(f"Received response from Claude API, message ID: {message.id}")
        
        # Debug: log the full message structure
        logger.debug(f"Claude response structure: {type(message)}")
        if hasattr(message, 'content'):
            logger.debug(f"Content types: {[type(c) for c in message.content]}")
            for i, content_block in enumerate(message.content):
                logger.debug(f"Content block {i} type: {type(content_block)}")
                if hasattr(content_block, 'type'):
                    logger.debug(f"Content block {i} 'type' attribute: {content_block.type}")
                elif isinstance(content_block, dict):
                    logger.debug(f"Content block {i} keys: {content_block.keys()}")
        
        # Extract the tool use from Claude's response
        tool_outputs = []
        logger.info("Parsing Claude response to extract tool outputs")
        for content in message.content:
            if hasattr(content, 'type'):
                content_type = content.type
            elif isinstance(content, dict) and 'type' in content:
                content_type = content['type']
            else:
                content_type = str(type(content))
                
            logger.debug(f"Processing content block of type: {content_type}")
            
            # Check for tool_use in different formats
            if isinstance(content, dict) and content.get("type") == "tool_use":
                tool_outputs.append(content)
            elif hasattr(content, 'type') and content.type == "tool_use":
                # Convert to dict if it's an object
                tool_outputs.append(vars(content) if hasattr(content, '__dict__') else content)
        
        if not tool_outputs:
            # Logging the response content for debugging
            logger.warning(f"Failed to get tool output for root node creation. Response content types: {[type(c) for c in message.content]}")
            logger.warning(f"First content block: {message.content[0] if message.content else 'No content'}")
            
            # Create a default root node
            return MindMapNode(
                id="1",
                label=topic,
                content=f"Overview of {topic}: A comprehensive exploration of this subject and its key aspects.",
                parent_id=None
            )
            
        # Get the nodes from the tool output
        logger.info("Extracting root node data from tool output")
        try:
            tool_output = tool_outputs[0]
            input_data = tool_output.get("input", "{}")
            if isinstance(input_data, dict):
                mindmap_data = input_data
            else:
                mindmap_data = json.loads(input_data)
            
            nodes = mindmap_data.get("nodes", [])
        except json.JSONDecodeError:
            logger.error(f"Failed to parse tool output as JSON: {tool_outputs[0].get('input')}")
            nodes = []
        except Exception as parse_error:
            logger.error(f"Error parsing tool output: {str(parse_error)}")
            nodes = []
        
        if not nodes:
            logger.warning("No nodes returned from Claude. Creating default root node.")
            return MindMapNode(
                id="1",
                label=topic,
                content=f"Overview of {topic}: A comprehensive exploration of this subject and its key aspects.",
                parent_id=None
            )
        
        # Take the first node as the root node
        root_node = MindMapNode(**nodes[0])
        logger.info(f"Successfully generated root node: '{root_node.label}'")
        
        return root_node
        
    except Exception as e:
        logger.error(f"Error generating root node with Claude: {str(e)}", exc_info=True)
        # Return a default root node on error
        return MindMapNode(
            id="1",
            label=topic,
            content=f"Overview of {topic}: A comprehensive exploration of this subject and its key aspects.",
            parent_id=None
        )

# Function to recursively generate mindmap nodes
async def generate_mindmap_recursively(topic: str, max_depth: int = 3, max_children_per_node: int = 4) -> List[MindMapNode]:
    """Generate a mindmap recursively, level by level."""
    
    logger.info(f"Starting recursive mindmap generation for topic: '{topic}' with max_depth={max_depth}")
    
    # All nodes in the mindmap
    all_nodes = []
    
    try:
        # Generate the root node
        root_node = await generate_root_node_with_claude(topic)
        all_nodes.append(root_node)
        logger.info(f"Added root node '{root_node.label}' (ID: {root_node.id}) to mindmap")
        
        # Queue of nodes to process, with their level
        nodes_to_process = [(root_node, 1)]  # Start with the root node at level 1
        
        # Process nodes level by level using BFS
        while nodes_to_process:
            current_node, current_level = nodes_to_process.pop(0)
            logger.info(f"Processing node: '{current_node.label}' (ID: {current_node.id}) at level {current_level}")
            
            # Skip generating children if we've reached max depth
            if current_level >= max_depth:
                logger.info(f"Reached max depth {max_depth} for node {current_node.id}. Skipping child generation.")
                continue
            
            logger.info(f"Generating children for node: '{current_node.label}' (ID: {current_node.id}) at level {current_level}")
            
            try:
                # Generate child nodes with retry mechanism
                retry_count = 0
                max_retries = 2
                child_nodes = []
                
                while retry_count <= max_retries and not child_nodes:
                    try:
                        # Generate child nodes
                        child_nodes = await generate_child_nodes_with_claude(
                            current_node.id,
                            current_node.content,
                            current_node.label,
                            max_children_per_node
                        )
                        
                        if not child_nodes and retry_count < max_retries:
                            logger.warning(f"No child nodes generated for {current_node.id} on attempt {retry_count+1}. Retrying...")
                            retry_count += 1
                        elif not child_nodes:
                            logger.warning(f"Failed to generate child nodes for {current_node.id} after {max_retries+1} attempts")
                            break
                        
                    except Exception as retry_error:
                        logger.error(f"Error on attempt {retry_count+1} generating children for node {current_node.id}: {str(retry_error)}")
                        if retry_count < max_retries:
                            retry_count += 1
                            logger.info(f"Retrying child generation for node {current_node.id} (Attempt {retry_count+1}/{max_retries+1})")
                        else:
                            logger.error(f"Exhausted retries for node {current_node.id}")
                            break
                
                # Add child nodes to the full list and queue
                for child_node in child_nodes:
                    all_nodes.append(child_node)
                    # Add to processing queue for next level
                    nodes_to_process.append((child_node, current_level + 1))
                    
                logger.info(f"Added {len(child_nodes)} children to node {current_node.id}")
                
            except Exception as e:
                logger.error(f"Unhandled error generating children for node {current_node.id}: {str(e)}", exc_info=True)
                # Continue with other nodes even if one fails
                continue
        
        logger.info(f"Completed recursive mindmap generation with {len(all_nodes)} total nodes")
        
        # Add level information for better logging
        for node in all_nodes:
            level = 0
            parent_id = node.parent_id
            
            # Determine level by walking up the tree
            while parent_id:
                level += 1
                parent_node = next((n for n in all_nodes if n.id == parent_id), None)
                parent_id = parent_node.parent_id if parent_node else None
            
            logger.debug(f"Node '{node.label}' (ID: {node.id}) is at level {level}")
        
        return all_nodes
        
    except Exception as e:
        logger.error(f"Error in recursive mindmap generation: {str(e)}", exc_info=True)
        
        # If we have at least a root node, return what we have
        if all_nodes:
            logger.warning(f"Returning partial mindmap with {len(all_nodes)} nodes due to error")
            return all_nodes
            
        # Otherwise create and return just a root node
        logger.warning("Creating default root node due to error")
        return [MindMapNode(
            id="1",
            label=topic,
            content=f"Overview of {topic}: A comprehensive exploration of this subject and its key aspects.",
            parent_id=None
        )]

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
            
            # Create NodeInfo object with proper structure
            session["graph_nodes"][node_id] = NodeInfo(
                id=node_id,
                label=node.get("data", {}).get("label", ""),
                content=node.get("data", {}).get("content", ""),
                position=node.get("position", {}),
                type="mindmap"
            )
            
            # Initialize the node in the nodes dictionary too
            # This is needed for status updates and progress tracking
            if node_id not in session["nodes"]:
                # Create NodeStatus object with proper structure
                session["nodes"][node_id] = NodeStatus(
                    node_id=node_id,
                    status=node.get("data", {}).get("status", "locked"),
                    questions=[],
                    unlockable=False
                )
        
        # Store edges as EdgeInfo objects
        session["graph_edges"] = [EdgeInfo(**edge) for edge in graph_data.edges]
        
        # Build relationships map for efficient access
        relationships = build_node_relationships([
            {"source": edge["source"], "target": edge["target"]} 
            for edge in graph_data.edges
        ])
        
        session["relationships"] = relationships
        
        return {"message": "Session initialized successfully", "session_id": session_id}
        
    except Exception as e:
        logger.error(f"Error initializing session: {str(e)}", exc_info=True)
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
            node_id: node_data.status  # Fix: Access status as an attribute
            for node_id, node_data in session.get("nodes", {}).items()
        }
        
        # Check if the node is unlockable
        result = check_node_unlockable(
            request.node_id, 
            [{"source": e.source, "target": e.target} for e in edges],  # Fix: Access source/target as attributes
            node_statuses
        )
        
        # Update the node's unlockable status in the session
        if request.node_id in session["nodes"]:
            # Fix: Use attribute assignment
            session["nodes"][request.node_id].unlockable = result["unlockable"]
        
        return UnlockCheckResponse(unlockable=result["unlockable"], reason="Node is unlockable", incomplete_prerequisites=result.get("children_pending", []))
        
    except Exception as e:
        logger.error(f"Error checking node unlockability: {str(e)}", exc_info=True)
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
            node_status = session["nodes"][request.node_id]
            
            # Fix: Use attribute assignment for NodeStatus object
            node_status.status = request.status
            current_time = datetime.utcnow().isoformat()
            
            # Add timestamp for completed nodes
            if request.status == "completed" and not node_status.completed_at:
                node_status.completed_at = current_time
            elif request.status == "in_progress" and not node_status.started_at:
                node_status.started_at = current_time
                
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
    max_depth = request.max_depth
    
    logger.info(f"Creating mindmap for topic: '{topic}' with max_depth={max_depth}, session_id={session_id}")
    
    try:
        # Generate the mindmap nodes using Claude - recursively
        logger.info(f"Calling generate_mindmap_recursively for topic: '{topic}'")
        mindmap_nodes = await generate_mindmap_recursively(topic, max_depth)
        logger.info(f"Successfully received {len(mindmap_nodes)} nodes from generate_mindmap_recursively")
        
        # Convert to React Flow format
        logger.info("Converting mindmap nodes to React Flow format")
        nodes = []
        edges = []
        
        # Position calculation variables
        levels = {}  # Keep track of nodes at each level
        level_counts = {}  # Count nodes at each level
        
        # First pass: group nodes by level
        logger.info("Organizing nodes by level")
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
        
        logger.info(f"Nodes organized into {len(levels)} levels")
        
        # Second pass: assign positions and create React Flow nodes
        logger.info("Assigning positions and creating React Flow nodes")
        for level, nodes_at_level in levels.items():
            level_width = len(nodes_at_level)
            logger.debug(f"Processing level {level} with {level_width} nodes")
            
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
        logger.info(f"Storing mindmap data in session {session_id}")
        session_data = get_session_data(session_id)
        
        # Fix: Extract label and content from the data field when creating NodeInfo objects
        session_data["graph_nodes"] = {}
        for node in nodes:
            node_id = node["id"]
            # Extract the label and content from the data field
            node_label = node["data"]["label"]
            node_content = node["data"]["content"]
            node_position = node["position"]
            
            # Create NodeInfo with the correct structure
            session_data["graph_nodes"][node_id] = NodeInfo(
                id=node_id,
                label=node_label,
                content=node_content,
                position=node_position,
                type="mindmap"
            )
            
        session_data["graph_edges"] = [EdgeInfo(**edge) for edge in edges]
        
        # Initialize node progress for all nodes
        logger.info("Initializing node progress status")
        for node_id in session_data["graph_nodes"]:
            if node_id not in session_data["nodes"]:
                is_root = node_id == mindmap_nodes[0].id if mindmap_nodes else False
                session_data["nodes"][node_id] = NodeStatus(
                    node_id=node_id,
                    status="not_started",
                    questions=[],
                    unlockable=True if is_root else False  # Only root node is unlocked
                )
        
        # Build node relationships for the new mindmap
        logger.info("Building node relationships")
        relationships = build_node_relationships([
            {"source": edge["source"], "target": edge["target"]} 
            for edge in edges
        ])
        session_data["relationships"] = relationships
        
        logger.info(f"Successfully created mindmap with {len(nodes)} nodes and {len(edges)} edges")
        
        return {
            "nodes": nodes,
            "edges": edges
        }
    
    except Exception as e:
        logger.error(f"Error creating mindmap: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create mindmap: {str(e)}")

@app.post("/api/mindmap/generate-child-nodes")
async def generate_child_nodes(request: GenerateChildNodesRequest) -> Dict[str, Any]:
    """Generate child nodes for a specific node in the mindmap."""
    session_id = request.session_id
    node_id = request.node_id
    max_children = request.max_children
    
    logger.info(f"Generating child nodes for node: {node_id} in session: {session_id}, max_children={max_children}")
    
    try:
        # Get session data
        logger.info(f"Getting session data for session_id: {session_id}")
        session = get_session_data(session_id)
        
        # Check if the node exists
        if node_id not in session["graph_nodes"]:
            logger.error(f"Node {node_id} not found in session {session_id}")
            raise HTTPException(status_code=404, detail=f"Node {node_id} not found in session")
        
        # Get the parent node data
        parent_node = session["graph_nodes"][node_id]
        
        # Fix: Directly access the label and content from the NodeInfo object
        parent_label = parent_node.label
        parent_content = parent_node.content
        logger.info(f"Parent node found: {parent_label} (ID: {node_id})")
        
        # Generate child nodes using Claude
        logger.info(f"Calling generate_child_nodes_with_claude for node: {node_id}")
        child_nodes = await generate_child_nodes_with_claude(
            node_id, 
            parent_content, 
            parent_label, 
            max_children
        )
        logger.info(f"Successfully received {len(child_nodes)} child nodes from generate_child_nodes_with_claude")
        
        # Check if we already have children for this node
        existing_child_edges = [
            edge for edge in session["graph_edges"] 
            if edge.source == node_id
        ]
        
        if existing_child_edges:
            logger.warning(f"Node {node_id} already has {len(existing_child_edges)} children. Adding new ones.")
        
        # Convert to React Flow format
        logger.info("Converting child nodes to React Flow format")
        new_nodes = []
        new_edges = []
        
        # Calculate positions for the child nodes in a semi-circle below the parent
        # Get the parent position
        parent_position = parent_node.position
        
        # Position the children below the parent in a semi-circle
        child_count = len(child_nodes)
        logger.info(f"Positioning {child_count} child nodes in a semi-circle")
        for i, node in enumerate(child_nodes):
            # Calculate position - spread evenly in a semi-circle below parent
            angle = math.pi * (i / (child_count - 1) if child_count > 1 else 0.5)
            radius = 250  # Distance from parent
            
            x_pos = parent_position["x"] + radius * math.cos(angle)
            y_pos = parent_position["y"] + 200 + (radius * math.sin(angle) * 0.5)
            
            # Create React Flow node
            rf_node = {
                "id": node.id,
                "type": "mindmap",
                "position": {"x": x_pos, "y": y_pos},
                "data": {
                    "label": node.label,
                    "content": node.content,
                    "status": "locked"  # Start as locked, parent must be completed to unlock
                }
            }
            new_nodes.append(rf_node)
            
            # Create edge from parent to this node
            edge_id = f"e-{node_id}-{node.id}"
            edge = {
                "id": edge_id,
                "source": node_id,
                "target": node.id,
                "type": "mindmap"
            }
            new_edges.append(edge)
            
            logger.debug(f"Created node {node.id} with label '{node.label}'")
            
            # Add to session data
            session["graph_nodes"][node.id] = NodeInfo(
                id=node.id,
                label=node.label,
                content=node.content,
                position={"x": x_pos, "y": y_pos}
            )
            
            # Initialize node progress
            session["nodes"][node.id] = NodeStatus(
                node_id=node.id,
                status="locked",
                questions=[],
                unlockable=False
            )
            
            # Add edge to session data
            session["graph_edges"].append(EdgeInfo(
                id=edge_id,
                source=node_id,
                target=node.id,
                type="mindmap"
            ))
        
        # Update relationships in the session
        logger.info("Updating node relationships in session data")
        relationships = build_node_relationships([
            {"source": edge.source, "target": edge.target} 
            for edge in session["graph_edges"]
        ])
        session["relationships"] = relationships
        
        logger.info(f"Successfully generated {len(new_nodes)} child nodes for node {node_id}")
        
        # Return the new nodes and edges
        return {
            "nodes": new_nodes,
            "edges": new_edges
        }
    
    except Exception as e:
        logger.error(f"Error generating child nodes: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate child nodes: {str(e)}")


@app.get("/api/chat/{node_id}")
async def get_node_chat(node_id: str, session_id: str):
    """Get the chat history for a specific node."""
    logger.info(f"Getting chat history for node: {node_id} in session: {session_id}")
    
    # Get session data
    session = get_session_data(session_id)
    
    # Check if node exists
    if node_id not in session["graph_nodes"]:
        raise HTTPException(status_code=404, detail=f"Node {node_id} not found")
    
    # Get or create chat history for this node
    if "chat_history" not in session:
        session["chat_history"] = {}
        
    if node_id not in session["chat_history"]:
        node_info = session["graph_nodes"][node_id]
        session["chat_history"][node_id] = {
            "node_id": node_id,
            "messages": [
                {
                    "id": str(uuid.uuid4()),
                    "role": "assistant",
                    "content": f"Hello! I'm your guide for learning about '{node_info.label}'. What would you like to know or discuss about this topic?",
                    "created_at": datetime.utcnow()
                }
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    
    # Convert to ChatResponse model
    messages = [
        ChatMessage(
            id=msg.get("id", str(uuid.uuid4())),
            role=msg["role"],
            content=msg["content"],
            created_at=msg.get("created_at", datetime.utcnow())
        ) for msg in session["chat_history"][node_id]["messages"]
    ]
    
    return ChatResponse(
        node_id=node_id,
        messages=messages
    )


@app.post("/api/chat/{node_id}")
async def send_chat_message(node_id: str, request: ChatMessageRequest):
    """Send a message in the chat for a specific node and get a response."""
    logger.info(f"Sending chat message for node: {node_id}")
    
    # Get session data
    session_id = request.session_id
    session = get_session_data(session_id)
    
    # Check if node exists
    if node_id not in session["graph_nodes"]:
        raise HTTPException(status_code=404, detail=f"Node {node_id} not found")
    
    # Get node information
    node_info = session["graph_nodes"][node_id]
    
    # Initialize chat history dict if it doesn't exist
    if "chat_history" not in session:
        session["chat_history"] = {}
    
    # Get or create chat history for this node
    if node_id not in session["chat_history"]:
        session["chat_history"][node_id] = {
            "node_id": node_id,
            "messages": [
                {
                    "id": str(uuid.uuid4()),
                    "role": "assistant",
                    "content": f"Hello! I'm your guide for learning about '{node_info.label}'. What would you like to know or discuss about this topic?",
                    "created_at": datetime.utcnow()
                }
            ],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    
    # Add user message to chat history
    user_message = {
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": request.message,
        "created_at": datetime.utcnow()
    }
    session["chat_history"][node_id]["messages"].append(user_message)
    
    # Generate AI response using Claude
    try:
        # Get the relationships
        relationships = session.get("relationships", {})
        
        # Get parent nodes to provide context
        parent_ids = set()
        for edge in session["graph_edges"]:
            if edge.target == node_id:
                parent_ids.add(edge.source)
                
        parent_nodes = []
        for parent_id in parent_ids:
            if parent_id in session["graph_nodes"]:
                parent_node = session["graph_nodes"][parent_id]
                parent_nodes.append({
                    "label": parent_node.label,
                    "content": parent_node.content
                })
        
        # Get child nodes to provide context
        child_ids = set()
        for edge in session["graph_edges"]:
            if edge.source == node_id:
                child_ids.add(edge.target)
                
        child_nodes = []
        for child_id in child_ids:
            if child_id in session["graph_nodes"]:
                child_node = session["graph_nodes"][child_id]
                child_nodes.append({
                    "label": child_node.label,
                    "content": child_node.content
                })
        
        # Get a message history formatted for Claude
        message_history = []
        for msg in session["chat_history"][node_id]["messages"]:
            message_history.append({"role": msg["role"], "content": msg["content"]})
            
        # Create system prompt with context about the node
        system_prompt = f"""You are an AI tutor specialized in teaching about '{node_info.label}'. 
Your goal is to help the user understand this topic in depth.

Here is the content about '{node_info.label}' that you should use as your primary source of information:
---
{node_info.content}
---

"""
        
        # Add parent and child node context if available
        if parent_nodes:
            system_prompt += "\nThis topic is related to these parent topics:\n"
            for i, parent in enumerate(parent_nodes):
                system_prompt += f"{i+1}. {parent['label']}: {parent['content'][:200]}...\n"
        
        if child_nodes:
            system_prompt += "\nThis topic has these subtopics:\n"
            for i, child in enumerate(child_nodes):
                system_prompt += f"{i+1}. {child['label']}: {child['content'][:200]}...\n"
        
        system_prompt += "\nYour responses should be educational, accurate, and helpful. Encourage the user to ask questions and engage with the material."
        
        # Call Claude to generate a response
        client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        response = client.messages.create(
            model="claude-3-7-sonnet-20240229",
            system=system_prompt,
            messages=message_history,
            max_tokens=1000,
            temperature=0.3,
        )
        
        # Extract the response
        ai_response = response.content[0].text
        
        # Add assistant response to chat history
        assistant_message = {
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": ai_response,
            "created_at": datetime.utcnow()
        }
        session["chat_history"][node_id]["messages"].append(assistant_message)
        
        # Update the chat history's updated_at timestamp
        session["chat_history"][node_id]["updated_at"] = datetime.utcnow()
        
    except Exception as e:
        logger.error(f"Error generating chat response: {str(e)}", exc_info=True)
        # Add a fallback message
        assistant_message = {
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": "I'm sorry, I encountered an error while processing your message. Please try again.",
            "created_at": datetime.utcnow()
        }
        session["chat_history"][node_id]["messages"].append(assistant_message)
    
    # Convert to ChatResponse model
    messages = [
        ChatMessage(
            id=msg.get("id", str(uuid.uuid4())),
            role=msg["role"],
            content=msg["content"],
            created_at=msg.get("created_at", datetime.utcnow())
        ) for msg in session["chat_history"][node_id]["messages"]
    ]
    
    return ChatResponse(
        node_id=node_id,
        messages=messages
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 