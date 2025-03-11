"""Base storage interface for session data."""
from abc import ABC, abstractmethod
from typing import Dict, Optional, Any, List

from ..models.schema import (
    NodeStatus, NodeInfo, EdgeInfo, NodeRelationships, SessionData
)


class BaseStorage(ABC):
    """Abstract base class for storage implementations."""
    
    @abstractmethod
    async def get_session_data(self, session_id: str) -> SessionData:
        """
        Get session data for a given session ID.
        
        Args:
            session_id: The unique session identifier
            
        Returns:
            SessionData object containing all session data
        """
        pass
    
    @abstractmethod
    async def save_session_data(self, session_id: str, data: SessionData) -> bool:
        """
        Save session data for a given session ID.
        
        Args:
            session_id: The unique session identifier
            data: SessionData object to save
            
        Returns:
            True if successful, False otherwise
        """
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
    async def add_edge(self, session_id: str, edge: EdgeInfo) -> bool:
        """
        Add an edge to a session.
        
        Args:
            session_id: The unique session identifier
            edge: EdgeInfo object to add
            
        Returns:
            True if successful, False otherwise
        """
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
    async def get_chat_history(self, session_id: str, node_id: str) -> Dict[str, Any]:
        """
        Get chat history for a node in a session.
        
        Args:
            session_id: The unique session identifier
            node_id: The node identifier
            
        Returns:
            Chat history data
        """
        pass 