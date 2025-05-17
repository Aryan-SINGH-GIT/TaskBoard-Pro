const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Automation = require('../models/Automation');

/**
 * @desc    Get all tasks for a project
 * @route   GET /api/tasks
 * @access  Private (project members)
 */
exports.getTasks = async (req, res) => {
  try {
    const { project } = req.query;
    
    if (!project) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    const tasks = await Task.find({ project })
      .populate('assignee', 'name email photoURL')
      .populate('reporter', 'name email photoURL')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private (project members)
 */
exports.createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { title, description, dueDate, assigneeId, projectId, status, priority, labels } = req.body;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Validate status against project's allowed statuses
    const isValidStatus = project.statuses.some(s => s.name === status);
    if (!isValidStatus && status) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status for this project'
      });
    }

    // If no status is provided, use the first status in the project
    const taskStatus = status || project.statuses[0]?.name || 'To Do';

    // Create new task
    const newTask = new Task({
      title,
      description,
      project: projectId,
      reporter: req.user._id,
      status: taskStatus,
      priority: priority || 'Medium'
    });

    // Add optional fields if provided
    if (dueDate) newTask.dueDate = dueDate;
    
    // Handle assignee - check if it's a Firebase UID and find corresponding MongoDB ID
    if (assigneeId) {
      // Check if this is a Firebase UID (not a MongoDB ObjectId)
      if (assigneeId.length !== 24 || !mongoose.Types.ObjectId.isValid(assigneeId)) {
        // Try to find the user by Firebase UID
        const assigneeUser = await User.findOne({ firebaseUid: assigneeId });
        if (assigneeUser) {
          newTask.assignee = assigneeUser._id; // Use MongoDB ObjectId instead
        } else {
          console.warn(`User with Firebase UID ${assigneeId} not found, leaving task unassigned`);
        }
      } else {
        // It's already a proper ObjectId
        newTask.assignee = assigneeId;
      }
    }
    
    if (labels && Array.isArray(labels)) newTask.labels = labels;

    await newTask.save();

    // Populate user data
    const task = await Task.findById(newTask._id)
      .populate('assignee', 'name email photoURL')
      .populate('reporter', 'name email photoURL');

    // Check for automations to run
    await checkAndRunAutomationsForTask(task, 'taskCreated', req.user._id, null);

    // Create a notification for the assignee if assigned
    if (newTask.assignee && newTask.assignee.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: newTask.assignee,
        type: 'info',
        title: 'New Task Assigned',
        message: `You have been assigned to "${title}"`,
        relatedTask: newTask._id,
        relatedProject: projectId,
        createdBy: req.user._id
      });
    }

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get a task by ID
 * @route   GET /api/tasks/:id
 * @access  Private (project members)
 */
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email photoURL')
      .populate('reporter', 'name email photoURL')
      .populate('comments.user', 'name email photoURL')
      .populate('attachments.uploadedBy', 'name email photoURL')
      .populate('history.changedBy', 'name email photoURL');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task by ID error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Update a task
 * @route   PUT /api/tasks/:id
 * @access  Private (project members)
 */
