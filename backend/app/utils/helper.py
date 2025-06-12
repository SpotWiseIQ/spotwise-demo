# TODO: need to use Open AI to detect the type of hotspot (outdoor/indoor/mixed)
from dotenv import load_dotenv
load_dotenv()

import openai
import os
import json


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
        addresses = [loc.get("address", "").lower() for loc in event["locations"] if loc.get("address")]
    elif event.get("location"):
        addresses = [event["location"].get("address", "").lower()]

    found_outdoor = any(any(word in addr for word in outdoor_keywords) for addr in addresses)
    found_indoor = any(any(word in addr for word in indoor_keywords) for addr in addresses)

    desc = (event.get("description") or event.get("descriptionLong") or "").lower()
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

def detect_audience_type(event):
    # The primary, main group the event is intended for.
    # Keywords for different audience types
    family_keywords = ["family", "children", "kids", "lapsi", "perhe", "child", "junior", "youth", "nuori"]
    adult_keywords = ["adult", "aikuinen", "18+", "21+", "mature"]
    senior_keywords = ["senior", "eläkeläinen", "elderly", "retiree"]
    student_keywords = ["student", "opiskelija", "university", "school", "campus"]
    general_keywords = ["everyone", "kaikki", "public", "yleisö", "all ages", "general"]

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
    return "Unknown"

def detect_demographics(event):
    # A list of all relevant groups that might be interested in or represented at the event.
    # Example keywords for demographics
    youth_keywords = ["youth", "junior", "nuori", "teen", "teini"]
    family_keywords = ["family", "perhe", "children", "kids", "lapsi"]
    senior_keywords = ["senior", "eläkeläinen", "elderly", "retiree"]
    lgbtq_keywords = ["lgbt", "pride", "rainbow", "queer"]
    international_keywords = ["international", "expat", "foreigner", "english", "englanti"]

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