# Tampere Explorer Hub - Project Documentation

## Project Overview

The Tampere Explorer Hub is a modern web application designed to explore and visualize data related to Tampere, with a specific focus on road and transportation infrastructure. The project uses a modern tech stack with a React/TypeScript frontend and Python backend.

## Technical Stack

### Frontend

- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Routing**: React Router
- **UI Components**: Custom components built with Radix UI primitives

### Backend

- **Language**: Python 3.12
- **Package Management**: uv (modern Python package manager)
- **Data Management**: Custom database implementation
- **API**: FastAPI (inferred from the modern Python stack)

## Project Structure

### Frontend Structure (`/frontend`)

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Base UI components
│   │   ├── LeftSidebar    # Main sidebar component
│   │   └── TampereMap     # Map visualization component
│   ├── pages/             # Page components
│   │   ├── Index.tsx      # Main application page
│   │   └── NotFound.tsx   # 404 page
│   ├── lib/               # Utility functions and contexts
│   │   ├── utils.ts
│   │   └── TampereContext.ts
│   ├── hooks/             # Custom React hooks
│   └── App.tsx            # Main application component
├── public/                # Static assets
├── vite.config.ts         # Vite configuration
└── package.json           # Frontend dependencies
```

### Backend Structure (`/backend`)

```
backend/
├── app/
│   ├── main.py           # FastAPI application entry point
│   ├── database.py       # Database operations
│   ├── models.py         # Data models
│   ├── fetch_tampere_roads.py  # Road data fetching script
│   └── tampere_roads.json      # Cached road data
├── pyproject.toml        # Python project configuration
└── .python-version       # Python version specification
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

## Development Workflow

1. **Frontend Development**

   - Uses Vite for fast development experience
   - TypeScript for type safety
   - Modern component architecture with Radix UI primitives

2. **Backend Development**
   - Python 3.12 with modern async capabilities
   - uv for dependency management
   - FastAPI for high-performance API endpoints

## Future Considerations

1. **Scalability**

   - Component structure ready for additional features
   - Modular design allows easy extension
   - State management prepared for increased complexity

2. **Performance**

   - Code splitting and lazy loading ready
   - Efficient data caching through React Query
   - Optimized map rendering

3. **Accessibility**
   - ARIA attributes implemented
   - Keyboard navigation support
   - Screen reader friendly components
