const express = require("express");
const mongoose = require("mongoose");
const Application = require("../models/Application");
const Job = require("../models/Job");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Submit a job application
router.post("/", async (req, res) => {
  try {
    const {
      jobId,
      applicantName,
      email,
      phone,
      resumeLink,
      coverLetter,
    } = req.body;

    if (
      !jobId ||
      !mongoose.isValidObjectId(jobId) ||
      !applicantName?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !resumeLink?.trim()
    ) {
      return res.status(400).json({
        message: "Please fill in all required fields.",
      });
    }

    const job = await Job.findById(jobId);

    if (!job || job.isActive === false) {
      return res.status(404).json({
        message: "This job is not available.",
      });
    }

    if (
      job.deadline &&
      new Date(job.deadline).setHours(23, 59, 59, 999) < Date.now()
    ) {
      return res.status(400).json({
        message: "The application deadline has passed.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (!/^https?:\/\/\S+$/i.test(resumeLink.trim())) {
      return res.status(400).json({
        message:
          "Please provide a valid resume URL starting with http:// or https://.",
      });
    }

    const application = await Application.create({
      job: job._id,
      applicantName: applicantName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      resumeLink: resumeLink.trim(),
      coverLetter: coverLetter?.trim() || "",
    });

    return res.status(201).json({
      message: "Application submitted successfully!",
      applicationId: application._id,
    });
  } catch (error) {
    console.error("Application submission error:", error.message);

    return res.status(500).json({
      message: "Could not submit your application. Please try again.",
    });
  }
});

// Admin: view all applications
router.get("/", authMiddleware, async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("job", "title company location")
      .sort({ createdAt: -1 });

    return res.json(applications);
  } catch (error) {
    console.error("Fetch applications error:", error.message);

    return res.status(500).json({
      message: "Could not load applications.",
    });
  }
});

// Admin: update application status
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Reviewed",
      "Shortlisted",
      "Rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid application status",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid application ID",
      });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    return res.json({
      message: "Application status updated successfully",
      application,
    });
  } catch (error) {
    console.error("Update application status error:", error);

    return res.status(500).json({
      message: "Failed to update application status",
    });
  }
});

// Applicant: track applications using email
router.get("/track", async (req, res) => {
  try {
    const email = String(req.query.email || "")
      .trim()
      .toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const applications = await Application.find({ email })
      .populate("job", "title company location")
      .select("job status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const results = applications
      .filter((application) => application.job)
      .map((application) => ({
        id: application._id,
        jobTitle: application.job.title,
        company: application.job.company,
        location: application.job.location,
        status: application.status || "Pending",
        appliedAt: application.createdAt,
      }));

    return res.json({
      applications: results,
    });
  } catch (error) {
    console.error("Application tracking error:", error);

    return res.status(500).json({
      message: "Could not check application status.",
    });
  }
});

module.exports = router;