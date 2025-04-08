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
from datetime import datetime, timedelta
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

# Cache for dynamically generated events
events_cache = {}
date_events_cache = {}

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
    """Get all hotspots with their foot traffic data included."""
    # Add foot traffic data to each hotspot
    for hotspot in hotspots:
        hotspot.footTraffic = get_hotspot_foot_traffic(hotspot.id)

    return hotspots


def get_hotspot_by_id(hotspot_id: str) -> Hotspot:
    for hotspot in hotspots:
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

    # Number of events to generate (between 4 and 8)
    num_events = random.randint(4, 8)

    # Time slots distributed across the day (from 9:00 to 21:00)
    time_slots = [
        "09:00",
        "10:30",
        "12:00",
        "13:30",
        "15:00",
        "16:30",
        "18:00",
        "19:30",
        "21:00",
    ]

    # Shuffle the time slots and pick the first 'num_events'
    random.shuffle(time_slots)
    selected_times = sorted(time_slots[:num_events])

    # Event types
    event_types = [
        "concert",
        "sports",
        "exhibition",
        "festival",
        "conference",
        "workshop",
        "theatre",
    ]

    # Event names by type
    event_names = {
        "concert": [
            "Rock Concert",
            "Jazz Night",
            "Symphony Orchestra",
            "Electronic Music Festival",
            "Pop Music Show",
        ],
        "sports": [
            "Basketball Match",
            "Football Game",
            "Ice Hockey Tournament",
            "Tennis Championship",
            "Swimming Competition",
        ],
        "exhibition": [
            "Art Exhibition",
            "Photography Showcase",
            "Historical Display",
            "Science Exhibition",
            "Design Expo",
        ],
        "festival": [
            "Food Festival",
            "Cultural Festival",
            "Film Festival",
            "Beer Festival",
            "Music Festival",
        ],
        "conference": [
            "Tech Conference",
            "Business Summit",
            "Medical Conference",
            "Education Symposium",
            "Research Convention",
        ],
        "workshop": [
            "Coding Workshop",
            "Creative Writing Class",
            "Design Thinking Workshop",
            "Entrepreneurship Seminar",
            "Dance Workshop",
        ],
        "theatre": [
            "Theatre Play",
            "Musical Performance",
            "Comedy Show",
            "Drama Production",
            "Opera Night",
        ],
    }

    # Venue names by type
    venue_names = {
        "concert": [
            "Tampere Hall",
            "YO-talo",
            "Pakkahuone",
            "Tullikamari",
            "Olympia-kortteli",
        ],
        "sports": [
            "Hakametsä Ice Stadium",
            "Tampere Stadium",
            "Ratina Stadium",
            "Kauppi Sports Center",
            "Pyynikki Sports Field",
        ],
        "exhibition": [
            "Tampere Art Museum",
            "Vapriikki Museum",
            "Sara Hildén Art Museum",
            "Mältinranta Art Center",
            "TR1 Exhibition Space",
        ],
        "festival": [
            "Ratina Festival Park",
            "Eteläpuisto Park",
            "Särkänniemi Area",
            "Tampere Exhibition Center",
            "Laukontori Square",
        ],
        "conference": [
            "Tampere Hall Congress Center",
            "Technopolis Yliopistonrinne",
            "Tampere University",
            "Hotel Rosendahl",
            "TOAS Conference Center",
        ],
        "workshop": [
            "Werstas Creative Space",
            "Y-kampus",
            "New Factory",
            "Tribe Tampere",
            "Demola Tampere",
        ],
        "theatre": [
            "Tampere Theatre",
            "TTT-Theatre",
            "Tampere Comedy Theatre",
            "Komediatehdas",
            "Telakka Cultural House",
        ],
    }

    # Address templates
    address_templates = [
        "Hämeenkatu {num}",
        "Hatanpään valtatie {num}",
        "Itsenäisyydenkatu {num}",
        "Satakunnankatu {num}",
        "Pirkankatu {num}",
        "Sammonkatu {num}",
        "Aleksis Kiven katu {num}",
        "Kauppakatu {num}",
        "Tuomiokirkonkatu {num}",
        "Rautatienkatu {num}",
    ]

    # Generate events
    generated_events = []

    for i in range(num_events):
        # Random coordinates near Tampere center
        lng_offset = random.uniform(-0.03, 0.03)
        lat_offset = random.uniform(-0.01, 0.01)
        coordinates = (TAMPERE_CENTER[0] + lng_offset, TAMPERE_CENTER[1] + lat_offset)

        # Random event attributes
        event_type = random.choice(event_types)
        capacity = random.choice([200, 300, 500, 800, 1000, 1500, 2000])
        duration = random.choice(["1 h", "1.5 h", "2 h", "2.5 h", "3 h"])
        demographics = random.choice(
            ["All ages", "18+", "18-35", "25-45", "Family-friendly"]
        )

        # Choose a descriptive name based on event type
        event_name = random.choice(event_names.get(event_type, ["Event"]))

        # Add a number to differentiate multiple events of the same type
        if random.random() < 0.5:  # Only add numbers sometimes for more variety
            event_name = f"{event_name} {i + 1}"

        # Choose a venue name based on event type
        venue_name = random.choice(venue_names.get(event_type, ["Venue"]))

        # Generate a realistic address
        address_template = random.choice(address_templates)
        address = address_template.format(num=random.randint(1, 99))

        # Traffic impact options with weights to favor certain values
        impact_options = ["+10%", "+15%", "+20%", "+30%", "+40%", "+50%"]
        impact_weights = [
            0.2,
            0.3,
            0.2,
            0.15,
            0.1,
            0.05,
        ]  # More likely to be moderate impact
        traffic_impact = random.choices(impact_options, weights=impact_weights)[0]

        # Ticket status options with weights
        status_options = ["Available", "Limited", "Selling Fast", "Sold Out"]
        status_weights = [0.5, 0.25, 0.15, 0.1]  # More likely to be available
        ticket_status = random.choices(status_options, weights=status_weights)[0]

        # Create the event
        event = Event(
            id=f"{date_str}-{i + 1}",
            name=event_name,
            time=selected_times[i],
            place=venue_name,
            coordinates=coordinates,
            date=date_str,
            address=address,
            type=event_type,
            duration=duration,
            capacity=capacity,
            demographics=demographics,
            peakTrafficImpact=traffic_impact,
            ticketStatus=ticket_status,
        )

        generated_events.append(event)
        # Also cache by event ID for quick lookup
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

    # Filter by current_hour if provided
    if current_hour is not None:
        try:
            daily_events = [
                event
                for event in daily_events
                if int(event.time.split(":")[0]) >= current_hour
            ]
        except (ValueError, AttributeError, IndexError):
            # If there's any error parsing the time, don't filter
            pass

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
            "label": hotspot.label,
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
            "total": int(event.capacity)
            if event.capacity and event.capacity.isdigit()
            else random.randint(200, 1000),
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
            "place": event.place,
            "date": event.date,
            "coordinates": event.coordinates,
        },
        "metrics": {
            "type": event.type,
            "time": event.time,
            "duration": event.duration,
            "capacity": event.capacity,
            "demographics": event.demographics,
            "address": event.address,
        },
        "detailed": event_data,
    }
