"""Main entry point for the application."""
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Run the FastAPI application using uvicorn."""
    logger.info("Starting Mind Map Learning API")
    uvicorn.run("backend_mindmap.app:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    main() 