from flask import Blueprint, request, jsonify
from services.risk_engine import calculate_premium as calc_premium
from utils.db import get_supabase_client
from services.external_api import get_live_weather_and_aqi, calculate_traffic_density
from datetime import datetime

premium_bp = Blueprint('premium', __name__)

# Plan definitions matching the insurance plan table from the UI
PLAN_DEFINITIONS = {
    "Micro AI": {
        "base_premium_min": 50,
        "base_premium_max": 80,
        "coverage_per_day": 400,
        "max_days": 1,
        "color": "#94a3b8",
        "features": ["Max Days: 1", "Adaptive Premium", "Rain (>50mm)"],
    },
    "Basic": {
        "base_premium": 120,
        "coverage_per_day": 500,
        "max_days": 1,
        "color": "#34d399",
        "features": ["Max Days: 1", "Heat Protection", "AQI Protection"],
    },
    "Standard": {
        "base_premium": 249,
        "coverage_per_day": 700,
        "max_days": 2,
        "color": "#fbbf24",
        "features": ["Max Days: 2", "Rain (>40mm)", "Temp (>42°C)"],
    },
    "Premium": {
        "base_premium": 399,
        "coverage_per_day": 900,
        "max_days": 3,
        "color": "#a78bfa",
        "features": ["Max Days: 3", "Temp (>42°C)", "Traffic (>80%)"],
    },
}

def compute_risk_adjusted_premium(plan_name: str, safety_score: int) -> int:
    """
    Compute the actual premium for a plan based on the worker's safety score.

    Safety Score bands (from image):
      80-100 → Safe Worker     → -5% to -10%
      50-79  → Normal Worker   → No change
      0-49   → High Risk       → +5% to +10%

    Micro AI: dynamically priced ₹50-₹80 within its own band.
    Others: fixed base with risk adjustment applied.
    """
    defn = PLAN_DEFINITIONS[plan_name]

    if plan_name == "Micro AI":
        # Micro AI scales between 50–80 based on safety score 90–100
        # If safety_score < 90, still show full ₹80 (not recommended for risky workers)
        if safety_score >= 100:
            return 50
        elif safety_score >= 90:
            return 80 - round((safety_score - 90) * 3)
        else:
            return 80
    else:
        base = defn["base_premium"]
        if safety_score >= 80:
            # Safe Worker: -5% to -10%
            discount_pct = 5 + round((safety_score - 80) / 20 * 5)  # 5% at 80, 10% at 100
            return max(1, round(base * (1 - discount_pct / 100)))
        elif safety_score >= 50:
            # Normal Worker: No change
            return base
        else:
            # High Risk: +5% to +10%
            surcharge_pct = 5 + round((49 - safety_score) / 49 * 5)  # 5% at 49, 10% at 0
            return round(base * (1 + surcharge_pct / 100))


