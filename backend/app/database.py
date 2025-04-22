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
    HotspotType,
    Location,
)
from typing import List, Dict, Callable, Optional
from datetime import datetime, timedelta
from app.fetch_tampere_roads import fetch_tampere_roads, process_road_data
import requests
from math import sin, cos, sqrt, atan2, radians
import math

# Tampere center coordinates
TAMPERE_CENTER = (23.7610, 61.4978)

# Global cache for foot traffic distributions by date/location
foot_traffic_cache = {}
# Caches for API responses
events_cache = {}
date_events_cache = {}
location_cache = {}

# Fixed hotspot locations and characteristics
HOTSPOT_TEMPLATES = [
    {
        "id": "1",
        "name": "Keskustori Zone",  # Central Square Zone
        "address": "Hämeenkatu 10",
        "coordinates": (23.760831, 61.498164),  # Updated coordinates
        "population": "~10k",
        "areaType": "Commercial",
        "avgDailyTraffic": "~8k",
        "dominantDemographics": "25-45",
        "nearbyBusinesses": "50+",
        "peak_hour": 17,  # Peak at 17:00
        "traffic_pattern": "commercial",  # High during day, peak after work
    },
    {
        "id": "2",
        "name": "Rautatieasema Zone",  # Railway Station Zone
        "address": "Rautatienkatu 25",
        "coordinates": (23.773060, 61.498472),  # Updated coordinates
        "population": "~5k",
        "areaType": "Residential/Office",
        "avgDailyTraffic": "~4k",
        "dominantDemographics": "30-55",
        "nearbyBusinesses": "20+",
        "peak_hour": 8,  # Peak at 8:00
        "traffic_pattern": "office",  # High during work hours
    },
    {
        "id": "3",
        "name": "Tampere-talo Zone",  # Tampere Hall Zone
        "address": "Yliopistonkatu 55",
        "coordinates": (23.781940, 61.495830),  # Updated coordinates
        "population": "~8k",
        "areaType": "Mixed Use",
        "avgDailyTraffic": "~6k",
        "dominantDemographics": "Students, Young Adults",
        "nearbyBusinesses": "35+",
        "peak_hour": 16,  # Peak at 16:00
        "traffic_pattern": "student",  # High during class hours, evening activities
    },
    {
        "id": "4",
        "name": "Koskikeskus Zone",  # Shopping Center Zone
        "address": "Hatanpään valtatie 1",
        "coordinates": (23.767500, 61.495833),  # Updated coordinates
        "population": "~12k",
        "areaType": "Entertainment District",
        "avgDailyTraffic": "~10k",
        "dominantDemographics": "18-30",
        "nearbyBusinesses": "60+",
        "peak_hour": 20,  # Peak at 20:00
        "traffic_pattern": "entertainment",  # High in evenings and weekends
    },
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
def get_traffic_data(hotspots: Optional[List[Hotspot]] = None) -> TrafficData:
    """Get traffic data for Tampere streets."""
    try:
        # Always fetch road data (will use cache if available)
        osm_data = fetch_tampere_roads()

        # Process with current hotspots to get real-time traffic data
        traffic_data = process_road_data(osm_data, hotspots)
        return traffic_data

    except Exception as e:
        print(f"Error generating traffic data: {e}")
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
def get_all_hotspots(
    target_date: Optional[str] = None, target_hour: Optional[int] = None
) -> List[Hotspot]:
    """Get all hotspots with dynamic foot traffic data."""
    if target_date is None:
        target_date = datetime.now().strftime("%Y-%m-%d")
    if target_hour is None:
        target_hour = datetime.now().hour

    # Generate hotspots with foot traffic
    hotspots_with_traffic = []
    for template in HOTSPOT_TEMPLATES:
        # Generate foot traffic data
        foot_traffic = generate_foot_traffic(template, target_date, target_hour)

        # Get the current hour's traffic value for sorting
        current_traffic = next(
            (ft.value for ft in foot_traffic if ft.type == FootTrafficType.CURRENT), 0
        )

        # Create hotspot with traffic level based on current value
        traffic_level = (
            TrafficLevel.HIGH
            if current_traffic > 150
            else TrafficLevel.MEDIUM
            if current_traffic > 80
            else TrafficLevel.LOW
        )

        # Create hotspot with dynamic data
        hotspot = Hotspot(
            id=template["id"],
            name=template["name"],
            label="",  # Will be assigned after sorting
            address=template["address"],
            trafficLevel=traffic_level,
            weather=random.choice(list(WeatherType)),  # Random weather for now
            coordinates=template["coordinates"],
            population=template["population"],
            areaType=template["areaType"],
            peakHour=f"{template['peak_hour']:02d}:00",
            avgDailyTraffic=template["avgDailyTraffic"],
            dominantDemographics=template["dominantDemographics"],
            nearbyBusinesses=template["nearbyBusinesses"],
            footTraffic=foot_traffic,
        )
        hotspots_with_traffic.append((hotspot, current_traffic))

    # Sort hotspots by current traffic value in descending order
    hotspots_with_traffic.sort(key=lambda x: x[1], reverse=True)

    # Assign labels A through D based on traffic order
    labels = ["A", "B", "C", "D"]
    hotspots = []
    for (hotspot, _), label in zip(hotspots_with_traffic, labels):
        hotspot.label = label
        hotspots.append(hotspot)

    return hotspots


def get_hotspot_by_id(
    hotspot_id: str,
    target_date: Optional[str] = None,
    target_hour: Optional[int] = None,
) -> Optional[Hotspot]:
    """Get a specific hotspot by ID with dynamic foot traffic data."""
    # Get all hotspots to determine the correct label based on traffic order
    all_hotspots = get_all_hotspots(target_date, target_hour)

    # Find the hotspot with the matching ID
    for hotspot in all_hotspots:
        if hotspot.id == hotspot_id:
            return hotspot

    return None


def get_all_events() -> List[Event]:
    """Get all events with their foot traffic data included."""
    # Check if we have a cached result for all events
    if "all_events" in events_cache:
        return events_cache["all_events"]

    # Generate events for multiple dates
    all_events = []

    # Current date + next 3 months worth of random events
    current_date = datetime.now().date()

    # Add some past dates (for demo and testing purposes)
    past_dates = [
        current_date.replace(month=current_date.month - 1)
        if current_date.month > 1
        else current_date.replace(year=current_date.year - 1, month=12),
        current_date.replace(month=current_date.month - 2)
        if current_date.month > 2
        else current_date.replace(
            year=current_date.year - 1, month=12 - (2 - current_date.month)
        ),
    ]

    # Add some future dates
    future_dates = []
    for i in range(90):  # next 90 days
        future_date = current_date + timedelta(days=i)
        # Only include about 1/3 of all possible dates (to make it more realistic)
        if random.random() < 0.33:
            future_dates.append(future_date)

    # Generate events for past dates
    for date in past_dates:
        date_str = date.strftime("%Y-%m-%d")
        all_events.extend(generate_mock_events_for_date(date_str))

    # Generate events for future dates
    for date in future_dates:
        date_str = date.strftime("%Y-%m-%d")
        all_events.extend(generate_mock_events_for_date(date_str))

    # Add foot traffic data to each event
    for event in all_events:
        event.footTraffic = get_event_foot_traffic(event.id)

    # Cache the results
    events_cache["all_events"] = all_events

    return all_events


def generate_mock_events_for_date(date_str: str) -> List[Event]:
    """Generate mock events for a specific date with times distributed throughout the day."""
    # Check cache first
    if date_str in date_events_cache:
        return date_events_cache[date_str]

    # Generate a seed based on the date to ensure consistent events for the same date
    seed = sum(ord(c) for c in date_str)
    random.seed(seed)

    # These are our fixed events
    fixed_events = [
        {
            "id": f"{date_str}-1",
            "name": "Tampere Film Festival Opening Screening",
            "time": "18:00",
            "place": "Finnkino Plevna",
            "coordinates": (23.7586, 61.5008),  # Corrected coordinates
            "date": date_str,
            "address": "Itäinenkatu 4, 33210 Tampere",
            "type": "festival",
            "duration": "2.5 h",
            "capacity": 500,
            "demographics": "All ages",
            "peakTrafficImpact": "+30%",
            "ticketStatus": "Available",
        },
        {
            "id": f"{date_str}-2",
            "name": "Irish Festival Tampere: Lamb, Galway, Rainey Trio Concert",
            "time": "18:00",
            "place": "Höllä-näyttämö",
            "coordinates": (23.7600, 61.4980),  # Corrected coordinates
            "date": date_str,
            "address": "Hämeenkatu 25, 33200 Tampere",
            "type": "concert",
            "duration": "3 h",
            "capacity": 300,
            "demographics": "All ages",
            "peakTrafficImpact": "+20%",
            "ticketStatus": "Limited",
        },
        {
            "id": f"{date_str}-3",
            "name": "Manse Pride Main Celebration",
            "time": "15:00",
            "place": "Sorsapuisto Park",
            "coordinates": (23.7813, 61.4973),  # Corrected coordinates
            "date": date_str,
            "address": "Sorsapuisto Park, 33500 Tampere",
            "type": "festival",
            "duration": "3 h",
            "capacity": 2000,
            "demographics": "All ages",
            "peakTrafficImpact": "+40%",
            "ticketStatus": "Available",
        },
        {
            "id": f"{date_str}-4",
            "name": "FIBA EuroBasket Group Stage Match",
            "time": "15:00",
            "place": "Nokia Arena",
            "coordinates": (23.772955, 61.493952),  # Corrected coordinates
            "date": date_str,
            "address": "Kansikatu 3, 33100 Tampere",
            "type": "sports",
            "duration": "2 h",
            "capacity": 15000,
            "demographics": "All ages",
            "peakTrafficImpact": "+50%",
            "ticketStatus": "Selling Fast",
        },
    ]

    # Create Event objects from the fixed events
    generated_events = []
    for event_data in fixed_events:
        event = Event(**event_data)
        generated_events.append(event)
        # Also cache by event ID
        events_cache[event.id] = event

    # Cache the results for this date
    date_events_cache[date_str] = generated_events
    return generated_events


def get_events_by_date(date_str: str, current_hour: int = None) -> List[Event]:
    """
    Get events by date with foot traffic data included.

    If current_hour is provided, only return events with start time after that hour.
    """
    # Generate mock events for the specified date
    daily_events = generate_mock_events_for_date(date_str)

    # Filter events based on date and current hour
    if current_hour is not None:
        filtered_events = []
        for event in daily_events:
            # Check if the event starts in the future on the same date
            event_hour = None

            # Try to get hour from start_time field first
            if event.start_time:
                try:
                    if "T" in event.start_time:
                        # ISO format
                        dt = datetime.fromisoformat(
                            event.start_time.replace("Z", "+00:00")
                        )
                        event_hour = dt.hour
                    else:
                        # Simple time format
                        event_hour = int(event.start_time.split(":")[0])
                except (ValueError, IndexError):
                    pass

            # Fall back to legacy time field
            if event_hour is None and event.time:
                try:
                    event_hour = int(event.time.split(":")[0])
                except (ValueError, IndexError):
                    continue

            # Skip if we couldn't parse time
            if event_hour is None:
                continue

            # Add event if it starts after the current hour
            if event_hour >= current_hour:
                filtered_events.append(event)
        daily_events = filtered_events

    # Add foot traffic data to each filtered event
    for event in daily_events:
        event.footTraffic = get_event_foot_traffic(event.id)

    return daily_events


def get_event_by_id(event_id: str) -> Event:
    """Get a specific event by ID."""
    # Check the cache first
    if event_id in events_cache:
        return events_cache[event_id]

    # If the ID follows our format (date-number), we can extract the date
    # and generate just the events for that date
    if "-" in event_id and len(event_id.split("-")) >= 2:
        try:
            parts = event_id.split("-")
            # Check if we have a date format (YYYY-MM-DD-number)
            if len(parts) >= 4 and len(parts[0]) == 4:  # Year should be 4 digits
                date_str = f"{parts[0]}-{parts[1]}-{parts[2]}"
                # Generate events for that specific date
                date_events = generate_mock_events_for_date(date_str)
                # Find the specific event
                for event in date_events:
                    if event.id == event_id:
                        # Cache it
                        events_cache[event_id] = event
                        return event
        except Exception as e:
            print(f"Error parsing event ID: {e}")

    # If parsing the date failed or the event wasn't found,
    # get all events and search through them
    all_events = get_all_events()
    for event in all_events:
        if event.id == event_id:
            # Cache it
            events_cache[event_id] = event
            return event

    return None


def get_map_items(
    lat: float, lng: float, radius: float, types: Optional[List[str]] = None
) -> List[MapItem]:
    """Get map items within a specific area - places them near actual streets."""
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

    # Get road data
    traffic_data = get_traffic_data()

    # Extract road segments
    road_segments = []
    for feature in traffic_data.features:
        if feature.geometry and feature.geometry.coordinates:
            road_segments.append(feature.geometry.coordinates)

    # If no road data is available, fall back to the original random method
    if not road_segments:
        print("No road data available, falling back to random placement")
        return _get_random_map_items(lat, lng, radius, required_types, type_labels)

    # Find road segments within radius
    # Use a smaller search radius to ensure icons are closer to hotspot/center
    search_radius = min(radius * 0.6, 300)  # Max 300m or 60% of original radius
    nearby_segments = []

    for segment in road_segments:
        for point in segment:
            point_lng, point_lat = point
            distance = haversine_distance(lat, lng, point_lat, point_lng)
            if distance <= search_radius:
                nearby_segments.append(segment)
                break

    # If no nearby segments, gradually expand search until we find at least one
    if not nearby_segments:
        # Try with larger radius up to original
        expanded_radius = search_radius
        while expanded_radius < radius and not nearby_segments:
            expanded_radius = min(expanded_radius * 1.5, radius)
            print(f"Expanding search to {expanded_radius}m")

            for segment in road_segments:
                for point in segment:
                    point_lng, point_lat = point
                    distance = haversine_distance(lat, lng, point_lat, point_lng)
                    if distance <= expanded_radius:
                        nearby_segments.append(segment)
                        break
                if nearby_segments:
                    break

        # If still no segments, use closest one(s)
        if not nearby_segments:
            # Find the closest segments
            segments_with_distances = []

            for segment in road_segments:
                # Find minimum distance from any point in segment to center
                min_segment_distance = float("inf")
                for point in segment:
                    point_lng, point_lat = point
                    distance = haversine_distance(lat, lng, point_lat, point_lng)
                    min_segment_distance = min(min_segment_distance, distance)

                segments_with_distances.append((segment, min_segment_distance))

            # Sort segments by distance
            segments_with_distances.sort(key=lambda x: x[1])

            # Take 2-3 closest segments
            nearby_segments = [s[0] for s in segments_with_distances[:3]]

    # Generate items for each type
    for item_type in required_types:
        for i in range(2):  # Generate exactly 2 of each type
            # Choose a segment prioritizing closer ones
            if i == 0 and len(nearby_segments) > 1:
                # For first item, use segments very close to center
                segment_idx = random.randint(0, min(1, len(nearby_segments) - 1))
                segment = nearby_segments[segment_idx]
            else:
                segment = random.choice(nearby_segments)

            # Choose a point along the segment
            if len(segment) < 2:
                # If segment has only one point, add small variation
                base_point = segment[0]
                # Very small random offset (closer to the point)
                offset_factor = (
                    0.00005 * random.random()
                )  # About 5m at Tampere's latitude
                point_lng = base_point[0] + random.uniform(
                    -offset_factor, offset_factor
                )
                point_lat = base_point[1] + random.uniform(
                    -offset_factor, offset_factor
                )
            else:
                # Choose point in segment closest to center
                closest_idx = 0
                closest_distance = float("inf")

                for idx, point in enumerate(segment):
                    point_lng, point_lat = point
                    distance = haversine_distance(lat, lng, point_lat, point_lng)
                    if distance < closest_distance:
                        closest_distance = distance
                        closest_idx = idx

                # Use adjacent points to closest point
                idx = max(0, min(closest_idx, len(segment) - 2))
                p1 = segment[idx]
                p2 = segment[idx + 1]

                # Interpolate with bias towards closest side
                # This ensures we're picking a point along the segment that is
                # relatively close to the center coordinates
                t = random.random() * 0.6 + 0.2  # Random value between 0.2-0.8
                point_lng = p1[0] + t * (p2[0] - p1[0])
                point_lat = p1[1] + t * (p2[1] - p1[1])

                # Add a small perpendicular offset to place slightly off the street
                # Calculate perpendicular vector
                dx = p2[0] - p1[0]
                dy = p2[1] - p1[1]
                length = math.sqrt(dx * dx + dy * dy)

                if length > 0:
                    # Normalize and create perpendicular vector
                    dx, dy = dx / length, dy / length
                    perp_dx, perp_dy = -dy, dx

                    # Smaller offset (0.5-2 meters) to keep closer to the road
                    offset_meters = random.uniform(0.5, 2)
                    offset_deg_lat = offset_meters / 111000
                    offset_deg_lng = offset_meters / (
                        111000 * math.cos(math.radians(point_lat))
                    )

                    # Apply offset in the perpendicular direction
                    side = 1 if random.random() > 0.5 else -1
                    point_lng += side * perp_dx * offset_deg_lng
                    point_lat += side * perp_dy * offset_deg_lat

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
                coordinates=(point_lng, point_lat),
                label=label,
            )

            items.append(mock_item)
            print(f"Added street-based mock item: {mock_item}")

    return items


