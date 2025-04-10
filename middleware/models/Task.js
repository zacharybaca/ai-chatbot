const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema({
    taskTitle: {
        type: String,
        required: true
    },
    taskCompleted: {
        type: Boolean,
        default: false
    },
    taskDetails: {
        type: String,
        required: true
    },
    taskTodos: {
        type: String,
    },
    taskUpdates: [
        {
            updateText: { type: String, required: false },
            updatedAt: { type: Date, default: Date.now }
        }
    ],
    // Add the category field here
    category: {
        type: String,
        enum: ['Frontend', 'Backend', 'Performance', 'Security', 'Uncategorized'],  // Optional: limit categories to these options
        default: 'Uncategorized'  // Default category if none provided
    },
    assignedEmployee: {
        type: Schema.Types.ObjectId,
        ref: "Employee"
    }
});

// You may want to add methods related to category in the future, like updating it based on task data

taskSchema.methods.autoAssignCategory = function() {
    const taskDescription = `${this.taskTitle} ${this.taskDetails}`.toLowerCase();
    
    // Add your category detection logic here
    const categoryKeywords = {
        Frontend: ["UI", "layout", "mobile", "button", "design", "responsive", "image", "CSS"],
        Backend: ["API", "database", "server", "authentication", "backend", "request", "response", "endpoint"],
        Performance: ["optimize", "speed", "performance", "load", "time", "CPU", "memory", "lag", "slow"],
        Security: ["secure", "authentication", "login", "privacy", "encryption", "hack", "vulnerability"],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => taskDescription.includes(keyword.toLowerCase()))) {
            this.category = category;
            return this.save();
        }
    }

    this.category = "Uncategorized"; // Default category
    return this.save();
};

taskSchema.methods.getSummary = function() {
    return {
        title: this.taskTitle,
        completed: this.taskCompleted,
        details: this.taskDetails,
        category: this.category  // Include category in the summary
    };
};

taskSchema.methods.markComplete = function() {
    this.taskCompleted = true;
    return this.save();
};

module.exports = mongoose.model("Task", taskSchema);
