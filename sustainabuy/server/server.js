const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const historyRoutes = require("./routes/historyRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();

// CORS — allow React dev server on port 3000 and production origin
// PATCH is included because admin product edits use PATCH requests.
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// Connect to MongoDB (retries automatically on failure — see config/db.js)
connectDB();

app.use("/api/auth",     authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/history",  historyRoutes);
app.use("/api/admin",    adminRoutes);
app.use("/api/reviews",  reviewRoutes);

app.get("/", (req, res) => res.json({ status: "SustainaBuy API running" }));

// 404 handler — catch unknown routes and return JSON (not HTML)
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler — prevents unhandled errors from crashing the server
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err.stack || err.message);
  res.status(500).json({ message: "Internal server error", error: err.message });
});

// Catch unhandled promise rejections (e.g. DB queries that throw unexpectedly)
process.on("unhandledRejection", (reason) => {
  console.error("⚠️  Unhandled Promise Rejection:", reason);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));