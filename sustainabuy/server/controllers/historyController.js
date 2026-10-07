const History = require("../models/History");
const Product = require("../models/Product");

// POST /api/history — save a product to the logged-in user's history
exports.saveHistory = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    // Fetch the product to snapshot its current healthScore
    const product = await Product.findById(productId).select("healthScore");
    const scoreSnapshot = product?.healthScore ?? null;

    // Avoid duplicate entries for the same user+product — update timestamp + snapshot
    const existing = await History.findOne({ user: req.user.id, product: productId });
    if (existing) {
      existing.viewedAt = Date.now();
      existing.scoreSnapshot = scoreSnapshot;
      existing.scoreType = "healthScore";
      await existing.save();
      return res.json(existing);
    }

    const history = await History.create({
      user: req.user.id,
      product: productId,
      scoreSnapshot,
      scoreType: "healthScore",
    });
    res.status(201).json(history);
  } catch (err) {
    res.status(500).json({ message: "Server error saving history", error: err.message });
  }
};

// GET /api/history — get all products viewed by the logged-in user
exports.getHistory = async (req, res) => {
  try {
    const history = await History.find({ user: req.user.id })
      .populate("product")
      .sort({ viewedAt: -1 }) // most recently viewed first
      .limit(50);
      
    // Fetch user's reviews for these products
    const Review = require("../models/Review");
    const productIds = history.map(h => h.product?._id).filter(Boolean);
    const reviews = await Review.find({ user: req.user.id, product: { $in: productIds } });
    
    // Map reviews by productId
    const ratingMap = {};
    reviews.forEach(r => ratingMap[String(r.product)] = r.rating);
    
    const historyWithRatings = history.map(h => {
      const hObj = h.toObject();
      if (h.product) {
        hObj.myRating = ratingMap[String(h.product._id)] || 0;
      }
      return hObj;
    });

    res.json(historyWithRatings);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching history", error: err.message });
  }
};

// DELETE /api/history/:id — remove a specific history item
exports.deleteHistory = async (req, res) => {
  try {
    const history = await History.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!history) {
      return res.status(404).json({ message: "History item not found" });
    }
    res.json({ message: "Item removed from dashboard" });
  } catch (err) {
    res.status(500).json({ message: "Server error deleting history", error: err.message });
  }
};

/**
 * GET /api/history/analytics
 *
 * Returns analytics derived exclusively from the authenticated user's own history.
 * Score-over-time values come from stored scoreSnapshot — not from the product's
 * current healthScore — so charts reflect actual save events, not today's values.
 *
 * scoreSnapshot is null for history records created before this field was added.
 * Those records are excluded from chart data but counted in totalSaved.
 */
exports.getAnalytics = async (req, res) => {
  try {
    const history = await History.find({ user: req.user.id })
      .populate("product", "name brands healthScore")
      .sort({ viewedAt: 1 }) // ascending for timeline chart
      .limit(200);

    const totalSaved = history.length;

    // Only entries with a captured score contribute to charts/summaries
    const scored = history.filter(
      (h) => h.scoreSnapshot !== null && h.scoreSnapshot !== undefined
    );

    const scoreOverTime = scored.map((h) => ({
      viewedAt: h.viewedAt,
      scoreSnapshot: h.scoreSnapshot,
      scoreType: h.scoreType || "healthScore",
      productName: h.product?.name || "Unknown",
    }));

    let bestProduct = null;
    let worstProduct = null;
    let averageScore = null;

    if (scored.length > 0) {
      const best = scored.reduce((a, b) => (a.scoreSnapshot >= b.scoreSnapshot ? a : b));
      const worst = scored.reduce((a, b) => (a.scoreSnapshot <= b.scoreSnapshot ? a : b));

      bestProduct = {
        productId: best.product?._id,
        name: best.product?.name || "Unknown",
        scoreSnapshot: best.scoreSnapshot,
        viewedAt: best.viewedAt,
      };
      worstProduct = {
        productId: worst.product?._id,
        name: worst.product?.name || "Unknown",
        scoreSnapshot: worst.scoreSnapshot,
        viewedAt: worst.viewedAt,
      };

      const sum = scored.reduce((acc, h) => acc + h.scoreSnapshot, 0);
      averageScore = Math.round(sum / scored.length);
    }

    res.json({
      scoreLabel: "Nutrition Health Score (0–100, higher = healthier)",
      scoreSource: "nutrition-score-fr-derived-v1",
      totalSaved,
      averageScore,
      bestProduct,
      worstProduct,
      scoreOverTime,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error fetching analytics", error: err.message });
  }
};
