"""FastAPI app initialization and routing."""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config.settings import ALL_ALLOWED_ORIGINS, ANTHROPIC_API_KEY
from .services.anthropic import AnthropicService
from .services.mindmap import MindMapService
from .services.question import QuestionService
from .services.session import SessionService
from .services.chat import ChatService
from .storage.memory import MemoryStorage
from .routes import mindmap, questions, session, chat

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global services
_services = None


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(title="Mind Map Learning API")
    
    # Configure CORS for frontend communication
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALL_ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(session.router)
    app.include_router(mindmap.router)
    app.include_router(questions.router)
    app.include_router(chat.router)
    
    # Root endpoints
    @app.get("/")
    async def root():
        return {"message": "Mind Map Learning API is running"}

    @app.get("/api")
    async def api_root():
        return {"message": "Mind Map Learning API is running"}
    
    return app


def initialize_services():
    """Initialize services for dependency injection."""
    global _services
    
    if _services is not None:
        return _services
    
    # Create services
    storage = MemoryStorage()
    anthropic_service = AnthropicService(ANTHROPIC_API_KEY)
    
    # Create dependent services
    mindmap_service = MindMapService(anthropic_service)
    question_service = QuestionService(anthropic_service)
    session_service = SessionService(storage)
    chat_service = ChatService(anthropic_service)
    
    # Store services for dependency injection
    _services = {
        "storage": storage,
        "anthropic": anthropic_service,
        "mindmap": mindmap_service,
        "question": question_service,
        "session": session_service,
        "chat": chat_service
    }
    
    return _services


def get_services():
    """Get or initialize services for dependency injection."""
    global _services
    if _services is None:
        _services = initialize_services()
    return _services


# Initialize app and services
app = create_app()
initialize_services() 