from geopy.distance import geodesic
from datetime import datetime

festival_market_keywords = {
    "festivals",
    "fairs",
    "food and beverage",
    # "market",
    # "seasonal events"
}

def is_weekend(date_str):
    dt = datetime.fromisoformat(date_str.replace('Z', ''))
    return dt.weekday() in (5, 6)

def is_morning(date_str):
    dt = datetime.fromisoformat(date_str.replace('Z', ''))
    return 6 <= dt.hour < 12

def is_evening(date_str):
    dt = datetime.fromisoformat(date_str.replace('Z', ''))
    return 17 <= dt.hour < 22

def calculate_distance(loc1, loc2):
    point1 = (loc1['lat'], loc1['lng'])
    point2 = (loc2['lat'], loc2['lng'])
    return geodesic(point1, point2).kilometers

def is_festival_or_market(event):
    categories = event.get("globalContentCategories", [])
    return any(cat.lower() in festival_market_keywords for cat in categories)

def map_age_groups(ages):
    return 'General'

ideal_audience = {
    "Families": 20,
    "Students": 15,
    "General": 10
}

def calculate_duration_hours(start_time, end_time):
    start = datetime.fromisoformat(start_time.replace('Z', ''))
    end = datetime.fromisoformat(end_time.replace('Z', ''))
    duration = end - start
    return duration.total_seconds() / 3600

def is_all_day_event(start_time, end_time):
    start_hour = datetime.fromisoformat(start_time.replace('Z', '')).hour
    end_hour = datetime.fromisoformat(end_time.replace('Z', '')).hour
    return (start_hour <= 10) and (end_hour >= 17)

def calculate_score(
    event_data,
    resource_data=None,
    weather_data=None,
    traffic_data=None,
    demographics_data=None,
    transport_data=None,
    available_spots_nearby=0
):
    score = 0
    score_breakdown = []

    # 1. Event Type
    event_type_score = 20 if is_festival_or_market(event_data) else 0
    score += event_type_score
    if event_type_score > 0:
        score_breakdown.append({"type": "Event Type", "value": event_type_score})

    # TODO: Rewrite this logic. 
    # I am considering this as high foot traffic at the moment. Replace this when foot traffic is in place. 
    # 2. Views
    views = event_data.get('countViews', 0)
    views_score = 0
    if views > 3000:
        views_score = 100
    elif views > 2000:
        views_score = 90        
    elif views > 1000:
        views_score = 70
    elif views > 600:
        views_score = 60
    elif views > 300:
        views_score = 30
    elif views > 100:
        views_score = 10
    elif views > 50:
        views_score = 5
    score += views_score
    if views_score > 0:
        score_breakdown.append({"type": "Views", "value": views_score})

# 3. Indoor or Outdoor
    locations_type = event_data.get('event', {}).get('locationsType', '')
    if locations_type == "outdoor":
        outdoor_score = 20
    elif locations_type == "mixed":
        outdoor_score = 10
    else:  # indoor or unknown
        outdoor_score = 5
    score += outdoor_score
    score_breakdown.append({"type": "Outdoor/Indoor", "value": outdoor_score})


    # 4. Event Duration
    start_time = event_data.get('defaultStartDate')
    end_time = event_data.get('defaultEndDate')
    hours = calculate_duration_hours(start_time, end_time)
    duration_score = 0
    if hours >= 5:
        duration_score = 20
    elif hours >= 3:
        duration_score = 10
    else:
        duration_score = 5
    score += duration_score
    score_breakdown.append({"type": "Event Duration", "value": duration_score})

    # 5. Morning/Evening or All-Day
    time_of_day_score = 0
    if is_all_day_event(start_time, end_time):
        time_of_day_score = 30
    elif is_morning(start_time):
        time_of_day_score = 10
    elif is_evening(start_time):
        time_of_day_score = 20
    score += time_of_day_score
    if time_of_day_score > 0:
        score_breakdown.append({"type": "Time of Day", "value": time_of_day_score})

    # 6. Distance to Booking Spot
    distance_score = 0
    if resource_data and resource_data.get('location'):
        distance = calculate_distance(event_data.get('locations', [{}])[0], resource_data['location'])
        if distance < 1:
            distance_score = 30
        elif distance < 3:
            distance_score = 20
        elif distance > 5:
            distance_score = -10
    score += distance_score
    if distance_score != 0:
        score_breakdown.append({"type": "Distance to Spot", "value": distance_score})

    # 7. Weather
    if weather_data:
        weather_score = 0
        if weather_data.get('rain', 0) == 0 and 15 <= weather_data.get('temperature', 0) <= 25:
            weather_score += 20
        if weather_data.get('condition', '') in ['sunny', 'partly cloudy']:
            weather_score += 10
        score += weather_score
        if weather_score > 0:
            score_breakdown.append({"type": "Weather", "value": weather_score})

    # 8. Foot Traffic
    foot_traffic_score = 0
    if traffic_data:
        daily_avg = traffic_data.get('daily_average', 0)
        if daily_avg > 20000:
            foot_traffic_score = 30
        elif daily_avg > 10000:
            foot_traffic_score = 20
        elif daily_avg > 5000:
            foot_traffic_score = 10
    score += foot_traffic_score
    if foot_traffic_score > 0:
        score_breakdown.append({"type": "Foot Traffic", "value": foot_traffic_score})

    # 9. Audience Type Fit (improved)
    audience_type = event_data.get('audienceType', 'Unknown')
    audience_score = 0
    if audience_type == "Family":
        audience_score = 20
    elif audience_type == "Student":
        audience_score = 15
    elif audience_type == "General":
        audience_score = 10
    elif audience_type == "Adult":
        audience_score = 8
    elif audience_type == "Senior":
        audience_score = 8
    score += audience_score
    if audience_score > 0:
        score_breakdown.append({"type": "Audience Fit", "value": audience_score})

    # 10. Demographics Fit (improved)
    demographics = event_data.get('demographics', [])
    demographics_score = 0
    if isinstance(demographics, list):
        if "Family" in demographics:
            demographics_score += 10
        if "Youth" in demographics or "Student" in demographics:
            demographics_score += 8
        if "Senior" in demographics:
            demographics_score += 5
        if "LGBTQ+" in demographics:
            demographics_score += 3
        if "International" in demographics:
            demographics_score += 3
    score += demographics_score
    if demographics_score > 0:
        score_breakdown.append({"type": "Demographics Fit", "value": demographics_score})
        
    # 10. Public Transport Access
    transport_score = 0
    if transport_data:
        if transport_data.get('nearest_stop_distance', 10000) < 500:
            transport_score = 20
    score += transport_score
    if transport_score > 0:
        score_breakdown.append({"type": "Public Transport", "value": transport_score})

    # 11. Available Booking Spots Nearby
    spot_score = min(available_spots_nearby * 5, 20)
    score += spot_score
    if spot_score > 0:
        score_breakdown.append({"type": "Available Spots", "value": spot_score})

    return score, score_breakdown
