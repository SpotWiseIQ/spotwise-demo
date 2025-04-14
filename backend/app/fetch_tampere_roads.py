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

    # Debug logging for the closest hotspot
    if closest_hotspot and min_distance < 200:  # Only log for very close roads
        print(f"Road near hotspot '{closest_hotspot.name}':")
        print(f"  Road midpoint: {road_midpoint}")
        print(f"  Hotspot coords: {closest_hotspot.coordinates}")
        print(f"  Distance: {min_distance:.2f}m")

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
    Generate a GeoJSON point collection from traffic data with varying point density based on traffic status.

    Points are generated with strong emphasis on traffic status:
    - Available (low traffic): base density
    - Moderate traffic: 5x base density
    - Congested: 12x base density

    Base density varies with road length:
    - Segments > 100m: 1 point per 100 meters
    - Segments 50-100m: 1 point per 150 meters
    - Segments < 50m: 1 point per 200 meters

    Short segments (<50m) are only included if they have congested traffic status.
    Note: First and last points of each segment are skipped to avoid artificial hotspots at intersections.
    """
    points_features = []

    for feature in traffic_data.features:
        coords = feature.geometry.coordinates
        status = feature.properties.status

        # Set density multiplier based on traffic status with stronger influence
        if status == TrafficStatus.CONGESTED:
            density_multiplier = 12.0  # 12x base density for high traffic
        elif status == TrafficStatus.MODERATE:
            density_multiplier = 5.0  # 5x base density for moderate traffic
        else:  # AVAILABLE
            density_multiplier = 1.0  # base density for low traffic

        # Process each line segment in the road
        for i in range(len(coords) - 1):
            p1 = coords[i]
            p2 = coords[i + 1]

            # Calculate segment length in meters
            segment_length = calculate_distance(
                (p1[1], p1[0]),  # Convert to (lat, lon) for calculate_distance
                (p2[1], p2[0]),
            )

            # Skip short segments unless they have congested traffic
            if segment_length < 50 and status != TrafficStatus.CONGESTED:
                continue

            # Determine base length based on segment length
            if segment_length > 100:
                base_length = 100  # Standard density for long segments
            elif segment_length > 50:
                base_length = 150  # Reduced density for medium segments
            else:
                base_length = 200  # Minimum density for short segments

            # Calculate number of points based on segment length and density
            # We subtract 1 to account for skipping start and end points, but ensure at least 1 point
            points_per_segment = max(
                1, int((segment_length / base_length) * density_multiplier)
            )

            # Generate points along the segment (excluding start and end points)
            for j in range(points_per_segment):
                # Distribute points evenly between start and end (excluding them)
                t = (j + 1) / (points_per_segment + 1)  # This ensures t is never 0 or 1
                point = interpolate_point(p1, p2, t)

                # Create GeoJSON point feature
                point_feature = {
                    "type": "Feature",
                    "properties": {"status": status.value},
                    "geometry": {"type": "Point", "coordinates": point},
                }
                points_features.append(point_feature)

    # Create the GeoJSON feature collection
    points_geojson = {"type": "FeatureCollection", "features": points_features}

    return points_geojson


def main():
    """Main function to fetch and cache the data"""
    data = fetch_tampere_roads()
    print(f"Successfully processed {len(data['elements'])} road elements")


if __name__ == "__main__":
    main()
