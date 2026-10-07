const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { producerMiddleware } = require("../middleware/authMiddleware");
const {
  searchProducts,
  getProductScore,
  getAlternatives,
  createProduct,
  getMyProducts,
  producerUpdateProduct,
  producerDeleteProduct,
} = require("../controllers/productController");

// Public — search and view
router.get("/search", searchProducts);
router.get("/mine", producerMiddleware, getMyProducts);   // MUST be before /:id
router.get("/:id/score", getProductScore);
router.get("/:id/alternatives", getAlternatives);

// Producer-protected — submit, edit, delete own products
router.post("/",    producerMiddleware, createProduct);
router.patch("/:id",  producerMiddleware, producerUpdateProduct);
router.delete("/:id", producerMiddleware, producerDeleteProduct);

module.exports = router;