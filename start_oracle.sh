#!/bin/bash

# HALE Oracle System Startup Script

echo "🚀 Starting HALE Oracle System..."
echo "=================================="

# Activate virtual environment
source ./venv/bin/activate

# Check if .env exists
if [ ! -f .env ] && [ ! -f .env.local ]; then
    echo "❌ Error: No .env or .env.local file found"
    echo "Please create one with your configuration"
    exit 1
fi

# Start API server in background
echo "📡 Starting API Server..."
python api_server.py &
API_PID=$!

echo "✅ API Server started (PID: $API_PID)"
echo ""
echo "🌐 API Server: http://localhost:5001"
echo "📊 Health Check: http://localhost:5001/api/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo ''; echo '🛑 Stopping services...'; kill $API_PID 2>/dev/null; exit 0" INT

# Keep script running
wait $API_PID
