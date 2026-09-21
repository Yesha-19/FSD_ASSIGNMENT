import pandas as pd

df = pd.read_csv("data/en.openfoodfacts.org.products.tsv", sep="\t", low_memory=False)

# Only select columns that actually exist in this file
desired_cols = ["product_name", "packaging", "ingredients_text", "categories",
                 "nutrition_grade_fr", "nutrition-score-fr_100g",
                 "energy_100g", "fat_100g", "sugars_100g",
                 "proteins_100g", "sodium_100g", "countries", "brands"]

available_cols = [c for c in desired_cols if c in df.columns]
missing_cols = [c for c in desired_cols if c not in df.columns]

print("Using columns:", available_cols)
print("Not found (skipped):", missing_cols)

df = df[available_cols]

# Use nutrition-score-fr_100g as the target (proxy for sustainability score)
df = df.dropna(subset=["nutrition-score-fr_100g"])

df["packaging"] = df["packaging"].fillna("Unknown")
df["ingredients_text"] = df["ingredients_text"].fillna("")
df["categories"] = df["categories"].fillna("Unknown")

df["ingredient_count"] = df["ingredients_text"].apply(lambda x: len(x.split(",")))

df.to_csv("data/cleaned_products.csv", index=False)
print("Cleaned data saved:", df.shape)

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib

# ---- Since dataset is large, sample it for faster training ----
df_sample = df.sample(n=20000, random_state=42) if len(df) > 20000 else df

# Encode categorical text features
le_packaging = LabelEncoder()
df_sample["packaging_enc"] = le_packaging.fit_transform(df_sample["packaging"].astype(str))

# Features & target
feature_cols = ["ingredient_count", "packaging_enc", "energy_100g",
                 "fat_100g", "sugars_100g", "proteins_100g", "sodium_100g"]

X = df_sample[feature_cols].fillna(0)
y = df_sample["nutrition-score-fr_100g"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

print("Model R2 score:", model.score(X_test, y_test))

# Save model + encoder
import os
os.makedirs("model", exist_ok=True)
joblib.dump(model, "model/eco_score_model.pkl")
joblib.dump(le_packaging, "model/packaging_encoder.pkl")
print("Model saved successfully in model/ folder!")