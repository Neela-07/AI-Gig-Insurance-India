from flask import Blueprint, request, jsonify
from services.payout_service import calculate_payout

payout_bp = Blueprint('payout', __name__)

@payout_bp.route('/payout/simulate', methods=['POST'])
def simulate_payout():
    """Simulate a payout for an approved claim."""
    data = request.get_json() or {}
    
    event_type = data.get('event_type', 'rain')
    severity = float(data.get('severity', 0.7))
    coverage = float(data.get('coverage', 50000))
    
    result = calculate_payout(
        event_type=event_type,
        severity=severity,
        coverage=coverage,
    )
    
    return jsonify(result)
