
const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Helper: check whether the required environment variables exist
function isAdminConfigured() {
  return Boolean(
    process.env.ADMIN_USERNAME &&
    process.env.ADMIN_PASSWORD &&
    process.env.JWT_SECRET
  );
}

// Admin login
router.post("/login", (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!isAdminConfigured()) {
      return res.status(500).json({
        message: "Admin login is not configured on the server.",
      });
    }

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Please enter your username and password.",
      });
    }

    if (
      username.trim() !== process.env.ADMIN_USERNAME ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    const token = jwt.sign(
      { username: username.trim(), role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      username: username.trim(),
    });
  } catch (error) {
    console.error("Admin login error:", error.message);

    return res.status(500).json({
      message: "An error occurred during admin login.",
    });
  }
});

// Admin registration
router.post("/register", (req, res) => {
  try {
    const { username, password, registrationKey } = req.body || {};

    // Check server configuration
    if (
      !isAdminConfigured() ||
      !process.env.ADMIN_REGISTRATION_KEY
    ) {
      console.error(
        "Admin registration configuration is missing:",
        {
          adminUsernameConfigured: Boolean(process.env.ADMIN_USERNAME),
          adminPasswordConfigured: Boolean(process.env.ADMIN_PASSWORD),
          registrationKeyConfigured: Boolean(
            process.env.ADMIN_REGISTRATION_KEY
          ),
          jwtSecretConfigured: Boolean(process.env.JWT_SECRET),
        }
      );

      return res.status(500).json({
        message:
          "Admin registration is not configured on the server. Check backend/.env and restart the backend.",
      });
    }

    // Validate form fields
    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      typeof registrationKey !== "string" ||
      !username.trim() ||
      !password ||
      !registrationKey
    ) {
      return res.status(400).json({
        message: "Please complete all registration fields.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    // Verify private registration key
    if (registrationKey !== process.env.ADMIN_REGISTRATION_KEY) {
      return res.status(403).json({
        message: "Invalid admin registration key.",
      });
    }

    // This project supports one admin configured in backend/.env
    if (
      username.trim() !== process.env.ADMIN_USERNAME ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(400).json({
        message:
          "The username and password must match the admin credentials configured by the project owner.",
      });
    }

    // Issue token after successful verification
    const token = jwt.sign(
      { username: username.trim(), role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(201).json({
      message: "Admin registration verified successfully.",
      token,
      username: username.trim(),
    });
  } catch (error) {
    console.error("Admin registration error:", error.message);

    return res.status(500).json({
      message: "An error occurred during admin registration.",
    });
  }
});

module.exports = router;