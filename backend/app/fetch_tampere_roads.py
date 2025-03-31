import requests
import json
import random
from typing import Dict, List, Any, Tuple

from app.models import (
    TrafficStatus,
    TrafficFeatureProperties,
    TrafficLineCoordinates,
    TrafficFeature,
    TrafficData,
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


def fetch_tampere_roads() -> Dict[str, Any]:
    """Fetch road data for Tampere from Overpass API"""
    print("Fetching Tampere road data from Overpass API...")
    response = requests.post(OVERPASS_URL, data={"data": OVERPASS_QUERY})

    if response.status_code != 200:
        print(f"Error fetching data: {response.status_code}")
        print(response.text)
        return {"elements": []}

    data = response.json()
    print(f"Fetched {len(data['elements'])} elements from Overpass API")
    return data


def process_road_data(data: Dict[str, Any]) -> TrafficData:
    """Process the Overpass API data into our TrafficData format"""
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

        # Assign a random traffic status for demonstration
        # In a real application, you would use actual traffic data
        status = random.choice(
            [TrafficStatus.AVAILABLE, TrafficStatus.MODERATE, TrafficStatus.CONGESTED]
        )

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


def main():
    """Main function to fetch and process the data"""
    data = fetch_tampere_roads()
    traffic_data = process_road_data(data)
    save_traffic_data(traffic_data, "tampere_roads.json")


if __name__ == "__main__":
    main()
