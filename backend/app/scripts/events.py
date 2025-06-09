import requests
import json


def fetch_and_save_events(start_date: str, end_date: str):
    """
    Fetches events from the Tampere API and saves the raw JSON response to a file.
    """
    url = (
        "https://tapahtumat.tampere.fi/api/collection/634844c32f41a024ee51a234/content"
    )

    # Parameters from the curl command's URL
    params = {
        "lang": "en",
        "country": "FI",
        "end": end_date,
        "mode": "",
        "q": "",
        "sort": "startDate",
        "start": start_date,
    }

    print("Fetching data from the API...")
    try:
        # Make the GET request
        response = requests.get(url, params=params)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)

        # Parse the JSON response
        data = response.json()

        # Save the raw data directly to a JSON file
        file_name = f"data/events_{start_date}_{end_date}.json"
        with open(file_name, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

        print(f"\u2705 Data successfully fetched and saved to '{file_name}'")

    except requests.exceptions.RequestException as e:
        print(f"\u274c An error occurred during the request: {e}")
    except ValueError:
        print("\u274c Failed to parse JSON response.")


if __name__ == "__main__":
    fetch_and_save_events("1.6.2025", "30.6.2025")
