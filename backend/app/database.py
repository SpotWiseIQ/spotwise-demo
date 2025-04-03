import os
import json
import random
from app.models import (
    TrafficLevel,
    WeatherType,
    Hotspot,
    Event,
    MapItemType,
    MapItem,
    TrafficStatus,
    TrafficFeature,
    TrafficFeatureProperties,
    TrafficLineCoordinates,
    TrafficData,
    FootTrafficType,
    FootTrafficData,
)
from typing import List, Dict, Callable, Optional
from datetime import datetime
from app.fetch_tampere_roads import fetch_tampere_roads, process_road_data
import requests
from math import sin, cos, sqrt, atan2, radians
import math

# Tampere center coordinates
TAMPERE_CENTER = (23.7610, 61.4978)

# Mock hotspots data
hotspots: List[Hotspot] = [
    Hotspot(
        id="1",
        label="A",
        address="Address 1",
        trafficLevel=TrafficLevel.HIGH,
        weather=WeatherType.SUNNY,
        coordinates=(23.775, 61.4998),
        population="~10k",
        areaType="Commercial",
        peakHour="17:00",
        avgDailyTraffic="~8k",
        dominantDemographics="25-45",
        nearbyBusinesses="50+",
    ),
    Hotspot(
        id="2",
        label="B",
        address="Address 2",
        trafficLevel=TrafficLevel.HIGH,
        weather=WeatherType.CLOUDED,
        coordinates=(23.745, 61.4990),
        population="~5k",
        areaType="Residential/Office",
        peakHour="08:00",
        avgDailyTraffic="~4k",
        dominantDemographics="30-55",
        nearbyBusinesses="20+",
    ),
    Hotspot(
        id="3",
        label="C",
        address="Address 3",
        trafficLevel=TrafficLevel.MEDIUM,
        weather=WeatherType.CLOUDED,
        coordinates=(23.755, 61.4960),
        population="~8k",
        areaType="Mixed Use",
        peakHour="16:00",
        avgDailyTraffic="~6k",
        dominantDemographics="Students, Young Adults",
        nearbyBusinesses="35+",
    ),
    Hotspot(
        id="4",
        label="D",
        address="Address 4",
        trafficLevel=TrafficLevel.MEDIUM,
        weather=WeatherType.SUNNY,
        coordinates=(23.765, 61.4940),
        population="~12k",
        areaType="Entertainment District",
        peakHour="20:00",
        avgDailyTraffic="~10k",
        dominantDemographics="18-30",
        nearbyBusinesses="60+",
    ),
]

# Mock events data
events: List[Event] = [
    Event(
        id="1",
        name="Event 1",
        time="15:00",
        place="Place",
        coordinates=(23.760, 61.4988),
        date="2025-03-26",
        address="Hämeenkatu 12",
        type="concert",
        duration="2 h",
        capacity=1000,
        demographics="18-35",
        peakTrafficImpact="+50%",
        ticketStatus="Sold Out",
    ),
    Event(
        id="2",
        name="Event 2",
        time="15:00",
        place="Place",
        coordinates=(23.772, 61.4975),
        date="2025-03-26",
        peakTrafficImpact="+20%",
        ticketStatus="Available",
    ),
    Event(
        id="3",
        name="Event 3",
        time="15:00",
        place="Place",
        coordinates=(23.750, 61.4965),
        date="2025-03-26",
        peakTrafficImpact="+15%",
        ticketStatus="Limited",
    ),
    Event(
        id="4",
        name="Event 4",
        time="15:00",
        place="Place",
        coordinates=(23.780, 61.4950),
        date="2025-03-26",
    ),
    Event(
        id="5",
        name="Event 5",
        time="10:00",
        place="Place",
        coordinates=(23.765, 61.4940),
        date="2025-03-27",
    ),
    Event(
        id="6",
        name="Event 6",
        time="15:00",
        place="Place",
        coordinates=(23.755, 61.4930),
        date="2025-03-27",
    ),
    Event(
        id="7",
        name="Event 7",
        time="15:00",
        place="Place",
        coordinates=(23.770, 61.4920),
        date="2025-01-12",
    ),
    Event(
        id="8",
        name="Event 8",
        time="15:00",
        place="Place",
        coordinates=(23.750, 61.4910),
        date="2025-02-01",
    ),
]

