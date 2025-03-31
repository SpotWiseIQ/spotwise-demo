import os
import json
from app.models import (
    DangerLevel,
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
)
from typing import List, Dict, Callable
from datetime import datetime
from app.fetch_tampere_roads import fetch_tampere_roads, process_road_data

# Tampere center coordinates
TAMPERE_CENTER = (23.7610, 61.4978)

# Mock hotspots data
hotspots: List[Hotspot] = [
    Hotspot(
        id="1",
        label="A",
        address="Address 1",
        dangerLevel=DangerLevel.HIGH,
        weather=WeatherType.SUNNY,
        coordinates=(23.775, 61.4998),
    ),
    Hotspot(
        id="2",
        label="B",
        address="Address 2",
        dangerLevel=DangerLevel.HIGH,
        weather=WeatherType.CLOUDED,
        coordinates=(23.745, 61.4990),
    ),
    Hotspot(
        id="3",
        label="C",
        address="Address 3",
        dangerLevel=DangerLevel.MEDIUM,
        weather=WeatherType.CLOUDED,
        coordinates=(23.755, 61.4960),
    ),
    Hotspot(
        id="4",
        label="D",
        address="Address 4",
        dangerLevel=DangerLevel.MEDIUM,
        weather=WeatherType.SUNNY,
        coordinates=(23.765, 61.4940),
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
    ),
    Event(
        id="2",
        name="Event 2",
        time="15:00",
        place="Place",
        coordinates=(23.772, 61.4975),
        date="2025-03-26",
    ),
    Event(
        id="3",
        name="Event 3",
        time="15:00",
        place="Place",
        coordinates=(23.750, 61.4965),
        date="2025-03-26",
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
    hotspot = get_hotspot_by_id(hotspot_id)
    if not hotspot:
        return []

    # First get hotspots with similar danger level
    similar_danger = [
        h
        for h in hotspots
        if h.dangerLevel == hotspot.dangerLevel and h.id != hotspot_id
    ]

    # Then get hotspots with similar weather
    similar_weather = [
        h
        for h in hotspots
        if h.weather == hotspot.weather
        and h.id != hotspot_id
        and h not in similar_danger
    ]

    # Combine them, prioritizing similar danger level
    result = similar_danger + similar_weather

    # If we still don't have enough, add other hotspots
    if len(result) < 3:
        other_hotspots = [h for h in hotspots if h.id != hotspot_id and h not in result]
        result.extend(other_hotspots)

    return result[:4]  # Return up to 4 similar hotspots


def get_map_items() -> List[MapItem]:
    return map_items
