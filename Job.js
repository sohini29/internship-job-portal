const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },

    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },

    location: {
      type: String,
      required: [true, "Job location is required"],
      trim: true,
    },

    type: {
      type: String,
      enum: ["Internship", "Full-time", "Part-time", "Contract"],
      required: [true, "Job type is required"],
    },

    category: {
      type: String,
      required: [true, "Job category is required"],
      trim: true,
    },

    salary: {
      type: String,
      default: "Not specified",
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
    },

    requirements: {
      type: [String],
      default: [],
    },

    skills: {
      type: [String],
      default: [],
    },

    applicationLink: {
      type: String,
      default: "",
      trim: true,
    },

    deadline: {
      type: Date,
      default: null,
    },

    postedBy: {
      type: String,
      default: "Admin",
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Job", jobSchema);