# Mock map items data
map_items: List[MapItem] = [
    MapItem(type=MapItemType.BUS, id="bus1", coordinates=(23.780, 61.4970)),
    MapItem(type=MapItemType.BUS, id="bus2", coordinates=(23.765, 61.4965)),
    MapItem(type=MapItemType.TRAM, id="tram1", coordinates=(23.770, 61.4960)),
    MapItem(type=MapItemType.BUSINESS, id="business1", coordinates=(23.760, 61.4965)),
    MapItem(type=MapItemType.BUSINESS, id="business2", coordinates=(23.768, 61.4968)),
    MapItem(type=MapItemType.BUSINESS, id="business3", coordinates=(23.750, 61.4980)),
    MapItem(type=MapItemType.PARKING, id="parking1", coordinates=(23.778, 61.4975)),
    MapItem(type=MapItemType.PARKING, id="parking2", coordinates=(23.763, 61.4950)),
    MapItem(type=MapItemType.AVAILABLE, id="available1", coordinates=(23.755, 61.4985)),
    MapItem(type=MapItemType.AVAILABLE, id="available2", coordinates=(23.775, 61.4960)),
    MapItem(type=MapItemType.AVAILABLE, id="available3", coordinates=(23.740, 61.4970)),
    MapItem(type=MapItemType.AVAILABLE, id="available4", coordinates=(23.790, 61.4950)),
]

# Path to cache file for Tampere road data
TAMPERE_ROADS_CACHE = os.path.join(os.path.dirname(__file__), "tampere_roads.json")


# Traffic data
def get_traffic_data() -> TrafficData:
    """Get traffic data for Tampere streets."""
    # Try to load from cache file first
    if os.path.exists(TAMPERE_ROADS_CACHE):
        try:
            with open(TAMPERE_ROADS_CACHE, "r") as f:
                data = json.load(f)
                return TrafficData(**data)
        except Exception as e:
            print(f"Error loading cached road data: {e}")

    # If cache doesn't exist or couldn't be loaded, fetch from API
    try:
        print("Fetching fresh road data from Overpass API...")
        osm_data = fetch_tampere_roads()
        traffic_data = process_road_data(osm_data)

        # Save to cache for future use
        try:
            with open(TAMPERE_ROADS_CACHE, "w") as f:
                json.dump(traffic_data.dict(), f)
        except Exception as e:
            print(f"Error saving road data to cache: {e}")

        return traffic_data
    except Exception as e:
        print(f"Error fetching road data from API: {e}")
        # Fall back to the mock data if everything else fails
        return get_mock_traffic_data()


