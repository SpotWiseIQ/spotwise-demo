# Tampere Explorer Hub - Project Documentation

## Project Overview

The Tampere Explorer Hub is a modern web application designed to explore and visualize data related to Tampere, with a specific focus on road and transportation infrastructure. The project uses a modern tech stack with a React/TypeScript frontend and Python backend.

## Tech Stack

### Frontend

- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom configuration
- **State Management**: React Query
- **Routing**: React Router
- **UI Components**: Custom components built with Radix UI primitives
- **Package Manager**: Both npm (package-lock.json) and Bun (bun.lockb) supported

### Backend

- **Language**: Python 3.12
- **Package Management**: uv (modern Python package manager)
- **Web Framework**: FastAPI
- **Data Storage**: Harcoded in database.py and some JSON (tampere_roads.json)

## Project Structure

### Frontend Structure (`/frontend`)

```
frontend/
├── src/                  # Source code
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Base UI components
│   │   ├── LeftSidebar  # Main sidebar component
│   │   └── TampereMap   # Map visualization component
│   ├── pages/           # Page components
│   │   ├── Index.tsx    # Main application page
│   │   └── NotFound.tsx # 404 page
│   ├── lib/             # Utility functions and contexts
│   │   ├── utils.ts
│   │   └── TampereContext.ts
│   ├── hooks/           # Custom React hooks
│   └── App.tsx          # Main application component
├── public/              # Static assets
├── vite.config.ts       # Vite configuration
├── tailwind.config.ts   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript base configuration
├── tsconfig.app.json    # App-specific TypeScript config
├── tsconfig.node.json   # Node-specific TypeScript config
├── components.json      # UI components configuration
├── eslint.config.js     # ESLint configuration
├── postcss.config.js    # PostCSS configuration
└── package.json         # Frontend dependencies
```

### Backend Structure (`/backend`)

```
backend/
├── app/
│   ├── __init__.py           # Python package marker
│   ├── main.py              # FastAPI application entry point
│   ├── database.py          # Database operations
│   ├── models.py            # Data models
│   ├── fetch_tampere_roads.py  # Road data fetching script
│   └── tampere_roads.json      # Cached road data
├── pyproject.toml           # Python project configuration
├── uv.lock                  # uv lock file for dependencies
├── .python-version          # Python version specification (3.12)
└── .venv/                   # Virtual environment directory
```

## UI Workflow

### Main Application Layout

The application follows a responsive, split-view design:

1. **Left Sidebar (Collapsible)**

   - Takes up 1/3 of the screen width when expanded
   - Can be collapsed using a toggle button
   - Contains navigation and data exploration tools

2. **Main Map View**
   - Takes up 2/3 of the screen (or full width when sidebar is collapsed)
   - Displays the interactive Tampere map
   - Shows visualization of road and transportation data

### Key UI Components

1. **Navigation System**

   - Breadcrumb navigation for hierarchical browsing
   - Responsive sidebar with collapsible sections
   - Command palette for quick actions

2. **Interactive Elements**

   - Buttons with clear visual feedback
   - Form controls with validation
   - Tooltips for additional information
   - Toast notifications for system messages

3. **Data Visualization**
   - Interactive map component
   - Data tables and lists
   - Search and filter capabilities

### User Interaction Flow

1. **Initial Load**

   - Application loads with expanded sidebar
   - Map view displays default Tampere region
   - Context providers initialize (Tampere data, tooltips, notifications)

2. **Navigation**

   - Users can collapse/expand sidebar for more map space
   - Breadcrumb navigation shows current location in app
   - Command palette available for quick actions

3. **Data Exploration**
   - Interactive map allows zooming and panning
   - Sidebar provides data filtering and search options
   - Real-time updates through React Query

## State Management

1. **Application State**

   - React Query for server state management
   - Context providers for shared state
   - Local component state for UI elements

2. **Data Flow**
   - Backend API provides road and transportation data
   - Frontend caches and manages data through React Query
   - Real-time updates handled through modern state management

## User Workflow & Features

### Core Features

1. **Interactive Map Exploration**

   - Central map view of Tampere region
   - Real-time traffic visualization
   - Dynamic points of interest (hotspots, events, transport)
   - Radius-based location search

2. **Hotspot Discovery**

   - Browse popular locations and areas
   - View traffic levels and weather conditions
   - Access demographic and population data
   - Find similar hotspots
   - Analyze foot traffic patterns

3. **Event Management**

   - Browse upcoming events
   - Filter events by date
   - View event details (capacity, type, duration)
   - Monitor event-related foot traffic

4. **Transportation Features**
   - Real-time foot traffic status
   - Public transport integration (bus, tram locations)
   - Parking availability
   - Traffic impact analysis

### Data Flow

1. **Map Interaction**

   - User selects location on map
   - System fetches nearby items within specified radius
   - Displays filtered results (events, hotspots, transport)

2. **Traffic Monitoring**

   - Real-time foot traffic data visualization
   - Color-coded foot traffic status indicators
   - GeoJSON-based road network representation

3. **Analytics**
   - Historical foot traffic patterns
   - Current occupancy levels
   - Predicted crowd movements
   - Peak hour identification

### API Structure

1. **Core Endpoints**

   - `/api/map-items`: Location-based point of interest search
   - `/api/hotspots`: Hotspot management and discovery
   - `/api/events`: Event browsing and filtering
   - `/api/traffic`: Real-time traffic data

2. **Analytics Endpoints**
   - `/api/hotspots/{id}/foot-traffic`: Hotspot crowd analysis
   - `/api/events/{id}/foot-traffic`: Event attendance patterns
   - `/api/hotspots/{id}/similar`: Related location discovery
   - `/api/events/{id}/similar`: Similar event suggestions
