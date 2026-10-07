/**
 * One-time backfill script — run with: npm run backfill
 *
 * Computes and stores healthScore for all existing products that have a nutritionScore
 * but no healthScore yet. Safe to run multiple times — skips products that already
 * have a healthScore.
 *
 * Run this once after deploying the healthScore field to an existing catalogue.
 * After running npm run seed, this script is not needed (seed.js populates it directly).
 */
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { _computeHealthScore } = require("../controllers/productController");
require("dotenv").config();

async function backfill() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB.");
  } catch (err) {
    console.error("❌ Could not connect to MongoDB:", err.message);
    process.exit(1);
  }

  try {
    // Find products that have a nutritionScore but no healthScore yet
    const products = await Product.find({
      nutritionScore: { $ne: null },
      healthScore: null,
    }).select("_id nutritionScore");

    if (products.length === 0) {
      console.log("✅ All products already have a healthScore. Nothing to backfill.");
      return;
    }

    console.log(`📦 Backfilling ${products.length} products...`);

    let updated = 0;
    const BATCH = 100;
    for (let i = 0; i < products.length; i += BATCH) {
      const batch = products.slice(i, i + BATCH);
      const bulk = batch.map((p) => ({
        updateOne: {
          filter: { _id: p._id },
          update: {
            $set: {
              healthScore: _computeHealthScore(p.nutritionScore),
              healthScoreSource: "nutrition-score-fr-derived-v1",
              healthScoreVersion: "1.0",
            },
          },
        },
      }));
      const result = await Product.bulkWrite(bulk);
      updated += result.modifiedCount;
      process.stdout.write(`\r  Updated ${updated}/${products.length}`);
    }

    console.log(`\n✅ Backfill complete. ${updated} products updated.`);
  } catch (err) {
    console.error("❌ Backfill failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

backfill();
