# MindMap Project Guidelines

## Backend Commands
- **Setup**: `cd backend_mindmap && python3.12 -m venv venv && pip install -r requirements.txt`
- **Run Server**: `cd backend_mindmap && source venv/bin/activate && python main.py`

## Code Style Guidelines
- **Imports**: Group by standard lib, third-party, local imports; use alphabetical order within groups
- **Typing**: Use type hints for all function parameters and return values; use Optional for nullable types
- **Logging**: Use the logging module with appropriate levels (info, warning, error)
- **Error Handling**: Use try/except blocks with specific exceptions; log errors with context
- **Documentation**: Use docstrings for classes and functions; follow Google docstring format
- **Naming**: snake_case for variables/functions, PascalCase for classes, UPPER_CASE for constants
- **API Routes**: Use descriptive endpoint names; group by resource type; include error responses
- **Models**: Use Pydantic for data validation; define clear schemas with appropriate types
- **Line Length**: Keep lines under 120 characters
- **Async**: Use async/await for I/O-bound operations with FastAPI
- **Concise and simple**: Keep code concise and simple. Do not make crazy changes, just make solid incremental changes that make sense.