exports.updateTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { title, description, dueDate, assigneeId, status, priority, labels } = req.body;

    // Find the task
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Get the project to validate status
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if status is valid for the project
    if (status) {
      const isValidStatus = project.statuses.some(s => s.name === status);
      if (!isValidStatus) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status for this project'
        });
      }
    }

    // Save previous state for automation checks
    const previousStatus = task.status;
    const previousAssigneeId = task.assignee ? task.assignee.toString() : null;

    // Create history records for changes
    const history = [];
    
    if (title && title !== task.title) {
      history.push({
        field: 'title',
        oldValue: task.title,
        newValue: title,
        changedBy: req.user._id,
        changedAt: Date.now()
      });
    }
    
    if (status && status !== task.status) {
      history.push({
        field: 'status',
        oldValue: task.status,
        newValue: status,
        changedBy: req.user._id,
        changedAt: Date.now()
      });
    }
    
    // Process assigneeId and handle Firebase UID if needed
    let resolvedAssigneeId = assigneeId;
    if (assigneeId) {
      // Check if this is a Firebase UID (not a MongoDB ObjectId)
      if (assigneeId.length !== 24 || !mongoose.Types.ObjectId.isValid(assigneeId)) {
        // Try to find the user by Firebase UID
        const assigneeUser = await User.findOne({ firebaseUid: assigneeId });
        if (assigneeUser) {
          resolvedAssigneeId = assigneeUser._id; // Use MongoDB ObjectId instead
        } else {
          console.warn(`User with Firebase UID ${assigneeId} not found, not updating assignee`);
          resolvedAssigneeId = null;
        }
      }
    }
    
    if (resolvedAssigneeId && (!task.assignee || resolvedAssigneeId.toString() !== task.assignee.toString())) {
      history.push({
        field: 'assignee',
        oldValue: task.assignee || 'Unassigned',
        newValue: resolvedAssigneeId,
        changedBy: req.user._id,
        changedAt: Date.now()
      });

      // Create notification for new assignee
      if (resolvedAssigneeId.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: resolvedAssigneeId,
          type: 'info',
          title: 'Task Assigned',
          message: `You have been assigned to "${task.title}"`,
          relatedTask: task._id,
          relatedProject: task.project,
          createdBy: req.user._id
        });
      }
    }

    // Update task fields
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate) task.dueDate = dueDate;
    if (resolvedAssigneeId) task.assignee = resolvedAssigneeId;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (labels && Array.isArray(labels)) task.labels = labels;
    
    // Add history records
    if (history.length > 0) {
      task.history = [...task.history, ...history];
    }

    // Save the task
    await task.save();
    
    // Get the updated task with populated fields
    task = await Task.findById(req.params.id)
      .populate('assignee', 'name email photoURL')
      .populate('reporter', 'name email photoURL');

    // Check and run automations for status change
    if (status && status !== previousStatus) {
      await checkAndRunAutomationsForTask(
        task, 
        'taskStatusChange', 
        req.user._id,
        { 
          fromStatus: previousStatus,
          toStatus: status
        }
      );
    }

    // Check and run automations for assignee change
    if (resolvedAssigneeId && resolvedAssigneeId !== previousAssigneeId) {
      await checkAndRunAutomationsForTask(
        task, 
        'taskAssigneeChange', 
        req.user._id,
        { 
          assigneeId: resolvedAssigneeId
        }
      );
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private (project members)
 */
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Check if user is a member of the project
    const project = await Project.findById(task.project);
    const isMember = project.members.some(
      member => member.user.toString() === req.user._id.toString()
    );

    // Only allow admins/owners or the reporter to delete the task
    const isAdmin = project.members.some(
      member => member.user.toString() === req.user._id.toString() && 
               (member.role === 'admin' || member.role === 'owner')
    );

    if (!isAdmin && task.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this task'
      });
    }

    await task.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Add comment to a task
 * @route   POST /api/tasks/:id/comments
 * @access  Private (project members)
 */
