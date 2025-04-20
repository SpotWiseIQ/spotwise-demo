import logging
from fastapi import FastAPI, HTTPException, Query, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime

from app.models import (
    Hotspot,
    Event,
    MapItem,
    TrafficData,
    FootTrafficData,
    BusinessType,
    BusinessIntent,
    BusinessRequirementRequest,
    BusinessPreferences,
    Location,
)
from app.database import (
    get_all_hotspots,
    get_hotspot_by_id,
    get_all_events,
    get_events_by_date,
    get_event_by_id,
    get_map_items,
    get_traffic_data,
    get_event_foot_traffic,
    get_hotspot_detailed_metrics,
    get_event_detailed_metrics,
    TAMPERE_CENTER,
    get_all_locations,
    get_location_by_id,
    get_location_detailed_metrics,
)
from app.fetch_tampere_roads import generate_traffic_points
from app.business_requirements import get_business_requirements_response

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

# Create API router with /api prefix
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Welcome to the Tampere Explorer Hub API"}


@api_router.get("/tampere-center")
async def get_tampere_center():
    """Get Tampere center coordinates"""
    logger.info("Tampere center coordinates requested")
    return TAMPERE_CENTER


@api_router.get("/locations", response_model=List[Location])
async def read_locations(
    time_period: Optional[str] = Query(
        None, description="Time period: real-time, daily, weekly, monthly"
    ),
    date: Optional[str] = Query(
        None, description="Selected date in ISO format (YYYY-MM-DD)"
    ),
    time: Optional[int] = Query(None, ge=0, le=23, description="Selected hour (0-23)"),
):
    """
    Get all locations as hotspots (natural and event types).
    Returns locations with their foot traffic data, ordered by current traffic level.
    """
    logger.info(
        f"Locations requested with filters: time_period={time_period}, date={date}, time={time}"
    )

    # Use current date/time if not provided
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    if time is None:
        time = datetime.now().hour

    # Get locations with traffic data
    locations = get_all_locations(date, time)
    logger.info(f"Retrieved {len(locations)} locations")
    return locations


@api_router.get("/locations/{location_id}", response_model=Location)
async def read_location(
    location_id: str,
    date: Optional[str] = Query(
        None, description="Selected date in ISO format (YYYY-MM-DD)"
    ),
    time: Optional[int] = Query(None, ge=0, le=23, description="Selected hour (0-23)"),
):
    """Get a specific location by ID with all its data."""
    logger.info(
        f"Location requested with ID: {location_id}, date: {date}, time: {time}"
    )

    # Use current date/time if not provided
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    if time is None:
        time = datetime.now().hour

    location = get_location_by_id(location_id, date, time)
    if not location:
        logger.warning(f"Location with ID {location_id} not found")
        raise HTTPException(status_code=404, detail="Location not found")
    return location


@api_router.get("/locations/{location_id}/detailed-metrics")
async def read_location_detailed_metrics(location_id: str):
    """Get detailed metrics for a specific location"""
    logger.info(f"Detailed metrics requested for location ID: {location_id}")
    detailed_metrics = get_location_detailed_metrics(location_id)
    if "error" in detailed_metrics:
        logger.warning(f"Location with ID {location_id} not found")
        raise HTTPException(status_code=404, detail="Location not found")
    logger.info(f"Retrieved detailed metrics for location ID: {location_id}")
    return detailed_metrics


@api_router.get("/hotspots", response_model=List[Location])
async def read_hotspots(
    time_period: Optional[str] = Query(
        None, description="Time period: real-time, daily, weekly, monthly"
    ),
    date: Optional[str] = Query(
        None, description="Selected date in ISO format (YYYY-MM-DD)"
    ),
    time: Optional[int] = Query(None, ge=0, le=23, description="Selected hour (0-23)"),
):
    """
    Get all hotspots with optional filtering by time period, date, and time.
    Now returns unified Location objects instead of separate Hotspot objects.
    """
    # Log the request parameters
    logger.info(
        f"Hotspots requested with filters: time_period={time_period}, date={date}, time={time}"
    )

    # Use current date/time if not provided
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    if time is None:
        time = datetime.now().hour

    # Get locations with traffic data (filtered to natural hotspots)
    locations = get_all_locations(date, time)
    natural_hotspots = [loc for loc in locations if loc.type == "natural"]
    logger.info(f"Retrieved {len(natural_hotspots)} natural hotspots")
    return natural_hotspots


