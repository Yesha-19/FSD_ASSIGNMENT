const Product = require("../models/Product");
const Review = require("../models/Review");

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

/**
 * Converts Open Food Facts nutrition-score-fr_100g to a 0–100 health score.
 *
 * Scale definition:
 *   - OFF nutritionScore: lower value = healthier (roughly -15 best → 40 worst).
 *   - healthScore = clamp(round(100 - ((ns + 15) / 55) * 100), 0, 100)
 *   - 100 = most healthy (ns ≤ -15), 0 = least healthy (ns ≥ 40).
 *
 * Source: Open Food Facts nutrition-score-fr_100g (Nutri-Score algorithm).
 * This is a NUTRITION indicator only — not an environmental or eco score.
 */
function computeHealthScore(nutritionScore) {
  if (nutritionScore === null || nutritionScore === undefined || isNaN(nutritionScore)) return null;
  const WORST = 40;   // highest OFF score in practice
  const BEST  = -15;  // lowest OFF score in practice
  const range = WORST - BEST; // 55
  const clamped = Math.min(WORST, Math.max(BEST, nutritionScore));
  return Math.round(100 - ((clamped - BEST) / range) * 100);
}

/**
 * Shared product field validation — used by both user and admin create/update.
 * Returns { valid: false, message } or { valid: true, fields: {...} }.
 */
function validateProductBody(body) {
  const { name, brands, categories, packaging, ingredientCount,
          energy100g, fat100g, sugars100g, proteins100g, sodium100g } = body;

  if (!name || String(name).trim() === "") {
    return { valid: false, message: "Product name is required." };
  }

  const nums = { energy100g, fat100g, sugars100g, proteins100g, sodium100g };
  for (const [key, val] of Object.entries(nums)) {
    if (val === undefined || val === null || isNaN(Number(val)) || Number(val) < 0) {
      return { valid: false, message: `Invalid value for ${key}. Must be a number >= 0.` };
    }
  }

  return {
    valid: true,
    fields: {
      name: String(name).trim(),
      brands: brands || "Unknown",
      categories: categories || "Unknown",
      packaging: packaging || "Unknown",
      ingredientCount: Number(ingredientCount) || 0,
      energy100g: Number(energy100g),
      fat100g: Number(fat100g),
      sugars100g: Number(sugars100g),
      proteins100g: Number(proteins100g),
      sodium100g: Number(sodium100g),
    },
  };
}

// ── Public routes ──────────────────────────────────────────────────────────────

// GET /api/products/search?q=... — search products by name
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    const filter = {
      addedBy: { $ne: null },
      ...(q ? { name: { $regex: q, $options: "i" } } : {}),
    };
    const products = await Product.find(filter).sort({ createdAt: -1 }).limit(20);
    res.json(products);
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ message: "Search failed. Is MongoDB running?", error: err.message });
  }
};

// GET /api/products/:id/score — get product and its stored nutrition score
exports.getProductScore = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || product.addedBy === null || product.addedBy === undefined) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ product, predictedScore: null });
  } catch (err) {
    console.error("Product score error:", err.message);
    res.status(500).json({ message: "Failed to fetch product", error: err.message });
  }
};

/**
 * GET /api/products/:id/alternatives?limit=3
 *
 * Returns up to `limit` products from the same first-token category that have
 * a strictly higher healthScore than the requested product.
 * healthScore is derived from the stored nutritionScore (lower OFF score = higher healthScore).
 * Returns an empty alternatives array — never a silent error — when no match is found.
 */
