
def get_mock_admin_stats():
    """Return platform-wide admin statistics."""
    return {
        "total_claims": 365,
        "total_payout": 328000,
        "active_workers": 1240,
        "fraud_blocked": 77,
        "loss_ratio": 0.62,
        "avg_payout": 898,
        "monthly_data": [
            {"month": "Oct", "claims": 42, "payouts": 38000, "fraud_blocked": 8},
            {"month": "Nov", "claims": 58, "payouts": 51000, "fraud_blocked": 12},
            {"month": "Dec", "claims": 71, "payouts": 64000, "fraud_blocked": 15},
            {"month": "Jan", "claims": 49, "payouts": 44000, "fraud_blocked": 9},
            {"month": "Feb", "claims": 63, "payouts": 57000, "fraud_blocked": 14},
            {"month": "Mar", "claims": 82, "payouts": 74000, "fraud_blocked": 19},
        ],
        "claims_by_type": [
            {"name": "Rain", "value": 35},
            {"name": "Heat", "value": 25},
            {"name": "AQI", "value": 20},
            {"name": "Traffic", "value": 15},
            {"name": "Outage", "value": 5},
        ],
    }
