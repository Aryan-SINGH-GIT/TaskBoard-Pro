const Automation = require('../models/Automation');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Middleware to process task status change automations
 */
exports.processTaskStatusChange = async (req, res, next) => {
  const taskId = req.params.id || req.body.taskId;
  const newStatus = req.body.status;
  
  try {
    // Get the task with its previous state
    const task = await Task.findById(taskId);
    if (!task) {
      return next();
    }
    
    const oldStatus = task.status;
    
    // Check if status actually changed
    if (oldStatus === newStatus) {
      return next();
    }
    
    // Get all automations for this project related to task status
    const automations = await Automation.find({
      project: task.project,
      'trigger.type': 'taskStatusChanged',
      enabled: true
    });
    
    // No relevant automations found
    if (!automations || automations.length === 0) {
      return next();
    }
    
    // Process each automation
    for (const automation of automations) {
      const { conditions } = automation.trigger;
      const { type, parameters } = automation.action;
      
      // Check if this automation should be triggered
      if ((conditions.fromStatus && conditions.fromStatus !== oldStatus) || 
          (conditions.toStatus && conditions.toStatus !== newStatus)) {
        continue;
      }
      
      // Execute the action based on its type
      switch (type) {
        case 'changeStatus':
          // Skip if it would create a loop
          if (parameters.newStatus !== newStatus) {
            task.status = parameters.newStatus;
            await task.save();
            
            // Add to status history
            task.statusHistory.push({
              from: newStatus,
              to: parameters.newStatus,
              changedBy: req.user._id,
              changedAt: Date.now()
            });
          }
          break;
          
        case 'assignUser':
          // Assign the task to someone else
          const prevAssignee = task.assignee;
          task.assignee = parameters.userId;
          await task.save();
          
          // Add to assignee history
          task.assigneeHistory.push({
            from: prevAssignee,
            to: parameters.userId,
            changedBy: req.user._id,
            changedAt: Date.now()
          });
          
          // Notify the new assignee
          await Notification.create({
            recipient: parameters.userId,
            title: 'Task Assigned to You',
            message: `Task '${task.title}' was assigned to you by automation rule '${automation.name}'`,
            type: 'automation',
            relatedTask: task._id,
            relatedProject: task.project
          });
          break;
          
        case 'addBadge':
          // Add badge to the task author/completor
          const badgeRecipient = task.assignee || task.reporter;
          
          if (badgeRecipient) {
            const user = await User.findById(badgeRecipient);
            
            // Add badge if the user doesn't have it already
            if (user && !user.badges.includes(parameters.badgeName)) {
              user.badges.push(parameters.badgeName);
              await user.save();
              
              // Notify the user about the new badge
              await Notification.create({
                recipient: user._id,
                title: 'New Badge Earned!',
                message: `You've earned the "${parameters.badgeName}" badge for your work on task "${task.title}"!`,
                type: 'automation',
                relatedTask: task._id,
                relatedProject: task.project
              });
            }
          }
          break;
          
        case 'sendNotification':
          // Get all project members
          const project = await req.app.models.Project.findById(task.project).populate('members.user');
          
          // Send notification to all project members
          for (const member of project.members) {
            await Notification.create({
              recipient: member.user._id,
              title: parameters.notificationTitle,
              message: parameters.notificationMessage.replace('{{taskTitle}}', task.title),
              type: 'automation',
              relatedTask: task._id,
              relatedProject: task.project
            });
          }
          break;
      }
      
      // Emit event via Socket.io if available
      const io = req.app.get('io');
      if (io) {
        io.to(task.project.toString()).emit('automation-triggered', {
          taskId: task._id,
          automationId: automation._id,
          automationName: automation.name
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Automation processing error:', error);
    // Continue with the request even if automation processing fails
    next();
  }
};

/**
 * Middleware to process task assignment automations
 */
exports.processTaskAssignment = async (req, res, next) => {
  if (!req.body.assignee) {
    return next();
  }
  
  const taskId = req.params.id || req.body.taskId;
  const newAssigneeId = req.body.assignee;
  
  try {
    // Get the task with its previous state
    const task = await Task.findById(taskId);
    if (!task) {
      return next();
    }
    
    // Check if assignee actually changed
    if (task.assignee && task.assignee.toString() === newAssigneeId.toString()) {
      return next();
    }
    
    // Get all automations for this project related to task assignment
    const automations = await Automation.find({
      project: task.project,
      'trigger.type': 'taskAssigned',
      'trigger.conditions.assignee': newAssigneeId,
      enabled: true
    });
    
    // No relevant automations found
    if (!automations || automations.length === 0) {
      return next();
    }
    
    // Process each automation
    for (const automation of automations) {
      const { type, parameters } = automation.action;
      
      // Execute the action based on its type
      switch (type) {
        case 'changeStatus':
          task.status = parameters.newStatus;
          await task.save();
          
          // Add to status history
          task.statusHistory.push({
            from: task.status,
            to: parameters.newStatus,
            changedBy: req.user._id,
            changedAt: Date.now()
          });
          break;
          
        // Other action types can be handled similarly
      }
      
      // Emit event via Socket.io if available
      const io = req.app.get('io');
      if (io) {
        io.to(task.project.toString()).emit('automation-triggered', {
          taskId: task._id,
          automationId: automation._id,
          automationName: automation.name
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Automation processing error:', error);
    next();
  }
};

// Additional automation processors can be added for other trigger types 