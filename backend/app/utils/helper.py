# TODO: need to use Open AI to detect the type of hotspot (outdoor/indoor/mixed)
import json
import os
import openai
from app.scripts.weather_meteo import WeatherMeteo
from dotenv import load_dotenv
from datetime import datetime
load_dotenv()


def detect_locations_type(event, use_ai_fallback=True):
    outdoor_keywords = [
        "park", "outdoor", "puisto", "square", "stage", "field", "stadium", "beach", "garden", "market", "aukio", "piha", "rant",
        "keskustori", "tori", "market square"
    ]
    indoor_keywords = [
        "museum", "hall", "house", "kirjasto", "library", "center", "keskus", "palatsi", "indoor", "sali", "teatteri", "theatre"
    ]

    addresses = []
    if event.get("locations"):
        addresses = [loc.get("address", "").lower()
                     for loc in event["locations"] if loc.get("address")]
    elif event.get("location"):
        addresses = [event["location"].get("address", "").lower()]

    found_outdoor = any(any(word in addr for word in outdoor_keywords)
                        for addr in addresses)
    found_indoor = any(any(word in addr for word in indoor_keywords)
                       for addr in addresses)

    desc = (event.get("description") or event.get(
        "descriptionLong") or "").lower()
    desc_outdoor = any(word in desc for word in outdoor_keywords)
    desc_indoor = any(word in desc for word in indoor_keywords)

    # If both outdoor and indoor keywords are found, or neither, it's ambiguous
    if (found_outdoor or desc_outdoor) and (found_indoor or desc_indoor):
        result = "unknown"
    elif found_outdoor or desc_outdoor:
        result = "outdoor"
    elif found_indoor or desc_indoor:
        result = "indoor"
    else:
        result = "unknown"

    # Fallback to OpenAI if ambiguous or unknown, or if the address is a public place not in your keywords
    if use_ai_fallback and result == "unknown":
        ai_result = classify_location_type_with_openai(event)
        return ai_result.get("locationType", "unknown")
    return result


def detect_audience_type(event, use_ai_fallback=True):
    # The primary, main group the event is intended for.
    # Keywords for different audience types

    # Problem: "ages" like "age-5" are not always clear.
    # In Finnish event data, "age-5" often means "all ages" or "family/youth",
    # not literally age 5. So we need to handle these cases carefully in future when we have knowledge.

    family_keywords = ["family", "children", "kids",
                       "lapsi", "perhe", "child", "junior", "youth", "nuori"]
    adult_keywords = ["adult", "aikuinen", "18+", "21+", "mature"]
    senior_keywords = ["senior", "eläkeläinen", "elderly", "retiree"]
    student_keywords = ["student", "opiskelija",
                        "university", "school", "campus"]
    general_keywords = ["everyone", "kaikki",
                        "public", "yleisö", "all ages", "general"]

    # Combine all relevant text fields
    text = (
        " ".join(event.get("ages", [])) + " " +
        (event.get("description") or "") + " " +
        (event.get("descriptionLong") or "") + " " +
        (event.get("name") or "")
    ).lower()

    # Check for each audience type
    if any(word in text for word in family_keywords):
        return "Family"
    if any(word in text for word in adult_keywords):
        return "Adult"
    if any(word in text for word in senior_keywords):
        return "Senior"
    if any(word in text for word in student_keywords):
        return "Student"
    if any(word in text for word in general_keywords):
        return "General"

    # Fallback to OpenAI if ambiguous or unknown
    if use_ai_fallback:
        ai_result = classify_audience_with_openai(event)
        return ai_result.get("audienceType", "Unknown")
    return "Unknown"


def detect_demographics(event, use_ai_fallback=True):
    # A list of all relevant groups that might be interested in or represented at the event.
    # Example keywords for demographics

    # Problem: "ages" like "age-5" are not always clear.
    # In Finnish event data, "age-5" often means "all ages" or "family/youth",
    # not literally age 5. So we need to handle these cases carefully in future when we have knowledge.

    youth_keywords = ["youth", "junior", "nuori", "teen", "teini"]
    family_keywords = ["family", "perhe", "children", "kids", "lapsi"]
    senior_keywords = ["senior", "eläkeläinen", "elderly", "retiree"]
    lgbtq_keywords = ["lgbt", "pride", "rainbow", "queer"]
    international_keywords = ["international",
                              "expat", "foreigner", "english", "englanti"]

    text = (
        " ".join(event.get("ages", [])) + " " +
        (event.get("description") or "") + " " +
        (event.get("descriptionLong") or "") + " " +
        (event.get("name") or "")
    ).lower()

    demographics = []
    if any(word in text for word in youth_keywords):
        demographics.append("Youth")
    if any(word in text for word in family_keywords):
        demographics.append("Family")
    if any(word in text for word in senior_keywords):
        demographics.append("Senior")
    if any(word in text for word in lgbtq_keywords):
        demographics.append("LGBTQ+")
    if any(word in text for word in international_keywords):
        demographics.append("International")
    # If no demographics found, we can use AI to classify
    if not demographics and use_ai_fallback:
        ai_result = classify_audience_with_openai(event)
        return ai_result.get("demographics", ["General"])
    if not demographics:
        demographics.append("General")
    return demographics


