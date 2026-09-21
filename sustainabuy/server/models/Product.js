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
  nutritionScore: { type: Number, default: null }, // from dataset
  nutritionGrade: { type: String, default: "unknown" },
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);