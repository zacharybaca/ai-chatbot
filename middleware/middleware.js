require("dotenv").config();
const { expressjwt: jwt } = require("express-jwt");

// Temporary in-memory token blacklist
const blacklistedTokens = new Set();

const authenticateUser = jwt({
  secret: process.env.SECRET,
  algorithms: ["HS256"],
  isRevoked: async (req, token) => {
    if (!token) return true; // If no token is found, deny access
    
    return blacklistedTokens.has(token.jti); // Check if token is blacklisted
  },
}).unless({ path: ["/api/employees/login"] }); // Exclude public endpoints

module.exports = { authenticateUser, blacklistedTokens };

// const jwt = require("jsonwebtoken");

// // Temporary in-memory token blacklist
// // In production, you can use a database or other persistent store
// const blacklistedTokens = new Set();

// const authenticateUser = (req, res, next) => {
//   const token = req.header("Authorization")?.split(" ")[1];

//   if (!token) return res.status(401).json({ message: "Access Denied" });

//   if (blacklistedTokens.has(token)) {
//     return res.status(403).json({ message: "Token has been invalidated. Please log in again." });
//   }

//   jwt.verify(token, process.env.SECRET, (err, decoded) => {
//     if (err) return res.status(403).json({ message: "Invalid token" });

//     req.user = decoded;
//     next();
//   });
// };

// module.exports = authenticateUser;
