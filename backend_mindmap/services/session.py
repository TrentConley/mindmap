"""Service for managing session data and operations."""
import logging
from typing import Dict, List, Optional, Any, Set
from datetime import datetime

from ..models.schema import NodeStatus, NodeInfo, EdgeInfo, SessionData
from ..storage.base import BaseStorage
from ..utils.helpers import build_node_relationships, check_node_unlockable, check_children_completed

# Configure logging
logger = logging.getLogger(__name__)


class SessionService:
    """Service for managing session data and operations."""
    
    def __init__(self, storage: BaseStorage):
        """Initialize with a reference to the storage service."""
        self.storage = storage
    
    async def get_session_data(self, session_id: str) -> SessionData:
        """
        Get session data for a session ID.
        
        Args:
            session_id: The session identifier
            
        Returns:
            SessionData object
        """
        return await self.storage.get_session_data(session_id)
    
    async def initialize_session(self, session_id: str, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> bool:
        """
        Initialize or update a session with graph data.
        
        Args:
            session_id: The session identifier
            nodes: List of node data dictionaries
            edges: List of edge data dictionaries
            
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"Initializing session: {session_id} with {len(nodes)} nodes and {len(edges)} edges")
            
            # Get session data
            session = await self.storage.get_session_data(session_id)
            
            # Store the graph nodes
            for node in nodes:
                node_id = node["id"]
                
                # Create NodeInfo object
                node_info = NodeInfo(
                    id=node_id,
                    label=node.get("data", {}).get("label", ""),
                    content=node.get("data", {}).get("content", ""),
                    position=node.get("position", {}),
                    type="mindmap"
                )
                session.graph_nodes[node_id] = node_info
                
                # Initialize node status if it doesn't exist
                if node_id not in session.nodes:
                    node_status = NodeStatus(
                        node_id=node_id,
                        status=node.get("data", {}).get("status", "locked"),
                        questions=[],
                        unlockable=False
                    )
                    session.nodes[node_id] = node_status
            
            # Store edges as EdgeInfo objects
            session.graph_edges = []
            for edge in edges:
                edge_info = EdgeInfo(
                    id=edge["id"],
                    source=edge["source"],
                    target=edge["target"],
                    type="mindmap"
                )
                session.graph_edges.append(edge_info)
            
            # Build relationships map for efficient access
            edge_dicts = [{"source": edge["source"], "target": edge["target"]} for edge in edges]
            session.relationships = build_node_relationships(edge_dicts)
            
            # Save the session data
            success = await self.storage.save_session_data(session_id, session)
            
            if success:
                logger.info(f"Session {session_id} initialized successfully")
            else:
                logger.error(f"Failed to save session data for {session_id}")
                
            return success
            
        except Exception as e:
            logger.error(f"Error initializing session: {str(e)}", exc_info=True)
            return False
    
    async def check_node_unlockability(self, session_id: str, node_id: str) -> Dict[str, Any]:
        """
        Check if a node is unlockable based on its parent nodes' completion status.
        
        Args:
            session_id: The session identifier
            node_id: The node identifier to check
            
        Returns:
            Dictionary with unlockable status and incomplete prerequisites
        """
        try:
            # Get session data
            session = await self.storage.get_session_data(session_id)
            
            # Extract edge data
            edges = [{"source": e.source, "target": e.target} for e in session.graph_edges]
            
            # Create a map of node IDs to their statuses
            node_statuses = {
                node_id: node_data.status
                for node_id, node_data in session.nodes.items()
            }
            
            # Check if the node is unlockable
            result = check_node_unlockable(node_id, edges, node_statuses)
            
            # Update the node's unlockable status in the session
            if node_id in session.nodes:
                session.nodes[node_id].unlockable = result["unlockable"]
                await self.storage.update_node_status(session_id, node_id, session.nodes[node_id])
            
            return {
                "unlockable": result["unlockable"],
                "reason": "Node is unlockable" if result["unlockable"] else "Prerequisites not completed",
                "incomplete_prerequisites": result.get("prerequisites_pending", [])
            }
            
        except Exception as e:
            logger.error(f"Error checking node unlockability: {str(e)}", exc_info=True)
            return {
                "unlockable": False,
                "reason": f"Error: {str(e)}",
                "incomplete_prerequisites": []
            }
    
    async def update_node_status(self, session_id: str, node_id: str, status: str) -> bool:
        """
        Update the status of a node.
        
        Args:
            session_id: The session identifier
            node_id: The node identifier
            status: New status ('not_started', 'in_progress', 'completed', 'locked')
            
        Returns:
            True if successful, False otherwise
        """
        try:
            valid_statuses = ['not_started', 'in_progress', 'completed', 'locked']
            if status not in valid_statuses:
                logger.error(f"Invalid status: {status}")
                return False
            
            # Get session data
            session = await self.storage.get_session_data(session_id)
            
            # Update the node status
            if node_id in session.nodes:
                node_status = session.nodes[node_id]
                
                # Update the status
                node_status.status = status
                current_time = datetime.utcnow()
                
                # Add timestamp for status changes
                if status == "completed" and not node_status.completed_at:
                    node_status.completed_at = current_time
                elif status == "in_progress" and not node_status.started_at:
                    node_status.started_at = current_time
                
                # Save the updated status
                success = await self.storage.update_node_status(session_id, node_id, node_status)
                
                if success:
                    logger.info(f"Node status updated: {session_id}/{node_id} -> {status}")
                else:
                    logger.error(f"Failed to update node status for {session_id}/{node_id}")
                
                return success
            else:
                logger.error(f"Node {node_id} not found in session {session_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating node status: {str(e)}", exc_info=True)
            return False
    
    async def get_node_data(self, session_id: str, node_id: str) -> Dict[str, Any]:
        """
        Get data for a specific node, including related nodes.
        
        Args:
            session_id: The session identifier
            node_id: The node identifier
            
        Returns:
            Dictionary with node data, progress data, and related nodes
        """
        try:
            # Get session data
            session = await self.storage.get_session_data(session_id)
            
            # Check if the node exists
            if node_id not in session.graph_nodes:
                logger.error(f"Node {node_id} not found in session {session_id}")
                return {"error": "Node not found"}
                
            # Get node data
            node_data = session.graph_nodes[node_id]
            
            # Get progress data if it exists
            progress_data = session.nodes.get(node_id, None)
            
            # Get related nodes
            children = list(session.relationships.children.get(node_id, set()))
            parents = list(session.relationships.parents.get(node_id, set()))
            
            # Get child and parent node data
            child_nodes = [session.graph_nodes.get(child_id, {"id": child_id}) for child_id in children]
            parent_nodes = [session.graph_nodes.get(parent_id, {"id": parent_id}) for parent_id in parents]
            
            # Combine all data
            result = {
                "node": node_data,
                "progress": progress_data,
                "children": child_nodes,
                "parents": parent_nodes
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting node data: {str(e)}", exc_info=True)
            return {"error": str(e)} 