@api_router.get("/hotspots/{hotspot_id}", response_model=Location)
async def read_hotspot(
    hotspot_id: str,
    date: Optional[str] = Query(
        None, description="Selected date in ISO format (YYYY-MM-DD)"
    ),
    time: Optional[int] = Query(None, ge=0, le=23, description="Selected hour (0-23)"),
):
    """Get a specific hotspot by ID with dynamic foot traffic data."""
    logger.info(f"Hotspot requested with ID: {hotspot_id}, date: {date}, time: {time}")

    # Use current date/time if not provided
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    if time is None:
        time = datetime.now().hour

    location = get_location_by_id(hotspot_id, date, time)
    if not location or location.type != "natural":
        logger.warning(f"Hotspot with ID {hotspot_id} not found")
        raise HTTPException(status_code=404, detail="Hotspot not found")
    return location


@api_router.get("/events", response_model=List[Location])
async def read_events(
    date: Optional[str] = Query(
        None, description="Selected date in ISO format (YYYY-MM-DD)"
    ),
):
    """
    Get all events for a specific date.
    Now returns unified Location objects instead of separate Event objects.
    """
    logger.info(f"Events requested for date: {date}")

    # Use current date if not provided
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")

    # Get all locations with traffic data (filtered to event hotspots)
    locations = get_all_locations(date)
    event_hotspots = [loc for loc in locations if loc.type == "event"]
    logger.info(f"Retrieved {len(event_hotspots)} event hotspots for date {date}")
    return event_hotspots


@api_router.get("/events/{event_id}", response_model=Location)
async def read_event(event_id: str):
    """Get a specific event by ID.
    Now returns a unified Location object instead of an Event object.
    """
    logger.info(f"Event requested with ID: {event_id}")

    # Get all locations
    locations = get_all_locations()

    # Find the event with the matching event_id
    for location in locations:
        if location.type == "event" and location.event_id == event_id:
            return location

    logger.warning(f"Event with ID {event_id} not found")
    raise HTTPException(status_code=404, detail="Event not found")


@api_router.get("/map-items", response_model=List[MapItem])
async def read_map_items(
    lat: float,
    lng: float,
    radius: int = Query(500, gt=0, le=5000),
    types: Optional[List[str]] = Query(None),
):
    """Get map items within a radius of a point"""
    logger.info(f"Map items requested for lat={lat}, lng={lng}, radius={radius}m")
    return get_map_items(lat, lng, radius, types)


@api_router.get("/traffic", response_model=TrafficData)
async def read_traffic_data(
    use_hotspots: bool = Query(
        True, description="Whether to use hotspots to generate traffic data"
    ),
):
    """Get traffic data for the map"""
    logger.info(f"Traffic data requested with use_hotspots={use_hotspots}")

    if use_hotspots:
        # Get current hotspots
        current_date = datetime.now().strftime("%Y-%m-%d")
        current_hour = datetime.now().hour
        hotspots = get_all_hotspots(current_date, current_hour)
        logger.info(f"Using {len(hotspots)} hotspots for traffic generation")
        return get_traffic_data(hotspots)

    return get_traffic_data()


@api_router.get(
    "/hotspots/{hotspot_id}/foot-traffic", response_model=List[FootTrafficData]
)
async def read_hotspot_foot_traffic(
    hotspot_id: str,
    date: Optional[str] = Query(
        None, description="Selected date in ISO format (YYYY-MM-DD)"
    ),
    time: Optional[int] = Query(None, ge=0, le=23, description="Selected hour (0-23)"),
):
    """Get foot traffic data for a specific hotspot."""
    logger.info(f"Foot traffic data requested for hotspot ID: {hotspot_id}")

    # Get the hotspot with its foot traffic data
    hotspot = get_hotspot_by_id(hotspot_id, date, time)
    if not hotspot:
        logger.warning(f"Hotspot with ID {hotspot_id} not found")
        raise HTTPException(status_code=404, detail="Hotspot not found")

    logger.info(
        f"Retrieved {len(hotspot.footTraffic) if hotspot.footTraffic else 0} foot traffic data points for hotspot ID: {hotspot_id}"
    )
    return hotspot.footTraffic or []


