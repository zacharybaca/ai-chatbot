const { NlpManager } = require("node-nlp");
const fs = require("fs");

const manager = new NlpManager({ languages: ["en"] });

const trainAndSave = async () => {
  if (fs.existsSync("./model.nlp")) {
    await manager.load("./model.nlp");
  } else {
    // Documents
    manager.addDocument("en", "how do I report a bug?", "bug.report");
    manager.addDocument("en", "where can I submit a bug?", "bug.report");
    manager.addDocument("en", "what are my assigned tasks?", "task.assigned");
    manager.addDocument("en", "show my unassigned tasks", "task.unassigned");
    manager.addDocument("en", "I cannot log in", "auth.issue");
    manager.addDocument("en", "how do I reset my password?", "auth.reset");
    manager.addDocument("en", "how does this system work?", "general.help");
    manager.addDocument("en", "tell me about this bug tracker", "general.help");

    // Answers
    manager.addAnswer(
      "en",
      "bug.report",
      'You can report a bug via the "Report a Bug" section on your dashboard.'
    );
    manager.addAnswer(
      "en",
      "auth.issue",
      "If you're having trouble logging in, double-check your credentials or reset your password."
    );
    manager.addAnswer(
      "en",
      "auth.reset",
      'Go to the login page and click "Forgot Password" to reset it.'
    );
    manager.addAnswer(
      "en",
      "general.help",
      "This bug tracker helps your team manage and fix issues efficiently."
    );

    await manager.train();
    await manager.save("./model.nlp");
  }
};

trainAndSave();

module.exports = manager;