def get_mock_traffic_data() -> TrafficData:
    """Fallback function that returns mock traffic data."""
    return TrafficData(
        type="FeatureCollection",
        features=[
            # Hämeenkatu - main east-west street in Tampere center (Low traffic)
            TrafficFeature(
                type="Feature",
                properties=TrafficFeatureProperties(status=TrafficStatus.AVAILABLE),
                geometry=TrafficLineCoordinates(
                    type="LineString",
                    coordinates=[
                        [23.7457, 61.4978],  # Western end near railway station
                        [23.7530, 61.4975],  # Intersection with Hämeenpuisto
                        [23.7584, 61.4972],  # Central Square
                        [23.7637, 61.4970],  # Near Keskustori
                        [23.7688, 61.4967],  # Eastern part
                        [23.7739, 61.4964],  # Eastern end
                    ],
                ),
            ),
            # Hatanpään valtatie - main southern route (Medium traffic)
            TrafficFeature(
                type="Feature",
                properties=TrafficFeatureProperties(status=TrafficStatus.MODERATE),
                geometry=TrafficLineCoordinates(
                    type="LineString",
                    coordinates=[
                        [23.7637, 61.4970],  # Starts at Hämeenkatu
                        [23.7647, 61.4955],  # Heading south
                        [23.7657, 61.4930],  # Continuing south
                        [23.7670, 61.4910],  # Near Hatanpää hospital
                        [23.7685, 61.4890],  # Southern part
                    ],
                ),
            ),
            # Tampereen valtatie - heavy traffic road (High traffic)
            TrafficFeature(
                type="Feature",
                properties=TrafficFeatureProperties(status=TrafficStatus.CONGESTED),
                geometry=TrafficLineCoordinates(
                    type="LineString",
                    coordinates=[
                        [23.7428, 61.4960],  # Western start
                        [23.7457, 61.4978],  # Near railway station
                        [23.7487, 61.4990],  # North of center
                    ],
                ),
            ),
            # Satakunnankatu - east-west street north of center (High traffic)
            TrafficFeature(
                type="Feature",
                properties=TrafficFeatureProperties(status=TrafficStatus.CONGESTED),
                geometry=TrafficLineCoordinates(
                    type="LineString",
                    coordinates=[
                        [23.7482, 61.5000],  # Western end
                        [23.7530, 61.5005],  # Going east
                        [23.7584, 61.5010],  # Middle section
                        [23.7637, 61.5012],  # Eastern part
                        [23.7688, 61.5015],  # Eastern end
                    ],
                ),
            ),
            # Pirkankatu - western approach (Low traffic)
            TrafficFeature(
                type="Feature",
                properties=TrafficFeatureProperties(status=TrafficStatus.AVAILABLE),
                geometry=TrafficLineCoordinates(
                    type="LineString",
                    coordinates=[
                        [23.7330, 61.4982],  # Western start
                        [23.7380, 61.4980],  # Middle
                        [23.7427, 61.4978],  # Eastern end - connects to center
                    ],
                ),
            ),
            # Itsenäisyydenkatu - eastern approach (Medium traffic)
            TrafficFeature(
                type="Feature",
                properties=TrafficFeatureProperties(status=TrafficStatus.MODERATE),
                geometry=TrafficLineCoordinates(
                    type="LineString",
                    coordinates=[
                        [23.7739, 61.4964],  # Western start (connects to Hämeenkatu)
                        [23.7780, 61.4961],  # Middle section
                        [23.7830, 61.4957],  # Near Tampere University
                        [23.7880, 61.4953],  # Eastern part
                    ],
                ),
            ),
            # Hämeenpuisto - main north-south boulevard (Medium traffic)
            TrafficFeature(
                type="Feature",
                properties=TrafficFeatureProperties(status=TrafficStatus.MODERATE),
                geometry=TrafficLineCoordinates(
                    type="LineString",
                    coordinates=[
                        [23.7530, 61.5020],  # Northern start
                        [23.7530, 61.5005],  # Intersection with Satakunnankatu
                        [23.7530, 61.4990],  # North of center
                        [23.7530, 61.4975],  # Intersection with Hämeenkatu
                        [23.7530, 61.4960],  # South of center
                        [23.7530, 61.4945],  # Continuing south
                        [23.7530, 61.4930],  # Southern part
                    ],
                ),
            ),
            # Tammelan puistokatu (Low traffic)
            TrafficFeature(
                type="Feature",
                properties=TrafficFeatureProperties(status=TrafficStatus.AVAILABLE),
                geometry=TrafficLineCoordinates(
                    type="LineString",
                    coordinates=[
                        [23.7688, 61.4967],  # Western start
                        [23.7705, 61.4985],  # Middle
                        [23.7720, 61.5000],  # Northern part
                    ],
                ),
            ),
        ],
    )


# Database access functions
def get_all_hotspots() -> List[Hotspot]:
    return hotspots


def get_hotspot_by_id(hotspot_id: str) -> Hotspot:
    for hotspot in hotspots:
        if hotspot.id == hotspot_id:
            return hotspot
    return None


def get_all_events() -> List[Event]:
    return events


def get_events_by_date(date_str: str) -> List[Event]:
    return [event for event in events if event.date == date_str]


def get_event_by_id(event_id: str) -> Event:
    for event in events:
        if event.id == event_id:
            return event
    return None


