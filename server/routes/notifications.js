const express = require('express');
const notificationController = require('../controllers/notifications');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All notification routes are protected
router.use(protect);

// @route   GET /api/notifications
// @desc    Get all notifications for the current user
// @access  Private
router.get('/', notificationController.getUserNotifications);

// @route   PUT /api/notifications/:id
// @desc    Mark notification as read
// @access  Private
router.put('/:id', notificationController.markNotificationRead);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', notificationController.markAllNotificationsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', notificationController.deleteNotification);

module.exports = router; 