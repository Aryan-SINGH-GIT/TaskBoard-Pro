const admin = require('../config/firebase');
const User = require('../models/User');
const mongoose = require('mongoose');

// Toggle to enable/disable test mode - DISABLED FOR PRODUCTION
const TESTING_MODE = false;

// Test user for development/testing
const TEST_USER = {
  _id: new mongoose.Types.ObjectId('5f8d0d55b54764421b715c78'), // Sample ObjectId
  name: 'Test User',
  email: 'test@example.com',
  firebaseUid: 'test-firebase-uid-123',
  badges: ['quick_starter'],
  photoURL: 'https://via.placeholder.com/150',
  notifications: {
    email: true,
    inApp: true
  }
};

// Middleware to verify the Firebase token and authenticate users
exports.protect = async (req, res, next) => {
  // If in testing mode, bypass token verification
  if (TESTING_MODE) {
    console.log('⚠️ TESTING MODE ENABLED: Bypassing authentication ⚠️');
    req.user = TEST_USER;
    return next();
  }

  let token;

  // Check if auth header exists and has the right format
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({ 
          success: false,
          error: 'Not authorized, no token'
        });
      }

      // Verify token with Firebase
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Get user from database using Firebase UID
      const user = await User.findOne({ firebaseUid: decodedToken.uid });

      // If user doesn't exist in our database, create a new one
      if (!user) {
        // This shouldn't happen often as users are created during signup,
        // but handle it just in case
        return res.status(401).json({
          success: false,
          error: 'User not found in database'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ 
        success: false,
        error: 'Not authorized, invalid token'
      });
    }
  } else {
    return res.status(401).json({ 
      success: false,
      error: 'Not authorized, no token'
    });
  }
};

// Middleware to check if user is a project member
exports.projectMember = async (req, res, next) => {
  try {
    // Skip project member check in testing mode
    if (TESTING_MODE) {
      console.log('⚠️ TESTING MODE ENABLED: Bypassing project member check ⚠️');
      req.project = { _id: req.params.id || req.body.projectId || req.body.project };
      return next();
    }

    const Project = require('../models/Project');
    const projectId = req.params.id || req.body.projectId || req.body.project;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user is a member of the project
    const isMember = project.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this project'
      });
    }

    req.project = project;
    next();
  } catch (error) {
    console.error('Project member check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Middleware to check if user is a project admin or owner
exports.projectAdmin = async (req, res, next) => {
  try {
    // Skip project admin check in testing mode
    if (TESTING_MODE) {
      console.log('⚠️ TESTING MODE ENABLED: Bypassing project admin check ⚠️');
      req.project = { _id: req.params.id || req.body.projectId || req.body.project };
      return next();
    }

    const Project = require('../models/Project');
    const projectId = req.params.id || req.body.projectId || req.body.project;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user is an admin or owner of the project
    const isAdmin = project.members.some(member => 
      member.user.toString() === req.user._id.toString() && 
      (member.role === 'admin' || member.role === 'owner')
    );

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized. Only project admins and owners can perform this action'
      });
    }

    req.project = project;
    next();
  } catch (error) {
    console.error('Project admin check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}; 