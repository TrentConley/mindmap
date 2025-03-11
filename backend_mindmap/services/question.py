"""Service for generating and evaluating questions."""
import logging
import json
from typing import Dict, List, Any, Optional
from datetime import datetime

from ..models.schema import Question, NodeStatus
from .anthropic import AnthropicService

# Configure logging
logger = logging.getLogger(__name__)


class QuestionService:
    """Service for generating and evaluating questions about nodes."""
    
    def __init__(self, anthropic_service: AnthropicService):
        """Initialize with a reference to the Anthropic service."""
        self.anthropic = anthropic_service
    
    async def generate_questions(
        self,
        node_content: str,
        node_label: str,
        parent_nodes: List[Dict[str, str]] = [],
        child_nodes: List[Dict[str, str]] = []
    ) -> List[Question]:
        """
        Generate questions for a specific node.
        
        Args:
            node_content: The content of the node
            node_label: The label of the node
            parent_nodes: List of parent node data
            child_nodes: List of child node data
            
        Returns:
            List of Question objects
        """
        logger.info(f"Generating questions for node: {node_label}")
        
        prompt = self._generate_questions_prompt(
            node_content,
            node_label,
            parent_nodes,
            child_nodes
        )
        
        # Use the anthropic service to generate questions
        response_text = await self.anthropic.generate_text(prompt)
        
        try:
            # Parse the JSON response
            questions_data = json.loads(response_text)
            
            # Create Question objects
            questions = []
            for q_data in questions_data:
                question = Question(
                    text=q_data.get("text", "No question text provided"),
                )
                questions.append(question)
            
            logger.info(f"Generated {len(questions)} questions for node: {node_label}")
            return questions
            
        except json.JSONDecodeError:
            logger.error(f"Failed to parse questions JSON: {response_text}")
            # Fallback to a default question
            default_question = Question(
                text=f"Explain the key concepts of {node_label} in your own words."
            )
            return [default_question]
        except Exception as e:
            logger.error(f"Error generating questions: {str(e)}")
            default_question = Question(
                text=f"Explain the key concepts of {node_label} in your own words."
            )
            return [default_question]
    
    async def evaluate_answer(
        self,
        question: str,
        answer: str,
        node_content: str
    ) -> Dict[str, Any]:
        """
        Evaluate a user's answer to a question.
        
        Args:
            question: The question text
            answer: The user's answer
            node_content: The content of the node for context
            
        Returns:
            Dictionary with evaluation results
        """
        logger.info(f"Evaluating answer to question: {question[:50]}...")
        
        prompt = self._evaluate_answer_prompt(
            question,
            answer,
            node_content
        )
        
        # Use the anthropic service to evaluate the answer
        response_text = await self.anthropic.generate_text(prompt)
        
        try:
            # Parse the JSON response
            evaluation = json.loads(response_text)
            
            logger.info(f"Answer evaluated. Grade: {evaluation.get('grade')}, Passed: {evaluation.get('passed')}")
            return evaluation
            
        except json.JSONDecodeError:
            logger.error(f"Failed to parse evaluation JSON: {response_text}")
            # Return a default evaluation
            return {
                "feedback": "We encountered an error evaluating your answer. Please try again.",
                "grade": 0,
                "passed": False
            }
        except Exception as e:
            logger.error(f"Error evaluating answer: {str(e)}")
            return {
                "feedback": "We encountered an error evaluating your answer. Please try again.",
                "grade": 0,
                "passed": False
            }
    
    def _generate_questions_prompt(
        self,
        node_content: str,
        node_label: str,
        parent_nodes: List[Dict[str, str]],
        child_nodes: List[Dict[str, str]]
    ) -> str:
        """
        Generate a prompt for Claude to create questions about a node.
        
        Args:
            node_content: The content of the node
            node_label: The label of the node
            parent_nodes: List of parent node data
            child_nodes: List of child node data
            
        Returns:
            Prompt string for Claude
        """
        context = f"""
        You are an educational assessment expert creating questions to test knowledge about: "{node_label}".
        
        Here is the content about this topic:
        "{node_content}"
        
        """
        
        if parent_nodes:
            context += "This topic is related to the following parent topics:\n"
            for node in parent_nodes:
                context += f"- {node.get('label', 'Unknown')}: {node.get('content', 'No content')}\n"
        
        if child_nodes:
            context += "This topic has the following subtopics:\n"
            for node in child_nodes:
                context += f"- {node.get('label', 'Unknown')}: {node.get('content', 'No content')}\n"
        
        prompt = f"""{context}

        Based on this content, create 1-3 open-ended questions that test understanding of "{node_label}".
        
        Guidelines:
        - Questions should test deep understanding, not just recall
        - Questions should be answerable from the provided content
        - Questions should encourage critical thinking
        - Include a variety of difficulty levels
        
        Format your response as a JSON array of questions with this structure:
        [
          {{
            "text": "Your first question here?"
          }},
          {{
            "text": "Your second question here?"
          }}
        ]
        
        Only return the valid JSON array, nothing else.
        """
        
        return prompt
    
    def _evaluate_answer_prompt(
        self,
        question: str,
        answer: str,
        node_content: str
    ) -> str:
        """
        Generate a prompt for Claude to evaluate a user's answer.
        
        Args:
            question: The question text
            answer: The user's answer
            node_content: The content of the node for context
            
        Returns:
            Prompt string for Claude
        """
        prompt = f"""
        You are an expert educational evaluator. Your task is to evaluate a student's answer to a question about a specific topic.
        
        Topic content: "{node_content}"
        
        Question: "{question}"
        
        Student's answer: "{answer}"
        
        First, evaluate the student's answer. Consider:
        - Is the answer factually correct?
        - Does it demonstrate understanding of the topic?
        - Is it complete?
        - Does it show critical thinking?
        
        Then, assign a grade from 0 to 100 where:
        - 0-60: Poor understanding
        - 61-79: Partial understanding
        - 80-89: Good understanding
        - 90-100: Excellent understanding
        
        Provide your feedback as a JSON object with this structure:
        {{
          "feedback": "Your detailed feedback here, explaining strengths and weaknesses of the answer, and how it could be improved.",
          "grade": 85,
          "passed": true
        }}
        
        The "passed" field should be true if the grade is 80 or above, false otherwise.
        Only return the valid JSON object, nothing else.
        """
        
        return prompt 