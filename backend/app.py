"""
SmartShield AI — Flask Backend
Parametric Insurance Platform for Gig Workers
"""

import os
import sys

# Ensure services and utils are importable
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()


def create_app():
    app = Flask(__name__)
    
    # Enable CORS for frontend dev server
    CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])
    
    # Register all blueprints
    from routes.risk import risk_bp
    from routes.trigger import trigger_bp
    from routes.premium import premium_bp
    from routes.claims import claims_bp
    from routes.fraud import fraud_bp
    from routes.payout import payout_bp
    from routes.admin import admin_bp
    from routes.auth import auth_bp
    
    app.register_blueprint(risk_bp)
    app.register_blueprint(trigger_bp)
    app.register_blueprint(premium_bp)
    app.register_blueprint(claims_bp)
    app.register_blueprint(fraud_bp)
    app.register_blueprint(payout_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(auth_bp)
    
    @app.route('/health')
    def health():
        return jsonify({"status": "ok", "service": "SmartShield AI Backend"})
    
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found"}), 404
    
    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error", "details": str(e)}), 500
    
    return app


if __name__ == '__main__':
    # Warm up the fraud detection ML model on startup
    print("[SmartShield] Warming up fraud detection model...")
    try:
        from services.fraud_service import warm_up
        warm_up()
        print("[SmartShield] ML model ready ✅")
    except Exception as e:
        print(f"[SmartShield] Warning: ML model warm-up failed: {e}")
    
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    
    print(f"\n{'='*50}")
    print("  SmartShield AI Backend")
    print(f"  Running on http://localhost:{port}")
    print(f"{'='*50}\n")
    
    app.run(debug=True, port=port, host='0.0.0.0')
