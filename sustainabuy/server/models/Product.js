const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  packaging: { type: String, default: "Unknown" },
  categories: { type: String, default: "Unknown" },
  brands: { type: String, default: "Unknown" },
  ingredientCount: { type: Number, default: 0 },
  energy100g: { type: Number, default: 0 },
  fat100g: { type: Number, default: 0 },
  sugars100g: { type: Number, default: 0 },
  proteins100g: { type: Number, default: 0 },
  sodium100g: { type: Number, default: 0 },
  nutritionScore: { type: Number, default: null }, // Open Food Facts nutrition-score-fr_100g; lower = healthier
  nutritionGrade: { type: String, default: "unknown" },
  // Nutrition-derived health score (0–100, higher = healthier).
  // Computed from nutritionScore: maps the OFF range [≈40 (worst) .. ≈-15 (best)]
  // to [0 .. 100]. This is a NUTRITION indicator, not an environmental score.
  healthScore: { type: Number, default: null },
  healthScoreSource: { type: String, default: "nutrition-score-fr-derived-v1" },
  healthScoreVersion: { type: String, default: "1.0" },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);