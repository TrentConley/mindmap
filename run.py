"""Run script for the Mind Map Learning API."""
import logging
import importlib
import os
import sys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Run the Mind Map Learning API."""
    try:
        # Add the current directory to the sys.path
        sys.path.insert(0, os.path.abspath("."))
        
        # Import and run the FastAPI application
        from backend_mindmap.main import main as run_app
        importlib.reload(sys.modules.get('backend_mindmap.main'))
        
        logger.info("Starting Mind Map Learning API")
        run_app()
    except Exception as e:
        logger.error(f"Error starting Mind Map Learning API: {str(e)}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main() 