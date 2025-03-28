import json
from collections import defaultdict, Counter
from datetime import datetime

class LocationAggregator:
    def __init__(self, scored_events):
        """
        scored_events: List of event dicts, each with 'fullEventData' containing event info.
        """
        self.scored_events = scored_events

    def normalize_location(self, loc):
        # Use address as key, fallback to rounded lat/lng if needed
        if loc.get("address"):
            return loc["address"].strip().lower()
        return f"{round(loc['lat'], 4)},{round(loc['lng'], 4)}"

    def aggregate(self):
        location_groups = defaultdict(list)
        for event in self.scored_events:
            loc = event["fullEventData"]["location"]
            key = self.normalize_location(loc)
            location_groups[key].append(event["fullEventData"])

        aggregated = []
        for loc_key, events in location_groups.items():
            total_events = len(events)
            total_views = sum(e.get("views", 0) for e in events)
            avg_views = total_views / total_events if total_events else 0
            event_types = set(cat for e in events for cat in e.get("globalContentCategories", []))
            audience_types = [e.get("audienceType", "Unknown") for e in events]
            primary_audience_type = Counter(audience_types).most_common(1)[0][0] if audience_types else "Unknown"
            demographics = []
            for e in events:
                demographics.extend(e.get("demographics", []))
            demographics_counter = Counter(demographics)
            top_demographics = [d for d, _ in demographics_counter.most_common(3)]
            day_types = [e.get("dayType", "unknown") for e in events]
            peak_day_type = Counter(day_types).most_common(1)[0][0] if day_types else "unknown"
            times_of_day = [e.get("timeOfDay", "other") for e in events]
            peak_time_of_day = Counter(times_of_day).most_common(1)[0][0] if times_of_day else "other"
            months = []
            for e in events:
                try:
                    dt = datetime.fromisoformat(e.get("startDate", "")[:10])
                    months.append(dt.strftime("%B"))
                except Exception:
                    continue
            month_counter = Counter(months)
            top_months = [m for m, _ in month_counter.most_common(3)]
            available_spots = max(e.get("availableSpotsNearby", 0) for e in events)
            weather_types = set(e.get("weather", "N/A") for e in events)

            aggregated.append({
                "locationKey": loc_key,
                "address": events[0]["location"]["address"],
                "lat": events[0]["location"]["lat"],
                "lng": events[0]["location"]["lng"],
                "totalEvents": total_events,
                "totalViews": total_views,
                "avgViews": avg_views,
                "eventTypes": list(event_types),
                "primaryAudienceType": primary_audience_type,
                "topDemographics": top_demographics,
                "peakDayType": peak_day_type,
                "peakTimeOfDay": peak_time_of_day,
                "seasonality": top_months,
                "availableSpotsNearby": available_spots,
                "weatherTypes": list(weather_types),
            })
        return aggregated

    @staticmethod
    def from_json_file(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            scored_events = json.load(f)
        return LocationAggregator(scored_events)

    def to_json_file(self, output_path, aggregated_data):
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(aggregated_data, f, ensure_ascii=False, indent=2)