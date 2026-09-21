const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  viewedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("History", historySchema);