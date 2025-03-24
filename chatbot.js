const { authenticateUser, blacklistedTokens } = require("./middleware/middleware.js");
const { NlpManager } = require("node-nlp");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const fs = require("fs");
const rateLimit = require("express-rate-limit");

require("dotenv").config({ path: "./.env" });

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per minute
  message: {
    error: "Too many requests, please try again later.",
  },
  headers: true, // Send rate limit info in response headers
});

const app = express();
app.use(bodyParser.json());
app.use("/api/bot", limiter);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Task Schema for fetching real-time data
const Task = mongoose.model(
  "Task",
  new mongoose.Schema({
    title: String,
    assignedEmployee: String,
    completed: Boolean,
    createdAt: Date,
  })
);

// Define NLP Responses
const responses = {
  greeting: ["Hey!", "Hi!", "Hello!", "Hey there!"],
  "task.assigned": [
    "Here are your tasks.",
    "Fetching your assigned tasks...",
    "These are the tasks you need to complete.",
  ],
  "task.unassigned": [
    "Here are the unassigned tasks.",
    "Fetching all unassigned tasks...",
    "These tasks are currently unassigned.",
  ],
};

// Initialize NLP Manager
const manager = new NlpManager({ languages: ["en"] });

// Expand Training Data
manager.addDocument("en", "how do I report a bug?", "bug.report");
manager.addDocument("en", "where can I submit a bug?", "bug.report");

manager.addDocument("en", "what are my assigned tasks?", "task.assigned");
manager.addDocument("en", "show my unassigned tasks", "task.unassigned");

manager.addDocument("en", "I cannot log in", "auth.issue");
manager.addDocument("en", "how do I reset my password?", "auth.reset");

manager.addDocument("en", "how does this system work?", "general.help");
manager.addDocument("en", "tell me about this bug tracker", "general.help");

// Provide Answers
manager.addAnswer(
  "en",
  "bug.report",
  'You can report a bug by visiting the "Report a Bug" section in your dashboard.'
);
manager.addAnswer(
  "en",
  "auth.issue",
  "If you cannot log in, please check your credentials or reset your password."
);
manager.addAnswer(
  "en",
  "auth.reset",
  'To reset your password, go to the login page and click on "Forgot Password".'
);
manager.addAnswer(
  "en",
  "general.help",
  "This bug tracker helps you manage and resolve software issues efficiently."
);

// Train Model
(async () => {
  await manager.train();
  manager.save();
})();

// Logging function
const logInteraction = (userMessage, botResponse) => {
  const logEntry = `${new Date().toISOString()} - User: ${userMessage} | Bot: ${botResponse}\n`;
  fs.appendFile("chat_logs.txt", logEntry, (err) => {
    if (err) console.error("Logging error:", err);
  });
};

// Chatbot API
app.post("/api/bot", authenticateUser, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).send({ error: "Message is required" });
  }

  let response = await manager.process("en", message);
  let botReply =
    response.answer ||
    "I'm not sure how to respond. Here are some things I can help with: 'report a bug', 'assigned tasks', 'reset password', 'help'.";
  
  // Handle Task Queries
  if (response.intent === "task.assigned") {
    const userId = req.auth?._id; // Ensure user ID exists
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
    const tasks = await Task.find({ assignedEmployee: userId });
    const randomReply =
      responses["task.assigned"][
        Math.floor(Math.random() * responses["task.assigned"].length)
      ];
    botReply = tasks.length
      ? `${randomReply} ${tasks.map((task) => task.title).join(", ")}`
      : "You have no assigned tasks.";
  } else if (response.intent === "task.unassigned") {
    const unassignedTasks = await Task.find({ assignedEmployee: null });
    const randomReply =
      responses["task.unassigned"][
        Math.floor(Math.random() * responses["task.unassigned"].length)
      ];
    botReply = unassignedTasks.length
      ? `${randomReply} ${unassignedTasks.map((task) => task.title).join(", ")}`
      : "No unassigned tasks at the moment.";
  }

  // Log interaction
  logInteraction(message, botReply);

  res.json({ answer: botReply });
});

// Start Server
app.listen(3000, () => {
  console.log("Chatbot server running on Port 3000");
});
