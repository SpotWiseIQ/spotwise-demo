import logging
from fastapi import FastAPI, HTTPException, Query, APIRouter, Request
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
    HotspotType,
    LocationsResponse,
    LocationResponse,
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
from app.business_requirements import (
    get_business_requirements_response,
    classify_business_requirement_with_openai,
    generate_llm_summary,
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

# Create API router with /api prefix
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Welcome to the Tampere Explorer Hub API"}


@api_router.post("/analyze-business", response_model=BusinessPreferences)
async def analyze_business_requirement(requirement: BusinessRequirementRequest):
    """Analyze business requirement text and return business preferences"""
    logger.info(f"Analyzing business requirement: {requirement.text}")

    # Use OpenAI classification
    result = classify_business_requirement_with_openai(requirement.text)
    logger.debug(f"OpenAI classification result: {result}")
    logger.debug(f"Business field from OpenAI result: {result.get('business')}")
    if not result.get("supported", False):
        raise HTTPException(
            status_code=422,
            detail=result.get("message", "Business requirement not supported."),
        )

    # Check for unsupported location
    location = result.get("location")
    if location and location.strip().lower() != "tampere":
        raise HTTPException(
            status_code=422,
            detail="Currently, only Tampere is supported as a location.",
        )

    # Normalize and validate business value
    allowed_businesses = {
        "car wash": "Car Wash",
        "food stall": "Food Stall",
        "artisan stall": "Artisan Stall",
    }
    business_raw = (result["business"] or "").strip().lower()
    business = allowed_businesses.get(business_raw)
    if not business:
        raise HTTPException(
            status_code=422, detail="Business type not recognized or supported."
        )

    # Map OpenAI result to BusinessPreferences
    business_type = (
        BusinessType(result["business_type"])
        if result["business_type"]
        else BusinessType.MOBILE
    )
    intent = (
        BusinessIntent(result["intent"])
        if result.get("intent") in BusinessIntent.__members__.values()
        else BusinessIntent.RESEARCH
    )
    return BusinessPreferences(
        business_type=business_type,
        business=business,
        location="Tampere",  # Always Tampere as per frontend
        intent=intent,
    )


@api_router.get("/tampere-center")
async def get_tampere_center():
    """Get Tampere center coordinates"""
    logger.info("Tampere center coordinates requested")
    return TAMPERE_CENTER


@api_router.get("/locations", response_model=LocationsResponse)
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
    Also includes traffic data and traffic points for the map view.
    """
    logger.info(
        f"Locations requested with filters: time_period={time_period}, date={date}, time={time}"
    )

    # Use current date/time if not provided
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    if time is None:
        time = datetime.now().hour

    logger.info(f"Using date={date}, hour={time} for location request")

    # Get locations with traffic data
    locations = get_all_locations(date, time)
    logger.info(f"Retrieved {len(locations)} locations")

    # Convert Location objects to Hotspot objects for traffic generation
    hotspots = []
    for location in locations:
        # Use venue_coordinates for event-hotspots if available
        coordinates = location.coordinates
        if location.type == HotspotType.EVENT and location.venue_coordinates:
            coordinates = location.venue_coordinates

        hotspot = Hotspot(
            id=location.id,
            name=location.name,
            label=location.label,
            address=f"{location.name} Area",  # Simple address
            trafficLevel=location.trafficLevel,
            weather=location.weather,
            coordinates=coordinates,
            population=location.population,
            areaType=location.areaType,
            peakHour=location.peakHour,
            avgDailyTraffic=location.avgDailyTraffic,
            dominantDemographics=location.dominantDemographics,
            nearbyBusinesses=location.nearbyBusinesses,
            footTraffic=location.footTraffic,
        )
        hotspots.append(hotspot)

    # Generate traffic data using locations
    traffic_data = get_traffic_data(hotspots)
    logger.info("Traffic data generated")

    # Generate traffic points from traffic data
    traffic_points = generate_traffic_points(traffic_data)
    logger.info("Traffic points generated")

    # Return combined response
    return LocationsResponse(
        locations=locations, traffic_data=traffic_data, traffic_points=traffic_points
    )


@api_router.get("/locations/{location_id}", response_model=LocationResponse)
async def read_location(
    location_id: str,
    date: Optional[str] = Query(
        None, description="Selected date in ISO format (YYYY-MM-DD)"
    ),
    time: Optional[int] = Query(None, ge=0, le=23, description="Selected hour (0-23)"),
):
    """Get a specific location by ID with all its data, traffic data, and traffic points."""
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

    # Create a hotspot object for traffic data generation
    coordinates = location.coordinates
    if location.type == HotspotType.EVENT and location.venue_coordinates:
        coordinates = location.venue_coordinates

    hotspot = Hotspot(
        id=location.id,
        name=location.name,
        label=location.label,
        address=f"{location.name} Area",  # Simple address
        trafficLevel=location.trafficLevel,
        weather=location.weather,
        coordinates=coordinates,
        population=location.population,
        areaType=location.areaType,
        peakHour=location.peakHour,
        avgDailyTraffic=location.avgDailyTraffic,
        dominantDemographics=location.dominantDemographics,
        nearbyBusinesses=location.nearbyBusinesses,
        footTraffic=location.footTraffic,
    )

    # Generate traffic data using this single location
    traffic_data = get_traffic_data([hotspot])
    logger.info("Traffic data generated for location")

    # Generate traffic points from traffic data
    traffic_points = generate_traffic_points(traffic_data)
    logger.info("Traffic points generated for location")

    return LocationResponse(
        location=location, traffic_data=traffic_data, traffic_points=traffic_points
    )


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


@api_router.get("/traffic", response_model=TrafficData, deprecated=True)
async def read_traffic_data(
    use_hotspots: bool = Query(
        True, description="Whether to use hotspots to generate traffic data"
    ),
    date: Optional[str] = Query(
        None, description="Selected date in ISO format (YYYY-MM-DD)"
    ),
    time: Optional[int] = Query(None, ge=0, le=23, description="Selected hour (0-23)"),
):
    """
    Get traffic data for Tampere, optionally using hotspots.
    DEPRECATED: Use /locations endpoint instead, which returns traffic data along with locations.
    """
    logger.info(f"Traffic data requested (use_hotspots={use_hotspots})")

    if not use_hotspots:
        data = get_traffic_data([])  # Use empty list when hotspots are not wanted
    else:
        # Use current date/time if not provided
        if not date:
            date = datetime.now().strftime("%Y-%m-%d")
        if time is None:
            time = datetime.now().hour

        # Get locations from the database
        locations = get_all_locations(date, time)

        # Convert Location objects to Hotspot objects for traffic generation
        hotspots = []
        for location in locations:
            # Use venue_coordinates for event-hotspots if available
            coordinates = location.coordinates
            if location.type == HotspotType.EVENT and location.venue_coordinates:
                coordinates = location.venue_coordinates

            hotspot = Hotspot(
                id=location.id,
                name=location.name,
                label=location.label,
                address=f"{location.name} Area",  # Simple address
                trafficLevel=location.trafficLevel,
                weather=location.weather,
                coordinates=coordinates,
                population=location.population,
                areaType=location.areaType,
                peakHour=location.peakHour,
                avgDailyTraffic=location.avgDailyTraffic,
                dominantDemographics=location.dominantDemographics,
                nearbyBusinesses=location.nearbyBusinesses,
                footTraffic=location.footTraffic,
            )
            hotspots.append(hotspot)

        # Generate traffic data using converted hotspots
        data = get_traffic_data(hotspots)

    logger.info("Traffic data generated")
    return data


@api_router.get("/traffic/points", deprecated=True)
async def read_traffic_points(
    use_hotspots: bool = Query(
        True, description="Whether to use hotspots to generate traffic data"
    ),
    date: Optional[str] = Query(
        None, description="Selected date in ISO format (YYYY-MM-DD)"
    ),
    time: Optional[int] = Query(None, ge=0, le=23, description="Selected hour (0-23)"),
):
    """
    Get traffic points for Tampere, optionally using hotspots.
    DEPRECATED: Use /locations endpoint instead, which returns traffic points along with locations.
    """
    logger.info(f"Traffic points requested (use_hotspots={use_hotspots})")

    if not use_hotspots:
        traffic_data = get_traffic_data([])
    else:
        # Use current date/time if not provided
        if not date:
            date = datetime.now().strftime("%Y-%m-%d")
        if time is None:
            time = datetime.now().hour

        # Get locations from the database
        locations = get_all_locations(date, time)

        # Convert Location objects to Hotspot objects
        hotspots = []
        for location in locations:
            # Use venue_coordinates for event-hotspots if available
            coordinates = location.coordinates
            if location.type == HotspotType.EVENT and location.venue_coordinates:
                coordinates = location.venue_coordinates

            hotspot = Hotspot(
                id=location.id,
                name=location.name,
                label=location.label,
                address=f"{location.name} Area",
                trafficLevel=location.trafficLevel,
                weather=location.weather,
                coordinates=coordinates,
                population=location.population,
                areaType=location.areaType,
                peakHour=location.peakHour,
                avgDailyTraffic=location.avgDailyTraffic,
                dominantDemographics=location.dominantDemographics,
                nearbyBusinesses=location.nearbyBusinesses,
                footTraffic=location.footTraffic,
            )
            hotspots.append(hotspot)

        traffic_data = get_traffic_data(hotspots)

    points = generate_traffic_points(traffic_data)
    logger.info("Traffic points generated")
    return points


@api_router.post("/llm-summary")
async def llm_summary(request: Request):
    """Generate a smart summary for a zone and business requirement using LLM"""
    try:
        data = await request.json()
        metrics = data.get("metrics", {})
        business_requirement = data.get("business_requirement", "")
        location_type = data.get("location_type", None)
        instructions = data.get("instructions", "")
        summary = generate_llm_summary(
            metrics=metrics,
            business_requirement=business_requirement,
            location_type=location_type,
            instructions=instructions,
        )
        return {"summary": summary}
    except Exception as e:
        logger.error(f"LLM summary error: {e}", exc_info=True)
        return {
            "summary": "This area has promising metrics for your business. (LLM summary unavailable)"
        }


# Include the API router in the main app
app.include_router(api_router)
