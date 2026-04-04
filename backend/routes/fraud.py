from flask import Blueprint, request, jsonify
from services.fraud_service import check_fraud

fraud_bp = Blueprint('fraud', __name__)

@fraud_bp.route('/fraud/check', methods=['POST'])
def check_fraud_route():
    """Run ML fraud detection on a claim."""
    data = request.get_json() or {}
    
    result = check_fraud(
        claim_frequency=float(data.get('claim_frequency', 0.3)),
        unusual_timing=float(data.get('unusual_timing', 0.2)),
        gps_mismatch=float(data.get('gps_mismatch', 0.1)),
        rapid_succession=float(data.get('rapid_succession', 0.25)),
        amount_anomaly=float(data.get('amount_anomaly', 0.15)),
    )
    
    claim_id = data.get('claim_id', 'CLM-UNKNOWN')
    result['claim_id'] = claim_id
    
    return jsonify(result)
