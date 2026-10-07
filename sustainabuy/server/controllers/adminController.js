const User = require("../models/User");
const {
  getAllProducts,
  adminCreateProduct,
  updateProduct,
  deleteProduct,
} = require("./productController");

/**
 * GET /api/admin/users
 * Returns all users. Password field is explicitly excluded from the projection.
 */
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password") // never return password hashes or tokens
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("Admin get users error:", err.message);
    res.status(500).json({ message: "Failed to fetch users.", error: err.message });
  }
};

// Re-export product handlers so the admin router has one import point
exports.getAllProducts = getAllProducts;
exports.adminCreateProduct = adminCreateProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
