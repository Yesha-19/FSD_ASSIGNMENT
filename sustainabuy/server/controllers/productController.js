const Product = require("../models/Product");
const axios = require("axios");

// GET /api/products/search?q=... — search products by name
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    const filter = q ? { name: { $regex: q, $options: "i" } } : {};
    const products = await Product.find(filter).limit(20);
    res.json(products);
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ message: "Search failed. Is MongoDB running?", error: err.message });
  }
};

// GET /api/products/:id/score — get product + AI sustainability score
exports.getProductScore = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let predictedScore = null;
    try {
      const aiResponse = await axios.post("http://localhost:5001/predict-score", {
        ingredient_count: product.ingredientCount,
        packaging: product.packaging,
        energy_100g: product.energy100g,
        fat_100g: product.fat100g,
        sugars_100g: product.sugars100g,
        proteins_100g: product.proteins100g,
        sodium_100g: product.sodium100g,
      }, { timeout: 3000 });
      predictedScore = aiResponse.data.nutrition_score;
    } catch (aiErr) {
      // AI service is optional — return product data even if AI is down
      console.warn("AI service unavailable:", aiErr.message);
    }

    res.json({ product, predictedScore });
  } catch (err) {
    console.error("Product score error:", err.message);
    res.status(500).json({ message: "Failed to fetch product", error: err.message });
  }
};
