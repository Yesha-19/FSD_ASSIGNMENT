const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Chains authMiddleware then enforces admin role.
const adminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  });
};

// Chains authMiddleware then enforces producer role.
const producerMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user?.role !== "producer" && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Producer access required" });
    }
    next();
  });
};

module.exports = authMiddleware;
module.exports.adminMiddleware = adminMiddleware;
module.exports.producerMiddleware = producerMiddleware;
