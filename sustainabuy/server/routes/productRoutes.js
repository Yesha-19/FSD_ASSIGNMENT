const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const axios = require("axios");

// Search products by name or category
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    const filter = q
      ? { name: { $regex: q, $options: "i" } }
      : {};
    const products = await Product.find(filter).limit(20);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get single product + AI predicted score
router.get("/:id/score", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const aiResponse = await axios.post("http://localhost:5001/predict-score", {
      ingredient_count: product.ingredientCount,
      packaging: product.packaging,
      energy_100g: product.energy100g,
      fat_100g: product.fat100g,
      sugars_100g: product.sugars100g,
      proteins_100g: product.proteins100g,
      sodium_100g: product.sodium100g,
    });

    res.json({ product, predictedScore: aiResponse.data.nutrition_score });
  } catch (err) {
    res.status(500).json({ message: "Error getting score", error: err.message });
  }
});

module.exports = router;