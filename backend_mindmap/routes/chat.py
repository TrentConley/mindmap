"""Chat-related API routes."""
import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from datetime import datetime

from ..models.schema import ChatMessageRequest, ChatResponse, ChatMessage
from ..services.chat import ChatService
from ..services.session import SessionService

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/chat",
    tags=["chat"],
)


def get_chat_service():
    """Dependency to get the chat service."""
    from ..app import get_services
    services = get_services()
    return services["chat"]


def get_session_service():
    """Dependency to get the session service."""
    from ..app import get_services
    services = get_services()
    return services["session"]


@router.get("/{node_id}")
async def get_node_chat(
    node_id: str,
    session_id: str,
    chat_service: ChatService = Depends(get_chat_service),
    session_service: SessionService = Depends(get_session_service)
) -> ChatResponse:
    """Get the chat history for a specific node."""
    try:
        logger.info(f"Getting chat history for node: {node_id} in session: {session_id}")
        
        # Get session data
        session_data = await session_service.get_session_data(session_id)
        
        # Check if node exists
        if node_id not in session_data.graph_nodes:
            raise HTTPException(status_code=404, detail=f"Node {node_id} not found")
        
        # Get or create chat history for this node
        chat_history = await session_service.storage.get_chat_history(session_id, node_id)
        
        # If chat history is empty, add a welcome message
        if not chat_history.get("messages", []):
            node_info = session_data.graph_nodes[node_id]
            welcome_message = await chat_service.generate_welcome_message(node_info)
            
            # Add welcome message to chat history
            messages = [welcome_message]
            chat_history["messages"] = [welcome_message.dict()]
            
            # Save the chat history
            await session_service.storage.update_chat_history(session_id, node_id, chat_history)
        else:
            # Convert the messages to ChatMessage objects
            messages = [
                ChatMessage(
                    id=msg.get("id", str(uuid.uuid4())),
                    role=msg["role"],
                    content=msg["content"],
                    created_at=msg.get("created_at", datetime.utcnow())
                ) for msg in chat_history.get("messages", [])
            ]
        
        return ChatResponse(
            node_id=node_id,
            messages=messages
        )
        
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get chat history: {str(e)}")


@router.post("/{node_id}")
async def send_chat_message(
    node_id: str,
    request: ChatMessageRequest,
    chat_service: ChatService = Depends(get_chat_service),
    session_service: SessionService = Depends(get_session_service)
) -> ChatResponse:
    """Send a message in the chat for a specific node and get a response."""
    try:
        logger.info(f"Sending chat message for node: {node_id}")
        
        # Get session data
        session_id = request.session_id
        session_data = await session_service.get_session_data(session_id)
        
        # Check if node exists
        if node_id not in session_data.graph_nodes:
            raise HTTPException(status_code=404, detail=f"Node {node_id} not found")
        
        # Get node information
        node_info = session_data.graph_nodes[node_id]
        
        # Get existing chat history
        chat_history = await session_service.storage.get_chat_history(session_id, node_id)
        
        # Add user message to chat history
        user_message = ChatMessage(
            id=str(uuid.uuid4()),
            role="user",
            content=request.message,
            created_at=datetime.utcnow()
        )
        
        if "messages" not in chat_history:
            chat_history["messages"] = []
            
        chat_history["messages"].append(user_message.dict())
        
        # Get related nodes for context
        parent_nodes = []
        child_nodes = []
        
        try:
            # Get parent nodes
            if hasattr(session_data, 'relationships'):
                if hasattr(session_data.relationships, 'parents') and node_id in session_data.relationships.parents:
                    parent_ids = session_data.relationships.parents[node_id]
                    for parent_id in parent_ids:
                        if parent_id in session_data.graph_nodes:
                            parent = session_data.graph_nodes[parent_id]
                            parent_nodes.append({
                                "label": parent.label,
                                "content": parent.content
                            })
            
                # Get child nodes
                if hasattr(session_data.relationships, 'children') and node_id in session_data.relationships.children:
                    child_ids = session_data.relationships.children[node_id]
                    for child_id in child_ids:
                        if child_id in session_data.graph_nodes:
                            child = session_data.graph_nodes[child_id]
                            child_nodes.append({
                                "label": child.label,
                                "content": child.content
                            })
        except Exception as rel_error:
            logger.warning(f"Error accessing relationships for node {node_id}: {str(rel_error)}")
            # Continue without relationship data
        
        # Format message history for Claude
        message_history = []
        for msg in chat_history["messages"]:
            message_history.append({"role": msg["role"], "content": msg["content"]})
        
        # Generate AI response
        try:
            response_text = await chat_service.generate_chat_response(
                node_info,
                message_history,
                parent_nodes,
                child_nodes
            )
            
            # Add assistant response to chat history
            assistant_message = ChatMessage(
                id=str(uuid.uuid4()),
                role="assistant",
                content=response_text,
                created_at=datetime.utcnow()
            )
            
            chat_history["messages"].append(assistant_message.dict())
            
        except Exception as chat_error:
            logger.error(f"Error generating chat response: {str(chat_error)}", exc_info=True)
            # Add a fallback message
            assistant_message = ChatMessage(
                id=str(uuid.uuid4()),
                role="assistant",
                content="I'm sorry, I encountered an error while processing your message. Please try again.",
                created_at=datetime.utcnow()
            )
            chat_history["messages"].append(assistant_message.dict())
        
        # Update the chat history's updated_at timestamp
        chat_history["updated_at"] = datetime.utcnow().isoformat()
        
        # Save the updated chat history
        await session_service.storage.update_chat_history(session_id, node_id, chat_history)
        
        # Convert messages for response
        messages = [
            ChatMessage(
                id=msg.get("id", str(uuid.uuid4())),
                role=msg["role"],
                content=msg["content"],
                created_at=msg.get("created_at", datetime.utcnow()) if isinstance(msg.get("created_at"), datetime) else datetime.fromisoformat(msg.get("created_at")) if isinstance(msg.get("created_at"), str) else datetime.utcnow()
            ) for msg in chat_history["messages"]
        ]
        
        return ChatResponse(
            node_id=node_id,
            messages=messages
        )
        
    except Exception as e:
        logger.error(f"Error sending chat message: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to send chat message: {str(e)}") 