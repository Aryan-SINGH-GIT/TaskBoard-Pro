const mongoose = require('mongoose');

const AutomationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  // Trigger types: taskStatusChange, taskAssigneeChange, taskDueDatePassed
  trigger: {
    type: {
      type: String,
      required: true,
      enum: ['taskStatusChange', 'taskAssigneeChange', 'taskDueDatePassed']
    },
    // For taskStatusChange: from and to status
    // For taskAssigneeChange: specific assignee ID
    // For taskDueDatePassed: no additional conditions
    conditions: {
      fromStatus: String,
      toStatus: String,
      assigneeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },
  // Action types: changeTaskStatus, assignBadge, sendNotification
  action: {
    type: {
      type: String,
      required: true,
      enum: ['changeTaskStatus', 'assignBadge', 'sendNotification']
    },
    // For changeTaskStatus: new status
    // For assignBadge: badge name
    // For sendNotification: message
    params: {
      status: String,
      badgeName: String,
      notificationMessage: String,
      notificationType: {
        type: String,
        enum: ['info', 'warning', 'success']
      }
    }
  },
  executionCount: {
    type: Number,
    default: 0
  },
  lastExecuted: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Automation', AutomationSchema); 