from app.scripts.aggregrator_scripts.location_aggregator import LocationAggregator

if __name__ == "__main__":
    # Adjust the path as needed for your project structure
    input_path = "data/scored_events.json"
    output_path = "data/aggregated_locations.json"

    aggregator = LocationAggregator.from_json_file(input_path)
    aggregated_data = aggregator.aggregate()
    aggregator.to_json_file(output_path, aggregated_data)
    print(f"Aggregated location data written to {output_path}")