const { validationResult } = require('express-validator');
const admin = require('firebase-admin'); // Make sure firebase-admin is initialized
const User = require('../models/User');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');

/**
 * @desc    Register a new user with Firebase token
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, photoURL, firebaseUid } = req.body;

    // Check if user already exists in MongoDB
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Firebase user handling
    let uid = firebaseUid;
    
    // If no firebaseUid is provided, create a Firebase user
    if (!uid) {
      try {
        const firebaseUser = await admin.auth().createUser({
          email,
          password,
          displayName: name,
          photoURL: photoURL || undefined,
        });
        uid = firebaseUser.uid;
      } catch (firebaseError) {
        console.error('Firebase user creation error:', firebaseError);
        return res.status(400).json({ error: firebaseError.message });
      }
    }

    // Hash password for MongoDB
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user to MongoDB with Firebase UID
    user = new User({
      name,
      email,
      firebaseUid: uid,
      password: hashedPassword,
      photoURL: photoURL || '',
      badges: ['quick_starter']
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        badges: user.badges
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Login user and return token
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Get Firebase custom token for the user
    const customToken = await admin.auth().createCustomToken(user.firebaseUid);

    res.status(200).json({
      success: true,
      token: customToken,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        badges: user.badges
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get current user's profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getCurrentUser = async (req, res) => {
  try {
    // User is already available in req.user from the auth middleware
    const user = req.user;

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Update current user's profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
exports.updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, photoURL, notifications } = req.body;
    const userId = req.user._id;

    // Find and update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        name,
        photoURL: photoURL || req.user.photoURL,
        notifications: notifications || req.user.notifications
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get user notifications
 * @route   GET /api/auth/notifications
 * @access  Private
 */
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      recipient: req.user._id 
    })
    .sort({ createdAt: -1 })
    .populate('relatedTask', 'title')
    .populate('relatedProject', 'title');

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/auth/notifications/:id
 * @access  Private
 */
exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found or you do not have permission'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};