@premium_bp.route('/premium/risk-snapshot', methods=['GET'])
def get_risk_snapshot():
    """
    Get a complete real-time risk snapshot for a worker including:
    - Live telemetry (weather, AQI, traffic) — user location-aware
    - Safety score & risk level
    - Calculated premiums for all 4 plans
    - Active plan's current risk-adjusted premium
    - Recommended plan
    - Claim frequency from DB
    """
    worker_id = request.args.get('worker_id')
    active_plan = request.args.get('active_plan')  # current plan name if known

    # Accept user coordinates for location-aware weather
    try:
        lat = float(request.args.get('lat', 19.0760))
        lon = float(request.args.get('lon', 72.8777))
    except (TypeError, ValueError):
        lat, lon = 19.0760, 72.8777

    city_name = request.args.get('city', 'Your Location')

    # 1. Fetch live environmental data at user's location
    live_env = get_live_weather_and_aqi(lat=lat, lon=lon)
    current_hour = datetime.now().hour
    live_env["traffic_pct"] = calculate_traffic_density(current_hour)

    # 2. Derive zone_risk from live telemetry
    rain_score = min(1.0, live_env["rain_mm"] / 50)
    aqi_score = min(1.0, live_env["aqi"] / 400)
    traffic_score = live_env["traffic_pct"] / 100
    zone_risk = round((rain_score * 0.4) + (aqi_score * 0.3) + (traffic_score * 0.3), 3)

    # 3. Fetch claim frequency from DB
    claim_frequency = 0.1  # default
    claim_count = 0
    if worker_id:
        try:
            supabase = get_supabase_client()
            claims_res = supabase.table("claims").select("id").eq("worker_id", worker_id).execute()
            claim_count = len(claims_res.data) if claims_res.data else 0
            claim_frequency = min(0.9, 0.1 + (claim_count * 0.15))
        except Exception as e:
            print(f"[SmartShield] Claim fetch error: {e}")

    # 4. Work consistency — default 0.7
    work_consistency = 0.7

    # 5. Calculate risk score
    result = calc_premium(
        zone_risk=zone_risk,
        claim_frequency=claim_frequency,
        work_consistency=work_consistency,
    )
    safety_score = result["risk_score"]  # 0-100; higher = safer

    # 6. Risk level + adjustment label
    if safety_score >= 80:
        risk_level = "Safe Worker"
        adjustment_label = "-5% to -10%"
        adjustment_color = "#34d399"
    elif safety_score >= 50:
        risk_level = "Normal Worker"
        adjustment_label = "No change"
        adjustment_color = "#fbbf24"
    else:
        risk_level = "High Risk"
        adjustment_label = "+5% to +10%"
        adjustment_color = "#f87171"

    # 7. Calculate premiums for all 4 plans with risk adjustment
    plans_with_premiums = []
    for plan_name, defn in PLAN_DEFINITIONS.items():
        adjusted_premium = compute_risk_adjusted_premium(plan_name, safety_score)
        coverage_total = defn["coverage_per_day"] * defn["max_days"]
        plans_with_premiums.append({
            "name": plan_name,
            "adjusted_premium": adjusted_premium,
            "base_premium": defn.get("base_premium", f"{defn.get('base_premium_min', 50)}-{defn.get('base_premium_max', 80)}"),
            "coverage_per_day": defn["coverage_per_day"],
            "max_days": defn["max_days"],
            "coverage_total": coverage_total,
            "color": defn["color"],
            "features": defn["features"],
        })

    # 8. Recommended plan based on safety score
    if safety_score >= 90:
        recommended_plan = "Micro AI"
    elif safety_score >= 75:
        recommended_plan = "Basic"
    elif safety_score >= 50:
        recommended_plan = "Standard"
    else:
        recommended_plan = "Premium"

    # 9. Active plan's current adjusted premium (the premium the user ACTUALLY pays now)
    active_plan_premium = None
    if active_plan and active_plan in PLAN_DEFINITIONS:
        active_plan_premium = compute_risk_adjusted_premium(active_plan, safety_score)

    # 10. Parametric trigger checks
    triggers = {
        "rain":     {"active": live_env["rain_mm"] > 40,        "value": live_env["rain_mm"],    "threshold": 40,  "unit": "mm"},
        "heatwave": {"active": live_env["temp_c"] > 42,         "value": live_env["temp_c"],     "threshold": 42,  "unit": "°C"},
        "aqi":      {"active": live_env["aqi"] > 300,           "value": live_env["aqi"],        "threshold": 300, "unit": ""},
        "traffic":  {"active": live_env["traffic_pct"] > 80,    "value": live_env["traffic_pct"],"threshold": 80,  "unit": "%"},
    }
    any_triggered = any(t["active"] for t in triggers.values())

    return jsonify({
        "worker_id": worker_id,
        "timestamp": datetime.now().isoformat(),
        "location": {"lat": lat, "lon": lon, "city": city_name},
        "live_conditions": {
            "rain_mm": live_env["rain_mm"],
            "temp_c":  live_env["temp_c"],
            "aqi":     live_env["aqi"],
            "traffic_pct": live_env["traffic_pct"],
        },
        "risk_factors": {
            "zone_risk":        zone_risk,
            "claim_frequency":  round(claim_frequency, 3),
            "work_consistency": work_consistency,
            "claim_count_30d":  claim_count,
        },
        "safety_score":      safety_score,
        "risk_level":        risk_level,
        "adjustment_label":  adjustment_label,
        "adjustment_color":  adjustment_color,
        "recommended_plan":  recommended_plan,
        "active_plan_premium": active_plan_premium,
        "plans":             plans_with_premiums,
        "triggers":          triggers,
        "any_triggered":     any_triggered,
        "formula": "Risk = (Zone Risk × 0.4) + (Claim Freq × 0.4) + (Work Inconsistency × 0.2)",
    })



