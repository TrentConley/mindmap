"""Configuration settings for the application."""
import os
from pathlib import Path
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# API settings
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    logger.warning("ANTHROPIC_API_KEY not found in environment variables")

# Claude Models
CLAUDE_LATEST = "claude-3-7-sonnet-20250219"
CLAUDE_BACKUP = "claude-3-sonnet-20240229"

# API and CORS settings
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
DEFAULT_ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:8000", "http://localhost:5173"]

# Add all allowed origins
ALL_ALLOWED_ORIGINS = DEFAULT_ALLOWED_ORIGINS.copy()
ALL_ALLOWED_ORIGINS.extend(ALLOWED_ORIGINS)

# Add wildcard origin if specified
if "*" in ALLOWED_ORIGINS:
    ALL_ALLOWED_ORIGINS.append("*")

# Default settings for mindmap generation
DEFAULT_MAX_DEPTH = 3
DEFAULT_MAX_CHILDREN = 4 