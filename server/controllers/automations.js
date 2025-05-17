const { validationResult } = require('express-validator');
const Automation = require('../models/Automation');
const Project = require('../models/Project');

/**
 * @desc    Get all automations for a project
 * @route   GET /api/automations
 * @access  Private (project members)
 */
exports.getAutomations = async (req, res) => {
  try {
    const { project } = req.query;
    
    if (!project) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    const automations = await Automation.find({ project })
      .populate('createdBy', 'name email photoURL')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: automations.length,
      data: automations
    });
  } catch (error) {
    console.error('Get automations error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get automation by ID
 * @route   GET /api/automations/:id
 * @access  Private (project members)
 */
exports.getAutomationById = async (req, res) => {
  try {
    const automation = await Automation.findById(req.params.id)
      .populate('createdBy', 'name email photoURL');

    if (!automation) {
      return res.status(404).json({
        success: false,
        error: 'Automation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: automation
    });
  } catch (error) {
    console.error('Get automation by ID error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Automation not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Create a new automation
 * @route   POST /api/automations
 * @access  Private (project admins only)
 */
exports.createAutomation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { name, projectId, trigger, action, active } = req.body;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Validate status name if action is changeTaskStatus
    if (action.type === 'changeTaskStatus' && action.params && action.params.status) {
      const isValidStatus = project.statuses.some(s => s.name === action.params.status);
      if (!isValidStatus) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status for this project'
        });
      }
    }

    // Create new automation
    const newAutomation = new Automation({
      name,
      project: projectId,
      createdBy: req.user._id,
      active: active !== undefined ? active : true,
      trigger,
      action
    });

    await newAutomation.save();

    const automation = await Automation.findById(newAutomation._id)
      .populate('createdBy', 'name email photoURL');

    res.status(201).json({
      success: true,
      data: automation
    });
  } catch (error) {
    console.error('Create automation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Update an automation
 * @route   PUT /api/automations/:id
 * @access  Private (project admins only)
 */
exports.updateAutomation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { name, trigger, action, active } = req.body;

    // Find the automation
    const automation = await Automation.findById(req.params.id);
    if (!automation) {
      return res.status(404).json({
        success: false,
        error: 'Automation not found'
      });
    }

    // Check if user is project admin
    const project = await Project.findById(automation.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Validate status name if action type is changeTaskStatus
    if (action && action.type === 'changeTaskStatus' && action.params && action.params.status) {
      const isValidStatus = project.statuses.some(s => s.name === action.params.status);
      if (!isValidStatus) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status for this project'
        });
      }
    }

    // Update automation fields
    if (name) automation.name = name;
    if (trigger) automation.trigger = trigger;
    if (action) automation.action = action;
    if (active !== undefined) automation.active = active;

    await automation.save();

    // Get the updated automation with populated fields
    const updatedAutomation = await Automation.findById(req.params.id)
      .populate('createdBy', 'name email photoURL');

    res.status(200).json({
      success: true,
      data: updatedAutomation
    });
  } catch (error) {
    console.error('Update automation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Toggle automation active status
 * @route   PUT /api/automations/:id/toggle
 * @access  Private (project admins only)
 */
exports.toggleAutomationStatus = async (req, res) => {
  try {
    const automation = await Automation.findById(req.params.id);
    if (!automation) {
      return res.status(404).json({
        success: false,
        error: 'Automation not found'
      });
    }

    automation.active = !automation.active;
    await automation.save();

    res.status(200).json({
      success: true,
      data: automation
    });
  } catch (error) {
    console.error('Toggle automation status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Delete an automation
 * @route   DELETE /api/automations/:id
 * @access  Private (project admins only)
 */
exports.deleteAutomation = async (req, res) => {
  try {
    const automation = await Automation.findById(req.params.id);
    if (!automation) {
      return res.status(404).json({
        success: false,
        error: 'Automation not found'
      });
    }

    // Check if user is project admin or owner
    const project = await Project.findById(automation.project);
    const isAdmin = project.members.some(member => 
      member.user.toString() === req.user._id.toString() && 
      (member.role === 'admin' || member.role === 'owner')
    );

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this automation'
      });
    }

    await automation.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete automation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}; 