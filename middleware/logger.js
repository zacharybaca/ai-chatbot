const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "../chat_logs.txt");

const logInteraction = (userMessage, botReply) => {
  const entry = `${new Date().toISOString()} - User: ${userMessage} | Bot: ${botReply}\n`;
  fs.appendFile(logFile, entry, (err) => {
    if (err) console.error("Logging error:", err);
  });
};

module.exports = { logInteraction };
