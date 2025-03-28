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


# Traffic data
def get_traffic_data() -> TrafficData:
    return TrafficData(
        type="FeatureCollection",
        features=[
            TrafficFeature(
                type="Feature",
                properties=TrafficFeatureProperties(status=TrafficStatus.AVAILABLE),
                geometry=TrafficLineCoordinates(
                    type="LineString",
                    coordinates=[
                        [23.748, 61.4988],
                        [23.760, 61.4988],
                        [23.772, 61.4988],
                    ],
                ),
            ),
            TrafficFeature(
                type="Feature",
                properties=TrafficFeatureProperties(status=TrafficStatus.MODERATE),
                geometry=TrafficLineCoordinates(
                    type="LineString",
                    coordinates=[
                        [23.748, 61.4970],
                        [23.760, 61.4970],
                        [23.772, 61.4970],
                    ],
                ),
            ),
            TrafficFeature(
                type="Feature",
                properties=TrafficFeatureProperties(status=TrafficStatus.CONGESTED),
                geometry=TrafficLineCoordinates(
                    type="LineString",
                    coordinates=[
                        [23.748, 61.4950],
                        [23.760, 61.4950],
                        [23.772, 61.4950],
                    ],
                ),
            ),
            TrafficFeature(
                type="Feature",
                properties=TrafficFeatureProperties(status=TrafficStatus.CONGESTED),
                geometry=TrafficLineCoordinates(
                    type="LineString",
                    coordinates=[
                        [23.760, 61.4930],
                        [23.760, 61.4950],
                        [23.760, 61.4970],
                        [23.760, 61.4990],
                    ],
                ),
            ),
            TrafficFeature(
                type="Feature",
                properties=TrafficFeatureProperties(status=TrafficStatus.AVAILABLE),
                geometry=TrafficLineCoordinates(
                    type="LineString",
                    coordinates=[
                        [23.748, 61.4930],
                        [23.748, 61.4950],
                        [23.748, 61.4970],
                        [23.748, 61.4990],
                    ],
                ),
            ),
            TrafficFeature(
                type="Feature",
                properties=TrafficFeatureProperties(status=TrafficStatus.MODERATE),
                geometry=TrafficLineCoordinates(
                    type="LineString",
                    coordinates=[
                        [23.772, 61.4930],
                        [23.772, 61.4950],
                        [23.772, 61.4970],
                        [23.772, 61.4990],
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
    # For simplicity, just use a few specific events as "similar"
    similar_ids = ["5", "6", "7", "8"]
    return [e for e in events if e.id in similar_ids and e.id != event_id][:4]


def get_map_items() -> List[MapItem]:
    return map_items
