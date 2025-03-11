"""Standardized service for Anthropic API calls."""
import json
import logging
import anthropic
from anthropic.types import ContentBlockDeltaEvent, MessageDeltaEvent, MessageStartEvent
from typing import Dict, List, Any, Optional, Union

from ..config.settings import ANTHROPIC_API_KEY, CLAUDE_LATEST, CLAUDE_BACKUP

# Configure logging
logger = logging.getLogger(__name__)

class AnthropicService:
    """Service for standardized interactions with Anthropic's Claude API."""
    
    def __init__(self, api_key: str = ANTHROPIC_API_KEY):
        """Initialize the Anthropic client with API key."""
        self.client = anthropic.Anthropic(api_key=api_key)
        self.default_model = CLAUDE_LATEST
        self.backup_model = CLAUDE_BACKUP
    
    async def generate_text(
        self, 
        prompt: str, 
        temperature: float = 0.2, 
        max_tokens: int = 1024,
        model: Optional[str] = None
    ) -> str:
        """Generate text response from Claude without using tools.
        
        Args:
            prompt: The text prompt to send to Claude
            temperature: Controls randomness (0.0 to 1.0)
            max_tokens: Maximum tokens in the response
            model: Claude model to use (defaults to latest)
            
        Returns:
            Text response from Claude
        """
        try:
            logger.info(f"Sending text generation request to Claude")
            
            response = self.client.messages.create(
                model=model or self.default_model,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[{"role": "user", "content": prompt}]
            )
            
            if not response.content or not response.content[0].text:
                logger.warning("Empty response from Claude API")
                return ""
                
            logger.info(f"Successfully received text response from Claude")
            return response.content[0].text
            
        except Exception as e:
            logger.error(f"Error in Claude API call: {str(e)}", exc_info=True)
            
            # Attempt with backup model if primary failed and a different model was not specified
            if model is None or model == self.default_model:
                try:
                    logger.info(f"Retrying with backup model {self.backup_model}")
                    
                    response = self.client.messages.create(
                        model=self.backup_model,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        messages=[{"role": "user", "content": prompt}]
                    )
                    
                    if response.content and response.content[0].text:
                        logger.info(f"Successfully received text from backup model")
                        return response.content[0].text
                        
                except Exception as backup_error:
                    logger.error(f"Backup model also failed: {str(backup_error)}", exc_info=True)
            
            # Return empty string on complete failure
            return ""

    async def use_tool(
        self, 
        prompt: str, 
        tool_schema: Dict[str, Any], 
        system: str = "", 
        temperature: float = 0.2, 
        max_tokens: int = 2000,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """Tool-based generation for structured outputs.
        
        Args:
            prompt: The text prompt to send to Claude
            tool_schema: The JSON schema of the tool
            system: System prompt for Claude
            temperature: Controls randomness (0.0 to 1.0)
            max_tokens: Maximum tokens in the response
            model: Claude model to use (defaults to latest)
            
        Returns:
            Extracted tool output as a dictionary
        """
        try:
            logger.info(f"Sending tool-use request to Claude with tool: {tool_schema['name']}")
            
            message = self.client.messages.create(
                model=model or self.default_model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system or "You are a helpful assistant.",
                messages=[{"role": "user", "content": prompt}],
                tools=[tool_schema]
            )
            
            # Extract tool output
            tool_output = self._extract_tool_output(message)
            
            if tool_output:
                logger.info(f"Successfully extracted tool output from Claude response")
                return tool_output
            else:
                logger.warning(f"No tool output found in Claude response")
                return {}
                
        except Exception as e:
            logger.error(f"Error in Claude API tool call: {str(e)}", exc_info=True)
            
            # Attempt with backup model if primary failed and a different model was not specified
            if model is None or model == self.default_model:
                try:
                    logger.info(f"Retrying tool call with backup model {self.backup_model}")
                    
                    message = self.client.messages.create(
                        model=self.backup_model,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        system=system or "You are a helpful assistant.",
                        messages=[{"role": "user", "content": prompt}],
                        tools=[tool_schema]
                    )
                    
                    tool_output = self._extract_tool_output(message)
                    if tool_output:
                        logger.info(f"Successfully extracted tool output from backup model")
                        return tool_output
                        
                except Exception as backup_error:
                    logger.error(f"Backup model tool call also failed: {str(backup_error)}", exc_info=True)
            
            # Return empty dict on complete failure
            return {}

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        system: str = "",
        temperature: float = 0.3,
        max_tokens: int = 1000,
        model: Optional[str] = None
    ) -> str:
        """Generate a response in a multi-turn conversation.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            system: System prompt for Claude
            temperature: Controls randomness (0.0 to 1.0)
            max_tokens: Maximum tokens in the response
            model: Claude model to use (defaults to latest)
            
        Returns:
            Text response from Claude
        """
        try:
            logger.info(f"Sending chat completion request to Claude with {len(messages)} messages")
            
            response = self.client.messages.create(
                model=model or self.default_model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system,
                messages=messages
            )
            
            if not response.content or not response.content[0].text:
                logger.warning("Empty response from Claude API for chat completion")
                return ""
                
            logger.info(f"Successfully received chat response from Claude")
            return response.content[0].text
            
        except Exception as e:
            logger.error(f"Error in Claude chat completion: {str(e)}", exc_info=True)
            
            # Attempt with backup model if primary failed and a different model was not specified
            if model is None or model == self.default_model:
                try:
                    logger.info(f"Retrying chat completion with backup model {self.backup_model}")
                    
                    response = self.client.messages.create(
                        model=self.backup_model,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        system=system,
                        messages=messages
                    )
                    
                    if response.content and response.content[0].text:
                        logger.info(f"Successfully received chat response from backup model")
                        return response.content[0].text
                        
                except Exception as backup_error:
                    logger.error(f"Backup model chat completion also failed: {str(backup_error)}", exc_info=True)
            
            # Return empty string on complete failure
            return "I apologize, but I encountered an error processing your request. Please try again."

    def _extract_tool_output(self, message: Any) -> Dict[str, Any]:
        """Extract tool output from Claude's response.
        
        Args:
            message: The Claude API response message
            
        Returns:
            Extracted tool output as a dictionary
        """
        try:
            tool_outputs = []
            
            # Process message content
            for content in message.content:
                # Determine content type
                if hasattr(content, 'type'):
                    content_type = content.type
                elif isinstance(content, dict) and 'type' in content:
                    content_type = content['type']
                else:
                    content_type = str(type(content))
                    
                logger.debug(f"Processing content block of type: {content_type}")
                
                # Extract tool_use content
                if isinstance(content, dict) and content.get("type") == "tool_use":
                    tool_outputs.append(content)
                elif hasattr(content, 'type') and content.type == "tool_use":
                    # Convert to dict if it's an object
                    tool_outputs.append(vars(content) if hasattr(content, '__dict__') else content)
            
            if not tool_outputs:
                logger.warning("No tool outputs found in Claude response")
                return {}
            
            # Process the first tool output
            tool_output = tool_outputs[0]
            input_data = tool_output.get("input", "{}")
            
            # Parse the input data
            if isinstance(input_data, dict):
                return input_data
            else:
                return json.loads(input_data)
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse tool output as JSON: {str(e)}")
            return {}
        except Exception as e:
            logger.error(f"Error extracting tool output: {str(e)}", exc_info=True)
            return {} 