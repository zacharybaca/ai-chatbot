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
