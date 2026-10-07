const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { saveHistory, getHistory, deleteHistory, getAnalytics } = require("../controllers/historyController");

// Analytics must be registered BEFORE /:id so Express doesn't treat "analytics" as an ID
router.get("/analytics", authMiddleware, getAnalytics);

// Save a product to history (protected route — must be logged in)
router.post("/", authMiddleware, saveHistory);

// Get logged-in user's view history (protected route)
router.get("/", authMiddleware, getHistory);

// Remove a product from history
router.delete("/:id", authMiddleware, deleteHistory);

module.exports = router;