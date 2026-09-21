const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const historyRoutes = require("./routes/historyRoutes");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/history", historyRoutes);

app.get("/", (req, res) => res.json({ status: "SustainaBuy API running" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));