def classify_audience_with_openai(event):
    prompt = (
        "Given the following event data, classify the primary audience type "
        "(Family, Adult, Senior, Student, General, Unknown) and list any relevant demographics "
        "(e.g., Youth, Family, Senior, LGBTQ+, International, etc.). "
        "Respond in JSON with keys: audienceType, demographics (list).\n"
        f"Event data: {event}"
    )

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable not set.")

    client = openai.OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model="gpt-4.1-nano",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=200,
        temperature=0.0,
    )
    return json.loads(response.choices[0].message.content)


def classify_location_type_with_openai(event):
    prompt = (
        "Given the following event data, classify the location type as 'outdoor', 'indoor', or 'unknown'. "
        "Respond in JSON with key: locationType.\n"
        f"Event data: {event}"
    )
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable not set.")
    client = openai.OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model="gpt-4.1-nano",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=50,
        temperature=0.0,
    )
    return json.loads(response.choices[0].message.content)


def get_event_date_range(event):
    event_dates = event.get('event', {}).get('dates', [])
    if event_dates:
        starts = [d['start'] for d in event_dates if 'start' in d]
        ends = [d['end'] for d in event_dates if 'end' in d]
        if starts and ends:
            return min(starts), max(ends), len(event_dates)
    # Fallback
    return event.get('defaultStartDate'), event.get('defaultEndDate'), 1


HOTSPOT_LABEL_RULES = [
    {
        "label": "Event-hotspot",
        "condition": lambda e: e.get("hotspotType") == "Event-hotspot"
    },
    {
        "label": "Regular-hotspot",
        "condition": lambda e: e.get("hotspotType") == "Regular-hotspot"
    },
    {
        "label": "Family-friendly",
        "condition": lambda e: e.get("audienceType") == "Family" or "Family" in e.get("demographics", [])
    },
    {
        "label": "Tourist Magnet",
        "condition": lambda e: "excursions, guided tours" in e.get("globalContentCategories", []) or "excursions, guided tours" in e.get("eventType", [])
    },
    {
        "label": "Nightlife Zone",
        "condition": lambda e: e.get("timeOfDay") == "evening" and (
            "gig" in e.get("globalContentCategories", []
                           ) or "gig" in e.get("eventType", [])
        )
    },
    {
        "label": "Seasonal Hotspot",
        "condition": lambda e: (
            (lambda m: 6 <= m <= 8)(int(e.get("startDate", "1970-01-01")[5:7]))
            if e.get("startDate") else False
        )
    },
    {
        "label": "Student Hub",
        "condition": lambda e: e.get("audienceType") == "Student" or "Student" in e.get("demographics", [])
    },
    {
        "label": "LGBTQ+ Friendly",
        "condition": lambda e: "LGBTQ+" in e.get("demographics", [])
    },
    {
        "label": "International",
        "condition": lambda e: "International" in e.get("demographics", [])
    },
]


def get_hotspot_labels(event_data):
    labels = []
    for rule in HOTSPOT_LABEL_RULES:
        try:
            if rule["condition"](event_data):
                labels.append(rule["label"])
        except Exception:
            continue
    return labels


def get_weather_data(weather_client: WeatherMeteo, lat: float, lng: float, date: str):
    try:
        # Try real API call
        weather_response = weather_client.get_weather(lat, lng, date)
        # weather = WeatherMeteo.extract_weather_for_date(weather_response, date)
        weather = map_meteo_to_weather_data(weather_response, date)
        return weather
    except Exception:
        pass


def map_meteo_to_weather_data(meteo_response: dict, date: str) -> dict:
    from datetime import datetime
    # Extract date part if needed
    if "T" in date:
        date = datetime.fromisoformat(
            date.replace("Z", "+00:00")).strftime("%Y-%m-%d")
    daily = meteo_response.get("daily", {})
    times = daily.get("time", [])
    if date in times:
        idx = times.index(date)
        rain = daily.get("precipitation_sum", [0])[idx]
        temperature = daily.get("temperature_2m_max", [0])[idx]
        # You can add logic to set 'condition' based on rain, temperature, etc.
        condition = "sunny" if rain == 0 else "partly cloudy"
        return {
            "rain": rain,
            "temperature": temperature,
            "condition": condition
        }
    return {
        "rain": 0,
        "temperature": 0,
        "condition": ""
    }


def get_time_of_day(date_str):
    dt = datetime.fromisoformat(date_str.replace('Z', ''))
    hour = dt.hour
    if 6 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 22:
        return "evening"
    elif 22 <= hour or hour < 6:
        return "night"
    else:
        return "other"
