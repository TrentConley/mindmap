"""In-memory storage implementation."""
import logging
from typing import Dict, Optional, Any, List, Set
from datetime import datetime

from .base import BaseStorage
from ..models.schema import (
    NodeStatus, NodeInfo, EdgeInfo, NodeRelationships, SessionData
)

# Configure logging
logger = logging.getLogger(__name__)

class MemoryStorage(BaseStorage):
    """In-memory storage for session data using dictionaries."""
    
    def __init__(self):
        """Initialize the in-memory storage."""
        self.sessions: Dict[str, SessionData] = {}
    
    async def get_session_data(self, session_id: str) -> SessionData:
        """
        Get session data for a given session ID.
        
        Args:
            session_id: The unique session identifier
            
        Returns:
            SessionData object containing all session data
        """
        # If session doesn't exist, create a new one
        if session_id not in self.sessions:
            logger.info(f"Creating new session: {session_id}")
            self.sessions[session_id] = SessionData()
        
        return self.sessions[session_id]
    
    async def save_session_data(self, session_id: str, data: SessionData) -> bool:
        """
        Save session data for a given session ID.
        
        Args:
            session_id: The unique session identifier
            data: SessionData object to save
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.sessions[session_id] = data
            logger.info(f"Session data saved: {session_id}")
            return True
        except Exception as e:
            logger.error(f"Error saving session data: {str(e)}")
            return False
    
    async def update_node_status(self, session_id: str, node_id: str, status: NodeStatus) -> bool:
        """
        Update a node's status in a session.
        
        Args:
            session_id: The unique session identifier
            node_id: The node identifier
            status: New NodeStatus object
            
        Returns:
            True if successful, False otherwise
        """
        try:
            session = await self.get_session_data(session_id)
            session.nodes[node_id] = status
            logger.info(f"Node status updated: {session_id}/{node_id} -> {status.status}")
            return True
        except Exception as e:
            logger.error(f"Error updating node status: {str(e)}")
            return False
    
    async def update_node_info(self, session_id: str, node_id: str, info: NodeInfo) -> bool:
        """
        Update a node's information in a session.
        
        Args:
            session_id: The unique session identifier
            node_id: The node identifier
            info: New NodeInfo object
            
        Returns:
            True if successful, False otherwise
        """
        try:
            session = await self.get_session_data(session_id)
            session.graph_nodes[node_id] = info
            logger.info(f"Node info updated: {session_id}/{node_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating node info: {str(e)}")
            return False
    
    async def add_edge(self, session_id: str, edge: EdgeInfo) -> bool:
        """
        Add an edge to a session.
        
        Args:
            session_id: The unique session identifier
            edge: EdgeInfo object to add
            
        Returns:
            True if successful, False otherwise
        """
        try:
            session = await self.get_session_data(session_id)
            
            # Check if edge already exists
            edge_exists = any(e.id == edge.id for e in session.graph_edges)
            if not edge_exists:
                session.graph_edges.append(edge)
                
                # Update relationships
                if edge.source not in session.relationships.parents:
                    session.relationships.parents[edge.source] = set()
                if edge.target not in session.relationships.children:
                    session.relationships.children[edge.target] = set()
                if edge.target not in session.relationships.parents:
                    session.relationships.parents[edge.target] = set()
                if edge.source not in session.relationships.children:
                    session.relationships.children[edge.source] = set()
                
                session.relationships.parents[edge.target].add(edge.source)
                session.relationships.children[edge.source].add(edge.target)
                
                logger.info(f"Edge added: {session_id}/{edge.id}")
            else:
                logger.warning(f"Edge already exists: {session_id}/{edge.id}")
                
            return True
        except Exception as e:
            logger.error(f"Error adding edge: {str(e)}")
            return False
    
    async def update_chat_history(self, session_id: str, node_id: str, chat_data: Dict[str, Any]) -> bool:
        """
        Update chat history for a node in a session.
        
        Args:
            session_id: The unique session identifier
            node_id: The node identifier
            chat_data: Chat history data
            
        Returns:
            True if successful, False otherwise
        """
        try:
            session = await self.get_session_data(session_id)
            
            # Initialize chat_history if it doesn't exist
            if not session.chat_history:
                session.chat_history = {}
            
            session.chat_history[node_id] = chat_data
            logger.info(f"Chat history updated: {session_id}/{node_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating chat history: {str(e)}")
            return False
    
    async def get_chat_history(self, session_id: str, node_id: str) -> Dict[str, Any]:
        """
        Get chat history for a node in a session.
        
        Args:
            session_id: The unique session identifier
            node_id: The node identifier
            
        Returns:
            Chat history data
        """
        try:
            session = await self.get_session_data(session_id)
            
            # Initialize chat_history if it doesn't exist
            if not session.chat_history:
                session.chat_history = {}
            
            # Initialize node chat history if it doesn't exist
            if node_id not in session.chat_history:
                session.chat_history[node_id] = {
                    "node_id": node_id,
                    "messages": [],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            
            return session.chat_history[node_id]
        except Exception as e:
            logger.error(f"Error getting chat history: {str(e)}")
            return {
                "node_id": node_id,
                "messages": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            } 