exports.addComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const newComment = {
      text,
      user: req.user._id,
      createdAt: Date.now()
    };

    task.comments.unshift(newComment);
    await task.save();

    // Populate user data in the new comment
    const updatedTask = await Task.findById(req.params.id)
      .populate('comments.user', 'name email photoURL');

    // Notify task assignee and reporter if they're different from the commenter
    if (task.assignee && task.assignee.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: task.assignee,
        type: 'info',
        title: 'New Comment on Task',
        message: `New comment on task "${task.title}"`,
        relatedTask: task._id,
        relatedProject: task.project,
        createdBy: req.user._id
      });
    }

    if (task.reporter.toString() !== req.user._id.toString() && 
        (!task.assignee || task.reporter.toString() !== task.assignee.toString())) {
      await Notification.create({
        recipient: task.reporter,
        type: 'info',
        title: 'New Comment on Task',
        message: `New comment on task "${task.title}"`,
        relatedTask: task._id,
        relatedProject: task.project,
        createdBy: req.user._id
      });
    }

    res.status(200).json({
      success: true,
      data: updatedTask.comments[0]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Helper function to check and run automations for a task
async function checkAndRunAutomationsForTask(task, triggerType, userId, conditions) {
  try {
    // Find applicable automations for this project and trigger type
    const automations = await Automation.find({
      project: task.project,
      'trigger.type': triggerType,
      active: true
    });

    if (!automations.length) return;

    for (const automation of automations) {
      let shouldRun = true;

      // Check specific conditions based on trigger type
      if (triggerType === 'taskStatusChange') {
        const { fromStatus, toStatus } = conditions;
        const autoFromStatus = automation.trigger.conditions.fromStatus;
        const autoToStatus = automation.trigger.conditions.toStatus;
        
        // If automation specifies fromStatus, it must match
        if (autoFromStatus && autoFromStatus !== fromStatus) {
          shouldRun = false;
        }
        
        // If automation specifies toStatus, it must match
        if (autoToStatus && autoToStatus !== toStatus) {
          shouldRun = false;
        }
      }
      
      else if (triggerType === 'taskAssigneeChange') {
        const { assigneeId } = conditions;
        const autoAssigneeId = automation.trigger.conditions.assigneeId;
        
        // If automation specifies assigneeId, it must match
        if (autoAssigneeId && autoAssigneeId.toString() !== assigneeId) {
          shouldRun = false;
        }
      }
      
      // If conditions are met, execute the automation action
      if (shouldRun) {
        await executeAutomationAction(automation, task, userId);
        
        // Update automation execution count and timestamp
        await Automation.findByIdAndUpdate(automation._id, {
          $inc: { executionCount: 1 },
          lastExecuted: Date.now()
        });
      }
    }
  } catch (error) {
    console.error('Error checking automations:', error);
  }
}

// Helper function to execute automation actions
async function executeAutomationAction(automation, task, userId) {
  const actionType = automation.action.type;
  const params = automation.action.params;

  try {
    switch (actionType) {
      case 'changeTaskStatus':
        if (params.status) {
          // Update task status
          await Task.findByIdAndUpdate(task._id, { 
            status: params.status,
            $push: { 
              history: {
                field: 'status',
                oldValue: task.status,
                newValue: params.status,
                changedBy: userId,
                changedAt: Date.now(),
              }
            }
          });
          
          console.log(`Automation: Changed task ${task._id} status to ${params.status}`);
        }
        break;

      case 'assignBadge':
        if (params.badgeName && task.assignee) {
          // Add badge to user if they don't already have it
          await User.findByIdAndUpdate(
            task.assignee,
            { $addToSet: { badges: params.badgeName } }
          );
          
          // Create notification for badge award
          await Notification.create({
            recipient: task.assignee,
            type: 'success',
            title: 'Badge Awarded',
            message: `You earned the "${params.badgeName}" badge!`,
            relatedTask: task._id,
            relatedProject: task.project,
            createdBy: userId
          });
          
          console.log(`Automation: Assigned badge ${params.badgeName} to user ${task.assignee}`);
        }
        break;

      case 'sendNotification':
        if (params.notificationMessage && task.assignee) {
          // Send notification
          await Notification.create({
            recipient: task.assignee,
            type: params.notificationType || 'info',
            title: 'Task Notification',
            message: params.notificationMessage,
            relatedTask: task._id,
            relatedProject: task.project,
            createdBy: userId
          });
          
          console.log(`Automation: Sent notification to user ${task.assignee}`);
        }
        break;

      default:
        console.log(`Unknown automation action type: ${actionType}`);
    }
  } catch (error) {
    console.error(`Error executing automation action: ${error.message}`);
  }
} 