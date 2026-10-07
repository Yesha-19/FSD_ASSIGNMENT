const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  viewedAt: { type: Date, default: Date.now },
  // Snapshot of the product's healthScore at save time — used for score-over-time charts.
  // Null for history records created before this field was added.
  scoreSnapshot: { type: Number, default: null },
  scoreType: { type: String, default: "healthScore" }, // which score was captured
}, { timestamps: true });

module.exports = mongoose.model("History", historySchema);