const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['owner', 'admin', 'member'],
        default: 'member'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  pendingInvites: [
    {
      email: {
        type: String,
        required: true
      },
      role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
      },
      invitedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  statuses: [
    {
      name: {
        type: String,
        required: true,
        trim: true
      },
      color: {
        type: String,
        default: '#4A90E2'  // Default blue color
      },
      order: {
        type: Number,
        required: true
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Add default statuses when creating a new project
ProjectSchema.pre('save', function(next) {
  if (this.isNew && !this.statuses.length) {
    this.statuses = [
      { name: 'To Do', color: '#FF5630', order: 0 },
      { name: 'In Progress', color: '#FFAB00', order: 1 },
      { name: 'Done', color: '#36B37E', order: 2 }
    ];
  }
  
  // Add owner to members if it's a new project
  if (this.isNew) {
    this.members = [{
      user: this.owner,
      role: 'owner',
      addedAt: Date.now()
    }];
  }
  
  next();
});

module.exports = mongoose.model('Project', ProjectSchema); 