def get_similar_events(event_id: str) -> List[Event]:
    event = get_event_by_id(event_id)
    if not event:
        return []

    # Return events that are not the same as the selected one
    # First find events on the same date
    same_date_events = [e for e in events if e.date == event.date and e.id != event_id]

    # If we don't have enough same-date events, add events from other dates
    if len(same_date_events) < 3:
        other_date_events = [e for e in events if e.date != event.date]
        # Sort them chronologically
        other_date_events.sort(key=lambda x: x.date)
        # Combine the lists
        return (same_date_events + other_date_events)[:4]

    return same_date_events[:4]


def get_similar_hotspots(hotspot_id: str) -> List[Hotspot]:
    """Get similar hotspots to a specific hotspot."""
    hotspot = get_hotspot_by_id(hotspot_id)
    if not hotspot:
        return []

    # First get hotspots with similar traffic level
    similar_traffic = [
        h
        for h in hotspots
        if h.trafficLevel == hotspot.trafficLevel and h.id != hotspot_id
    ]

    # Then get hotspots with similar weather
    similar_weather = [
        h
        for h in hotspots
        if h.weather == hotspot.weather
        and h.id != hotspot_id
        and h not in similar_traffic
    ]

    # Combine them, prioritizing similar traffic level
    result = similar_traffic + similar_weather
    return result[:3]  # Return at most 3 similar hotspots


def get_map_items(
    lat: float, lng: float, radius: float, types: Optional[List[str]] = None
) -> List[MapItem]:
    """Get map items within a specific area - generates exactly two of each type."""
    # Convert radius from meters to degrees
    # At Tampere's latitude (~61.5°N), longitude degrees are shorter
    radius_deg_lat = radius / 111000  # 1 degree latitude is ~111km
    radius_deg_lng = radius / (
        111000 * math.cos(math.radians(lat))
    )  # Adjust for longitude at this latitude

    # Define the item types we want to generate
    required_types = [
        MapItemType.BUS,
        MapItemType.TRAM,
        MapItemType.BUSINESS,
        MapItemType.PARKING,
        MapItemType.AVAILABLE,
    ]

    # Filter types if specified
    if types:
        required_types = [t for t in required_types if t.value in types]

    # Prepare result list
    items: List[MapItem] = []

    # Type-specific labels
    type_labels = {
        MapItemType.BUS: "Bus Stop",
        MapItemType.TRAM: "Tram Station",
        MapItemType.BUSINESS: "Local Business",
        MapItemType.PARKING: "Parking Area",
        MapItemType.AVAILABLE: "Available Location",
    }

    # Generate two items for each type
    for item_type in required_types:
        for i in range(2):  # Generate exactly 2 of each type
            # Generate a random angle and distance within the radius
            angle = random.uniform(0, 2 * math.pi)  # Random angle in radians

            # First item closer (20-35% of radius), second further away (35-45%)
            if i == 0:
                distance_factor = random.uniform(0.20, 0.35)
            else:
                distance_factor = random.uniform(0.35, 0.45)

            # Calculate coordinates with proper scaling
            # Use different scales for latitude and longitude to maintain circular distribution
            delta_lng = distance_factor * radius_deg_lng * math.cos(angle)
            delta_lat = distance_factor * radius_deg_lat * math.sin(angle)

            new_lng = lng + delta_lng
            new_lat = lat + delta_lat

            # Create label
            label = f"{type_labels.get(item_type, 'Place')} {i + 1}"

            # Add some variety to business names
            if item_type == MapItemType.BUSINESS:
                business_names = [
                    "Cafe",
                    "Restaurant",
                    "Shop",
                    "Store",
                    "Market",
                    "Bookstore",
                ]
                label = f"{random.choice(business_names)} {i + 1}"

            # Create the item
            mock_item = MapItem(
                type=item_type,
                id=f"mock-{item_type}-{i}",
                coordinates=(new_lng, new_lat),
                label=label,
            )

            items.append(mock_item)
            print(f"Added mock item: {mock_item}")

    return items


