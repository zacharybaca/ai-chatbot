require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");

const chatbotRouter = require("./routes/chatbot");

const app = express();

// Rate Limiter
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { error: "Too many requests, please try again later." },
  headers: true,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/api/bot", limiter);
app.use("/api/bot", chatbotRouter);

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start Server
app.listen(process.env.PORT, () => {
  console.log(`Chatbot server running on port ${process.env.PORT}`);
});
