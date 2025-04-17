import requests
import json
import random
from typing import Dict, List, Any, Tuple
import math
import os

from app.models import (
    TrafficStatus,
    TrafficFeatureProperties,
    TrafficLineCoordinates,
    TrafficFeature,
    TrafficData,
    Hotspot,
)

# Overpass API query for Tampere's main roads
OVERPASS_QUERY = """
[out:json];
area[name="Tampere"][admin_level=8]->.tampere;
(
  way[highway=motorway](area.tampere);
  way[highway=trunk](area.tampere);
  way[highway=primary](area.tampere);
  way[highway=secondary](area.tampere);
  way[highway=tertiary](area.tampere);
  way[highway=residential][name](area.tampere);
);
out body;
>;
out skel qt;
"""

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Path to cache file for raw Overpass API data
OVERPASS_CACHE_FILE = os.path.join(os.path.dirname(__file__), "tampere_roads_raw.json")


def fetch_tampere_roads() -> Dict[str, Any]:
    """Fetch road data for Tampere from Overpass API or cache"""
    # Try to load from cache first
    if os.path.exists(OVERPASS_CACHE_FILE):
        try:
            print("Loading road data from cache...")
            with open(OVERPASS_CACHE_FILE, "r") as f:
                data = json.load(f)
                print(f"Loaded {len(data['elements'])} elements from cache")
                return data
        except Exception as e:
            print(f"Error loading cached road data: {e}")

    # If cache doesn't exist or couldn't be loaded, fetch from API
    print("Fetching Tampere road data from Overpass API...")
    response = requests.post(OVERPASS_URL, data={"data": OVERPASS_QUERY})

    if response.status_code != 200:
        print(f"Error fetching data: {response.status_code}")
        print(response.text)
        return {"elements": []}

    data = response.json()
    print(f"Fetched {len(data['elements'])} elements from Overpass API")

    # Save raw data to cache
    try:
        with open(OVERPASS_CACHE_FILE, "w") as f:
            json.dump(data, f)
        print("Saved road data to cache")
    except Exception as e:
        print(f"Error saving road data to cache: {e}")

    return data


