const Review  = require("../models/Review");
const Product = require("../models/Product");

/* ── POST /api/reviews ── Customer submits/updates a rating */
exports.submitReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    if (!productId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "productId and rating (1-5) are required." });
    }

    const product = await Product.findById(productId);
    if (!product || product.addedBy === null || product.addedBy === undefined) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Upsert — one review per user per product
    const review = await Review.findOneAndUpdate(
      { product: productId, user: req.user.id },
      { rating: Number(rating), comment: comment || "" },
      { new: true, upsert: true, runValidators: true }
    ).populate("user", "name");

    res.json(review);
  } catch (err) {
    res.status(500).json({ message: "Failed to submit review.", error: err.message });
  }
};

/* ── GET /api/reviews/product/:productId ── Public: all reviews for a product */
exports.getProductReviews = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product || product.addedBy === null || product.addedBy === undefined) {
      return res.status(404).json({ message: "Product not found" });
    }

    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reviews.", error: err.message });
  }
};

/* ── GET /api/reviews/my-products ── Producer: all reviews for their products */
exports.getMyProductReviews = async (req, res) => {
  try {
    // Find all products this producer added
    const myProducts = await Product.find({ addedBy: req.user.id }).select("_id name");
    const productIds = myProducts.map((p) => p._id);

    const reviews = await Review.find({ product: { $in: productIds } })
      .populate("user",    "name")
      .populate("product", "name")
      .sort({ createdAt: -1 });

    res.json({ products: myProducts, reviews });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reviews.", error: err.message });
  }
};

/* ── GET /api/reviews/analytics ── Producer: analytics for their products */
exports.getProducerAnalytics = async (req, res) => {
  try {
    const myProducts = await Product.find({ addedBy: req.user.id }).select("_id name");

    const productIds = myProducts.map((p) => p._id);

    // Aggregate ratings per product
    const ratingAgg = await Review.aggregate([
      { $match: { product: { $in: productIds } } },
      {
        $group: {
          _id: "$product",
          avgRating:       { $avg: "$rating" },
          totalReviews:    { $sum: 1 },
          ratingDist: {
            $push: "$rating",
          },
        },
      },
    ]);

    // Build a lookup map
    const ratingMap = {};
    for (const r of ratingAgg) {
      const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      r.ratingDist.forEach((v) => { dist[v] = (dist[v] || 0) + 1; });
      ratingMap[String(r._id)] = {
        avgRating: Math.round(r.avgRating * 10) / 10,
        totalReviews: r.totalReviews,
        ratingDist: dist,
      };
    }

    const analytics = myProducts.map((p) => ({
      productId:   p._id,
      productName: p.name,
      ...(ratingMap[String(p._id)] || { avgRating: null, totalReviews: 0, ratingDist: { 1:0,2:0,3:0,4:0,5:0 } }),
    }));

    // Overall rating distribution across all products
    const allDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const a of analytics) {
      for (let s = 1; s <= 5; s++) allDist[s] += (a.ratingDist[s] || 0);
    }

    res.json({ analytics, overallRatingDist: allDist });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch analytics.", error: err.message });
  }
};
