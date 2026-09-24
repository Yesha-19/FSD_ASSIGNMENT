const mongoose = require("mongoose");

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async (retryCount = 0) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // fail fast if unreachable
    });
    console.log("✅ MongoDB connected successfully!");
    console.log(`   URI: ${process.env.MONGO_URI?.replace(/\/\/.*@/, "//***@")}`);
  } catch (err) {
    console.error(`❌ MongoDB connection failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`, err.message);

    if (retryCount < MAX_RETRIES - 1) {
      console.log(`   Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      setTimeout(() => connectDB(retryCount + 1), RETRY_DELAY_MS);
    } else {
      console.error("   Max retries reached. Server continues but DB features will not work.");
      console.error("   Check: Is MongoDB running? Is MONGO_URI in .env correct?");
      console.error("   Local fix: Run 'net start MongoDB' in an admin terminal.");
    }
  }
};

// Log disconnection events so you know immediately if the DB drops
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected. Attempting reconnect...");
  connectDB();
});

mongoose.connection.on("error", (err) => {
  console.error("⚠️  MongoDB runtime error:", err.message);
});

module.exports = connectDB;