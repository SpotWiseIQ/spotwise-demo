from datetime import datetime
from typing import Optional, Dict, Any
import requests


class WeatherMeteo:
    def __init__(self, api_url: str = "https://api.open-meteo.com/v1/forecast"):
        self.api_url = api_url

    def get_weather(
        self,
        latitude: float,
        longitude: float,
        date: str,
        timezone: str = "Europe/Helsinki",
        daily: str = "temperature_2m_max,temperature_2m_min,precipitation_sum",
        extra_params: Optional[Dict[str, Any]] = None
    ) -> dict:
        """
        Fetch weather data for a given location and date.
        Returns empty dict if date is more than 16 days from now.
        """
        # Extract date part if ISO 8601 string is provided
        try:
            if "T" in date:
                date_obj = datetime.fromisoformat(date.replace("Z", "+00:00"))
            else:
                date_obj = datetime.strptime(date, "%Y-%m-%d")
        except Exception:
            return {}

        # Check if date is more than 16 days from now
        today = datetime.now(date_obj.tzinfo)
        if (date_obj - today).days > 16:
            return {}

        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": date_obj.strftime("%Y-%m-%d"),
            "end_date": date_obj.strftime("%Y-%m-%d"),
            "daily": daily,
            "timezone": timezone
        }
        if extra_params:
            params.update(extra_params)

        import requests
        response = requests.get(self.api_url, params=params)
        response.raise_for_status()
        return response.json()
    
    from datetime import datetime

    @staticmethod
    def extract_weather_for_date(weather_response: dict, date: str) -> str:
        """
        Returns the max temperature as a string for the given date from the Open-Meteo API response.
        Handles ISO 8601 date strings by extracting the date part.
        """
        try:
            # Extract date part if ISO 8601 string is provided
            if "T" in date:
                date_obj = datetime.fromisoformat(date.replace("Z", "+00:00"))
                date_str = date_obj.strftime("%Y-%m-%d")
            else:
                date_str = date

            daily = weather_response.get("daily", {})
            times = daily.get("time", [])
            if date_str in times:
                idx = times.index(date_str)
                temp_max_list = daily.get("temperature_2m_max", [])
                if temp_max_list and idx < len(temp_max_list):
                    return str(temp_max_list[idx])
            return ""
        except Exception:
            return ""


# # Example usage and test:
# if __name__ == "__main__":
#     client = WeatherMeteo()
#     # Example: Helsinki, 2024-06-19
#     latitude = 60.1699
#     longitude = 24.9384
#     date = "2025-06-30T16:15:00.000Z"
#     weather = client.get_weather(latitude, longitude, date)
#     print(weather)
