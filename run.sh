#!/bin/bash

# HALE Oracle Run Script
# Activates virtual environment and runs Python scripts

set -e

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "📥 Installing dependencies..."
    source venv/bin/activate
    pip install -r requirements.txt
    echo "✅ Virtual environment ready!"
    echo ""
fi

# Activate virtual environment
source venv/bin/activate

# Run the script passed as argument
if [ $# -eq 0 ]; then
    echo "Usage: ./run.sh <script.py> [args...]"
    echo ""
    echo "Examples:"
    echo "  ./run.sh hale_oracle_backend.py"
    echo "  ./run.sh hale_oracle_backend_circle.py"
    echo "  ./run.sh example_usage.py"
    exit 1
fi

# Execute the script with all arguments
exec python3 "$@"