def _get_random_map_items(
    lat: float,
    lng: float,
    radius: float,
    required_types: List[MapItemType],
    type_labels: Dict,
) -> List[MapItem]:
    """Original implementation of get_map_items that uses random placement."""
    # Convert radius from meters to degrees
    radius_deg_lat = radius / 111000  # 1 degree latitude is ~111km
    radius_deg_lng = radius / (
        111000 * math.cos(math.radians(lat))
    )  # Adjust for longitude at this latitude

    # Prepare result list
    items: List[MapItem] = []

    # Generate two items for each type
    for item_type in required_types:
        for i in range(2):  # Generate exactly 2 of each type
            # Generate a random angle and distance within the radius
            angle = random.uniform(0, 2 * math.pi)  # Random angle in radians

            # Reduced distance factors to keep items closer to center
            # First item much closer (10-20% of radius), second still fairly close (20-30%)
            if i == 0:
                distance_factor = random.uniform(0.10, 0.20)
            else:
                distance_factor = random.uniform(0.20, 0.30)

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
            print(f"Added random mock item: {mock_item}")

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


def get_traffic_pattern_values(pattern: str, hour: int, date_seed: int) -> int:
    """Generate foot traffic values based on pattern and hour."""
    random.seed(date_seed + hash(pattern))  # Use date seed for consistent randomness
    base = random.randint(20, 40)  # Base traffic level

    if pattern == "commercial":
        if 9 <= hour <= 20:  # Shopping hours
            base *= 3
            if 16 <= hour <= 18:  # After work peak
                base *= 1.5
    elif pattern == "office":
        if 8 <= hour <= 17:  # Work hours
            base *= 4
            if hour in [8, 12, 17]:  # Commute and lunch peaks
                base *= 1.3
    elif pattern == "student":
        if 8 <= hour <= 16:  # Class hours
            base *= 3
            if hour in [8, 12, 16]:  # Class change and lunch peaks
                base *= 1.4
        elif 17 <= hour <= 22:  # Evening activities
            base *= 2
    elif pattern == "entertainment":
        if 12 <= hour <= 23:  # Entertainment hours
            base *= 2
            if 18 <= hour <= 22:  # Evening peak
                base *= 3

    # Add some randomness
    variation = random.uniform(0.8, 1.2)
    return int(base * variation)


