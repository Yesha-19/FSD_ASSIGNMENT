const express = require("express");
const router = express.Router();
const { searchProducts, getProductScore, createProduct } = require("../controllers/productController");

// Search products by name or category
router.get("/search", searchProducts);

// Create a new product (user input)
router.post("/", createProduct);

// Get single product + AI predicted score
router.get("/:id/score", getProductScore);

module.exports = router;