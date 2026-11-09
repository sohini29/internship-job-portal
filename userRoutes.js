const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const userAuthMiddleware = require("../middleware/userAuthMiddleware");

const router = express.Router();

function createUserToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: "user",
    },
    process.env.USER_JWT_SECRET,
    { expiresIn: "1d" }
  );
}

// User registration
router.post("/register", async (req, res) => {
  try {
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (name.length > 100 || email.length > 254) {
      return res.status(400).json({
        message: "Name or email is too long.",
      });
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and no more than 72 bytes.",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = createUserToken(user);

    return res.status(201).json({
      message: "Account created successfully.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("User registration error:", error.message);

    return res.status(500).json({
      message: "Could not create your account.",
    });
  }
});

// User login
router.post("/login", async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = createUserToken(user);

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("User login error:", error.message);

    return res.status(500).json({
      message: "Could not log in. Please try again.",
    });
  }
});

// Get the logged-in user's profile
router.get("/me", userAuthMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "name email createdAt"
    );

    if (!user) {
      return res.status(401).json({
        message: "User account not found.",
      });
    }

    return res.json({ user });
  } catch (error) {
    console.error("User profile error:", error.message);

    return res.status(500).json({
      message: "Could not load your profile.",
    });
  }
});

module.exports = router;