def generate_foot_traffic(
    hotspot_template: dict, target_date: str, target_hour: int
) -> List[FootTrafficData]:
    """Generate foot traffic data for a hotspot based on its pattern."""
    date_seed = sum(ord(c) for c in target_date)  # Create a seed from the date
    data = []

    # Generate values for all hours
    for hour in range(24):
        value = get_traffic_pattern_values(
            hotspot_template["traffic_pattern"], hour, date_seed
        )

        # Determine if this is past or predicted data
        data_type = (
            FootTrafficType.PAST if hour <= target_hour else FootTrafficType.PREDICTED
        )
        if hour == target_hour:
            # Current hour appears in both past and predicted
            data.append(
                FootTrafficData(hour=hour, value=value, type=FootTrafficType.CURRENT)
            )

        data.append(FootTrafficData(hour=hour, value=value, type=data_type))

    return data


def get_event_foot_traffic(
    event_id: str, target_hour: int = None
) -> List[FootTrafficData]:
    """Generate foot traffic data for a specific event.

    Similar to hotspot foot traffic, but with a different pattern that peaks around event time.
    """
    if target_hour is None:
        target_hour = datetime.now().hour

    # Create a cache key that includes the hour
    cache_key = f"event_{event_id}_{target_hour}"
    if cache_key in foot_traffic_cache:
        return foot_traffic_cache[cache_key]

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
        if event.start_time and ":" in event.start_time:
            # Try parsing from start_time first
            if "T" in event.start_time:
                # ISO format like "2024-01-01T14:00:00+02:00"
                dt = datetime.fromisoformat(event.start_time.replace("Z", "+00:00"))
                event_hour = dt.hour
            else:
                # Simple time format like "14:00"
                event_hour = int(event.start_time.split(":")[0])
        elif event.time and ":" in event.time:
            # Fall back to legacy time field
            event_hour = int(event.time.split(":")[0])
    except Exception:
        pass

    # Generate values for all hours with peak around event time
    data = []
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

        value = int(base_value * time_factor)

        # Set data type based on current hour
        if hour < target_hour:
            data_type = FootTrafficType.PAST
        elif hour > target_hour:
            data_type = FootTrafficType.PREDICTED
        else:
            data_type = FootTrafficType.CURRENT

        data.append(FootTrafficData(hour=hour, value=value, type=data_type))

    # Cache the data with the hour-specific key
    foot_traffic_cache[cache_key] = data
    return data


