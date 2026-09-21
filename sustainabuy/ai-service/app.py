from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

model = joblib.load("model/eco_score_model.pkl")
le_packaging = joblib.load("model/packaging_encoder.pkl")

@app.route("/predict-score", methods=["POST"])
def predict_score():
    data = request.json
    try:
        packaging_enc = le_packaging.transform([data.get("packaging", "Unknown")])[0]
    except ValueError:
        packaging_enc = 0  # unseen category fallback

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