from flask import Blueprint, request, jsonify
from services.risk_engine import check_triggers
from utils.db import get_supabase_client

trigger_bp = Blueprint('trigger', __name__)

@trigger_bp.route('/trigger/validate', methods=['POST'])
def validate_trigger():
    """Validate if parametric conditions trigger a claim."""
    data = request.get_json() or {}
    
    rain_mm = data.get('rain_mm')
    temp_c = data.get('temp_c')
    aqi = data.get('aqi')
    traffic_pct = data.get('traffic_pct')
    worker_id = data.get('worker_id', 'UNKNOWN')

    # If telemetry not provided, fetch the absolute latest from the Risk Telemetry table
    if rain_mm is None or temp_c is None:
        try:
            supabase = get_supabase_client()
            res = supabase.table("risk_telemetry").select("*").order("recorded_at", desc=True).limit(1).execute()
            if res.data:
                latest = res.data[0]
                rain_mm = rain_mm if rain_mm is not None else float(latest.get('rainfall_mm', 0))
                temp_c = temp_c if temp_c is not None else float(latest.get('temperature_c', 0))
                aqi = aqi if aqi is not None else float(latest.get('aqi_value', 0))
                traffic_pct = traffic_pct if traffic_pct is not None else float(latest.get('traffic_density_pct', 0))
        except Exception as e:
            print(f"[SmartShield] Trigger DB fallback error: {e}")

    # Ensure defaults if still None
    rain_mm = float(rain_mm or 0)
    temp_c = float(temp_c or 0)
    aqi = float(aqi or 0)
    traffic_pct = float(traffic_pct or 0)

    result = check_triggers(
        rain_mm=rain_mm,
        temp_c=temp_c,
        aqi=aqi,
        traffic_pct=traffic_pct,
    )
    
    if result['triggered']:
        events = ', '.join(result['events']).upper()
        message = f"🚨 Conditions breached ({events}) — Claim auto-triggered for {worker_id}"
        status = "triggered"
    else:
        message = "✅ All conditions within safe thresholds — No claim needed"
        status = "safe"
    
    return jsonify({
        "status": status,
        "worker_id": worker_id,
        "message": message,
        **result,
    })
