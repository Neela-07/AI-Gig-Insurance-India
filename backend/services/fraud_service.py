"""
Fraud Detection Service using Random Forest classifier.

Feature vector:
  [claim_frequency, unusual_timing, gps_mismatch, rapid_succession, amount_anomaly]

Decision:
  score < 0.4  → approve
  0.4–0.7      → review
  > 0.7        → reject
"""

import os
import pickle
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'fraud_model.pkl')

_model = None

def _train_model():
    """Train a simple Random Forest on synthetic fraud data."""
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.datasets import make_classification
    
    # Generate synthetic training data
    X, y = make_classification(
        n_samples=2000,
        n_features=5,
        n_informative=4,
        n_redundant=1,
        weights=[0.7, 0.3],
        random_state=42,
    )
    
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        random_state=42,
        class_weight='balanced',
    )
    model.fit(X, y)
    
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"[FraudService] Model trained and saved to {MODEL_PATH}")
    return model

def _load_model():
    global _model
    if _model is not None:
        return _model
    
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            _model = pickle.load(f)
        print(f"[FraudService] Model loaded from {MODEL_PATH}")
    else:
        print("[FraudService] No saved model found. Training new model...")
        _model = _train_model()
    
    return _model

def check_fraud(
    claim_frequency: float = 0.3,
    unusual_timing: float = 0.2,
    gps_mismatch: float = 0.1,
    rapid_succession: float = 0.25,
    amount_anomaly: float = 0.15,
) -> dict:
    """
    Run fraud detection on a claim.
    
    Returns:
        fraud_score: 0.0–1.0 probability of fraud
        decision: approve | review | reject
        feature_importance: dict of feature weights
    """
    model = _load_model()
    
    features = np.array([[
        claim_frequency,
        unusual_timing,
        gps_mismatch,
        rapid_succession,
        amount_anomaly,
    ]])
    
    fraud_proba = model.predict_proba(features)[0][1]
    fraud_score = round(float(fraud_proba), 4)
    
    # Decision thresholds
    if fraud_score < 0.4:
        decision = "approve"
        message = "Low fraud risk — Auto-approved"
    elif fraud_score < 0.7:
        decision = "review"
        message = "Moderate fraud risk — Manual review required"
    else:
        decision = "reject"
        message = "High fraud risk — Claim rejected"
    
    feature_names = [
        "claim_frequency", "unusual_timing", "gps_mismatch",
        "rapid_succession", "amount_anomaly"
    ]
    
    # Feature importance from the model
    importances = model.feature_importances_.tolist()
    feature_breakdown = {
        name: round(float(val), 4)
        for name, val in zip(feature_names, importances)
    }
    
    return {
        "fraud_score": fraud_score,
        "decision": decision,
        "message": message,
        "feature_breakdown": feature_breakdown,
        "input_features": {
            name: round(float(val), 4)
            for name, val in zip(feature_names, features[0])
        },
    }

# Initialize model on import
def warm_up():
    _load_model()
