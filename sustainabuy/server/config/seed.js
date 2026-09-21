const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");
const Product = require("../models/Product");
require("dotenv").config();

const csvPath = path.join(__dirname, "..", "..", "ai-service", "data", "cleaned_products.csv");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB. Reading CSV...");

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
    .on("end", async () => {
      await Product.deleteMany({}); // clear old data before reseeding
      await Product.insertMany(products);
      console.log(`Seeded ${products.length} products into MongoDB!`);
      mongoose.disconnect();
    });
}

seed();