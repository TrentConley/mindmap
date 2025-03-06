#!/bin/bash

# Activate virtual environment if it exists, create it if it doesn't
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate the virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install requirements
echo "Installing dependencies..."
pip install -r requirements.txt

echo "Setup complete! Virtual environment is activated and dependencies are installed."
echo "You can now run the backend with 'python main.py'" 