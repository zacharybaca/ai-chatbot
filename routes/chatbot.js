const express = require("express");
const { authenticateUser } = require("../middleware/middleware.js");
const manager = require("../nlp/nlpManager");
const Task = require("../models/Task");
const Employee = require("../models/Employee.js");
const { logInteraction } = require("../middleware/logger");

const router = express.Router();

// Predefined responses for intents
const responses = {
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
  "task.complete": [
    "Marking this task as complete.",
    "Task marked as complete.",
  ],
  "task.update": ["Updating the task.", "Task updated successfully."],
  "general.signup": [
    "Here are the steps to Sign Up: ",
    "Follow these steps in order to Sign Up: ",
    "To Sign Up, simply follow these instructions: ",
  ],
};

async function getGeneralBotReply(message) {
  const response = await manager.process("en", message);
  let botReply = response.answer || "I'm not sure how to respond.";

  // Block restricted intents if user is unauthenticated
  const restrictedIntents = [
    "task.assigned",
    "task.unassigned",
    "task.complete",
    "task.update",
  ];
  if (restrictedIntents.includes(response.intent)) {
    botReply = "Unauthorized. Please log in to continue.";
    return { botReply, error: "Unauthorized", status: 401 };
  }

  try {
    switch (response.intent) {
      case "general.signup":
        botReply = `${
          responses["general.signup"][
            Math.floor(
              Math.random() * responses["general.signup"].length
            )
          ]
        }
          \nStep 1: Click The Sign Up Button \nStep 2: Fill Out Form \nStep 3: If you do not know your Access Code, get with your manager`;
        break;
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }

  return { botReply, status: 200 };
}

// Chatbot API Route
router.post("/", authenticateUser, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).send({ error: "Message is required" });

  const response = await manager.process("en", message);
  let botReply = response.answer || "I'm not sure how to respond.";

  const userId = req.auth?._id;

  // Handle intents
  try {
    switch (response.intent) {
      case "task.assigned":
        if (!userId)
          return res
            .status(401)
            .json({ error: "Unauthorized. Please log in." });

        const employee = await Employee.findById(userId).select("firstName");
        if (!employee)
          return res.status(404).json({ error: "Employee not found." });

        const tasks = await Task.find({ assignedEmployee: userId });
        if (tasks.length > 0) {
          const taskSummary = tasks.map((task) => task.getSummary());
          botReply = `Hello ${
            employee.firstName
          }! You have the following tasks assigned:\n${taskSummary
            .map((task) => `- ${task.title} [${task.category}]`)
            .join("\n")}`;
        } else {
          botReply = `Hello ${employee.firstName}! You have no tasks assigned currently.`;
        }
        break;

      case "task.complete":
        const completeMatch = message.match(/task (\d+|[a-zA-Z\s]+)/);
        const completeTitle = completeMatch ? completeMatch[0] : null;
        if (!completeTitle)
          return res
            .status(400)
            .json({ error: "No task title found in the message." });

        const completeTask = await Task.findOne({
          taskTitle: new RegExp(completeTitle, "i"),
          assignedEmployee: userId,
        });
        if (!completeTask)
          return res.status(404).json({ error: "Task not found." });

        completeTask.taskCompleted = true;
        await completeTask.save();
        botReply = `${
          responses["task.complete"][
            Math.floor(Math.random() * responses["task.complete"].length)
          ]
        }\nTask: ${completeTask.taskTitle} is now marked as complete.`;
        break;

      case "task.update":
        const updateMatch = message.match(/task (\d+|[a-zA-Z\s]+)/);
        const updateTitle = updateMatch ? updateMatch[0] : null;
        const newDetails = message.replace(updateTitle, "").trim();
        if (!updateTitle || !newDetails)
          return res
            .status(400)
            .json({ error: "Task title or new details not provided." });

        const updateTask = await Task.findOne({
          taskTitle: new RegExp(updateTitle, "i"),
          assignedEmployee: userId,
        });
        if (!updateTask)
          return res.status(404).json({ error: "Task not found." });

        updateTask.taskDetails = newDetails;
        await updateTask.save();
        botReply = `${
          responses["task.update"][
            Math.floor(Math.random() * responses["task.update"].length)
          ]
        }\nTask: ${updateTask.taskTitle} has been updated with new details: ${
          updateTask.taskDetails
        }`;
        break;

      default:
        const { botReply: generalReply } = await getGeneralBotReply(message);
        botReply = generalReply;
        break;
    }

    logInteraction(message, botReply);
    return res.json({ answer: botReply });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

// Chatbot API Route for General Questions
router.post("/general", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).send({ error: "Message is required" });
  }

  const { botReply, error, status } = await getGeneralBotReply(message);
  if (error) return res.status(status).json({ error });

  logInteraction(message, botReply);

  return res.json({ answer: botReply });
});

module.exports = router;
