const jwt = require("jsonwebtoken");

// Temporary in-memory token blacklist
// In production, you can use a database or other persistent store
const blacklistedTokens = new Set();

const authenticateUser = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access Denied" });

  if (blacklistedTokens.has(token)) {
    return res.status(403).json({ message: "Token has been invalidated. Please log in again." });
  }

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    req.user = decoded;
    next();
  });
};

module.exports = authenticateUser;