# Helper function to calculate distance between two points
def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the distance between two points on Earth using the Haversine formula."""
    R = 6371000  # Earth's radius in meters

    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


def get_hotspot_foot_traffic(hotspot_id: str) -> List[FootTrafficData]:
    """Generate foot traffic data for a specific hotspot.

    Creates a dataset with past data (hours 0 to current) and predicted data (hours current to 23),
    ensuring a seamless transition at the current hour by including the current hour in both datasets.
    """
    current_hour = datetime.now().hour
    data = []

    # Generate a seed based on the hotspot ID to ensure consistent data for the same hotspot
    seed = sum(ord(c) for c in hotspot_id)
    random.seed(seed)

    # Find the hotspot to adjust traffic based on traffic level
    hotspot = get_hotspot_by_id(hotspot_id)
    traffic_multiplier = 1.0
    if hotspot:
        if hotspot.trafficLevel == TrafficLevel.HIGH:
            traffic_multiplier = 2.0
        elif hotspot.trafficLevel == TrafficLevel.MEDIUM:
            traffic_multiplier = 1.5

    # Generate values for all hours
    hour_values = {}
    for hour in range(0, 24):
        base_value = random.randint(10, 60)
        time_multiplier = 2 if (hour >= 8 and hour <= 18) else 1
        hour_values[hour] = int(base_value * time_multiplier * traffic_multiplier)

    print(f"🔍 DEBUG: Current hour is {current_hour}")

    # Generate past data (0 to current hour)
    for hour in range(0, current_hour + 1):
        data.append(
            FootTrafficData(
                hour=hour,
                value=hour_values[hour],
                type=FootTrafficType.PAST,
            )
        )

    print(
        f"🔍 DEBUG: Last past data point - hour: {current_hour}, value: {hour_values[current_hour]}"
    )

    # Generate predicted data (current hour to 23)
    # Note: current hour is included in both past and predicted
    for hour in range(current_hour, 24):
        data.append(
            FootTrafficData(
                hour=hour,
                value=hour_values[hour],
                type=FootTrafficType.PREDICTED,
            )
        )

    return data


def get_event_foot_traffic(event_id: str) -> List[FootTrafficData]:
    """Generate foot traffic data for a specific event.

    Similar to hotspot foot traffic, but with a different pattern that peaks around event time.
    """
    current_hour = datetime.now().hour
    data = []

    # Generate a seed based on the event ID to ensure consistent data for the same event
    seed = sum(ord(c) for c in event_id)
    random.seed(seed)

    # Find the event to adjust traffic based on event details
    event = get_event_by_id(event_id)
    if not event:
        return []

    # Parse event time to get hour
    event_hour = 12  # Default to noon if we can't parse
    try:
        if event.time and ":" in event.time:
            event_hour = int(event.time.split(":")[0])
    except Exception:
        pass

    # Generate values for all hours with peak around event time
    hour_values = {}
    for hour in range(0, 24):
        # Base traffic is low
        base_value = random.randint(5, 20)

        # Traffic ramps up before event, peaks during, and decreases after
        time_factor = 1.0
        hours_to_event = abs(hour - event_hour)

        if hours_to_event == 0:  # During event
            time_factor = 5.0
        elif hours_to_event == 1:  # 1 hour before/after
            time_factor = 3.0
        elif hours_to_event == 2:  # 2 hours before/after
            time_factor = 2.0
        elif hours_to_event <= 4:  # Up to 4 hours before/after
            time_factor = 1.5

        hour_values[hour] = int(base_value * time_factor)

    # Generate past data (0 to current hour)
    for hour in range(0, current_hour + 1):
        data.append(
            FootTrafficData(
                hour=hour,
                value=hour_values[hour],
                type=FootTrafficType.PAST,
            )
        )

    # Generate predicted data (current hour to 23)
    # Note: current hour is included in both past and predicted
    for hour in range(current_hour, 24):
        data.append(
            FootTrafficData(
                hour=hour,
                value=hour_values[hour],
                type=FootTrafficType.PREDICTED,
            )
        )

    return data