def get_hotspot_detailed_metrics(hotspot_id: str) -> dict:
    """Get detailed metrics for a specific hotspot.

    This data is used for more in-depth analysis in the LocationMetrics component.
    """
    # Find the hotspot
    hotspot = get_hotspot_by_id(hotspot_id)
    if not hotspot:
        return {}

    # Generate a seed based on the hotspot ID for consistent random data
    seed = sum(ord(c) for c in hotspot_id)
    random.seed(seed)

    # Generate additional detailed metrics that weren't in the original hotspot data
    location_data = {
        "nearbyBusinessTypesBreakdown": {
            "retail": random.randint(3, 15),
            "food": random.randint(2, 10),
            "services": random.randint(4, 12),
            "entertainment": random.randint(1, 8),
            "other": random.randint(2, 6),
        },
        "demographicsBreakdown": {
            "18-24": random.randint(10, 30),
            "25-34": random.randint(20, 40),
            "35-44": random.randint(15, 35),
            "45+": random.randint(10, 25),
        },
        "footTrafficByTimeOfDay": {
            "morning": random.randint(30, 70),
            "afternoon": random.randint(50, 100),
            "evening": random.randint(40, 90),
            "night": random.randint(10, 50),
        },
        "businessOpportunityScore": random.randint(60, 95),
        "weekdayVsWeekend": {
            "weekday": random.randint(70, 100),
            "weekend": random.randint(80, 120),
        },
        "growthTrend": random.choice(["increasing", "stable", "decreasing"]),
        "seasonalityImpact": random.choice(["high", "medium", "low"]),
        "competitionDensity": random.choice(["high", "medium", "low"]),
        "averageVisitDuration": f"{random.randint(30, 120)} min",
    }

    # Return combined data
    return {
        "basic": {
            "id": hotspot.id,
            "name": hotspot.name,
            "address": hotspot.address,
            "coordinates": hotspot.coordinates,
        },
        "metrics": {
            "population": hotspot.population,
            "areaType": hotspot.areaType,
            "peakHour": hotspot.peakHour,
            "avgDailyTraffic": hotspot.avgDailyTraffic,
            "dominantDemographics": hotspot.dominantDemographics,
            "nearbyBusinesses": hotspot.nearbyBusinesses,
        },
        "detailed": location_data,
    }


