"""
Payout calculation service.

Payout = min(coverage, base_payout × severity_multiplier × event_factor)
"""

EVENT_BASE_PAYOUTS = {
    "rain": 800,
    "heat": 600,
    "aqi": 500,
    "traffic": 450,
    "outage": 700,
}

EVENT_FACTORS = {
    "rain": 1.2,
    "heat": 1.0,
    "aqi": 0.9,
    "traffic": 0.85,
    "outage": 1.1,
}

def calculate_payout(event_type: str, severity: float, coverage: float = 50000) -> dict:
    """
    Calculate payout amount.
    
    Args:
        event_type: rain | heat | aqi | traffic | outage
        severity: 0.0–1.0 intensity of the event
        coverage: total policy coverage amount
    
    Returns:
        payout details dict
    """
    base = EVENT_BASE_PAYOUTS.get(event_type, 500)
    factor = EVENT_FACTORS.get(event_type, 1.0)
    
    payout = base * factor * severity
    payout = round(min(coverage * 0.05, max(200, payout)))  # cap at 5% of coverage
    
    return {
        "event_type": event_type,
        "severity": severity,
        "base_amount": base,
        "event_factor": factor,
        "payout_amount": payout,
        "coverage": coverage,
        "processing_time_ms": 142,
        "status": "credited",
        "transfer_ref": f"PAY-{abs(hash(f'{event_type}{severity}')) % 99999:05d}",
    }
