const express = require('express');
const { check } = require('express-validator');
const automationController = require('../controllers/automations');
const { protect, projectAdmin } = require('../middleware/auth');

const router = express.Router();

// All automation routes are protected
router.use(protect);

// @route   GET /api/automations
// @desc    Get all automations for a project
// @access  Private
router.get('/', automationController.getAutomations);

// @route   GET /api/automations/:id
// @desc    Get automation by ID
// @access  Private
router.get('/:id', automationController.getAutomationById);

// @route   POST /api/automations
// @desc    Create a new automation
// @access  Private (project admins only)
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('projectId', 'Project ID is required').not().isEmpty(),
    check('trigger', 'Trigger configuration is required').isObject(),
    check('trigger.type', 'Trigger type is required').not().isEmpty(),
    check('action', 'Action configuration is required').isObject(),
    check('action.type', 'Action type is required').not().isEmpty()
  ],
  projectAdmin,
  automationController.createAutomation
);

// @route   PUT /api/automations/:id
// @desc    Update an automation
// @access  Private (project admins only)
router.put(
  '/:id',
  projectAdmin,
  automationController.updateAutomation
);

// @route   PUT /api/automations/:id/toggle
// @desc    Toggle automation active status
// @access  Private (project admins only)
router.put(
  '/:id/toggle',
  projectAdmin,
  automationController.toggleAutomationStatus
);

// @route   DELETE /api/automations/:id
// @desc    Delete an automation
// @access  Private (project admins only)
router.delete(
  '/:id',
  projectAdmin,
  automationController.deleteAutomation
);

module.exports = router; 