def get_event_detailed_metrics(event_id: str) -> dict:
    """Get detailed metrics for a specific event.

    This data is used for more in-depth analysis in the LocationMetrics component.
    """
    # Find the event
    event = get_event_by_id(event_id)
    if not event:
        return {}

    # Generate a seed based on the event ID for consistent random data
    seed = sum(ord(c) for c in event_id)
    random.seed(seed)

    # Generate additional detailed metrics that weren't in the original event data
    event_data = {
        "eventTypeBreakdown": {
            "music": random.randint(10, 80)
            if event.type == "Concert"
            else random.randint(0, 20),
            "sports": random.randint(10, 80)
            if event.type == "Sports"
            else random.randint(0, 20),
            "cultural": random.randint(10, 80)
            if event.type == "Cultural"
            else random.randint(0, 20),
            "food": random.randint(10, 80)
            if event.type == "Food Festival"
            else random.randint(0, 20),
            "other": random.randint(5, 20),
        },
        "demographicsBreakdown": {
            "18-24": random.randint(10, 30),
            "25-34": random.randint(20, 40),
            "35-44": random.randint(15, 35),
            "45+": random.randint(10, 25),
        },
        "timelineBreakdown": {
            "setup": {"start": 0, "duration": random.randint(1, 3)},
            "main": {"start": random.randint(1, 3), "duration": random.randint(2, 5)},
            "breakdown": {
                "start": random.randint(6, 8),
                "duration": random.randint(1, 2),
            },
        },
        "capacityBreakdown": {
            "total": (
                int(event.expected_attendance)
                if event.expected_attendance
                else int(event.capacity)
                if event.capacity
                and (
                    (isinstance(event.capacity, int))
                    or (isinstance(event.capacity, str) and event.capacity.isdigit())
                )
                else random.randint(200, 1000)
            ),
            "current": random.randint(50, 100),
        },
        "trafficImpact": {
            "before": random.randint(50, 70),
            "during": random.randint(80, 100),
            "after": random.randint(60, 80),
        },
        "ticketStatusBreakdown": {
            "sold": random.randint(50, 80),
            "reserved": random.randint(5, 20),
            "available": random.randint(5, 30),
        },
        "environmentalImpact": random.choice(["low", "medium", "high"]),
        "localBusinessBoost": f"+{random.randint(10, 50)}%",
        "parkingAvailability": random.choice(["limited", "adequate", "plenty"]),
        "publicTransportUsage": f"{random.randint(20, 60)}%",
    }

    # Return combined data
    return {
        "basic": {
            "id": event.id,
            "name": event.name,
            "coordinates": event.coordinates,
            "timeInfo": {
                "startTime": event.start_time or event.time or "N/A",
                "endTime": event.end_time or "N/A",
                "duration": event.duration or "N/A",
            },
            "place": event.place or "N/A",
            "type": event.event_type or event.type or "N/A",
            "capacity": event.expected_attendance or event.capacity or "N/A",
            "description": event.description or "N/A",
        },
        "metrics": {
            "type": event.event_type or event.type,
            "startTime": event.start_time or event.time,
            "endTime": event.end_time,
            "duration": event.duration,
            "capacity": event.expected_attendance or event.capacity,
            "demographics": event.demographics,
            "address": event.address,
        },
        "detailed": event_data,
    }


