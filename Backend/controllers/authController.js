const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");

exports.register = async (req, res) => {
  // Input validation and sanitization
  await body("email").trim().escape().isEmail().run(req);
  await body("password").trim().isLength({ min: 6 }).run(req);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Create new user without hashing the password here
    user = new User({ username, email, password });
    
    // Save the user, which will trigger the pre-save hook for hashing
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(201).json({ token, user });
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({
        message:
          "Unable to register user at this time. Please try again later.",
      });
  }
};

// Login User with rate-limiting
let loginAttempts = 0;

exports.login = async (req, res) => {
  if (loginAttempts >= 50) {
    return res
      .status(429)
      .json({ message: "Too many login attempts. Please try again later." });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      loginAttempts++;
      return res.status(400).json({ message: "Invalid credentials" });
    }

    loginAttempts = 0; // Reset attempts on successful login

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving user profile", error: error.message });
  }
};
