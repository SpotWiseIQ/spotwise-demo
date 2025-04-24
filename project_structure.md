## Project Overview

Tampere Explorer Hub is a modern web application for exploring and visualizing Tampere's transportation infrastructure data. The project follows a client-server architecture:

- **Frontend**: React/TypeScript application built with Vite and styled with Tailwind CSS. The main components are in the frontend/src/components directory.
- **Backend**: Python 3.12 FastAPI application serving road and transportation data. The main entry point is backend/app/main.py.

The application provides an interactive map interface with a collapsible sidebar for exploring road data, hotspots, events, and transportation features.

## Frontend Structure and Components

The frontend is a React/TypeScript application built with Vite and Tailwind CSS.

### Key Directories

- **frontend/src/components**: Reusable UI components
  - **frontend/src/components/ui**: Base UI components
  - **frontend/src/components/LeftSidebar**: Main sidebar component
  - **frontend/src/components/TampereMap**: Map visualization component
- **frontend/src/pages**: Page components
- **frontend/src/lib**: Utility functions and context providers
- **frontend/src/hooks**: Custom React hooks

### Main Files

- **frontend/src/App.tsx**: Main application component
- **frontend/src/main.tsx**: Application entry point
- **frontend/tailwind.config.ts**: Tailwind CSS configuration
- **frontend/vite.config.ts**: Vite configuration

## Backend Structure and Components

The backend is a Python 3.12 application using FastAPI to serve transportation data.

### Key Files

- **backend/app/main.py**: FastAPI application entry point and API endpoints
- **backend/app/models.py**: Pydantic data models for API requests/responses
- **backend/app/database.py**: Database operations and data access
- **backend/app/fetch_tampere_roads.py**: Script for fetching road data
- **backend/app/tampere_roads.json**: Cached road data

### Python Environment

The backend uses Python 3.12 with the uv package manager as specified in the .python-version file. Dependencies are listed in backend/requirements.txt.

## Data Flow

This section explains how data flows between the frontend and backend components.

### Backend to Frontend Data Flow

1. The backend serves data via REST API endpoints defined in backend/app/main.py
2. Road data is sourced from backend/app/tampere_roads.json which is fetched/updated using backend/app/fetch_tampere_roads.py
3. Data models are defined in backend/app/models.py/

### Frontend Data Fetching

1. The frontend uses React Query for data fetching and state management
2. API calls are made from relevant components or custom hooks
3. The TampereMap component visualizes the geographic data

### Key API Endpoints

- `/api/map-items`: Location-based point of interest search
- `/api/hotspots`: Hotspot management and discovery
- `/api/events`: Event browsing and filtering
- `/api/traffic`: Real-time traffic data

## Map Integration

This project uses MapLibre GL JS for interactive map visualization.

### Map Components

- **frontend/src/components/TampereMap**: Main map component directory
  - This component uses MapLibre GL JS to render the interactive map
  - The map displays road networks and points of interest in Tampere

### Data Visualization

- GeoJSON data from the backend is visualized on the map
- Road networks are displayed with appropriate styling
- Points of interest, hotspots, and events are shown as markers

### Map Interactions

- Pan and zoom functionality
- Click events for selecting map features
- Radius-based search for nearby locations
- Layer toggling for different data types
