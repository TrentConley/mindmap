"""Session-related API routes."""
import logging
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any

from ..models.schema import GraphDataRequest, ProgressResponse
from ..services.session import SessionService

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/session",
    tags=["session"],
)


def get_session_service():
    """Dependency to get the session service."""
    from ..app import get_services
    services = get_services()
    return services["session"]


@router.post("/init")
async def initialize_session(
    graph_data: GraphDataRequest,
    session_service: SessionService = Depends(get_session_service)
) -> Dict[str, Any]:
    """Initialize or update a session with graph data."""
    try:
        success = await session_service.initialize_session(
            graph_data.session_id,
            graph_data.nodes,
            graph_data.edges
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to initialize session")
        
        return {"message": "Session initialized successfully", "session_id": graph_data.session_id}
        
    except Exception as e:
        logger.error(f"Error initializing session: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to initialize session: {str(e)}")


@router.get("/data")
async def get_session_graph_data(
    session_id: str,
    session_service: SessionService = Depends(get_session_service)
) -> Dict[str, Any]:
    """Get the full graph data for a session."""
    try:
        session_data = await session_service.get_session_data(session_id)
        
        # Return the graph nodes and edges along with progress data
        return {
            "nodes": session_data.graph_nodes,
            "edges": session_data.graph_edges,
            "progress": session_data.nodes
        }
        
    except Exception as e:
        logger.error(f"Error getting session graph data: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get session graph data: {str(e)}")


@router.get("/progress")
async def get_progress(
    session_id: str,
    session_service: SessionService = Depends(get_session_service)
) -> ProgressResponse:
    """Get the current progress for a session."""
    try:
        session_data = await session_service.get_session_data(session_id)
        return ProgressResponse(nodes=session_data.nodes)
        
    except Exception as e:
        logger.error(f"Error getting progress: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get progress: {str(e)}") 