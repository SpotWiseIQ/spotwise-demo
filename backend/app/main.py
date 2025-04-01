import logging
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime

from app.models import Hotspot, Event, MapItem, TrafficData, FootTrafficData
from app.database import (
    get_all_hotspots,
    get_hotspot_by_id,
    get_all_events,
    get_events_by_date,
    get_event_by_id,
    get_similar_events,
    get_similar_hotspots,
    get_map_items,
    get_traffic_data,
    get_hotspot_foot_traffic,
    TAMPERE_CENTER,
)

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Tampere Explorer Hub API",
    description="API for the Tampere Explorer Hub application",
    version="1.0.0",
)

# CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Welcome to the Tampere Explorer Hub API"}


@app.get("/tampere-center", response_model=List[float])
async def get_tampere_center():
    """Get the coordinates of Tampere center"""
    logger.info(f"Tampere center coordinates requested, returning: {TAMPERE_CENTER}")
    return list(TAMPERE_CENTER)


@app.get("/hotspots", response_model=List[Hotspot])
async def read_hotspots():
    """Get all hotspots"""
    hotspots = get_all_hotspots()
    logger.info(f"Retrieved {len(hotspots)} hotspots")
    return hotspots


@app.get("/hotspots/{hotspot_id}", response_model=Hotspot)
async def read_hotspot(hotspot_id: str):
    """Get a specific hotspot by ID"""
    logger.info(f"Hotspot requested with ID: {hotspot_id}")
    hotspot = get_hotspot_by_id(hotspot_id)
    if not hotspot:
        logger.warning(f"Hotspot with ID {hotspot_id} not found")
        raise HTTPException(status_code=404, detail="Hotspot not found")
    return hotspot


@app.get("/hotspots/{hotspot_id}/similar", response_model=List[Hotspot])
async def read_similar_hotspots(hotspot_id: str):
    """Get similar hotspots to a specific hotspot"""
    logger.info(f"Similar hotspots requested for hotspot ID: {hotspot_id}")
    return get_similar_hotspots(hotspot_id)


@app.get("/events", response_model=List[Event])
async def read_events(date: Optional[str] = None):
    """
    Get all events or filter by date

    Format: YYYY-MM-DD (e.g., 2025-03-26)
    """
    if date:
        logger.info(f"Events requested for date: {date}")
        return get_events_by_date(date)
    logger.info("All events requested")
    return get_all_events()


@app.get("/events/{event_id}", response_model=Event)
async def read_event(event_id: str):
    """Get a specific event by ID"""
    logger.info(f"Event requested with ID: {event_id}")
    event = get_event_by_id(event_id)
    if not event:
        logger.warning(f"Event with ID {event_id} not found")
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@app.get("/events/{event_id}/similar", response_model=List[Event])
async def read_similar_events(event_id: str):
    """Get similar events to a specific event"""
    logger.info(f"Similar events requested for event ID: {event_id}")
    return get_similar_events(event_id)


@app.get("/map-items", response_model=List[MapItem])
async def read_map_items():
    """Get all map items (bus stops, trams, businesses, etc.)"""
    map_items = get_map_items()
    logger.info(f"Retrieved {len(map_items)} map items")
    return map_items


@app.get("/traffic", response_model=TrafficData)
async def read_traffic_data():
    """Get traffic data for the map"""
    logger.info("Traffic data requested")
    return get_traffic_data()


@app.get("/hotspots/{hotspot_id}/foot-traffic", response_model=List[FootTrafficData])
async def read_hotspot_foot_traffic(hotspot_id: str):
    """Get foot traffic data for a specific hotspot"""
    logger.info(f"Foot traffic data requested for hotspot ID: {hotspot_id}")
    hotspot = get_hotspot_by_id(hotspot_id)
    if not hotspot:
        logger.warning(f"Hotspot with ID {hotspot_id} not found")
        raise HTTPException(status_code=404, detail="Hotspot not found")

    foot_traffic = get_hotspot_foot_traffic(hotspot_id)
    logger.info(
        f"Retrieved {len(foot_traffic)} foot traffic data points for hotspot ID: {hotspot_id}"
    )
    return foot_traffic
