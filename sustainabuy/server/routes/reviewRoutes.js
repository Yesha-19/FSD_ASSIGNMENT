const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { producerMiddleware } = require("../middleware/authMiddleware");
const {
  submitReview,
  getProductReviews,
  getMyProductReviews,
  getProducerAnalytics,
} = require("../controllers/reviewController");

// Customer: submit or update their own rating for a product
router.post("/", authMiddleware, submitReview);

// Public: get all reviews for a specific product
router.get("/product/:productId", getProductReviews);

// Producer: get reviews for their submitted products
router.get("/my-products", producerMiddleware, getMyProductReviews);

// Producer: analytics for their products
router.get("/analytics", producerMiddleware, getProducerAnalytics);

module.exports = router;
