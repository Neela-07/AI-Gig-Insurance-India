from flask import Flask, jsonify
from flask_cors import CORS
import os

# Import Blueprints from routes
from routes.auth import auth_bp
from routes.claims import claims_bp
from routes.fraud import fraud_bp
from routes.payout import payout_bp
from routes.premium import premium_bp
from routes.risk import risk_bp
from routes.trigger import trigger_bp

# Import Warmup for ML model
from services.fraud_service import warm_up

app = Flask(__name__)
CORS(app) # Enable CORS for all routes (frontend integration)

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(claims_bp)
app.register_blueprint(fraud_bp)
app.register_blueprint(payout_bp)
app.register_blueprint(premium_bp)
app.register_blueprint(risk_bp)
app.register_blueprint(trigger_bp)

@app.route('/')
def home():
    return jsonify({
        "name": "SmartShield AI API",
        "status": "online",
        "version": "1.0.0",
        "description": "AI-powered parametric insurance platform for gig workers."
    })

if __name__ == '__main__':
    print("[SmartShield] Initializing AI models...")
    warm_up()
    
    port = int(os.environ.get("PORT", 5000))
    print(f"[SmartShield] Backend starting on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
