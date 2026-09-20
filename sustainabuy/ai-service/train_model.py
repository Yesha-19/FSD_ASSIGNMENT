import pandas as pd

# Load raw data (tab-separated)
df = pd.read_csv("data/en.openfoodfacts.org.products.tsv", sep="\t", low_memory=False)

# Select only relevant columns (15-18 range)
cols = ["product_name", "packaging", "ingredients_text", "categories",
        "nutrition_grade_fr", "ecoscore_grade", "ecoscore_score",
        "carbon_footprint_100g", "energy_100g", "fat_100g", "sugars_100g",
        "proteins_100g", "sodium_100g", "countries", "brands"]
df = df[cols]

# Drop rows missing the target (ecoscore_score)
df = df.dropna(subset=["ecoscore_score"])

# Fill missing values
df["packaging"] = df["packaging"].fillna("Unknown")
df["ingredients_text"] = df["ingredients_text"].fillna("")
df["categories"] = df["categories"].fillna("Unknown")

# Feature: ingredient count (simple NLP-free feature)
df["ingredient_count"] = df["ingredients_text"].apply(lambda x: len(x.split(",")))

df.to_csv("data/cleaned_products.csv", index=False)
print("Cleaned data saved:", df.shape)