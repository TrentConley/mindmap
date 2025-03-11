"""Mindmap-related API routes."""
import logging
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List

from ..models.schema import (
    CreateMindMapRequest, GenerateChildNodesRequest, 
    UpdateNodeStatusRequest, MindMapNode, NodeInfo, EdgeInfo
)
from ..services.mindmap import MindMapService
from ..services.session import SessionService

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/mindmap",
    tags=["mindmap"],
)


def get_mindmap_service():
    """Dependency to get the mindmap service."""
    from ..app import get_services
    services = get_services()
    return services["mindmap"]


def get_session_service():
    """Dependency to get the session service."""
    from ..app import get_services
    services = get_services()
    return services["session"]


@router.post("/create")
async def create_mindmap(
    request: CreateMindMapRequest,
    mindmap_service: MindMapService = Depends(get_mindmap_service),
    session_service: SessionService = Depends(get_session_service)
) -> Dict[str, Any]:
    """Create a new mindmap using Anthropic's Claude."""
    try:
        logger.info(f"Creating mindmap for topic: '{request.topic}' with max_depth={request.max_depth}")
        
        # Generate the mindmap nodes
        mindmap_nodes = await mindmap_service.generate_mindmap_recursively(
            request.topic, 
            request.max_depth
        )
        
        # Convert to React Flow format
        react_flow_data = mindmap_service.convert_to_react_flow_format(mindmap_nodes)
        
        # Initialize the session with the new mindmap
        await session_service.initialize_session(
            request.session_id,
            react_flow_data["nodes"],
            react_flow_data["edges"]
        )
        
        return react_flow_data
        
    except Exception as e:
        logger.error(f"Error creating mindmap: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create mindmap: {str(e)}")


@router.post("/generate-child-nodes")
async def generate_child_nodes(
    request: GenerateChildNodesRequest,
    mindmap_service: MindMapService = Depends(get_mindmap_service),
    session_service: SessionService = Depends(get_session_service)
) -> Dict[str, Any]:
    """Generate child nodes for a specific node in the mindmap."""
    try:
        # Get session data
        session_data = await session_service.get_session_data(request.session_id)
        
        # Check if the node exists
        if request.node_id not in session_data.graph_nodes:
            logger.error(f"Node {request.node_id} not found in session {request.session_id}")
            raise HTTPException(status_code=404, detail=f"Node {request.node_id} not found in session")
        
        # Get the parent node data
        parent_node = session_data.graph_nodes[request.node_id]
        
        # Generate child nodes
        child_nodes = await mindmap_service.generate_child_nodes(
            request.node_id, 
            parent_node.content, 
            parent_node.label, 
            request.max_children
        )
        
        # Calculate positions for the child nodes
        positions = mindmap_service.calculate_child_positions(
            parent_node.position or {"x": 0, "y": 0}, 
            len(child_nodes)
        )
        
        # Create React Flow nodes and edges
        new_nodes = []
        new_edges = []
        
        for i, node in enumerate(child_nodes):
            # Create React Flow node
            rf_node = {
                "id": node.id,
                "type": "mindmap",
                "position": positions[i],
                "data": {
                    "label": node.label,
                    "content": node.content,
                    "status": "locked"  # Start as locked, parent must be completed to unlock
                }
            }
            new_nodes.append(rf_node)
            
            # Create edge from parent to this node
            edge_id = f"e-{request.node_id}-{node.id}"
            edge = {
                "id": edge_id,
                "source": request.node_id,
                "target": node.id,
                "type": "mindmap"
            }
            new_edges.append(edge)
            
            # Add to session data
            node_info = NodeInfo(
                id=node.id,
                label=node.label,
                content=node.content,
                position=positions[i],
                type="mindmap"
            )
            
            session_data.graph_nodes[node.id] = node_info
            
            # Add edge to session data
            edge_info = EdgeInfo(
                id=edge_id,
                source=request.node_id,
                target=node.id,
                type="mindmap"
            )
            session_data.graph_edges.append(edge_info)
        
        # Update the session data
        await session_service.initialize_session(
            request.session_id,
            new_nodes + [{"id": n, "data": {}, "position": {}} for n in session_data.graph_nodes.keys()],
            new_edges + [{"id": e.id, "source": e.source, "target": e.target, "type": e.type} for e in session_data.graph_edges]
        )
        
        # Return the new nodes and edges
        return {
            "nodes": new_nodes,
            "edges": new_edges
        }
        
    except Exception as e:
        logger.error(f"Error generating child nodes: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate child nodes: {str(e)}")


@router.post("/nodes/update-status")
async def update_node_status(
    request: UpdateNodeStatusRequest,
    session_service: SessionService = Depends(get_session_service)
) -> Dict[str, Any]:
    """Update the status of a node."""
    try:
        success = await session_service.update_node_status(
            request.session_id,
            request.node_id,
            request.status
        )
        
        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to update node status")
        
        return {"success": True, "status": request.status}
        
    except Exception as e:
        logger.error(f"Error updating node status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update node status: {str(e)}")


@router.get("/nodes/{node_id}")
async def get_node_data(
    node_id: str,
    session_id: str,
    session_service: SessionService = Depends(get_session_service)
) -> Dict[str, Any]:
    """Get data for a specific node."""
    try:
        node_data = await session_service.get_node_data(session_id, node_id)
        
        if "error" in node_data:
            raise HTTPException(status_code=404, detail=node_data["error"])
            
        return node_data
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error getting node data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get node data: {str(e)}") 