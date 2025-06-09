import json
import os
from datetime import datetime
from calculate_score import calculate_score, map_age_groups, is_weekend, is_morning, is_evening

# Load your saved event list
with open('./mock_data/mvp_data/events_full_list.json', 'r', encoding='utf-8') as f:
    events_data = json.load(f)

# Access the list of events
events = events_data.get('pages', [])

# Sample Mock Resource (optional for now)
sample_resource = {
    'location': {
        'lat': 61.498150,
        'lng': 23.760953
    }
}

# Optional data (mock for now)
weather_data = {
    'rain': 0,
    'temperature': 20,
    'condition': 'sunny'
}
traffic_data = {
    'daily_average': 15000
}
demographics_data = None
transport_data = {
    'nearest_stop_distance': 400
}
available_spots_nearby = 3

# Prepare a list to store results
scored_events = []

# Constants for normalization
MAX_SCORE = 350  # Based on previous calculation

today = datetime.now()

# Test scoring
for event in events:
    try:
        startDate = event.get('defaultStartDate')
        endDate = event.get('defaultEndDate')

        if not startDate or not endDate:
            print(f"Skipping event due to missing start or end date: {event.get('name', 'Unknown')}")
            continue

        locations = event.get('locations')
        if not locations or len(locations) == 0:
            print(f"Skipping event due to missing location: {event.get('name', 'Unknown')}")
            continue

        event_location = {
            'lat': locations[0].get('lat'),
            'lng': locations[0].get('lng'),
            'address': locations[0].get('address')
        }


        venue = event['locations'][0].get('address')

        event_data = {
            'name': event.get('name', 'No Name'),
            'startDate': startDate,
            'defaultStartDate': startDate,
            'defaultEndDate': endDate,
            'event': event.get('event', {}),
            'location': event_location,
            'categories': event.get('categories', []),
            'globalContentCategories': event.get('globalContentCategories', []),
            'ages': event.get('ages', []),
            'countViews': event.get('countViews', 0)
        }

        # New Additional Fields
        contact_email = event.get('email')
        event_image = event.get('mainImage', {}).get('imageURL')
        social_links = {
            'facebook': event.get('urlFacebook'),
            'instagram': event.get('urlInstagram'),
            'twitter': event.get('urlTwitter')
        }
        event_description = event.get('descriptionShort')

        # Audience
        audience_type = map_age_groups(event_data['ages'])

        event_start_dt = datetime.fromisoformat(event_data['defaultStartDate'].replace('Z', ''))
        days_to_event = (event_start_dt - today).days

        # Derived values
        day_type = 'weekend' if is_weekend(event_data['defaultStartDate']) else 'weekday'
        if is_morning(event_data['defaultStartDate']):
            time_of_day = 'morning'
        elif is_evening(event_data['defaultStartDate']):
            time_of_day = 'evening'
        else:
            time_of_day = 'other'

        score, breakdown = calculate_score(
            event_data=event_data,
            # resource_data=sample_resource,
            # weather_data=weather_data,
            # traffic_data=traffic_data,
            # demographics_data=demographics_data,
            # transport_data=transport_data,
            # available_spots_nearby=available_spots_nearby
        )

        # ✅ Validate
        if not isinstance(score, int):
            print(f"Skipping event due to invalid score: {event_data['name']}")
            continue

        normalized_score = round((score / MAX_SCORE) * 100, 2)

        # Build Left Panel Data
        left_panel_data = {
            'eventName': event_data['name'],
            'venue': venue,
            'startDate': event_data['defaultStartDate'],
            'endDate': event_data['defaultEndDate'],
            'eventType': event_data['globalContentCategories'],
            'score': score,
            'normalizedScore': normalized_score,
            'dayType': day_type,
            'timeOfDay': time_of_day,
            'views': event_data['countViews'],
            'audienceType': audience_type,
            'daysToEvent': days_to_event,
            'peakFootTraffic': 'N/A',  # Placeholder for now
            'weather': 'N/A',  # Placeholder for now
        }

        # Build Full Event Data
        full_event_data = {
            'name': event_data['name'],
            'startDate': event_data['defaultStartDate'],
            'endDate': event_data['defaultEndDate'],
            'score': score,
            'normalizedScore': normalized_score,
            'scoreBreakdown': breakdown,
            'views': event_data['countViews'],
            'peakFootTraffic': traffic_data['daily_average'],
            'dayType': day_type,
            'timeOfDay': time_of_day,
            'audienceType': audience_type,
            'globalContentCategories': event_data['globalContentCategories'],
            'ages': event_data['ages'],
            'peakFootTraffic': 'N/A',  # Placeholder for now
            'weather': 'N/A',  # Placeholder for now
            'availableSpotsNearby': 0,  # Placeholder for now
            'location': event_location,
            'contactEmail': contact_email,
            'mainImage': event_image,
            'socialLinks': social_links,
            'description': event_description            
        }

        scored_events.append({
            'leftPanelData': left_panel_data,
            'fullEventData': full_event_data
        })

    except (IndexError, KeyError, TypeError) as e:
        print(f"Skipping event due to missing data: {e}")

#  Sort events by score descending
scored_events = sorted(scored_events, key=lambda x: int(x['leftPanelData']['score']), reverse=True)

# Save the scored events to a test_output_samples folder
output_path = './frontend/test_output_samples/scored_events.json'

# Make sure test_output_samples directory exists
os.makedirs(os.path.dirname(output_path), exist_ok=True)

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(scored_events, f, indent=4, ensure_ascii=False)

print(f"\n✅ Scored events saved successfully to {output_path}")
