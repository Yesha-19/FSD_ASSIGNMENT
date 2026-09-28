const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { saveHistory, getHistory, deleteHistory } = require("../controllers/historyController");

// Save a product to history (protected route — must be logged in)
router.post("/", authMiddleware, saveHistory);

// Get logged-in user's view history (protected route)
router.get("/", authMiddleware, getHistory);

// Remove a product from history
router.delete("/:id", authMiddleware, deleteHistory);

module.exports = router;