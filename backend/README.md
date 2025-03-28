# Tampere Explorer Hub Backend

This is the FastAPI backend for the Tampere Explorer Hub application. It provides the data for the frontend application.

## Setup

### Prerequisites

- Python 3.12
- UV (Python package manager)

### Installation

1. Make sure you have Python 3.12 installed.

2. The project uses `uv` for Python package management. The virtual environment is already set up with the required dependencies.

3. Activate the virtual environment:

```bash
source ./venv/bin/activate
```

4. Run the application:

```bash
python main.py
```

The API will be available at http://localhost:8000.

## API Documentation

Once the server is running, you can access the interactive API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

- `GET /`: Welcome message
- `GET /tampere-center`: Get Tampere center coordinates
- `GET /hotspots`: Get all hotspots
- `GET /hotspots/{hotspot_id}`: Get a specific hotspot by ID
- `GET /events`: Get all events
- `GET /events?date=YYYY-MM-DD`: Get events by date
- `GET /events/{event_id}`: Get a specific event by ID
- `GET /events/{event_id}/similar`: Get similar events to a specific event
- `GET /map-items`: Get all map items (bus stops, trams, businesses, etc.)
- `GET /traffic`: Get traffic data for the map
