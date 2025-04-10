const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

const employeeSchema = new Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  roleAtCompany: {
    type: String,
    required: true,
  },
  user: {
    userID: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: function () {
        return !!this.user.userID; // Dynamically require password if userID exists
      },
    },
    associatedEmployee: {
      type: String,
      required: false,
    },
  },
  accessCode: {
    type: String,
    required: function () {
      return !!this.user.userID; // Dynamically require accessCode if userID exists
    },
  },
  avatar: {
    type: String,
    default: "/uploads/default-profile-pic.jpg",
    required: false,
  },
  generateAccessCode: {
    type: Boolean,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

// Pre-save hook to remove empty userID
employeeSchema.pre("save", function (next) {
  if (this.user && (!this.user.userID || this.user.userID === "")) {
    this.user.userID = undefined; // Set null or empty string userID to undefined
  }
  next();
});

// Pre-save hook to hash password before saving to DB
employeeSchema.pre("save", async function (next) {
  const user = this.user;
  if (user && user.isModified("password")) {
    try {
      const hash = await bcrypt.hash(user.password, 10);
      user.password = hash;
    } catch (error) {
      return next(error);
    }
  }
});

// Added method to check if hashed password equals plain-text password
employeeSchema.methods.checkPassword = async function (passwordAttempt) {
  try {
    const isMatch = await bcrypt.compare(passwordAttempt, this.user.password);
    return isMatch;
  } catch (error) {
    throw new Error("Error comparing passwords");
  }
};

// Added method that removes password from object before sending back to client
employeeSchema.methods.withoutPassword = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Virtual property to combine first and last name into a full name
employeeSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual property to get the avatar URL
employeeSchema.virtual("profilePicture").get(function () {
  return this.avatar || "/uploads/default-profile-pic.jpg";
});

// Check if the employee has a user ID for authentication
employeeSchema.virtual("hasUserID").get(function () {
  return !!this.user?.userID; // Returns true if userID exists, false otherwise
});

module.exports = mongoose.model("Employee", employeeSchema);