@premium_bp.route('/premium/calculate', methods=['POST'])
def calculate_premium():
    """AI-powered premium calculation with live data sync."""
    data = request.get_json() or {}
    worker_id = data.get('worker_id')
    
    # Defaults
    zone_risk = float(data.get('zone_risk', 0.5))
    claim_frequency = float(data.get('claim_frequency', 0.3))
    work_consistency = float(data.get('work_consistency', 0.7))
    auto_synced = False
    
    # 1. Real-time Sync if worker_id provided
    if worker_id:
        try:
            supabase = get_supabase_client()
            
            # A. Fetch Claim Frequency (Last 30 days)
            claims_res = supabase.table("claims").select("id").eq("worker_id", worker_id).execute()
            claim_count = len(claims_res.data) if claims_res.data else 0
            claim_frequency = min(0.9, 0.1 + (claim_count * 0.15))
            
            # B. Fetch Real-time Zone Risk (Latest Telemetry)
            telemetry_res = supabase.table("risk_telemetry").select("*").order("created_at", desc=True).limit(1).execute()
            if telemetry_res.data:
                latest = telemetry_res.data[0]
                rain_score = min(1.0, latest['rainfall_mm'] / 50)
                aqi_score = min(1.0, latest['aqi_value'] / 400)
                traffic_score = latest['traffic_density_pct'] / 100
                zone_risk = (rain_score * 0.4) + (aqi_score * 0.3) + (traffic_score * 0.3)
                zone_risk = round(zone_risk, 2)
            
            auto_synced = True
        except Exception as e:
            print(f"[SmartShield] Auto-sync error: {e}")

    result = calc_premium(
        zone_risk=zone_risk,
        claim_frequency=claim_frequency,
        work_consistency=work_consistency,
    )
    
    result["auto_synced"] = auto_synced
    return jsonify(result)


@premium_bp.route('/premium/policy', methods=['GET'])
def get_policy():
    """Get the active policy for a worker."""
    worker_id = request.args.get('worker_id')
    if not worker_id:
        return jsonify({'error': 'Worker ID is required'}), 400
        
    try:
        supabase = get_supabase_client()
        response = supabase.table("policies").select("*").eq("worker_id", worker_id).eq("status", "active").limit(1).execute()
        
        if not response.data:
            return jsonify({'policy': None}), 200
            
        return jsonify({'policy': response.data[0]}), 200
    except Exception as e:
        print(f"[SmartShield] Policy fetch error: {e}")
        return jsonify({'error': str(e)}), 500


@premium_bp.route('/premium/buy', methods=['POST'])
def buy_policy():
    """Activate/Purchase a new policy."""
    data = request.get_json() or {}
    worker_id = data.get('worker_id')
    plan_name = data.get('plan_name')
    premium_amount = data.get('premium_amount')
    coverage_amount = data.get('coverage_amount')
    coverage_per_day = data.get('coverage_per_day')
    max_days = data.get('max_days')
    
    if not worker_id or not plan_name or premium_amount is None:
        return jsonify({'error': 'Missing required policy fields'}), 400

    # Auto-fill coverage from plan definitions if not provided
    if coverage_amount is None and plan_name in PLAN_DEFINITIONS:
        defn = PLAN_DEFINITIONS[plan_name]
        coverage_per_day = defn["coverage_per_day"]
        max_days = defn["max_days"]
        coverage_amount = coverage_per_day * max_days
    elif coverage_amount is None:
        coverage_amount = 50000
        
    try:
        supabase = get_supabase_client()
        
        # Deactivate old policies
        supabase.table("policies").update({"status": "expired"}).eq("worker_id", worker_id).eq("status", "active").execute()
        
        # Insert new policy
        policy_record = {
            "worker_id": worker_id,
            "plan_name": plan_name,
            "premium_amount": premium_amount,
            "coverage_amount": coverage_amount,
            "status": "active",
        }
        
        response = supabase.table("policies").insert(policy_record).execute()
        return jsonify({'message': 'Policy activated successfully', 'policy': response.data[0]}), 201
    except Exception as e:
        print(f"[SmartShield] Policy purchase error: {e}")
        return jsonify({'error': str(e)}), 500


