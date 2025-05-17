const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user with Firebase token
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  authController.registerUser
);

// @route   POST /api/auth/login
// @desc    Login user and return token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  authController.loginUser
);

// @route   GET /api/auth/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', protect, authController.getCurrentUser);

// @route   PUT /api/auth/me
// @desc    Update current user's profile
// @access  Private
router.put(
  '/me',
  protect,
  [
    check('name', 'Name is required').not().isEmpty()
  ],
  authController.updateUser
);

// @route   GET /api/auth/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', protect, authController.getUserNotifications);

// @route   PUT /api/auth/notifications/:id
// @desc    Mark notification as read
// @access  Private
router.put('/notifications/:id', protect, authController.markNotificationRead);

module.exports = router; 