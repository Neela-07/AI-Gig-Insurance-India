import requests
from datetime import datetime

# Default fallback coordinates (Mumbai)
DEFAULT_LATITUDE = 19.0760
DEFAULT_LONGITUDE = 72.8777

def get_live_weather_and_aqi(lat: float = DEFAULT_LATITUDE, lon: float = DEFAULT_LONGITUDE):
    """
    Fetches real-time environmental data via Open-Meteo API.
    Accepts user lat/lon for location-aware weather. No API key required.
    """
    try:
        # Detect timezone from coordinates (best-effort via timezonefinder logic)
        # Open-Meteo auto-detects timezone if we pass auto
        weather_url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,precipitation"
            f"&timezone=auto"
        )
        weather_res = requests.get(weather_url, timeout=5)
        weather_res.raise_for_status()
        weather_data = weather_res.json()

        current_temp = weather_data['current']['temperature_2m']
        current_rain = weather_data['current']['precipitation']

        # Fetch current air quality
        aqi_url = (
            f"https://air-quality-api.open-meteo.com/v1/air-quality"
            f"?latitude={lat}&longitude={lon}"
            f"&current=us_aqi"
            f"&timezone=auto"
        )
        aqi_res = requests.get(aqi_url, timeout=5)
        aqi_res.raise_for_status()
        aqi_data = aqi_res.json()

        current_aqi = aqi_data['current']['us_aqi']

        return {
            "temp_c": current_temp,
            "rain_mm": current_rain,
            "aqi": current_aqi,
        }
    except Exception as e:
        print(f"[SmartShield] Failed to fetch external APIs: {e}")
        return {
            "temp_c": 30.0,
            "rain_mm": 0.0,
            "aqi": 80,
        }


def calculate_traffic_density(hour: int) -> int:
    """
    Heuristic traffic density based on time-of-day (India general pattern).
    """
    if 8 <= hour <= 10 or 17 <= hour <= 20:
        return 85  # Peak hours
    elif 11 <= hour <= 16:
        return 55  # Mid-day
    elif 6 <= hour <= 7 or 21 <= hour <= 23:
        return 35  # Early morning / late evening
    else:
        return 15  # Night time
