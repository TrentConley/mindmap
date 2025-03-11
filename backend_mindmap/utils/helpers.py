"""Helper utility functions for the mindmap backend."""
import logging
from typing import Dict, List, Set, Any, Optional

# Configure logging
logger = logging.getLogger(__name__)


def build_node_relationships(edges: List[Dict[str, str]]) -> Dict[str, Dict[str, Set[str]]]:
    """
    Build a relationships map from a list of edges.
    
    Args:
        edges: List of edge dictionaries with source and target
        
    Returns:
        Dictionary with parent and child relationships
    """
    relationships = {
        "parents": {},  # target -> set of sources
        "children": {}  # source -> set of targets
    }
    
    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        
        if not source or not target:
            logger.warning(f"Skipping edge with missing source or target: {edge}")
            continue
        
        # Initialize sets if they don't exist
        if target not in relationships["parents"]:
            relationships["parents"][target] = set()
        if source not in relationships["children"]:
            relationships["children"][source] = set()
        
        # Update relationships
        relationships["parents"][target].add(source)
        relationships["children"][source].add(target)
    
    return relationships


def check_children_completed(node_id: str, edges: List[Dict[str, str]], node_statuses: Dict[str, str]) -> Dict[str, Any]:
    """
    Check if all children of a node are completed.
    
    Args:
        node_id: The parent node ID
        edges: List of edge dictionaries with source and target
        node_statuses: Dictionary mapping node IDs to their statuses
        
    Returns:
        Dictionary with completion status and pending children
    """
    children = []
    children_pending = []
    
    # Find all child nodes
    for edge in edges:
        if edge.get("source") == node_id:
            children.append(edge.get("target"))
    
    # Check if any children are not completed
    for child_id in children:
        child_status = node_statuses.get(child_id)
        if child_status != "completed":
            children_pending.append(child_id)
    
    return {
        "all_completed": len(children_pending) == 0,
        "children_pending": children_pending
    }


def check_node_unlockable(node_id: str, edges: List[Dict[str, str]], node_statuses: Dict[str, str]) -> Dict[str, Any]:
    """
    Check if a node is unlockable based on its parent nodes.
    
    Args:
        node_id: The node ID to check
        edges: List of edge dictionaries with source and target
        node_statuses: Dictionary mapping node IDs to their statuses
        
    Returns:
        Dictionary with unlockable status and pending prerequisites
    """
    # Find all parent nodes
    parents = []
    for edge in edges:
        if edge.get("target") == node_id:
            parents.append(edge.get("source"))
    
    # If no parents, node is a root and should be unlockable
    if not parents:
        return {"unlockable": True, "prerequisites_pending": []}
    
    # Check if all parents are completed
    prerequisites_pending = []
    for parent_id in parents:
        parent_status = node_statuses.get(parent_id)
        if parent_status != "completed":
            prerequisites_pending.append(parent_id)
    
    return {
        "unlockable": len(prerequisites_pending) == 0,
        "prerequisites_pending": prerequisites_pending
    } 