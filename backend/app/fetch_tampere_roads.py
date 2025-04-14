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

    density_multipliers = {
        TrafficStatus.CONGESTED: 6.0,  # e.g., 1 point every ~17m
        TrafficStatus.MODERATE: 3.0,  # e.g., 1 point every ~33m
        TrafficStatus.AVAILABLE: 1.0,  # e.g., 1 point every 100m
    }

    for feature in traffic_data.features:
        coords = feature.geometry.coordinates
        status = feature.properties.status

        if len(coords) < 2:
            continue

        # 1. Calculate segment lengths and total length of the feature polyline
        segment_lengths = []
        total_length = 0.0
        valid_segments_exist = False
        for i in range(len(coords) - 1):
            p1 = coords[i]
            p2 = coords[i + 1]
            length = calculate_distance(
                (p1[1], p1[0]),
                (p2[1], p2[0]),  # (lat, lon) for distance calc
            )
            # Store length, handle potential zero-length segments
            segment_lengths.append(max(0.0, length))  # Ensure non-negative
            total_length += max(0.0, length)
            if length > 1e-6:  # Use a small threshold to check for valid length
                valid_segments_exist = True

        # Skip features with no discernible length or only zero-length segments
        if not valid_segments_exist or total_length <= 1e-6:
            continue

        # 2. Determine Total Points for the entire polyline
        multiplier = density_multipliers.get(status, 1.0)
        target_spacing = BASE_SPACING_METERS / multiplier
        # Calculate points based purely on length and spacing. Very short polylines might get 0 points.
        total_num_points = round(total_length / target_spacing)

        # If no points are to be generated for this polyline, skip to the next feature
        if total_num_points <= 0:
            continue

        # 3. Calculate Actual Point Spacing along the polyline
        # Avoid division by zero (already handled by the continue above, but safe check)
        actual_spacing = (
            total_length / total_num_points if total_num_points > 0 else total_length
        )

        # 4. & 5. Place Points along the polyline
        cumulative_dist_along_polyline = (
            0.0  # Tracks distance up to the START of the current segment
        )
        segment_index = 0

        for k in range(total_num_points):
            # Target distance for the center of the k-th point's interval
            target_dist = (k + 0.5) * actual_spacing

            # Find the correct segment for this point by advancing segment_index
            # Ensure we don't go past the end of segments list
            while (
                segment_index < len(segment_lengths)
                and target_dist
                > cumulative_dist_along_polyline + segment_lengths[segment_index] + 1e-9
            ):  # Add tolerance for float comparison
                cumulative_dist_along_polyline += segment_lengths[segment_index]
                segment_index += 1

            # Clamp segment_index to the last valid index if overshoot occurs (e.g., float issues)
            segment_index = min(segment_index, len(segment_lengths) - 1)

            # Calculate distance *within* the current segment
            dist_into_segment = target_dist - cumulative_dist_along_polyline
            current_segment_length = segment_lengths[segment_index]

            # Calculate interpolation factor 't' for the current segment
            if current_segment_length > 1e-9:  # Use tolerance for division
                t = dist_into_segment / current_segment_length
                # Clamp t to [0, 1] due to potential float issues
                t = max(0.0, min(1.0, t))
            else:
                # If segment has effectively zero length, place point at start (t=0) or end (t=1)
                # based on whether target_dist is closer to start or end of this "zero" segment range
                t = 0.0 if dist_into_segment < 1e-9 else 1.0

            # Get the start and end points of the current segment
            # segment_index corresponds to the segment from coords[segment_index] to coords[segment_index + 1]
            p_start = coords[segment_index]
            # Ensure p_end exists, clamp index if needed (though logic should prevent this)
            p_end_index = min(segment_index + 1, len(coords) - 1)
            p_end = coords[p_end_index]

            # Interpolate the point
            # Handle case where p_start and p_end might be the same if segment_index reached the end
            if segment_index == p_end_index:
                point = p_start  # or p_end, they are the same
            else:
                point = interpolate_point(p_start, p_end, t)

            # Create GeoJSON point feature
            point_feature = {
                "type": "Feature",
                "properties": {"status": status.value},
                "geometry": {"type": "Point", "coordinates": point},
            }
            points_features.append(point_feature)

    # Create the GeoJSON feature collection
    points_geojson = {"type": "FeatureCollection", "features": points_features}

    print(f"Generated {len(points_features)} traffic points along polylines.")
    return points_geojson


def main():
    """Main function to fetch and cache the data"""
    data = fetch_tampere_roads()
    print(f"Successfully processed {len(data['elements'])} road elements")


if __name__ == "__main__":
    main()
