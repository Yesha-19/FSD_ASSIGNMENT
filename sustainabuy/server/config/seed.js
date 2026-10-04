const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const Product = require("../models/Product");
require("dotenv").config();

const csvPath = path.join(__dirname, "..", "..", "ai-service", "data", "cleaned_products.csv");

async function seed() {
  // Verify CSV exists before trying to connect to DB
  if (!fs.existsSync(csvPath)) {
    console.error("❌ CSV file not found at:", csvPath);
    console.error("   Run 'python train_model.py' inside sustainabuy/ai-service/ first.");
    console.error("   That script generates the cleaned_products.csv data file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB. Reading CSV...");
  } catch (err) {
    console.error("❌ Could not connect to MongoDB:", err.message);
    console.error("   Make sure MongoDB is running: net start MongoDB");
    console.error("   Check MONGO_URI in server/.env");
    process.exit(1);
  }

  const products = [];

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on("data", (row) => {
      if (products.length < 2000) { // limit for a manageable demo dataset
        products.push({
          name: row.product_name || "Unnamed Product",
          packaging: row.packaging || "Unknown",
          categories: row.categories || "Unknown",
          brands: row.brands || "Unknown",
          ingredientCount: parseInt(row.ingredient_count) || 0,
          energy100g: parseFloat(row.energy_100g) || 0,
          fat100g: parseFloat(row.fat_100g) || 0,
          sugars100g: parseFloat(row.sugars_100g) || 0,
          proteins100g: parseFloat(row.proteins_100g) || 0,
          sodium100g: parseFloat(row.sodium_100g) || 0,
          nutritionScore: parseFloat(row["nutrition-score-fr_100g"]) || null,
          nutritionGrade: row.nutrition_grade_fr || "unknown",
        });
      }
    })
    .on("error", (err) => {
      console.error("❌ Error reading CSV file:", err.message);
      mongoose.disconnect();
      process.exit(1);
    })
    .on("end", async () => {
      if (products.length === 0) {
        console.error("❌ CSV was read but no products were parsed. Check the file format.");
        mongoose.disconnect();
        process.exit(1);
      }

      try {
        await Product.deleteMany({}); // clear old data before reseeding
        await Product.insertMany(products);
        console.log(`✅ Seeded ${products.length} products into MongoDB!`);
      } catch (err) {
        console.error("❌ Failed to insert products into MongoDB:", err.message);
      } finally {
        mongoose.disconnect();
      }
    });
}

seed();