const express = require("express");
const router = express.Router();
const { searchProducts, getProductScore } = require("../controllers/productController");

// Search products by name or category
router.get("/search", searchProducts);

// Get single product + AI predicted score
router.get("/:id/score", getProductScore);

module.exports = router;