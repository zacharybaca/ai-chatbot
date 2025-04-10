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
  "task.update": [
    "Updating the task.",
    "Task updated successfully.",
  ]
};

// Chatbot API Route
router.post("/", authenticateUser, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).send({ error: "Message is required" });
  }

  let response = await manager.process("en", message);
  let botReply = response.answer || "I'm not sure how to respond.";

  if (response.intent === "task.assigned") {
    // Get assigned tasks for the employee
    const userId = req.auth?._id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    try {
      const employee = await Employee.findById(userId).select('firstName lastName avatar isAdmin');
      if (!employee) {
        return res.status(404).json({ error: "Employee not found." });
      }

      const tasks = await Task.find({ assignedEmployee: userId });
      if (tasks.length > 0) {
        let taskSummary = tasks.map((task) => task.getSummary());
        botReply = `Hello ${employee.firstName}! You have the following tasks assigned:\n${taskSummary
          .map((task) => `- ${task.title} [${task.category}]`)
          .join("\n")}`;
      } else {
        botReply = `Hello ${employee.firstName}! You have no tasks assigned currently.`;
      }

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "An error occurred while fetching employee data." });
    }
  }

  if (response.intent === "task.complete") {
    // Extract task title or task ID from the message to identify the task
    const taskIdentifier = message.match(/task (\d+|[a-zA-Z\s]+)/); // Matches task number or task name
    const taskTitle = taskIdentifier ? taskIdentifier[0] : null;

    if (!taskTitle) {
      return res.status(400).json({ error: "No task title found in the message." });
    }

    try {
      const task = await Task.findOne({ taskTitle: new RegExp(taskTitle, 'i'), assignedEmployee: req.auth?._id });

      if (!task) {
        return res.status(404).json({ error: "Task not found." });
      }

      task.taskCompleted = true; // Mark task as complete
      await task.save();

      botReply = `${responses["task.complete"][Math.floor(Math.random() * responses["task.complete"].length)]}\nTask: ${task.taskTitle} is now marked as complete.`;
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "An error occurred while updating the task." });
    }
  }

  if (response.intent === "task.update") {
    // Extract task details from the message
    const taskIdentifier = message.match(/task (\d+|[a-zA-Z\s]+)/); // Matches task number or task name
    const taskTitle = taskIdentifier ? taskIdentifier[0] : null;
    const newTaskDetails = message.replace(taskTitle, '').trim(); // Extract new details (simplified logic)

    if (!taskTitle || !newTaskDetails) {
      return res.status(400).json({ error: "Task title or new details not provided." });
    }

    try {
      const task = await Task.findOne({ taskTitle: new RegExp(taskTitle, 'i'), assignedEmployee: req.auth?._id });

      if (!task) {
        return res.status(404).json({ error: "Task not found." });
      }

      task.taskDetails = newTaskDetails; // Update task details
      await task.save();

      botReply = `${responses["task.update"][Math.floor(Math.random() * responses["task.update"].length)]}\nTask: ${task.taskTitle} has been updated with new details: ${task.taskDetails}`;
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "An error occurred while updating the task." });
    }
  }

  // Log the interaction (if desired)
  logInteraction(message, botReply);

  // Send the chatbot's response
  res.json({ answer: botReply });
});

module.exports = router;
