"""Pydantic models for the backend."""
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Set, Any, Union
from datetime import datetime
import uuid


class Question(BaseModel):
    """Model representing a question about a node."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    feedback: Optional[str] = None
    grade: Optional[int] = None
    status: str = "not_attempted"
    attempts: int = 0
    last_answer: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class NodeStatus(BaseModel):
    """Model representing the status of a node."""
    node_id: str
    status: str = "locked"  # locked, not_started, in_progress, completed
    questions: List[Question] = []
    unlockable: bool = False
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class NodePosition(BaseModel):
    """Model representing a node's position in the graph."""
    x: float = 0.0
    y: float = 0.0


class NodeInfo(BaseModel):
    """Model representing a node in the graph."""
    id: str
    label: str
    content: str
    position: Optional[Dict[str, float]] = None
    type: str = "mindmap"


class EdgeInfo(BaseModel):
    """Model representing an edge in the graph."""
    id: str
    source: str
    target: str
    type: str = "mindmap"


class NodeRelationships(BaseModel):
    """Model representing the relationships between nodes."""
    parents: Dict[str, Set[str]] = {}
    children: Dict[str, Set[str]] = {}


class SessionData(BaseModel):
    """Model representing session data."""
    nodes: Dict[str, NodeStatus] = {}
    graph_nodes: Dict[str, NodeInfo] = {}
    graph_edges: List[EdgeInfo] = []
    relationships: NodeRelationships = Field(default_factory=NodeRelationships)
    chat_history: Optional[Dict[str, Any]] = {}


class MindMapNode(BaseModel):
    """Model representing a node in the mindmap."""
    id: str
    label: str
    content: str
    parent_id: Optional[str] = None


class GeneratedMindMap(BaseModel):
    """Model representing a generated mindmap."""
    nodes: List[MindMapNode]


class ChatMessage(BaseModel):
    """Model representing a message in a chat."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Request and Response Models
class GraphDataRequest(BaseModel):
    """Request model for initializing a session with graph data."""
    session_id: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]


class GenerateQuestionsRequest(BaseModel):
    """Request model for generating questions."""
    session_id: str
    node_id: str
    node_label: str
    node_content: str
    parent_nodes: List[Dict[str, str]] = []
    child_nodes: List[Dict[str, str]] = []


class AnswerRequest(BaseModel):
    """Request model for submitting an answer."""
    session_id: str
    node_id: str
    question_id: str
    answer: str


class UnlockCheckRequest(BaseModel):
    """Request model for checking if a node is unlockable."""
    session_id: str
    node_id: str


class CreateMindMapRequest(BaseModel):
    """Request model for creating a mindmap."""
    session_id: str
    topic: str
    max_depth: int = 3


class UpdateNodeStatusRequest(BaseModel):
    """Request model for updating a node's status."""
    session_id: str
    node_id: str
    status: str


class GenerateChildNodesRequest(BaseModel):
    """Request model for generating child nodes."""
    session_id: str
    node_id: str
    max_children: int = 4


class ChatMessageRequest(BaseModel):
    """Request model for sending a chat message."""
    session_id: str
    message: str


# Response Models
class ProgressResponse(BaseModel):
    """Response model for getting progress data."""
    nodes: Dict[str, Any]


class QuestionResponse(BaseModel):
    """Response model for getting questions."""
    node_id: str
    questions: List[Question]
    status: str


class AnswerResponse(BaseModel):
    """Response model for submitting an answer."""
    question_id: str
    feedback: str
    grade: int
    passed: bool
    node_status: str
    all_passed: bool


class UnlockCheckResponse(BaseModel):
    """Response model for checking if a node is unlockable."""
    unlockable: bool
    reason: str
    incomplete_prerequisites: List[str] = []


class ChatResponse(BaseModel):
    """Response model for chat."""
    node_id: str
    messages: List[ChatMessage] 