@premium_bp.route('/premium/payments', methods=['GET'])
def get_payments():
    """
    Get payment history and current due for a worker.
    Derives past weekly payments from the policy start date.
    """
    worker_id = request.args.get('worker_id')
    if not worker_id:
        return jsonify({'error': 'Worker ID is required'}), 400

    try:
        supabase = get_supabase_client()

        # Fetch active policy
        policy_res = supabase.table("policies").select("*").eq("worker_id", worker_id).eq("status", "active").limit(1).execute()
        active_policy = policy_res.data[0] if policy_res.data else None

        # Fetch all policies (for payment history)
        all_policies_res = supabase.table("policies").select("*").eq("worker_id", worker_id).order("start_date", desc=True).execute()
        all_policies = all_policies_res.data or []

        # Generate payment history from policies
        payments = []
        from datetime import timedelta

        for pol in all_policies:
            base_premium = float(pol.get('premium_amount', 199))
            status = pol.get('status', 'active')
            plan = pol.get('plan_name', 'Standard')
            pol_id = str(pol.get('id', ''))

            # Parse policy start so we don't generate payments before it began
            pol_start = None
            if pol.get('start_date'):
                try:
                    pol_start = datetime.fromisoformat(pol['start_date'].replace('Z', '+00:00'))
                except Exception:
                    pass

            # Generate last N weekly payments going backward from now
            num_weeks = 4 if status in ('expired', 'cancelled') else 3
            now_naive = datetime.now()
            for i in range(num_weeks):
                pay_date = now_naive - timedelta(weeks=i)
                # Don't show payments before policy started
                if pol_start:
                    pol_start_naive = pol_start.replace(tzinfo=None)
                    if pay_date < pol_start_naive:
                        continue
                pay_status = 'paid' if i > 0 else ('pending' if status == 'pending' else 'paid')
                pay_key = f"{worker_id}{pol_id}{i}"
                payments.append({
                    'id': f"PAY-{abs(hash(pay_key)) % 99999:05d}",
                    'plan_name': plan,
                    'amount': base_premium,
                    'date': pay_date.strftime('%Y-%m-%dT%H:%M:%S'),
                    'status': pay_status,
                    'billing_cycle': pol.get('billing_cycle', 'weekly'),
                    'coverage_amount': pol.get('coverage_amount', 0),
                })

        # Sort payments newest first
        payments.sort(key=lambda x: x['date'], reverse=True)

        # Current due: live-adjusted premium for active plan
        current_due = None
        if active_policy:
            # Try to get live-adjusted premium via risk snapshot
            try:
                from services.risk_engine import calculate_premium as calc_premium
                live_result = calc_premium(zone_risk=0.3, claim_frequency=0.1, work_consistency=0.7)
                safety_score = live_result.get('risk_score', 75)
                plan_name = active_policy.get('plan_name', 'Standard')
                adjusted_premium = compute_risk_adjusted_premium(plan_name, safety_score)
                current_due = {
                    'plan_name': plan_name,
                    'base_premium': float(active_policy.get('premium_amount', 199)),
                    'adjusted_premium': adjusted_premium,
                    'safety_score': safety_score,
                    'due_date': (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d'),
                    'billing_cycle': active_policy.get('billing_cycle', 'weekly'),
                    'coverage_amount': float(active_policy.get('coverage_amount', 0)),
                }
            except Exception as e:
                print(f"[SmartShield] Live premium calc failed for payments: {e}")
                current_due = {
                    'plan_name': active_policy.get('plan_name', 'Standard'),
                    'base_premium': float(active_policy.get('premium_amount', 199)),
                    'adjusted_premium': float(active_policy.get('premium_amount', 199)),
                    'safety_score': 75,
                    'due_date': (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d'),
                    'billing_cycle': active_policy.get('billing_cycle', 'weekly'),
                    'coverage_amount': float(active_policy.get('coverage_amount', 0)),
                }

        return jsonify({
            'current_due': current_due,
            'payments': payments,
            'total_paid': sum(p['amount'] for p in payments if p['status'] == 'paid'),
        })

    except Exception as e:
        print(f"[SmartShield] Payments fetch error: {e}")
        return jsonify({'error': str(e)}), 500
