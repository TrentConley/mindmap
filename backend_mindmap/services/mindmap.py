"""Service for generating and managing mindmaps."""
import logging
import json
import math
from typing import Dict, List, Optional, Any
import uuid

from ..models.schema import MindMapNode, NodeInfo, EdgeInfo, NodeStatus
from ..config.settings import DEFAULT_MAX_DEPTH, DEFAULT_MAX_CHILDREN
from .anthropic import AnthropicService

# Configure logging
logger = logging.getLogger(__name__)


# Define the tool schema for Anthropic to use for creating mindmaps
CREATE_MINDMAP_TOOL = {
    "name": "create_mindmap",
    "description": "Create a hierarchical mindmap structure about a topic",
    "input_schema": {
        "type": "object",
        "properties": {
            "nodes": {
                "type": "array",
                "description": "List of nodes in the mindmap hierarchy",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string", "description": "Unique identifier for the node"},
                        "label": {"type": "string", "description": "Short title for the node (max 50 chars)"},
                        "content": {"type": "string", "description": "Detailed explanation of the concept (100-300 chars)"},
                        "parent_id": {"type": "string", "description": "ID of the parent node, null for root node"}
                    },
                    "required": ["id", "label", "content"]
                }
            }
        },
        "required": ["nodes"]
    }
}

# Define the tool schema for Anthropic to use for creating child nodes
CREATE_CHILD_NODES_TOOL = {
    "name": "create_child_nodes",
    "description": "Create child nodes for a specified parent node in a mindmap",
    "input_schema": {
        "type": "object",
        "properties": {
            "nodes": {
                "type": "array",
                "description": "List of child nodes to add to the parent",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string", "description": "Unique identifier for the node"},
                        "label": {"type": "string", "description": "Short title for the node (max 50 chars)"},
                        "content": {"type": "string", "description": "Detailed explanation of the concept (100-300 chars)"},
                        "parent_id": {"type": "string", "description": "ID of the parent node"}
                    },
                    "required": ["id", "label", "content", "parent_id"]
                }
            }
        },
        "required": ["nodes"]
    }
}


