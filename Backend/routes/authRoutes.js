const express = require("express");
const { login, register, getProfile } = require("../controllers/authController");
const { check } = require("express-validator");
const authMiddleware = require("../middlewares/authMiddleware")

const router = express.Router();

// Register route with validation
router.post('/register', [
  check('username').not().isEmpty().withMessage('Username is required'),
  check('email').isEmail().withMessage('Please provide a valid email'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], register);

// Login route with validation
router.post('/login', [
  check('email').isEmail().withMessage('Please provide a valid email'),
  check('password').not().isEmpty().withMessage('Password is required'),
], login);

// Protected route for user profile (requires authentication middleware)
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
