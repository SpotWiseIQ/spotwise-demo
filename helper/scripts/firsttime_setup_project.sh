#!/bin/bash
set -e

echo "=== [1/5] Checking prerequisites ==="
if ! command -v python3 &> /dev/null; then
    echo "Python 3.12+ is required. Please install it."
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo "Node.js and npm are required. Please install them."
    exit 1
fi

# Check Node.js version (require >=18)
REQUIRED_NODE_MAJOR=18
NODE_VERSION=$(node --version 2>/dev/null | sed 's/v\([0-9]*\).*/\1/')
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt "$REQUIRED_NODE_MAJOR" ]; then
    echo "Error: Node.js version 18 or higher is required. Please upgrade Node.js and run this script again"
    exit 1
fi

echo "=== [2/5] Installing frontend dependencies ==="
cd frontend
npm install
cd ..

echo "=== [3/5] Setting up backend Python environment ==="
cd backend

# Install uv if missing
if ! command -v uv &> /dev/null; then
    pip install uv
fi

# Remove old venv if it exists
if [ -d ".venv" ]; then
    rm -rf .venv
fi

# Create venv and sync dependencies using uv
uv venv

cd ..

echo "=== [4/5] Building backend ==="
npm run backend:build

echo "=== [5/5] Setup complete! ==="
echo ""
echo "You can now run the following in separate terminals:"
echo "  npm run backend:dev or npm run backend:dev2  # Start backend (http://localhost:8000)"
echo "  npm run frontend:dev    # Start frontend (http://localhost:8080)"
echo ""