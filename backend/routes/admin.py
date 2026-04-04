from flask import Blueprint, jsonify
from utils.db import get_supabase_client

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin/stats', methods=['GET'])
def get_admin_stats():
    """Get platform-wide admin statistics from live database."""
    try:
        supabase = get_supabase_client()
        
        # 1. Total Claims & Payouts
        claims_res = supabase.table("claims").select("*").execute()
        claims = claims_res.data
        total_claims = len(claims)
        total_payout = sum(c.get('payout_amount', 0) for c in claims if c['status'] == 'credited' or c['status'] == 'approved')
        
        # 2. Total Workers
        users_res = supabase.table("users").select("id").eq("role", "worker").execute()
        active_workers = len(users_res.data)
        
        # 3. Fraud and Rejections
        fraud_blocked = len([c for c in claims if c['status'] == 'rejected'])
        
        # 4. Monthly Trend (Simple bucket for demo)
        # In prod, we'd do a grouped query, but for hackathon demo, we consolidate
        stats = {
            "total_claims": total_claims,
            "total_payout": total_payout,
            "active_workers": active_workers,
            "fraud_blocked": fraud_blocked,
            "loss_ratio": 0.62, # Sample ratio
            "avg_payout": round(total_payout / total_claims) if total_claims > 0 else 0,
            "monthly_data": [
                {"month": "Apr", "claims": total_claims, "payouts": total_payout, "fraud_blocked": fraud_blocked},
            ],
            "claims_by_type": [
                {"name": "Rain", "value": len([c for c in claims if c['event_type'] == 'rain'])},
                {"name": "Heat", "value": len([c for c in claims if c['event_type'] == 'heat'])},
                {"name": "AQI", "value": len([c for c in claims if c['event_type'] == 'aqi'])},
                {"name": "Traffic", "value": len([c for c in claims if c['event_type'] == 'traffic'])},
            ]
        }
        return jsonify(stats)
    except Exception as e:
        print(f"[SmartShield] Admin stats error: {e}")
        return jsonify({"error": str(e)}), 500
