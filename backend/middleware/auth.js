// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId }; // attach userId to request
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token expired or invalid" });
  }
};

module.exports = { protect };