const Product = require("../models/Product");
const axios = require("axios");

/* ── Nutri-Score algorithm (mirrored from frontend) ── */
function energyPoints(kj)  { const t=[335,670,1005,1340,1675,2010,2345,2680,3015,3350]; const i=t.findIndex(v=>kj<=v); return i===-1?10:i; }
function sugarPoints(g)    { const t=[4.5,9,13.5,18,22.5,27,31,36,40,45]; const i=t.findIndex(v=>g<=v);  return i===-1?10:i; }
function fatPoints(g)      { const t=[1,2,3,4,5,6,7,8,9,10]; const i=t.findIndex(v=>g<=v);             return i===-1?10:i; }
function sodiumPoints(g)   { const mg=g*1000; const t=[90,180,270,360,450,540,630,720,810,900]; const i=t.findIndex(v=>mg<=v); return i===-1?10:i; }
function proteinPoints(g)  { const t=[1.6,3.2,4.8,6.4,8]; const i=t.findIndex(v=>g<=v);              return i===-1?5:i; }

function computeGrade({ energy100g, fat100g, sugars100g, proteins100g, sodium100g }) {
  const neg = energyPoints(energy100g) + fatPoints(fat100g) + sugarPoints(sugars100g) + sodiumPoints(sodium100g);
  const pos = proteinPoints(proteins100g);
  const score = neg - pos;
  if (score <= -1) return { score, grade: "a" };
  if (score <=  2) return { score, grade: "b" };
  if (score <= 10) return { score, grade: "c" };
  if (score <= 18) return { score, grade: "d" };
  return { score, grade: "e" };
}

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

// POST /api/products — create a new product entered by the user
exports.createProduct = async (req, res) => {
  try {
    const {
      name, brands, categories, packaging, ingredientCount,
      energy100g, fat100g, sugars100g, proteins100g, sodium100g,
    } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Product name is required." });
    }

    // Validate nutritional fields are numbers >= 0
    const nums = { energy100g, fat100g, sugars100g, proteins100g, sodium100g };
    for (const [key, val] of Object.entries(nums)) {
      if (val === undefined || val === null || isNaN(Number(val)) || Number(val) < 0) {
        return res.status(400).json({ message: `Invalid value for ${key}. Must be a number >= 0.` });
      }
    }

    // Auto-compute grade on the server (source of truth)
    const { score, grade } = computeGrade({
      energy100g: Number(energy100g),
      fat100g: Number(fat100g),
      sugars100g: Number(sugars100g),
      proteins100g: Number(proteins100g),
      sodium100g: Number(sodium100g),
    });

    const product = await Product.create({
      name: name.trim(),
      brands: brands || "Unknown",
      categories: categories || "Unknown",
      packaging: packaging || "Unknown",
      ingredientCount: Number(ingredientCount) || 0,
      energy100g: Number(energy100g),
      fat100g: Number(fat100g),
      sugars100g: Number(sugars100g),
      proteins100g: Number(proteins100g),
      sodium100g: Number(sodium100g),
      nutritionScore: score,
      nutritionGrade: grade,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Create product error:", err.message);
    res.status(500).json({ message: "Failed to create product.", error: err.message });
  }
};