class MindMapService:
    """Service for generating and managing mindmaps."""
    
    def __init__(self, anthropic_service: AnthropicService):
        """Initialize with a reference to the Anthropic service."""
        self.anthropic = anthropic_service
    
    async def generate_root_node(self, topic: str) -> MindMapNode:
        """
        Generate just the root node for a mindmap topic.
        
        Args:
            topic: The main topic for the mindmap
            
        Returns:
            Root MindMapNode
        """
        logger.info(f"Generating root node for topic: '{topic}'")
        
        # Create the prompt for Claude
        prompt = f"""
        Create a root node for an educational mindmap about "{topic}".
        
        The root node should:
        - Have a clear, concise label (title) representing the main topic
        - Include a comprehensive but concise content description (100-300 characters)
        - Use the ID "1" for the root node
        - Have no parent_id (it's the root)
        
        Use the create_mindmap tool to return just this single root node.
        """
        
        system_prompt = "You are an expert at organizing knowledge into structured, hierarchical mindmaps."
        
        try:
            # Use the anthropic service to generate the root node
            tool_output = await self.anthropic.use_tool(
                prompt=prompt,
                tool_schema=CREATE_MINDMAP_TOOL,
                system=system_prompt
            )
            
            if not tool_output or "nodes" not in tool_output or not tool_output["nodes"]:
                logger.warning("No nodes returned from Claude. Creating default root node.")
                return MindMapNode(
                    id="1",
                    label=topic,
                    content=f"Overview of {topic}: A comprehensive exploration of this subject and its key aspects.",
                    parent_id=None
                )
            
            # Take the first node as the root node
            root_node_data = tool_output["nodes"][0]
            root_node = MindMapNode(
                id=root_node_data.get("id", "1"),
                label=root_node_data.get("label", topic),
                content=root_node_data.get("content", f"Overview of {topic}"),
                parent_id=None
            )
            
            logger.info(f"Successfully generated root node: '{root_node.label}'")
            
            return root_node
        
        except Exception as e:
            logger.error(f"Error generating root node with Claude: {str(e)}", exc_info=True)
            # Return a default root node on error
            return MindMapNode(
                id="1",
                label=topic,
                content=f"Overview of {topic}: A comprehensive exploration of this subject and its key aspects.",
                parent_id=None
            )
    
    async def generate_child_nodes(
        self,
        parent_id: str,
        parent_content: str,
        parent_label: str,
        max_children: int = DEFAULT_MAX_CHILDREN
    ) -> List[MindMapNode]:
        """
        Generate child nodes for a specific parent node.
        
        Args:
            parent_id: ID of the parent node
            parent_content: Content of the parent node
            parent_label: Label of the parent node
            max_children: Maximum number of children to generate
            
        Returns:
            List of child MindMapNode objects
        """
        logger.info(f"Starting child nodes generation for parent: '{parent_label}' (ID: {parent_id}) with max_children={max_children}")
        
        # Create the prompt for Claude
        prompt = f"""
        I have a concept or topic in a mindmap that needs to be expanded with child nodes. 
        The parent node details are:
        
        ID: {parent_id}
        Label: "{parent_label}"
        Content: "{parent_content}"
        
        Please create {max_children} child nodes that expand on this topic in a logical and educational way.
        Each child node should explore a specific aspect, component, or sub-topic of the parent concept.
        
        Use the create_child_nodes tool to structure this information.
        Each child node needs:
        1. A unique id (use the parent id as a prefix, e.g. if parent is "1.2", use "1.2.1", "1.2.2", etc.)
        2. A short label/title that's clear and descriptive (max 50 characters)
        3. Content that explains the concept in more detail (100-300 characters)
        4. The parent_id reference which should be: "{parent_id}"
        
        Make sure the child nodes:
        - Are distinct from each other (cover different aspects)
        - Are directly related to the parent topic
        - Together provide comprehensive coverage of the parent topic
        - Have educational value and accurate content
        - Have an appropriate level of detail (not too broad, not too specific)
        """
        
        system_prompt = "You are an expert at expanding educational topics into well-structured, comprehensive subtopics."
        
        try:
            # Use the anthropic service to generate child nodes
            tool_output = await self.anthropic.use_tool(
                prompt=prompt,
                tool_schema=CREATE_CHILD_NODES_TOOL,
                system=system_prompt
            )
            
            if not tool_output or "nodes" not in tool_output or not tool_output["nodes"]:
                logger.warning(f"No nodes returned from Claude for parent: {parent_id}. Creating default child nodes.")
                # Create default child nodes
                default_nodes = []
                for i in range(1, max_children + 1):
                    child_id = f"{parent_id}.{i}"
                    default_nodes.append(MindMapNode(
                        id=child_id,
                        label=f"Aspect {i} of {parent_label}",
                        content=f"This is a key component of {parent_label} that explores important concepts related to this subject.",
                        parent_id=parent_id
                    ))
                logger.info(f"Created {len(default_nodes)} default child nodes for parent: {parent_id}")
                return default_nodes
            
            # Convert to MindMapNode objects
            child_nodes = []
            for node_data in tool_output["nodes"]:
                child_node = MindMapNode(
                    id=node_data.get("id", f"{parent_id}.{len(child_nodes)+1}"),
                    label=node_data.get("label", f"Aspect of {parent_label}"),
                    content=node_data.get("content", f"A key component of {parent_label}"),
                    parent_id=parent_id
                )
                child_nodes.append(child_node)
            
            logger.info(f"Successfully generated {len(child_nodes)} child nodes for parent: '{parent_label}' (ID: {parent_id})")
            
            return child_nodes
        
        except Exception as e:
            logger.error(f"Error generating child nodes with Claude: {str(e)}", exc_info=True)
            # On error, return some default child nodes instead of failing
            default_nodes = []
            for i in range(1, max_children + 1):
                child_id = f"{parent_id}.{i}"
                default_nodes.append(MindMapNode(
                    id=child_id,
                    label=f"Aspect {i} of {parent_label}",
                    content=f"This is a key component of {parent_label} that explores important concepts related to this subject.",
                    parent_id=parent_id
                ))
            logger.info(f"Created {len(default_nodes)} default child nodes after error for parent: {parent_id}")
            return default_nodes
    
    async def generate_mindmap_recursively(
        self,
        topic: str,
        max_depth: int = DEFAULT_MAX_DEPTH,
        max_children_per_node: int = DEFAULT_MAX_CHILDREN
    ) -> List[MindMapNode]:
        """
        Generate a mindmap recursively, level by level.
        
        Args:
            topic: The main topic for the mindmap
            max_depth: Maximum depth of the mindmap
            max_children_per_node: Maximum children per node
            
        Returns:
            List of all MindMapNode objects in the mindmap
        """
        logger.info(f"Starting recursive mindmap generation for topic: '{topic}' with max_depth={max_depth}")
        
        # All nodes in the mindmap
        all_nodes = []
        
        try:
            # Generate the root node
            root_node = await self.generate_root_node(topic)
            all_nodes.append(root_node)
            logger.info(f"Added root node '{root_node.label}' (ID: {root_node.id}) to mindmap")
            
            # Queue of nodes to process, with their level
            nodes_to_process = [(root_node, 1)]  # Start with the root node at level 1
            
            # Process nodes level by level using BFS
            while nodes_to_process:
                current_node, current_level = nodes_to_process.pop(0)
                logger.info(f"Processing node: '{current_node.label}' (ID: {current_node.id}) at level {current_level}")
                
                # Skip generating children if we've reached max depth
                if current_level >= max_depth:
                    logger.info(f"Reached max depth {max_depth} for node {current_node.id}. Skipping child generation.")
                    continue
                
                logger.info(f"Generating children for node: '{current_node.label}' (ID: {current_node.id}) at level {current_level}")
                
                try:
                    # Generate child nodes with retry mechanism
                    retry_count = 0
                    max_retries = 2
                    child_nodes = []
                    
                    while retry_count <= max_retries and not child_nodes:
                        try:
                            # Generate child nodes
                            child_nodes = await self.generate_child_nodes(
                                current_node.id,
                                current_node.content,
                                current_node.label,
                                max_children_per_node
                            )
                            
                            if not child_nodes and retry_count < max_retries:
                                logger.warning(f"No child nodes generated for {current_node.id} on attempt {retry_count+1}. Retrying...")
                                retry_count += 1
                            elif not child_nodes:
                                logger.warning(f"Failed to generate child nodes for {current_node.id} after {max_retries+1} attempts")
                                break
                            
                        except Exception as retry_error:
                            logger.error(f"Error on attempt {retry_count+1} generating children for node {current_node.id}: {str(retry_error)}")
                            if retry_count < max_retries:
                                retry_count += 1
                                logger.info(f"Retrying child generation for node {current_node.id} (Attempt {retry_count+1}/{max_retries+1})")
                            else:
                                logger.error(f"Exhausted retries for node {current_node.id}")
                                break
                    
                    # Add child nodes to the full list and queue
                    for child_node in child_nodes:
                        all_nodes.append(child_node)
                        # Add to processing queue for next level
                        nodes_to_process.append((child_node, current_level + 1))
                        
                    logger.info(f"Added {len(child_nodes)} children to node {current_node.id}")
                    
                except Exception as e:
                    logger.error(f"Unhandled error generating children for node {current_node.id}: {str(e)}", exc_info=True)
                    # Continue with other nodes even if one fails
                    continue
            
            logger.info(f"Completed recursive mindmap generation with {len(all_nodes)} total nodes")
            
            # Add level information for better logging
            for node in all_nodes:
                level = 0
                parent_id = node.parent_id
                
                # Determine level by walking up the tree
                while parent_id:
                    level += 1
                    parent_node = next((n for n in all_nodes if n.id == parent_id), None)
                    parent_id = parent_node.parent_id if parent_node else None
                
                logger.debug(f"Node '{node.label}' (ID: {node.id}) is at level {level}")
            
            return all_nodes
            
        except Exception as e:
            logger.error(f"Error in recursive mindmap generation: {str(e)}", exc_info=True)
            
            # If we have at least a root node, return what we have
            if all_nodes:
                logger.warning(f"Returning partial mindmap with {len(all_nodes)} nodes due to error")
                return all_nodes
                
            # Otherwise create and return just a root node
            logger.warning("Creating default root node due to error")
            return [MindMapNode(
                id="1",
                label=topic,
                content=f"Overview of {topic}: A comprehensive exploration of this subject and its key aspects.",
                parent_id=None
            )]
    
    def convert_to_react_flow_format(self, mindmap_nodes: List[MindMapNode]) -> Dict[str, Any]:
        """
        Convert mindmap nodes to React Flow format for frontend rendering.
        
        Args:
            mindmap_nodes: List of MindMapNode objects
            
        Returns:
            Dictionary with nodes and edges in React Flow format
        """
        logger.info(f"Converting {len(mindmap_nodes)} mindmap nodes to React Flow format")
        
        nodes = []
        edges = []
        
        # Position calculation variables
        levels = {}  # Keep track of nodes at each level
        level_counts = {}  # Count nodes at each level
        
        # First pass: group nodes by level
        logger.info("Organizing nodes by level")
        for node in mindmap_nodes:
            level = 0
            parent_id = node.parent_id
            
            # Determine level by walking up the tree
            while parent_id:
                level += 1
                parent_node = next((n for n in mindmap_nodes if n.id == parent_id), None)
                parent_id = parent_node.parent_id if parent_node else None
            
            # Initialize level lists if needed
            if level not in levels:
                levels[level] = []
                level_counts[level] = 0
            
            # Add node to appropriate level
            levels[level].append(node)
            level_counts[level] += 1
        
        logger.info(f"Nodes organized into {len(levels)} levels")
        
        # Second pass: assign positions and create React Flow nodes
        logger.info("Assigning positions and creating React Flow nodes")
        for level, nodes_at_level in levels.items():
            level_width = len(nodes_at_level)
            logger.debug(f"Processing level {level} with {level_width} nodes")
            
            for i, node in enumerate(nodes_at_level):
                # Calculate position
                x_pos = (i - level_width / 2) * 250  # Horizontal spacing
                y_pos = level * 200  # Vertical spacing
                
                # Create React Flow node
                rf_node = {
                    "id": node.id,
                    "type": "mindmap",
                    "position": {"x": x_pos, "y": y_pos},
                    "data": {
                        "label": node.label,
                        "content": node.content,
                        "status": "not_started" if level == 0 else "locked"  # Only root is not_started
                    }
                }
                nodes.append(rf_node)
                
                # Create edge if node has a parent
                if node.parent_id:
                    edge_id = f"e-{node.parent_id}-{node.id}"
                    edge = {
                        "id": edge_id,
                        "source": node.parent_id,
                        "target": node.id,
                        "type": "mindmap"
                    }
                    edges.append(edge)
        
        logger.info(f"Successfully created React Flow format with {len(nodes)} nodes and {len(edges)} edges")
        
        return {
            "nodes": nodes,
            "edges": edges
        }
    
    def calculate_child_positions(
        self, 
        parent_position: Dict[str, float], 
        child_count: int
    ) -> List[Dict[str, float]]:
        """
        Calculate positions for child nodes in a semi-circle below the parent.
        
        Args:
            parent_position: Parent node position with x and y coordinates
            child_count: Number of children to position
            
        Returns:
            List of position dictionaries with x and y coordinates
        """
        positions = []
        
        # Position the children below the parent in a semi-circle
        for i in range(child_count):
            # Calculate position - spread evenly in a semi-circle below parent
            angle = math.pi * (i / (child_count - 1) if child_count > 1 else 0.5)
            radius = 250  # Distance from parent
            
            x_pos = parent_position["x"] + radius * math.cos(angle)
            y_pos = parent_position["y"] + 200 + (radius * math.sin(angle) * 0.5)
            
            positions.append({"x": x_pos, "y": y_pos})
        
        return positions 