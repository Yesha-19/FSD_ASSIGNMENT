const express = require("express");
const router = express.Router();
const History = require("../models/History");
const authMiddleware = require("../middleware/authMiddleware");

// Save a product to history (protected)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;
    const history = await History.create({ user: req.user.id, product: productId });
    res.status(201).json(history);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get logged-in user's history (protected)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const history = await History.find({ user: req.user.id }).populate("product");
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;