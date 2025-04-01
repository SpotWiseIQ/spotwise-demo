# Tampere Explorer Hub

This project consists of a React frontend and a FastAPI backend for a Tampere city explorer application.

## Project Structure

- `frontend/` - Frontend React application
- `backend/` - FastAPI backend providing data for the application

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

## Connecting Frontend to Backend

To use the backend API in the frontend, you would need to modify the frontend code to fetch data from the API instead of using the mock data. This would involve:

1. Create an API service to fetch data from the backend
2. Update the context provider to use this service
3. Handle loading states and errors

Example integration:

```typescript
// frontend/src/lib/api.ts
export const fetchHotspots = async () => {
  const response = await fetch("http://localhost:8000/hotspots");
  if (!response.ok) {
    throw new Error("Failed to fetch hotspots");
  }
  return response.json();
};

export const fetchEvents = async (date?: string) => {
  const url = date
    ? `http://localhost:8000/events?date=${date}`
    : "http://localhost:8000/events";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }
  return response.json();
};

// ... other API methods
```

Then update the TampereContext to use these API methods.
