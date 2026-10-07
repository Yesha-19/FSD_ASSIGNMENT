const express = require("express");
const router = express.Router();
const { adminMiddleware } = require("../middleware/authMiddleware");
const {
  getUsers,
  getAllProducts,
  adminCreateProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/adminController");

// All routes in this file require admin role — adminMiddleware enforces both
// authentication and role check. A regular user gets 403, not 401.

router.get("/users", adminMiddleware, getUsers);

router.get("/products", adminMiddleware, getAllProducts);
router.post("/products", adminMiddleware, adminCreateProduct);
router.patch("/products/:id", adminMiddleware, updateProduct);
router.delete("/products/:id", adminMiddleware, deleteProduct);

module.exports = router;
