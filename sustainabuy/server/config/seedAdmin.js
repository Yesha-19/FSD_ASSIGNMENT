/**
 * Admin provisioning script — run with: npm run seed:admin
 *
 * Reads admin credentials from environment variables ADMIN_EMAIL and ADMIN_PASSWORD.
 * No default credentials are hard-coded here to prevent accidental exposure.
 *
 * Usage:
 *   1. Set in your shell (or add to server/.env temporarily):
 *        ADMIN_EMAIL=admin@example.com
 *        ADMIN_PASSWORD=YourStrongPassw0rd
 *   2. Run: npm run seed:admin
 *   3. Remove the credentials from .env after provisioning — .env is gitignored.
 *
 * The script is safe to re-run: it updates the existing admin without creating a duplicate.
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config();

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  if (!email || !password) {
    console.error("❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables.");
    console.error("   Example: set ADMIN_EMAIL=admin@example.com && set ADMIN_PASSWORD=Secret123");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌ ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB.");
  } catch (err) {
    console.error("❌ Could not connect to MongoDB:", err.message);
    process.exit(1);
  }

  try {
    const existing = await User.findOne({ email });
    const hashedPassword = await bcrypt.hash(password, 12);

    if (existing) {
      existing.name = name;
      existing.role = "admin";
      existing.password = hashedPassword;
      await existing.save();
      console.log(`✅ Existing user ${email} updated to admin role.`);
    } else {
      await User.create({ name, email, password: hashedPassword, role: "admin" });
      console.log(`✅ Admin user created: ${email}`);
    }
  } catch (err) {
    console.error("❌ Failed to provision admin:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
