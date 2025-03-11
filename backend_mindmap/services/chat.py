"""Service for handling chat interactions with nodes."""
import logging
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime

from ..models.schema import ChatMessage, NodeInfo
from .anthropic import AnthropicService

# Configure logging
logger = logging.getLogger(__name__)


class ChatService:
    """Service for handling chat interactions with nodes."""
    
    def __init__(self, anthropic_service: AnthropicService):
        """Initialize with a reference to the Anthropic service."""
        self.anthropic = anthropic_service
    
    async def generate_welcome_message(self, node_info: NodeInfo) -> ChatMessage:
        """
        Generate a welcome message for a node's chat.
        
        Args:
            node_info: Information about the node
            
        Returns:
            ChatMessage with welcome text
        """
        welcome_message = ChatMessage(
            id=str(uuid.uuid4()),
            role="assistant",
            content=f"Hello! I'm your guide for learning about '{node_info.label}'. What would you like to know or discuss about this topic?",
            created_at=datetime.utcnow()
        )
        
        return welcome_message
    
    async def generate_chat_response(
        self,
        node_info: NodeInfo,
        message_history: List[Dict[str, str]],
        parent_nodes: List[Dict[str, str]] = [],
        child_nodes: List[Dict[str, str]] = []
    ) -> str:
        """
        Generate a response in a chat about a node.
        
        Args:
            node_info: Information about the node
            message_history: List of previous chat messages
            parent_nodes: List of parent node data
            child_nodes: List of child node data
            
        Returns:
            Response text
        """
        logger.info(f"Generating chat response for node: {node_info.label}")
        
        # Create system prompt with context about the node
        system_prompt = self._create_chat_system_prompt(
            node_info, 
            parent_nodes, 
            child_nodes
        )
        
        # Use the anthropic service to generate a response
        response = await self.anthropic.chat_completion(
            messages=message_history,
            system=system_prompt
        )
        
        if not response:
            # Fallback response if generation fails
            return "I'm sorry, I encountered an error while processing your message. Please try again."
        
        return response
    
    def _create_chat_system_prompt(
        self,
        node_info: NodeInfo,
        parent_nodes: List[Dict[str, str]],
        child_nodes: List[Dict[str, str]]
    ) -> str:
        """
        Create a system prompt for Claude with context about the node.
        
        Args:
            node_info: Information about the node
            parent_nodes: List of parent node data
            child_nodes: List of child node data
            
        Returns:
            System prompt
        """
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
                system_prompt += f"{i+1}. {parent.get('label', 'Unknown')}: {parent.get('content', 'No content')[:200]}...\n"
        
        if child_nodes:
            system_prompt += "\nThis topic has these subtopics:\n"
            for i, child in enumerate(child_nodes):
                system_prompt += f"{i+1}. {child.get('label', 'Unknown')}: {child.get('content', 'No content')[:200]}...\n"
        
        system_prompt += "\nYour responses should be educational, accurate, and helpful. Encourage the user to ask questions and engage with the material."
        
        return system_prompt 