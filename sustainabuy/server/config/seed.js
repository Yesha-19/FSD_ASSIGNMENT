const mongoose = require("mongoose");
const Product = require("../models/Product");
const Review = require("../models/Review");
require("dotenv").config();

async function clearDefaultData() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    const orphanProductCount = await Product.countDocuments({ addedBy: null });
    const orphanReviewCount = await Review.countDocuments({
      product: { $in: await Product.find({ addedBy: null }, { _id: 1 }).lean() },
    });

    // Preserve users, roles, and producer-created products. Only legacy records
    // without an owner are removed from the customer-facing catalogue.
    const orphanProductIds = await Product.find({ addedBy: null }, { _id: 1 }).lean();
    if (orphanProductIds.length > 0) {
      await Review.deleteMany({ product: { $in: orphanProductIds.map((p) => p._id) } });
      await Product.deleteMany({ addedBy: null });
    }

    console.log(`✅ Removed ${orphanProductCount} orphan products and ${orphanReviewCount} orphan reviews.`);
    console.log("✅ Users, roles, and producer-created products were preserved.");
  } catch (err) {
    console.error("❌ Failed to clear default data:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

clearDefaultData();
