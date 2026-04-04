"""
Risk Engine — AI-powered premium and risk score calculation.

Formula:
  Risk Score = (Zone Risk × 0.4) + (Claim Freq × 0.4) + (Work Inconsistency × 0.2)
  Premium    = Base × (1 + Risk Score × 0.8)
"""

BASE_PREMIUM = 50
MAX_PREMIUM = 999

def calculate_risk_score(zone_risk: float, claim_frequency: float, work_consistency: float) -> float:
    """
    Calculate normalized risk score [0, 1].
    
    Args:
        zone_risk: 0.0–1.0 (delivery area danger)
        claim_frequency: 0.0–1.0 (historical claim rate)
        work_consistency: 0.0–1.0 (higher = more regular = less risk)
    
    Returns:
        Risk score [0, 1]
    """
    work_inconsistency = 1.0 - work_consistency
    score = (zone_risk * 0.4) + (claim_frequency * 0.4) + (work_inconsistency * 0.2)
    return round(min(1.0, max(0.0, score)), 4)

def calculate_premium(zone_risk: float, claim_frequency: float, work_consistency: float) -> dict:
    """Calculate weekly premium and safety score details."""
    work_inconsistency = 1.0 - work_consistency
    risk_score_raw = (zone_risk * 0.4) + (claim_frequency * 0.4) + (work_inconsistency * 0.2)
    risk_pct = round(min(1.0, max(0.0, risk_score_raw)) * 100)
    
    # Convert to Safety Score mapping where 100 is best
    safety_score = 100 - risk_pct
    
    # New 4-Tier Pricing Model based on Safety Score
    if safety_score >= 90:
        # Micro AI: Adaptive ₹50-₹80
        plan = "Micro AI"
        level = "Safe Worker"
        # Scale 80 (score=90) to 50 (score=100)
        premium = 80 - round((safety_score - 90) * 3)
    elif safety_score >= 75:
        # Basic: ₹120
        plan = "Basic"
        level = "Reliable Worker"
        premium = 120
    elif safety_score >= 50:
        # Standard: ₹249
        plan = "Standard"
        level = "Normal Worker"
        premium = 249
    else:
        # Premium: ₹399
        plan = "Premium"
        level = "High Risk"
        premium = 399
    
    return {
        "risk_score": safety_score,
        "risk_pct": safety_score,
        "risk_level": level,
        "base_premium": BASE_PREMIUM,
        "premium": premium,
        "recommended_plan": plan,
        "inputs": {
            "zone_risk": zone_risk,
            "claim_frequency": claim_frequency,
            "work_consistency": work_consistency,
        },
    }

# Trigger thresholds
THRESHOLDS = {
    "rain_mm": 40,
    "temp_c": 42,
    "aqi": 300,
    "traffic_pct": 80,
}

def check_triggers(rain_mm=0, temp_c=0, aqi=0, traffic_pct=0) -> dict:
    """Check which parametric conditions are breached."""
    triggered = []
    details = {}
    
    if rain_mm > THRESHOLDS["rain_mm"]:
        triggered.append("rain")
        details["rain"] = {"value": rain_mm, "threshold": THRESHOLDS["rain_mm"]}
    
    if temp_c > THRESHOLDS["temp_c"]:
        triggered.append("heat")
        details["heat"] = {"value": temp_c, "threshold": THRESHOLDS["temp_c"]}
    
    if aqi > THRESHOLDS["aqi"]:
        triggered.append("aqi")
        details["aqi"] = {"value": aqi, "threshold": THRESHOLDS["aqi"]}
    
    if traffic_pct > THRESHOLDS["traffic_pct"]:
        triggered.append("traffic")
        details["traffic"] = {"value": traffic_pct, "threshold": THRESHOLDS["traffic_pct"]}
    
    return {
        "triggered": len(triggered) > 0,
        "events": triggered,
        "details": details,
        "primary_event": triggered[0] if triggered else None,
    }
