from flask import Flask, request, jsonify
import joblib
import numpy as np
import os

app = Flask(__name__)

# Load model files — if missing, the /predict-score route will return a clear error
# instead of crashing the whole server on startup.
MODEL_PATH = "model/eco_score_model.pkl"
ENCODER_PATH = "model/packaging_encoder.pkl"

model = None
le_packaging = None

if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
    model = joblib.load(MODEL_PATH)
    le_packaging = joblib.load(ENCODER_PATH)
    print("✅ Model loaded successfully.")
else:
    print("⚠️  Model files not found. Run 'python train_model.py' first.")
    print(f"   Expected: {MODEL_PATH}, {ENCODER_PATH}")


@app.route("/", methods=["GET"])
def health():
    """Health check — useful for verifying the AI service is running."""
    if model is not None:
        return jsonify({"status": "ok", "message": "AI service is running and model is loaded."})
    return jsonify({"status": "degraded", "message": "AI service is running but model is NOT loaded. Run train_model.py."}), 503


@app.route("/predict-score", methods=["POST"])
def predict_score():
    if model is None or le_packaging is None:
        return jsonify({
            "error": "Model not loaded. Run 'python train_model.py' inside the ai-service folder first."
        }), 503

    data = request.json
    if not data:
        return jsonify({"error": "No JSON body received."}), 400

    try:
        packaging_enc = le_packaging.transform([data.get("packaging", "Unknown")])[0]
    except ValueError:
        packaging_enc = 0  # unseen packaging category — fallback to 0

    features = np.array([[
        data.get("ingredient_count", 0),
        packaging_enc,
        data.get("energy_100g", 0),
        data.get("fat_100g", 0),
        data.get("sugars_100g", 0),
        data.get("proteins_100g", 0),
        data.get("sodium_100g", 0),
    ]])

    score = model.predict(features)[0]
    return jsonify({"nutrition_score": round(float(score), 2)})


if __name__ == "__main__":
    app.run(port=5001, debug=True)