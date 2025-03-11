from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, Union, Set
import uuid
from datetime import datetime


class Question(BaseModel):
    """Question model for node learning assessment."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    status: str = "unanswered"  # unanswered, passed, failed
    attempts: int = 0
    last_answer: Optional[str] = None
    feedback: Optional[str] = None
    grade: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ChatMessage(BaseModel):
    """Message in a chat conversation about a node."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str  # "user" or "assistant"
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class NodeChat(BaseModel):
    """Chat history for a specific node."""
    node_id: str
    messages: List[ChatMessage] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class NodeStatus(BaseModel):
    """Status of a mind map node in the learning process."""
    node_id: str
    status: str = "not_started"  # not_started, in_progress, completed, locked
    questions: List[Question] = []
    unlockable: bool = False
    completed_at: Optional[datetime] = None
    started_at: Optional[datetime] = None


class NodeInfo(BaseModel):
    """Node information with content and metadata."""
    id: str
    label: str
    content: str
    type: str = "mindmap"
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 0, "y": 0})


class EdgeInfo(BaseModel):
    """Edge connecting two nodes in the mind map."""
    id: str
    source: str
    target: str
    type: str = "flowing"  # flowing, dashed, etc.


class NodeRelationships(BaseModel):
    """Node relationships for efficient access."""
    parents: Dict[str, Set[str]] = Field(default_factory=dict)
    children: Dict[str, Set[str]] = Field(default_factory=dict)


class SessionData(BaseModel):
    """Session data containing the full mind map with progress."""
    session_id: str
    nodes: Dict[str, NodeInfo] = Field(default_factory=dict)
    edges: List[EdgeInfo] = Field(default_factory=list)
    progress: Dict[str, NodeStatus] = Field(default_factory=dict)
    relationships: Optional[NodeRelationships] = None
    chat_history: Dict[str, NodeChat] = Field(default_factory=dict)  # node_id -> chat history
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# Request and Response Models
class GenerateQuestionsRequest(BaseModel):
    """Request to generate questions for a node."""
    node_id: str
    node_content: str
    node_label: str
    parent_nodes: List[Dict[str, str]] = []
    child_nodes: List[Dict[str, str]] = []
    session_id: str


class AnswerRequest(BaseModel):
    """Request to submit an answer to a question."""
    session_id: str
    node_id: str
    question_id: str
    answer: str


class UnlockCheckRequest(BaseModel):
    """Request to check if a node can be unlocked."""
    session_id: str
    node_id: str


class GraphDataRequest(BaseModel):
    """Request to initialize or update a session with graph data."""
    session_id: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]


class ProgressResponse(BaseModel):
    """Response with node progress information."""
    nodes: Dict[str, Any]


class QuestionResponse(BaseModel):
    """Response with questions for a node."""
    node_id: str
    questions: List[Question]
    status: str


class AnswerResponse(BaseModel):
    """Response with evaluation of an answer."""
    question_id: str
    feedback: str
    grade: int
    passed: bool
    node_status: str
    all_passed: bool


class UnlockCheckResponse(BaseModel):
    """Response with node unlockability information."""
    unlockable: bool
    reason: str
    incomplete_prerequisites: Optional[List[str]] = None


class UpdateNodeStatusRequest(BaseModel):
    """Request to update a node's status."""
    session_id: str
    node_id: str
    status: str


class CreateMindMapRequest(BaseModel):
    """Request to create a new mindmap using Anthropic."""
    session_id: str
    topic: str
    max_depth: Optional[int] = Field(default=3, ge=1, le=5)


class GenerateChildNodesRequest(BaseModel):
    """Request to generate child nodes for a specific node."""
    session_id: str
    node_id: str
    max_children: Optional[int] = Field(default=4, ge=2, le=6)


class MindMapNode(BaseModel):
    """Node data returned from Anthropic for mindmap creation."""
    id: str
    label: str
    content: str
    parent_id: Optional[str] = None


class GeneratedMindMap(BaseModel):
    """Complete mindmap structure returned from Anthropic."""
    nodes: List[MindMapNode] 


class ChatMessageRequest(BaseModel):
    """Request to send a chat message for a specific node."""
    session_id: str
    node_id: str
    message: str


class ChatResponse(BaseModel):
    """Response with the chat history for a node."""
    node_id: str
    messages: List[ChatMessage]