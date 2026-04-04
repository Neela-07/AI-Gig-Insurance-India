from flask import Blueprint, jsonify, request
from datetime import datetime
from services.external_api import get_live_weather_and_aqi, calculate_traffic_density
from utils.db import get_supabase_client

risk_bp = Blueprint('risk', __name__)

DEFAULT_LAT = 19.0760
DEFAULT_LON = 72.8777

@risk_bp.route('/risk/live', methods=['GET'])
def get_live_risk():
    """Get live environmental risk data. Accepts lat/lon for user location."""

    # Accept user coordinates if provided
    try:
        lat = float(request.args.get('lat', DEFAULT_LAT))
        lon = float(request.args.get('lon', DEFAULT_LON))
    except (TypeError, ValueError):
        lat, lon = DEFAULT_LAT, DEFAULT_LON

    city_name = request.args.get('city', 'Your Location')

    # 1. Fetch real-world baseline data
    live_data = get_live_weather_and_aqi(lat=lat, lon=lon)
    current_hour = datetime.now().hour
    live_data["traffic_pct"] = calculate_traffic_density(current_hour)

    live_data["zone"] = city_name
    live_data["timestamp"] = datetime.now().strftime("%I:%M %p")

    # 2. Log to Database for History
    try:
        supabase = get_supabase_client()
        supabase.table("risk_telemetry").insert({
            "zone_name": live_data["zone"],
            "temperature_c": live_data["temp_c"],
            "rainfall_mm": live_data["rain_mm"],
            "aqi_value": live_data["aqi"],
            "traffic_density_pct": live_data["traffic_pct"]
        }).execute()
    except Exception as e:
        print(f"[SmartShield] Telemetry log error: {e}")

    return jsonify(live_data)
