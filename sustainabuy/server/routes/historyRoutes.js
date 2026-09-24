const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { saveHistory, getHistory } = require("../controllers/historyController");

// Save a product to history (protected route — must be logged in)
router.post("/", authMiddleware, saveHistory);

// Get logged-in user's view history (protected route)
router.get("/", authMiddleware, getHistory);

module.exports = router;