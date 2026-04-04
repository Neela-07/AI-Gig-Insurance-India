from flask import Blueprint, request, jsonify
from datetime import datetime
from utils.db import get_supabase_client
from services.risk_engine import check_triggers

claims_bp = Blueprint('claims', __name__)

@claims_bp.route('/claim/trigger', methods=['POST'])
def trigger_claim():
    """Trigger a new claim based on parametric conditions."""
    data = request.get_json() or {}
    
    worker_id = data.get('worker_id', 'WRK-UNKNOWN')
    event_type = data.get('event_type', 'rain')
    
    claim_id = f"CLM-{abs(hash(f'{worker_id}{datetime.now().isoformat()}')) % 99999:05d}"
    
    claim_record = {
        "id": claim_id,
        "worker_id": worker_id,
        "event_type": event_type,
        "status": "approved",
        "payout_amount": data.get("payout_amount", 600),
        "triggered_at": datetime.now().isoformat(),
        "fraud_score": 0.14,
        "description": f"Simulated {event_type} event claim",
    }
    
    try:
        supabase = get_supabase_client()
        supabase.table("claims").insert(claim_record).execute()
    except Exception as e:
        print(f"[SmartShield] Error inserting claim to Supabase: {e}")
    
    return jsonify({
        "claim_id": claim_id,
        "worker_id": worker_id,
        "event_type": event_type,
        "status": "processing",
        "triggered_at": claim_record["triggered_at"],
        "message": f"Claim {claim_id} initiated — proceeding to fraud detection",
        "next_step": "fraud_check",
    })

@claims_bp.route('/claims', methods=['GET'])
def get_claims():
    """Get claim history for a worker."""
    worker_id = request.args.get('worker_id', 'WRK-8821')
    try:
        supabase = get_supabase_client()
        response = supabase.table("claims").select("*").eq("worker_id", worker_id).order("triggered_at", desc=True).execute()
        claims = response.data
    except Exception as e:
        print(f"[SmartShield] Error fetching claims from Supabase: {e}")
        claims = []
        
    return jsonify({"claims": claims, "total": len(claims)})