def calculate_distance(
    coord1: Tuple[float, float], coord2: Tuple[float, float]
) -> float:
    """Calculate the distance between two coordinates in meters using Haversine formula"""
    R = 6371000  # Earth's radius in meters
    lat1, lon1 = coord1
    lat2, lon2 = coord2

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2) * math.sin(delta_phi / 2) + math.cos(phi1) * math.cos(
        phi2
    ) * math.sin(delta_lambda / 2) * math.sin(delta_lambda / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def determine_traffic_status(
    road_coords: List[List[float]], hotspots: List[Hotspot]
) -> TrafficStatus:
    """Determine traffic status based on proximity to hotspots"""
    # Calculate the midpoint of the road segment
    road_midpoint = (
        sum(coord[1] for coord in road_coords) / len(road_coords),  # latitude
        sum(coord[0] for coord in road_coords) / len(road_coords),  # longitude
    )

    # Check distance to each hotspot
    min_distance = float("inf")
    closest_hotspot = None
    for hotspot in hotspots:
        # Hotspot coordinates are stored as (longitude, latitude)
        hotspot_coords = (
            hotspot.coordinates[1],
            hotspot.coordinates[0],
        )  # Convert to (latitude, longitude)
        distance = calculate_distance(road_midpoint, hotspot_coords)
        if distance < min_distance:
            min_distance = distance
            closest_hotspot = hotspot

    # # Debug logging for the closest hotspot
    # if closest_hotspot and min_distance < 200:  # Only log for very close roads
    #     print(f"Road near hotspot '{closest_hotspot.name}':")
    #     print(f"  Road midpoint: {road_midpoint}")
    #     print(f"  Hotspot coords: {closest_hotspot.coordinates}")
    #     print(f"  Distance: {min_distance:.2f}m")

    # Determine traffic status based on distance to nearest hotspot
    if min_distance < 100:  # Only very close streets get congested
        return TrafficStatus.CONGESTED
    elif min_distance < 200:  # Slightly further gets moderate
        return TrafficStatus.MODERATE
    else:  # Everything else is available
        return TrafficStatus.AVAILABLE


def process_road_data(
    data: Dict[str, Any], hotspots: List[Hotspot] = None
) -> TrafficData:
    """Process the Overpass API data into our TrafficData format with optional traffic status based on hotspots"""
    if hotspots is None:
        hotspots = []

    # Extract nodes (points) and ways (roads)
    nodes = {
        node["id"]: (node["lon"], node["lat"])
        for node in data["elements"]
        if node["type"] == "node"
    }
    ways = [way for way in data["elements"] if way["type"] == "way"]

    print(f"Processing {len(ways)} road segments...")

    # Convert to TrafficFeature objects
    features = []
    for way in ways:
        # Skip ways with too few nodes
        if len(way["nodes"]) < 2:
            continue

        # Get coordinates for the road
        coordinates = []
        for node_id in way["nodes"]:
            if node_id in nodes:
                coordinates.append(list(nodes[node_id]))

        # Skip if we couldn't get coordinates
        if len(coordinates) < 2:
            continue

        # Determine traffic status based on hotspots
        status = determine_traffic_status(coordinates, hotspots)

        # Create the feature
        feature = TrafficFeature(
            type="Feature",
            properties=TrafficFeatureProperties(status=status),
            geometry=TrafficLineCoordinates(type="LineString", coordinates=coordinates),
        )

        features.append(feature)

    # Create the TrafficData object
    traffic_data = TrafficData(type="FeatureCollection", features=features)

    print(f"Created traffic data with {len(features)} features")
    return traffic_data


def save_traffic_data(traffic_data: TrafficData, file_path: str) -> None:
    """Save the traffic data to a JSON file"""
    with open(file_path, "w") as f:
        json.dump(traffic_data.dict(), f, indent=2)
    print(f"Saved traffic data to {file_path}")


def interpolate_point(p1: List[float], p2: List[float], t: float) -> List[float]:
    """Interpolate between two points with parameter t (0 <= t <= 1)"""
    return [
        p1[0] + t * (p2[0] - p1[0]),  # longitude
        p1[1] + t * (p2[1] - p1[1]),  # latitude
    ]


def generate_traffic_points(traffic_data: TrafficData) -> Dict[str, Any]:
    """
    Generate a GeoJSON point collection from traffic data with density based on traffic status.

    Points are generated based on target spacing for each traffic status, distributed
    evenly along the *entire length* of each road feature (polyline).
    - Congested: Higher density
    - Moderate: Medium density
    - Available: Base density

    This method avoids point clustering at the nodes connecting segments.
    """
    points_features = []
    BASE_SPACING_METERS = 100.0  # Target spacing for AVAILABLE roads

    # Pre-define density multipliers as constants
    density_multipliers = {
        TrafficStatus.CONGESTED: 6.0,  # e.g., 1 point every ~17m
        TrafficStatus.MODERATE: 3.0,  # e.g., 1 point every ~33m
        TrafficStatus.AVAILABLE: 1.0,  # e.g., 1 point every 100m
    }

    # Predefine small tolerance value for float comparisons
    EPSILON = 1e-9

    for feature in traffic_data.features:
        coords = feature.geometry.coordinates
        status = feature.properties.status

        # Early return for features with insufficient coordinates
        if len(coords) < 2:
            continue

        # 1. Calculate segment lengths and total length of the feature polyline
        segment_lengths = []
        total_length = 0.0

        for i in range(len(coords) - 1):
            p1 = coords[i]
            p2 = coords[i + 1]
            # Convert coordinates once
            p1_lat_lon = (p1[1], p1[0])
            p2_lat_lon = (p2[1], p2[0])

            length = calculate_distance(p1_lat_lon, p2_lat_lon)

            # Only store non-zero lengths
            if length > EPSILON:
                segment_lengths.append(length)
                total_length += length
            else:
                segment_lengths.append(0.0)

        # Skip if no valid segments or total length is effectively zero
        if total_length <= EPSILON:
            continue

        # 2. Determine Total Points for the entire polyline
        multiplier = density_multipliers.get(status, 1.0)
        target_spacing = BASE_SPACING_METERS / multiplier
        # Calculate points based on length and spacing - very short polylines might get 0 points
        total_num_points = round(total_length / target_spacing)

        # Skip if no points would be generated
        if total_num_points <= 0:
            continue

        # 3. Calculate Actual Point Spacing
        actual_spacing = total_length / total_num_points

        # 4. Place Points along the polyline
        cumulative_distance = 0.0
        segment_index = 0
        segment_count = len(segment_lengths)
        status_value = status.value  # Cache the status value

        for k in range(total_num_points):
            # Target distance for current point
            target_dist = (k + 0.5) * actual_spacing

            # Find the segment containing this target distance
            while (
                segment_index < segment_count
                and target_dist
                > cumulative_distance + segment_lengths[segment_index] + EPSILON
            ):
                cumulative_distance += segment_lengths[segment_index]
                segment_index += 1

            # Ensure we don't exceed segment bounds
            if segment_index >= segment_count:
                segment_index = segment_count - 1

            # Calculate position within the segment
            current_segment_length = segment_lengths[segment_index]
            dist_into_segment = target_dist - cumulative_distance

            # Calculate interpolation factor
            if current_segment_length > EPSILON:
                t = min(1.0, max(0.0, dist_into_segment / current_segment_length))
            else:
                t = 0.0 if dist_into_segment < EPSILON else 1.0

            # Get segment endpoints
            p_start = coords[segment_index]
            p_end_index = min(segment_index + 1, len(coords) - 1)
            p_end = coords[p_end_index]

            # Interpolate point (inline for speed instead of calling function)
            if segment_index == p_end_index:
                point = p_start
            else:
                point = [
                    p_start[0] + t * (p_end[0] - p_start[0]),  # longitude
                    p_start[1] + t * (p_end[1] - p_start[1]),  # latitude
                ]

            # Create point feature with cached status value
            points_features.append(
                {
                    "type": "Feature",
                    "properties": {"status": status_value},
                    "geometry": {"type": "Point", "coordinates": point},
                }
            )

    # Create and return the GeoJSON feature collection
    points_geojson = {"type": "FeatureCollection", "features": points_features}
    print(f"Generated {len(points_features)} traffic points along polylines.")
    return points_geojson


def main():
    """Main function to fetch and cache the data"""
    data = fetch_tampere_roads()
    print(f"Successfully processed {len(data['elements'])} road elements")


if __name__ == "__main__":
    main()
