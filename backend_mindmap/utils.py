from typing import Dict, List, Set, Any

def get_child_nodes(node_id: str, edges: List[Dict[str, Any]]) -> Set[str]:
    """Get all immediate child nodes of a given node."""
    return {edge["target"] for edge in edges if edge["source"] == node_id}

def get_parent_nodes(node_id: str, edges: List[Dict[str, Any]]) -> Set[str]:
    """Get all immediate parent nodes of a given node."""
    return {edge["source"] for edge in edges if edge["target"] == node_id}

def check_children_completed(node_id: str, edges: List[Dict[str, Any]], node_statuses: Dict[str, str]) -> bool:
    """
    Check if all children of a node have been completed.
    
    Args:
        node_id: The ID of the node to check
        edges: List of edge objects with source and target fields
        node_statuses: Dictionary mapping node IDs to their status
        
    Returns:
        bool: True if all child nodes are completed, False otherwise
    """
    child_nodes = get_child_nodes(node_id, edges)
    
    # If there are no child nodes, return True (nothing to complete)
    if not child_nodes:
        return True
    
    # Check if all child nodes have a "completed" status
    for child_id in child_nodes:
        status = node_statuses.get(child_id, "not_started")
        if status != "completed":
            return False
    
    return True

def check_node_unlockable(node_id: str, edges: List[Dict[str, Any]], node_statuses: Dict[str, str]) -> Dict[str, Any]:
    """
    Check if a node is unlockable based on its children's completion status.
    
    Args:
        node_id: The ID of the node to check
        edges: List of edge objects with source and target fields
        node_statuses: Dictionary mapping node IDs to their status
        
    Returns:
        Dict with keys:
        - unlockable: bool - True if the node is unlockable
        - children_completed: List[str] - IDs of completed child nodes
        - children_pending: List[str] - IDs of child nodes not yet completed
    """
    child_nodes = get_child_nodes(node_id, edges)
    
    children_completed = []
    children_pending = []
    
    for child_id in child_nodes:
        status = node_statuses.get(child_id, "not_started")
        if status == "completed":
            children_completed.append(child_id)
        else:
            children_pending.append(child_id)
    
    unlockable = len(children_pending) == 0 or node_id in node_statuses
    
    return {
        "unlockable": unlockable,
        "children_completed": children_completed,
        "children_pending": children_pending
    }

def build_node_relationships(edges: List[Dict[str, Any]]) -> Dict[str, Dict[str, Set[str]]]:
    """
    Build a dictionary of node relationships from edges.
    
    Args:
        edges: List of edge objects with source and target fields
        
    Returns:
        Dict with node IDs as keys, and values being dicts with 'parents' and 'children' keys
    """
    relationships = {}
    
    for edge in edges:
        source = edge["source"]
        target = edge["target"]
        
        # Initialize source node if not already present
        if source not in relationships:
            relationships[source] = {"parents": set(), "children": set()}
        
        # Initialize target node if not already present
        if target not in relationships:
            relationships[target] = {"parents": set(), "children": set()}
        
        # Add the relationship
        relationships[source]["children"].add(target)
        relationships[target]["parents"].add(source)
    
    return relationships 