exports.getAlternatives = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || product.addedBy === null || product.addedBy === undefined) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.healthScore === null || product.healthScore === undefined) {
      return res.json({
        scoreSource: "nutrition-score-fr-derived-v1",
        scoreLabel: "Nutrition Health Score (0–100, higher = healthier)",
        currentScore: null,
        alternatives: [],
        note: "Health score not available for this product — cannot recommend alternatives.",
      });
    }

    const limit = Math.min(parseInt(req.query.limit) || 3, 10);

    // Normalise the first category token: trim, lowercase, strip extra whitespace
    const firstCategory = (product.categories || "")
      .split(",")[0]
      .trim()
      .toLowerCase();

    let alternatives = [];

    if (firstCategory && firstCategory !== "unknown") {
      // Match products whose categories field starts with the same first token (case-insensitive).
      // We use a regex anchored to the start of the token to avoid loose substring matches.
      const categoryRegex = new RegExp(
        `(^|,\\s*)${firstCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
        "i"
      );

      alternatives = await Product.find({
        _id: { $ne: product._id },
        categories: { $regex: categoryRegex },
        healthScore: { $gt: product.healthScore }, // strictly higher = healthier
      })
        .sort({ healthScore: -1, name: 1 }) // descending score, stable tie-break by name
        .limit(limit)
        .select("_id name brands categories healthScore healthScoreSource");
    }

    res.json({
      scoreSource: "nutrition-score-fr-derived-v1",
      scoreLabel: "Nutrition Health Score (0–100, higher = healthier)",
      currentScore: product.healthScore,
      alternatives: alternatives.map((a) => ({
        _id: a._id,
        name: a.name,
        brands: a.brands,
        categories: a.categories,
        healthScore: a.healthScore,
        scoreDifference: a.healthScore - product.healthScore,
      })),
    });
  } catch (err) {
    console.error("Alternatives error:", err.message);
    res.status(500).json({ message: "Failed to fetch alternatives", error: err.message });
  }
};

// ── User-protected route ───────────────────────────────────────────────────────

// POST /api/products — create a product (requires login, producer role)
exports.createProduct = async (req, res) => {
  try {
    const validation = validateProductBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const { fields } = validation;
    const { score, grade } = computeGrade(fields);
    const healthScore = computeHealthScore(score);

    const product = await Product.create({
      ...fields,
      nutritionScore: score,
      nutritionGrade: grade,
      healthScore,
      healthScoreSource: "nutrition-score-fr-derived-v1",
      healthScoreVersion: "1.0",
      addedBy: req.user?.id || null,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Create product error:", err.message);
    res.status(500).json({ message: "Failed to create product.", error: err.message });
  }
};

// ── Producer-protected routes ──────────────────────────────────────────────────

// GET /api/products/mine — list this producer's own products
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ addedBy: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("Get my products error:", err.message);
    res.status(500).json({ message: "Failed to fetch your products.", error: err.message });
  }
};

// PATCH /api/products/:id — producer edits their own product
exports.producerUpdateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (String(product.addedBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only edit products you submitted." });
    }

    const validation = validateProductBody({ ...product.toObject(), ...req.body });
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const { fields } = validation;
    const { score, grade } = computeGrade(fields);
    const healthScore = computeHealthScore(score);

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { ...fields, nutritionScore: score, nutritionGrade: grade, healthScore },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("Producer update product error:", err.message);
    res.status(500).json({ message: "Failed to update product.", error: err.message });
  }
};

// DELETE /api/products/:id — producer deletes their own product
exports.producerDeleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (String(product.addedBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only delete products you submitted." });
    }
    await Promise.all([
      Product.findByIdAndDelete(req.params.id),
      Review.deleteMany({ product: req.params.id }),
    ]);
    res.json({ message: "Product deleted successfully", deletedId: req.params.id });
  } catch (err) {
    console.error("Producer delete product error:", err.message);
    res.status(500).json({ message: "Failed to delete product.", error: err.message });
  }
};

// ── Admin-only routes ──────────────────────────────────────────────────────────

// GET /api/admin/products — list all products (admin only)
exports.getAllProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(parseInt(req.query.pageSize) || 50, 200);
    const q = req.query.q || "";
    const filter = q ? { name: { $regex: q, $options: "i" } } : {};

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
      Product.countDocuments(filter),
    ]);

    res.json({ products, total, page, pageSize });
  } catch (err) {
    console.error("Admin list products error:", err.message);
    res.status(500).json({ message: "Failed to list products.", error: err.message });
  }
};

// POST /api/admin/products — admin creates a product
exports.adminCreateProduct = async (req, res) => {
  try {
    const validation = validateProductBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const { fields } = validation;
    const { score, grade } = computeGrade(fields);
    const healthScore = computeHealthScore(score);

    const product = await Product.create({
      ...fields,
      nutritionScore: score,
      nutritionGrade: grade,
      healthScore,
      healthScoreSource: "nutrition-score-fr-derived-v1",
      healthScoreVersion: "1.0",
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Admin create product error:", err.message);
    res.status(500).json({ message: "Failed to create product.", error: err.message });
  }
};

// PATCH /api/admin/products/:id — admin edits a product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Validate only the fields that were sent
    const validation = validateProductBody({ ...product.toObject(), ...req.body });
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const { fields } = validation;
    const { score, grade } = computeGrade(fields);
    const healthScore = computeHealthScore(score);

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { ...fields, nutritionScore: score, nutritionGrade: grade, healthScore },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("Admin update product error:", err.message);
    res.status(500).json({ message: "Failed to update product.", error: err.message });
  }
};

// DELETE /api/admin/products/:id — admin deletes a product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    await Review.deleteMany({ product: req.params.id });
    res.json({ message: "Product deleted successfully", deletedId: req.params.id });
  } catch (err) {
    console.error("Admin delete product error:", err.message);
    res.status(500).json({ message: "Failed to delete product.", error: err.message });
  }
};

// Export computeHealthScore so seed scripts can reuse it without duplication
exports._computeHealthScore = computeHealthScore;
