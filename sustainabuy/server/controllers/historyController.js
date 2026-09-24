const History = require("../models/History");

// POST /api/history — save a product to the logged-in user's history
exports.saveHistory = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    // Avoid duplicate entries for the same user+product
    const existing = await History.findOne({ user: req.user.id, product: productId });
    if (existing) {
      // Update the timestamp so it surfaces as "recently viewed"
      existing.viewedAt = Date.now();
      await existing.save();
      return res.json(existing);
    }

    const history = await History.create({ user: req.user.id, product: productId });
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
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching history", error: err.message });
  }
};
