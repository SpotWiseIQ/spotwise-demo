# Tampere Explorer Hub

This project consists of a React frontend and a FastAPI backend for a Tampere city explorer application.

## Project Structure

- `frontend/` - Frontend React application
- `backend/` - FastAPI backend providing data for the application

For detailed documentation about the project structure, features, workflows, and API endpoints, please refer to [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).

## Tech Stack

### Frontend

- React with TypeScript
- Vite as build tool
- Tailwind CSS for styling
- React Query for state management
- React Router for routing
- Custom components built with Radix UI primitives

### Backend

- Python 3.12
- FastAPI framework
- uv for Python package management
- Custom database implementation

## Frontend

The frontend is a React application that displays the Tampere Explorer Hub interface.

## Backend

The backend is a FastAPI application providing all the data for the frontend:

- Hotspots
- Events
- Map items
- Traffic data

## Setup and Running

### Prerequisites

- Node.js and npm for the frontend
- Python 3.12 (specified in `.python-version`)
- `uv` for Python package management

### Quick Start

You can use the following npm scripts to manage the project:

```bash
# Install all dependencies
npm run install:all

# Build the backend (using uv)
npm run backend:build

# Start the backend development server
npm run backend:dev

# Start the frontend development server
npm run frontend:dev

# Build the frontend for production
npm run frontend:build
```

### Manual Setup

#### Backend

1. Navigate to the backend directory:

```bash
cd backend
```

2. Build the backend using uv:

```bash
uv sync
```

3. Activate the virtual environment:

```bash
source ./.venv/bin/activate
```

4. Run the backend:

```bash
python main.py
```

The backend will be running at http://localhost:8000. API documentation is available at http://localhost:8000/docs.

#### Frontend

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies (if not already installed):

```bash
npm install
```

3. Run the frontend development server:

```bash
npm run dev
```

The frontend will be running at http://localhost:8080.