def load_locations_data():
    """Load location data from locations_data.json"""
    try:
        with open("mock_data/locations_data.json", "r") as f:
            locations = json.load(f)
        return locations
    except FileNotFoundError:
        print(f"Error: Could not find locations_data.json in mock_data directory")
        return []


def load_demographics_data():
    """Load demographics data from demographics-2.json"""
    try:
        with open("mock_data/demographics-2.json", "r") as f:
            demographics = json.load(f)
        return demographics
    except FileNotFoundError:
        print(f"Error: Could not find demographics-2.json in mock_data directory")
        return []


def get_location_poi(location_id):
    """Get POIs for a specific location"""
    try:
        with open(f"mock_data/{location_id}_poi.json", "r") as f:
            pois = json.load(f)
        return pois
    except FileNotFoundError:
        return []


def get_location_companies(location_id):
    """Get companies for a specific location"""
    try:
        with open(f"mock_data/{location_id}_company_finances.json", "r") as f:
            companies = json.load(f)
        return companies
    except FileNotFoundError:
        return []


def get_location_events(location_id):
    """Get events for a specific location"""
    try:
        with open(f"mock_data/{location_id}_events.json", "r") as f:
            events = json.load(f)
        return events
    except FileNotFoundError:
        return []


def load_all_events():
    """Load all events from consolidated_events.json"""
    try:
        with open("mock_data/consolidated_events.json", "r") as f:
            events = json.load(f)
        return events
    except FileNotFoundError:
        print(f"Error: Could not find consolidated_events.json in mock_data directory")
        return []


def generate_location_foot_traffic(location_id, target_date, target_hour):
    """Generate foot traffic data for a location based on the date."""
    # Create a cache key that includes the hour to ensure fresh data when hour changes
    cache_key = f"{location_id}_{target_date}_{target_hour}"

    # Check if we have a cached distribution
    if cache_key in foot_traffic_cache:
        return foot_traffic_cache[cache_key]

    # Create a seed from the date and location ID
    date_seed = sum(ord(c) for c in f"{target_date}_{location_id}")
    random.seed(date_seed)

    # Create a new distribution
    traffic_data = []
    for hour in range(24):
        # Base traffic value
        base_value = random.randint(30, 200)

        # Adjust for time of day - morning peak (8-9am), lunch (12-1pm), evening peak (5-6pm)
        time_factor = 1.0
        if 7 <= hour <= 9:
            time_factor = 1.5  # Morning peak
        elif 11 <= hour <= 13:
            time_factor = 1.3  # Lunch peak
        elif 16 <= hour <= 18:
            time_factor = 1.7  # Evening peak
        elif 22 <= hour <= 23 or 0 <= hour <= 5:
            time_factor = 0.4  # Night low

        # Generate value for this hour
        value = int(base_value * time_factor)

        # Randomize slightly
        value = max(10, int(value * random.uniform(0.8, 1.2)))

        # Set data type - ensure there's a clear distinction at the current hour
        if hour < target_hour:
            data_type = FootTrafficType.PAST
        elif hour > target_hour:
            data_type = FootTrafficType.PREDICTED
        else:
            data_type = FootTrafficType.CURRENT

        # Add the data point
        traffic_data.append(FootTrafficData(hour=hour, value=value, type=data_type))

    # Cache the distribution with the hour-specific key
    foot_traffic_cache[cache_key] = traffic_data
    return traffic_data


