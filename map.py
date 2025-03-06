from typing import Dict, List, Set, Any, Optional, Union, Tuple
import uuid
import json
import httpx
from datetime import datetime


class MindMapNode:
    def __init__(self, 
                 node_id: str = None, 
                 label: str = "", 
                 content: str = "",
                 status: str = "not_started",
                 position: Dict[str, float] = None):
        """
        Initialize a mind map node.
        
        Args:
            node_id: Unique identifier for the node (generated if not provided)
            label: Short title or name of the node
            content: Detailed content or description for the node
            status: Current status of the node (not_started, in_progress, completed, locked)
            position: x,y coordinates for visualization
        """
        self.id = node_id if node_id else str(uuid.uuid4())
        self.label = label
        self.content = content
        self.status = status
        self.position = position or {"x": 0, "y": 0}
        self.questions = []
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert node to dictionary representation for API/frontend."""
        return {
            "id": self.id,
            "data": {
                "label": self.label,
                "content": self.content,
                "status": self.status
            },
            "position": self.position,
            "questions": self.questions
        }
    
    def update_status(self, new_status: str) -> None:
        """Update the status of this node."""
        valid_statuses = ["not_started", "in_progress", "completed", "locked"]
        if new_status not in valid_statuses:
            raise ValueError(f"Status must be one of {valid_statuses}")
        self.status = new_status
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MindMapNode':
        """Create a node from a dictionary representation."""
        node_data = data.get("data", {})
        return cls(
            node_id=data.get("id"),
            label=node_data.get("label", ""),
            content=node_data.get("content", ""),
            status=node_data.get("status", "not_started"),
            position=data.get("position")
        )


class MindMapEdge:
    def __init__(self, edge_id: str = None, source: str = "", target: str = "", edge_type: str = "flowing"):
        """
        Initialize a mind map edge.
        
        Args:
            edge_id: Unique identifier for the edge (generated if not provided)
            source: ID of the source node
            target: ID of the target node
            edge_type: Type of edge (default: "flowing")
        """
        self.id = edge_id if edge_id else f"e{str(uuid.uuid4())}"
        self.source = source
        self.target = target
        self.type = edge_type
        
    def to_dict(self) -> Dict[str, str]:
        """Convert edge to dictionary representation for API/frontend."""
        return {
            "id": self.id,
            "source": self.source,
            "target": self.target,
            "type": self.type
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MindMapEdge':
        """Create an edge from a dictionary representation."""
        return cls(
            edge_id=data.get("id"),
            source=data.get("source", ""),
            target=data.get("target", ""),
            edge_type=data.get("type", "flowing")
        )


class Question:
    def __init__(self, 
                 question_id: str = None, 
                 text: str = "", 
                 status: str = "unanswered",
                 attempts: int = 0,
                 last_answer: str = None,
                 feedback: str = None,
                 grade: int = None):
        """
        Initialize a question for a mind map node.
        
        Args:
            question_id: Unique identifier for the question
            text: The question text
            status: Current status (unanswered, passed, failed)
            attempts: Number of attempts made to answer
            last_answer: The most recent answer provided
            feedback: Feedback on the last answer
            grade: Score assigned to the last answer
        """
        self.id = question_id if question_id else str(uuid.uuid4())
        self.text = text
        self.status = status
        self.attempts = attempts
        self.last_answer = last_answer
        self.feedback = feedback
        self.grade = grade
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert question to dictionary representation."""
        return {
            "id": self.id,
            "text": self.text,
            "status": self.status,
            "attempts": self.attempts,
            "last_answer": self.last_answer,
            "feedback": self.feedback,
            "grade": self.grade
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Question':
        """Create a question from a dictionary representation."""
        return cls(
            question_id=data.get("id"),
            text=data.get("text", ""),
            status=data.get("status", "unanswered"),
            attempts=data.get("attempts", 0),
            last_answer=data.get("last_answer"),
            feedback=data.get("feedback"),
            grade=data.get("grade")
        )


class MindMap:
    def __init__(self):
        """Initialize an empty mind map."""
        self.nodes: Dict[str, MindMapNode] = {}
        self.edges: List[MindMapEdge] = []
        self.node_relationships: Dict[str, Dict[str, Set[str]]] = {
            "parents": {},
            "children": {}
        }
        self.session_id: Optional[str] = None
        self.api_url: str = "http://localhost:8000"
        
    def add_node(self, node: Union[MindMapNode, Dict[str, Any]]) -> str:
        """
        Add a node to the mind map.
        
        Args:
            node: A MindMapNode object or dictionary representation
            
        Returns:
            The ID of the added node
        """
        if isinstance(node, dict):
            node = MindMapNode.from_dict(node)
            
        self.nodes[node.id] = node
        
        # Initialize relationship tracking for this node
        if node.id not in self.node_relationships["parents"]:
            self.node_relationships["parents"][node.id] = set()
        if node.id not in self.node_relationships["children"]:
            self.node_relationships["children"][node.id] = set()
            
        return node.id
    
    def add_edge(self, edge: Union[MindMapEdge, Dict[str, Any]]) -> str:
        """
        Add an edge to the mind map.
        
        Args:
            edge: A MindMapEdge object or dictionary representation
            
        Returns:
            The ID of the added edge
        """
        if isinstance(edge, dict):
            edge = MindMapEdge.from_dict(edge)
            
        self.edges.append(edge)
        
        # Update relationship tracking
        if edge.source not in self.node_relationships["children"]:
            self.node_relationships["children"][edge.source] = set()
        if edge.target not in self.node_relationships["parents"]:
            self.node_relationships["parents"][edge.target] = set()
            
        self.node_relationships["children"][edge.source].add(edge.target)
        self.node_relationships["parents"][edge.target].add(edge.source)
        
        return edge.id
    
    def get_node(self, node_id: str) -> Optional[MindMapNode]:
        """Get a node by its ID."""
        return self.nodes.get(node_id)
    
    def get_children(self, node_id: str) -> List[MindMapNode]:
        """Get all children of a node."""
        child_ids = self.node_relationships["children"].get(node_id, set())
        return [self.nodes[child_id] for child_id in child_ids if child_id in self.nodes]
    
    def get_parents(self, node_id: str) -> List[MindMapNode]:
        """Get all parents of a node."""
        parent_ids = self.node_relationships["parents"].get(node_id, set())
        return [self.nodes[parent_id] for parent_id in parent_ids if parent_id in self.nodes]
    
    def are_children_completed(self, node_id: str) -> bool:
        """Check if all children of a node are completed."""
        children = self.get_children(node_id)
        if not children:
            return True  # If there are no children, it's trivially true
            
        return all(child.status == "completed" for child in children)
    
    def can_node_be_unlocked(self, node_id: str) -> Dict[str, Any]:
        """
        Check if a node can be unlocked based on its dependencies.
        
        For the basic implementation, a node can be unlocked if all its 
        children are completed.
        
        Returns:
            A dictionary with "unlockable" boolean and "reason" string
        """
        node = self.get_node(node_id)
        if not node:
            return {"unlockable": False, "reason": "Node not found"}
            
        # If the node is already not locked, it doesn't need unlocking
        if node.status != "locked":
            return {"unlockable": True, "reason": "Node is already unlocked"}
            
        # Check if all children are completed
        children_completed = self.are_children_completed(node_id)
        
        if children_completed:
            return {"unlockable": True, "reason": "All prerequisites are completed"}
        else:
            return {
                "unlockable": False, 
                "reason": "Not all prerequisites are completed",
                "incomplete_prerequisites": [
                    child.id for child in self.get_children(node_id) 
                    if child.status != "completed"
                ]
            }
    
    def update_node_status(self, node_id: str, new_status: str) -> bool:
        """
        Update the status of a node.
        
        Args:
            node_id: ID of the node to update
            new_status: New status for the node
            
        Returns:
            True if the update was successful, False otherwise
        """
        node = self.get_node(node_id)
        if not node:
            return False
            
        # Check if we're trying to set status to completed and verify prerequisites
        if new_status == "completed":
            result = self.can_node_be_unlocked(node_id)
            if not result["unlockable"]:
                return False
                
        node.update_status(new_status)
        return True
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the mind map to a dictionary representation."""
        return {
            "nodes": [node.to_dict() for node in self.nodes.values()],
            "edges": [edge.to_dict() for edge in self.edges]
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MindMap':
        """Create a mind map from a dictionary representation."""
        mind_map = cls()
        
        # Add nodes first
        for node_data in data.get("nodes", []):
            mind_map.add_node(node_data)
            
        # Then add edges (which depend on node IDs)
        for edge_data in data.get("edges", []):
            mind_map.add_edge(edge_data)
            
        return mind_map
    
    def generate_initial_statuses(self) -> None:
        """
        Set initial statuses for nodes:
        - Nodes with no parents are "not_started"
        - All other nodes are "locked"
        """
        for node_id, node in self.nodes.items():
            if not self.get_parents(node_id):
                node.update_status("not_started")
            else:
                node.update_status("locked")
                
    def export_data(self) -> Dict[str, Any]:
        """Export data in a format suitable for the frontend."""
        return {
            "nodes": [node.to_dict() for node in self.nodes.values()],
            "edges": [edge.to_dict() for edge in self.edges]
        }
    
    # Backend API integration methods
    async def initialize_session(self, session_id: Optional[str] = None) -> str:
        """
        Initialize a session with the backend API.
        
        Args:
            session_id: Optional session ID to use (generates one if not provided)
            
        Returns:
            The session ID
        """
        if not session_id:
            session_id = str(uuid.uuid4())
            
        self.session_id = session_id
        
        # Export the data for the API
        data = self.export_data()
        
        # Send to the API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/api/session/init",
                json={
                    "session_id": session_id,
                    "nodes": data["nodes"],
                    "edges": data["edges"]
                }
            )
            response.raise_for_status()
            
        return session_id
    
    async def generate_questions(self, node_id: str) -> List[Question]:
        """
        Generate questions for a node using the backend API.
        
        Args:
            node_id: ID of the node to generate questions for
            
        Returns:
            List of generated questions
        """
        if not self.session_id:
            raise ValueError("Session not initialized. Call initialize_session first.")
            
        node = self.get_node(node_id)
        if not node:
            raise ValueError(f"Node with ID {node_id} not found.")
            
        # Get parent and child nodes for context
        parent_nodes = [{
            "id": parent.id,
            "label": parent.label,
            "content": parent.content
        } for parent in self.get_parents(node_id)]
        
        child_nodes = [{
            "id": child.id,
            "label": child.label,
            "content": child.content
        } for child in self.get_children(node_id)]
        
        # Send to the API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/api/questions/generate",
                json={
                    "session_id": self.session_id,
                    "node_id": node_id,
                    "node_label": node.label,
                    "node_content": node.content,
                    "parent_nodes": parent_nodes,
                    "child_nodes": child_nodes
                }
            )
            response.raise_for_status()
            result = response.json()
            
        # Update node with questions
        questions = [Question.from_dict(q) for q in result["questions"]]
        node.questions = questions
        
        return questions
    
    async def answer_question(self, node_id: str, question_id: str, answer: str) -> Dict[str, Any]:
        """
        Submit an answer to a question using the backend API.
        
        Args:
            node_id: ID of the node containing the question
            question_id: ID of the question to answer
            answer: User's answer to the question
            
        Returns:
            Evaluation result with feedback
        """
        if not self.session_id:
            raise ValueError("Session not initialized. Call initialize_session first.")
            
        # Send to the API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/api/questions/answer",
                json={
                    "session_id": self.session_id,
                    "node_id": node_id,
                    "question_id": question_id,
                    "answer": answer
                }
            )
            response.raise_for_status()
            result = response.json()
            
        # Update node status if it changed
        node = self.get_node(node_id)
        if node and result["node_status"] != node.status:
            node.update_status(result["node_status"])
            
        # Update question status
        for q in node.questions:
            if q.id == question_id:
                q.grade = result["grade"]
                q.feedback = result["feedback"]
                q.status = "passed" if result["passed"] else "failed"
                q.last_answer = answer
                q.attempts += 1
                break
                
        return result
    
    async def check_node_unlockable(self, node_id: str) -> Dict[str, Any]:
        """
        Check if a node is unlockable using the backend API.
        
        Args:
            node_id: ID of the node to check
            
        Returns:
            Result with unlockable status and reason
        """
        if not self.session_id:
            raise ValueError("Session not initialized. Call initialize_session first.")
            
        # Send to the API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/api/nodes/check-unlockable",
                json={
                    "session_id": self.session_id,
                    "node_id": node_id
                }
            )
            response.raise_for_status()
            result = response.json()
            
        return result
    
    async def get_progress(self) -> Dict[str, Any]:
        """
        Get the current learning progress from the backend API.
        
        Returns:
            Progress data for all nodes
        """
        if not self.session_id:
            raise ValueError("Session not initialized. Call initialize_session first.")
            
        # Send to the API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_url}/api/progress?session_id={self.session_id}"
            )
            response.raise_for_status()
            result = response.json()
            
        # Update local node statuses
        for node_id, node_data in result["nodes"].items():
            if node_id in self.nodes:
                self.nodes[node_id].status = node_data["status"]
                
                # Update questions if they exist
                if "questions" in node_data:
                    self.nodes[node_id].questions = [
                        Question.from_dict(q) for q in node_data["questions"]
                    ]
            
        return result
    
    async def get_node_data(self, node_id: str) -> Dict[str, Any]:
        """
        Get detailed data for a specific node from the backend API.
        
        Args:
            node_id: ID of the node to get data for
            
        Returns:
            Detailed node data including progress and related nodes
        """
        if not self.session_id:
            raise ValueError("Session not initialized. Call initialize_session first.")
            
        # Send to the API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_url}/api/node/{node_id}?session_id={self.session_id}"
            )
            response.raise_for_status()
            result = response.json()
            
        return result 