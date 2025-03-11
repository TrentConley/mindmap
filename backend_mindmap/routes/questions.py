"""Question-related API routes."""
import logging
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from datetime import datetime

from ..models.schema import (
    GenerateQuestionsRequest, AnswerRequest, UnlockCheckRequest,
    QuestionResponse, AnswerResponse, UnlockCheckResponse, NodeStatus, Question
)
from ..services.question import QuestionService
from ..services.session import SessionService

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/questions",
    tags=["questions"],
)


def get_question_service():
    """Dependency to get the question service."""
    from ..app import get_services
    services = get_services()
    return services["question"]


def get_session_service():
    """Dependency to get the session service."""
    from ..app import get_services
    services = get_services()
    return services["session"]


@router.post("/generate")
async def generate_questions(
    request: GenerateQuestionsRequest,
    question_service: QuestionService = Depends(get_question_service),
    session_service: SessionService = Depends(get_session_service)
) -> QuestionResponse:
    """Generate questions for a specific node."""
    try:
        # Get session data
        session_data = await session_service.get_session_data(request.session_id)
        
        # Store node content in the session for future use if it doesn't exist
        if request.node_id not in session_data.graph_nodes:
            session_data.graph_nodes[request.node_id] = {
                "id": request.node_id,
                "label": request.node_label,
                "content": request.node_content
            }
        
        # Check if we already have questions for this node
        if request.node_id in session_data.nodes:
            node_data = session_data.nodes[request.node_id]
            # Only return existing questions if there are any
            if node_data.questions:
                return QuestionResponse(
                    node_id=request.node_id,
                    questions=node_data.questions,
                    status=node_data.status
                )
        
        # Generate questions using the question service
        questions = await question_service.generate_questions(
            request.node_content,
            request.node_label,
            request.parent_nodes,
            request.child_nodes
        )
        
        # Create a node status object
        node_status = NodeStatus(
            node_id=request.node_id,
            status="not_started",
            questions=questions,
            started_at=datetime.utcnow()
        )
        
        # Store in session
        session_data.nodes[request.node_id] = node_status
        
        # Save the session data
        await session_service.storage.update_node_status(
            request.session_id, 
            request.node_id, 
            node_status
        )
        
        return QuestionResponse(
            node_id=request.node_id,
            questions=questions,
            status="not_started"
        )
        
    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")


@router.post("/answer")
async def answer_question(
    request: AnswerRequest,
    question_service: QuestionService = Depends(get_question_service),
    session_service: SessionService = Depends(get_session_service)
) -> AnswerResponse:
    """Submit and evaluate an answer to a question."""
    try:
        # Get session data
        session_data = await session_service.get_session_data(request.session_id)
        
        # Check if the node exists in the session
        if request.node_id not in session_data.nodes:
            raise HTTPException(status_code=404, detail="Node not found")
        
        node_data = session_data.nodes[request.node_id]
        
        # Find the question
        question_found = False
        for i, q in enumerate(node_data.questions):
            if q.id == request.question_id:
                question = q
                question_index = i
                question_found = True
                break
                
        if not question_found:
            raise HTTPException(status_code=404, detail="Question not found")
        
        # Mark the node as in progress if it's not already completed
        if node_data.status != "completed":
            node_data.status = "in_progress"
            if not node_data.started_at:
                node_data.started_at = datetime.utcnow()
        
        # Get node content from session
        node_content = session_data.graph_nodes.get(request.node_id, {}).content
        
        # Evaluate the answer using the question service
        evaluation = await question_service.evaluate_answer(
            question.text,
            request.answer,
            node_content
        )
        
        # Update the question with evaluation results
        question.attempts += 1
        question.last_answer = request.answer
        question.feedback = evaluation.get("feedback", "No feedback provided")
        question.grade = evaluation.get("grade", 0)
        question.status = "passed" if evaluation.get("passed", False) else "failed"
        question.updated_at = datetime.utcnow()
        
        # Update the question in the node data
        node_data.questions[question_index] = question
        
        # Check if all questions for this node are passed
        all_passed = all(q.status == "passed" for q in node_data.questions)
        if all_passed:
            node_data.status = "completed"
            node_data.completed_at = datetime.utcnow()
        
        # Save the updated node data
        await session_service.storage.update_node_status(
            request.session_id, 
            request.node_id, 
            node_data
        )
        
        return AnswerResponse(
            question_id=request.question_id,
            feedback=question.feedback,
            grade=question.grade,
            passed=question.status == "passed",
            node_status=node_data.status,
            all_passed=all_passed
        )
        
    except Exception as e:
        logger.error(f"Error evaluating answer: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to evaluate answer: {str(e)}")


@router.post("/regenerate")
async def regenerate_questions(
    request: UnlockCheckRequest,
    session_service: SessionService = Depends(get_session_service)
) -> Dict[str, str]:
    """Regenerate questions for a node."""
    try:
        # Get session data
        session_data = await session_service.get_session_data(request.session_id)
        
        # Check if the node exists in the session
        if request.node_id not in session_data.nodes:
            raise HTTPException(status_code=404, detail="Node not found")
        
        # Reset the node data but keep track of previous attempts
        previous_questions = session_data.nodes[request.node_id].questions
        previous_status = session_data.nodes[request.node_id].status
        
        # Create a new node status but archive the old data
        node_status = NodeStatus(
            node_id=request.node_id,
            status="not_started",
            questions=[],
            previous_questions=previous_questions,
            previous_status=previous_status,
            updated_at=datetime.utcnow()
        )
        
        # Save the updated node data
        session_data.nodes[request.node_id] = node_status
        await session_service.storage.update_node_status(
            request.session_id, 
            request.node_id, 
            node_status
        )
        
        return {"message": "Questions reset successfully. Generate new questions with the generate endpoint."}
        
    except Exception as e:
        logger.error(f"Error regenerating questions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to regenerate questions: {str(e)}")


@router.post("/check-unlockable")
async def check_node_unlockability(
    request: UnlockCheckRequest,
    session_service: SessionService = Depends(get_session_service)
) -> UnlockCheckResponse:
    """Check if a node is unlockable based on its parent nodes' completion status."""
    try:
        # Get unlockability status from session service
        result = await session_service.check_node_unlockability(
            request.session_id,
            request.node_id
        )
        
        return UnlockCheckResponse(
            unlockable=result["unlockable"],
            reason=result["reason"],
            incomplete_prerequisites=result["incomplete_prerequisites"]
        )
        
    except Exception as e:
        logger.error(f"Error checking node unlockability: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to check node unlockability: {str(e)}") 