def get_all_locations(target_date=None, target_hour=None) -> List[Location]:
    """Get all locations as hotspots (natural or event), sorted by foot traffic."""
    # Set defaults for target_date and target_hour
    if target_date is None:
        target_date = datetime.now().strftime("%Y-%m-%d")
    if target_hour is None:
        target_hour = datetime.now().hour

    # Get current system time for cache invalidation
    current_date = datetime.now().strftime("%Y-%m-%d")
    current_hour = datetime.now().hour

    # Cache key includes current date and hour to ensure hourly regeneration
    cache_key = (
        f"locations_{target_date}_{target_hour}_sys_{current_date}_{current_hour}"
    )

    if cache_key in location_cache:
        return location_cache[cache_key]

    # Load all locations
    locations_data = load_locations_data()
    demographics_data = load_demographics_data()

    # Match demographics with locations
    location_demographics = {}
    for demo in demographics_data:
        location_id = demo["location_id"]
        if location_id not in location_demographics:
            location_demographics[location_id] = []
        location_demographics[location_id].append(demo)

    # Load all location events
    all_events = {}
    consolidated_events = load_all_events()
    for event in consolidated_events:
        location_id = event["location_id"]
        if location_id not in all_events:
            all_events[location_id] = []
        all_events[location_id].append(event)

    # Create locations list with traffic data
    locations_with_traffic = []

    for location in locations_data:
        location_id = location["location_id"]

        # Generate foot traffic for this location
        foot_traffic = generate_location_foot_traffic(
            location_id, target_date, target_hour
        )

        # Get the current hour's traffic
        current_traffic = next(
            (ft.value for ft in foot_traffic if ft.type == FootTrafficType.CURRENT), 0
        )

        # Traffic level based on current value
        traffic_level = (
            TrafficLevel.HIGH
            if current_traffic > 150
            else TrafficLevel.MEDIUM
            if current_traffic > 80
            else TrafficLevel.LOW
        )

        # Get demographics for this location, if available
        demo = None
        if location_id in location_demographics and location_demographics[location_id]:
            demo = location_demographics[location_id][
                0
            ]  # Take the first one for simplicity

        # Default to natural hotspot
        location_obj = Location(
            id=location_id,
            name=location["name"],
            type=HotspotType.NATURAL,
            label="",  # Will be assigned after sorting
            trafficLevel=traffic_level,
            weather=random.choice(list(WeatherType)),
            coordinates=(location["longitude"], location["latitude"]),
            footTraffic=foot_traffic,
            population=f"{demo['population'] if demo else random.randint(5000, 15000)}",
            areaType="Commercial" if random.random() < 0.5 else "Residential",
            peakHour=f"{8 + random.randint(0, 10):02d}:00",
            avgDailyTraffic=f"{random.randint(2000, 10000)}",
            dominantDemographics=f"{20 + random.randint(0, 30)}-{40 + random.randint(0, 30)}",
            nearbyBusinesses=f"{random.randint(10, 60)}+",
        )

        locations_with_traffic.append((location_obj, current_traffic))

    # Sort locations by current traffic in descending order
    locations_with_traffic.sort(key=lambda x: x[1], reverse=True)

    # Assign labels A, B, C, etc. based on traffic order
    import string

    labels = list(string.ascii_uppercase)  # A-Z
    locations = []

    # Save current random state
    random_state = random.getstate()

    # Generate a seed based on the date AND hour to ensure different event selection each hour
    hour_date_seed = sum(ord(c) for c in f"{target_date}_{target_hour}")
    random.seed(hour_date_seed)

    for i, (location, _) in enumerate(locations_with_traffic):
        if i < len(labels):
            location.label = labels[i]
        else:
            location.label = f"A{i - len(labels) + 1}"  # A1, A2, etc. after Z

        # Randomly upgrade some locations to event hotspots
        # This simulates events happening at some locations
        if (
            random.random() < 0.5
            and location.id in all_events
            and all_events[location.id]
        ):
            # Pick a random event for this location
            event = random.choice(all_events[location.id])

            # Format the event time (assuming ISO format)
            event_time = "N/A"
            if "start_time" in event:
                try:
                    if (
                        isinstance(event["start_time"], str)
                        and "T" in event["start_time"]
                    ):
                        # Parse ISO format
                        dt = datetime.fromisoformat(
                            event["start_time"].replace("Z", "+00:00")
                        )
                        event_time = dt.strftime("%H:%M")
                    elif (
                        isinstance(event["start_time"], str)
                        and len(event["start_time"]) > 10
                    ):
                        # Try to parse other common formats
                        parts = event["start_time"].split(" ")
                        if len(parts) > 1:
                            time_part = parts[1]
                            hours_mins = time_part.split(":")
                            if len(hours_mins) >= 2:
                                event_time = f"{hours_mins[0]}:{hours_mins[1]}"
                except Exception:
                    pass  # Keep default if parsing fails

            # Convert to event hotspot
            location.type = HotspotType.EVENT
            location.start_time = event.get("start_time", "")
            location.end_time = event.get("end_time", "")
            location.venue = event.get("venue", None)
            location.venue_address = event.get("venue_address", None)
            location.event_name = event.get("name", "Unknown Event")
            location.event_type = event.get("event_type", "Event")
            location.expected_attendance = event.get(
                "expected_attendance", random.randint(200, 2000)
            )
            location.description = event.get("description", "")
            location.location_id = event.get("location_id", "")
            location.event_id = event.get("event_id", "")

        locations.append(location)

    # Restore random state
    random.setstate(random_state)

    # Cache the results (top 6 locations)
    location_cache[cache_key] = locations[:6]

    # Return only the first 6 locations, regardless of type
    return locations[:6]