@api_router.get("/events/{event_id}/foot-traffic", response_model=List[FootTrafficData])
async def read_event_foot_traffic(
    event_id: str,
    time: Optional[int] = Query(None, ge=0, le=23, description="Selected hour (0-23)"),
):
    """Get foot traffic data for a specific event"""
    logger.info(f"Foot traffic data requested for event ID: {event_id} at hour: {time}")

    event = get_event_by_id(event_id)
    if not event:
        logger.warning(f"Event with ID {event_id} not found")
        raise HTTPException(status_code=404, detail="Event not found")

    # Use the time parameter if provided, otherwise it will use the current hour
    foot_traffic = get_event_foot_traffic(event_id, time)

    logger.info(
        f"Retrieved {len(foot_traffic)} foot traffic data points for event ID: {event_id}"
    )
    return foot_traffic


@api_router.post("/analyze-business", response_model=BusinessPreferences)
async def analyze_business_requirement(requirement: BusinessRequirementRequest):
    """Analyze business requirement text and return business preferences"""
    logger.info(f"Analyzing business requirement: {requirement.text}")

    # For now, return fixed preferences
    # In the future, this will use an LLM to analyze the text
    return BusinessPreferences(
        business_type=BusinessType.MOBILE,
        business="Foodstand",
        location="Tampere",
        intent=BusinessIntent.RESEARCH,
    )


@api_router.get("/hotspots/{hotspot_id}/detailed-metrics")
async def read_hotspot_detailed_metrics(hotspot_id: str):
    """Get detailed metrics for a specific hotspot"""
    logger.info(f"Detailed metrics requested for hotspot ID: {hotspot_id}")
    detailed_metrics = get_location_detailed_metrics(hotspot_id)
    if "error" in detailed_metrics:
        logger.warning(f"Hotspot with ID {hotspot_id} not found")
        raise HTTPException(status_code=404, detail="Hotspot not found")
    logger.info(f"Retrieved detailed metrics for hotspot ID: {hotspot_id}")
    return detailed_metrics


@api_router.get("/events/{event_id}/detailed-metrics")
async def read_event_detailed_metrics(event_id: str):
    """Get detailed metrics for a specific event"""
    logger.info(f"Detailed metrics requested for event ID: {event_id}")

    # Get all locations
    locations = get_all_locations()

    # Find the event with the matching event_id
    location_id = None
    for location in locations:
        if location.type == "event" and location.event_id == event_id:
            location_id = location.id
            break

    if not location_id:
        logger.warning(f"Event with ID {event_id} not found")
        raise HTTPException(status_code=404, detail="Event not found")

    detailed_metrics = get_location_detailed_metrics(location_id)
    logger.info(f"Retrieved detailed metrics for event ID: {event_id}")
    return detailed_metrics


@api_router.get("/traffic/points")
async def read_traffic_points(
    use_hotspots: bool = Query(
        True, description="Whether to use hotspots to generate traffic data"
    ),
):
    """Get traffic data as points for the map, with varying density based on traffic status"""
    logger.info(f"Traffic points data requested with use_hotspots={use_hotspots}")

    if use_hotspots:
        # Get current hotspots
        current_date = datetime.now().strftime("%Y-%m-%d")
        current_hour = datetime.now().hour
        hotspots = get_all_hotspots(current_date, current_hour)
        logger.info(f"Using {len(hotspots)} hotspots for traffic generation")
        traffic_data = get_traffic_data(hotspots)
    else:
        traffic_data = get_traffic_data()

    # Convert traffic lines to points
    points_data = generate_traffic_points(traffic_data)
    return points_data


@api_router.post("/business-requirements")
async def get_business_requirements(request: BusinessRequirementRequest):
    """Get business requirements response based on user input"""
    logger.info(f"Business requirements requested with text: {request.text[:50]}...")
    response = get_business_requirements_response(request.text)
    logger.info(f"Generated business requirements response")
    return response


# Include the API router in the main app
app.include_router(api_router)
