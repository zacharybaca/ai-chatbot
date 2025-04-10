# AI Chatbot

An AI-powered chatbot designed to assist users by providing relevant information and managing tasks through natural language conversations.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Natural Language Processing (NLP)**: Understands and processes user inputs to provide accurate responses.
- **Task Management**: Allows users to create, update, and mark tasks as complete through conversational commands.
- **Real-Time Responses**: Provides immediate feedback and assistance to user queries.
- **Extensible Architecture**: Modular design for easy integration of additional functionalities.

## Technologies Used

- **Backend**: Node.js with Express.js framework.
- **NLP**: NLP.js library for natural language understanding.
- **Database**: MongoDB for storing user data and tasks.
- **WebSocket**: For real-time communication between the client and server.

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/zacharybaca/ai-chatbot.git

2. **Navigate to the project directory**:
    ```bash
    cd ai-chatbot

3. **Install the dependencies**:
    ```bash
    npm install

4. **Set up environment variables**:
    Create a <code>.env</code> file in the root directory and add the following:
    Replace <code><your-mongodb-uri></code> with your MongoDB connection string.
    ```bash
    MONGODB_URI=<your-mongodb-uri>
    PORT=3000
    NODE_ENV=development

5. **Start the server**:
    ```bash
    npm start
    The server will run at <code>http://localhost:3000</code>.

## Usage

Once the server is running, users can interact with the chatbot through the client interface. The chatbot can handle various commands, such as:

- Creating a new task:
    ```bash
    Create a new task: "Fix the login bug."

- Updating an existing task:
    ```bash
    Update task "Fix the login bug" to "Fix the login and registration bugs."

- Marking a task as complete:
    ```bash
    Mark task "Fix the login bug" as complete.

The chatbot processes these commands and updates the task list accordingly.

## Project Structure
    ai-chatbot/
    ├── middleware/           # Custom middleware functions
    ├── models/               # Mongoose schemas for data models
    ├── nlp/                  # NLP.js configuration and training data
    ├── routes/               # API route definitions
    ├── .gitignore            # Files and directories to ignore in git
    ├── package-lock.json     # npm lockfile
    ├── package.json          # Project metadata and dependencies
    ├── server.js             # Main server file
    └── README.md             # Project documentation


    