def get_location_by_id(
    location_id: str, target_date=None, target_hour=None
) -> Optional[Location]:
    """Get a specific location by ID"""
    # Set defaults
    if target_date is None:
        target_date = datetime.now().strftime("%Y-%m-%d")
    if target_hour is None:
        target_hour = datetime.now().hour

    # Get current system time for cache key
    current_date = datetime.now().strftime("%Y-%m-%d")
    current_hour = datetime.now().hour

    # Check if location is in the top locations cache
    cache_key = (
        f"locations_{target_date}_{target_hour}_sys_{current_date}_{current_hour}"
    )
    if cache_key in location_cache:
        # Check if the location is in the top 6
        for location in location_cache[cache_key]:
            if location.id == location_id:
                return location

    # If not found in top locations or cache doesn't exist, look it up from source data
    locations_data = load_locations_data()
    for location_data in locations_data:
        if location_data["location_id"] == location_id:
            # Found the location, now create a Location object with traffic data
            # Generate foot traffic for this location
            foot_traffic = generate_location_foot_traffic(
                location_id, target_date, target_hour
            )

            # Get the current hour's traffic
            current_traffic = next(
                (ft.value for ft in foot_traffic if ft.type == FootTrafficType.CURRENT),
                0,
            )

            # Traffic level based on current value
            traffic_level = (
                TrafficLevel.HIGH
                if current_traffic > 150
                else TrafficLevel.MEDIUM
                if current_traffic > 80
                else TrafficLevel.LOW
            )

            # Create a basic Location object
            return Location(
                id=location_id,
                name=location_data["name"],
                type=HotspotType.NATURAL,  # Default to natural type
                label="Z",  # Not in top locations, so give it a Z label
                trafficLevel=traffic_level,
                weather=random.choice(list(WeatherType)),
                coordinates=(location_data["longitude"], location_data["latitude"]),
                footTraffic=foot_traffic,
                population=f"{random.randint(5000, 15000)}",
                areaType="Commercial" if random.random() < 0.5 else "Residential",
                peakHour=f"{8 + random.randint(0, 10):02d}:00",
                avgDailyTraffic=f"{random.randint(2000, 10000)}",
                dominantDemographics=f"{20 + random.randint(0, 30)}-{40 + random.randint(0, 30)}",
                nearbyBusinesses=f"{random.randint(10, 60)}+",
            )

    return None


def get_location_detailed_metrics(location_id: str) -> dict:
    """Get detailed metrics for a specific location"""
    location = get_location_by_id(location_id)
    if not location:
        return {"error": "Location not found"}

    # Generate mock places available for rent (near a street)
    def generate_places_for_rent(base_coords, count=2):
        # Just create a couple of mock places with slightly offset coordinates
        lat, lng = base_coords if isinstance(base_coords, (list, tuple)) else (0, 0)
        return [
            {
                "name": f"Rental Spot {i + 1}",
                "address": f"{100 + i} Main St",
                "coordinates": [lat + 0.0005 * (i + 1), lng + 0.0005 * (i + 1)],
            }
            for i in range(count)
        ]

    # Get POIs and companies for this location
    pois = get_location_poi(location_id)
    companies = get_location_companies(location_id)
    places_for_rent = generate_places_for_rent(location.coordinates)

    # Default structure
    location_data = {
        "places_for_rent": places_for_rent,
        "pois": pois,
    }

    # Add logic for natural vs event hotspot
    if getattr(location, "type", None) == "natural":
        # Natural hotspot: add companies and demographics
        location_data["companies"] = companies[:5]
        # Add demographics if available
        location_data["demographics"] = {}
        try:
            demographics = load_demographics_data()
            for demo in demographics:
                if demo["location_id"] == location_id:
                    location_data["demographics"] = {
                        "population": demo.get("population", "N/A"),
                        "median_age": demo.get("median_age", "N/A"),
                        "avg_household_size": demo.get("avg_household_size", "N/A"),
                        "income_distribution": {
                            "Low": demo.get("Low", "N/A"),
                            "Medium": demo.get("Medium", "N/A"),
                            "High": demo.get("High", "N/A"),
                        },
                        "age_distribution": {
                            "0-17": demo.get("0-17", "N/A"),
                            "18-25": demo.get("18-25", "N/A"),
                            "26-35": demo.get("26-35", "N/A"),
                            "36-45": demo.get("36-45", "N/A"),
                            "46-60": demo.get("46-60", "N/A"),
                            "61-75": demo.get("61-75", "N/A"),
                            "76+": demo.get("76+", "N/A"),
                        },
                    }
                    break
        except Exception as e:
            print(f"Error loading demographics: {e}")
    elif getattr(location, "type", None) == "event":
        # Event hotspot: add expected crowd (mock/heuristic)
        # Heuristic: use event size, time, or just random for now
        import random

        expected_crowd = {
            "primary_demographic": random.choice(
                ["18-25", "26-35", "36-45", "All Ages"]
            ),
            "estimated_size": random.randint(100, 1000),
            "notes": "Estimate based on event type and time",
        }
        location_data["expected_crowd"] = expected_crowd

    # Return combined data
    return {
        "basic": {
            "id": location.id,
            "name": location.name,
            # Only include address if present (for event-hotspots)
            "address": getattr(location, "venue_address", None),
            "coordinates": location.coordinates,
            "type": location.type,
        },
        "metrics": {
            "population": getattr(location, "population", None),
            "areaType": getattr(location, "areaType", None),
            "peakHour": getattr(location, "peakHour", None),
            "avgDailyTraffic": getattr(location, "avgDailyTraffic", None),
            "dominantDemographics": getattr(location, "dominantDemographics", None),
            "nearbyBusinesses": getattr(location, "nearbyBusinesses", None),
        },
        "detailed": location_data,
    }
