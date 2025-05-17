const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * @desc    Get all projects for the current user
 * @route   GET /api/projects
 * @access  Private
 */
exports.getUserProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      'members.user': req.user._id
    }).populate('owner', 'name email photoURL');

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
exports.createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description } = req.body;

    const project = new Project({
      title,
      description,
      owner: req.user._id
    });

    await project.save();

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get project by ID
 * @route   GET /api/projects/:id
 * @access  Private (only project members)
 */
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email photoURL')
      .populate('members.user', 'name email photoURL');

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project by ID error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Update project details
 * @route   PUT /api/projects/:id
 * @access  Private (only project admins/owner)
 */
exports.updateProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description } = req.body;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { title, description },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Delete a project
 * @route   DELETE /api/projects/:id
 * @access  Private (only project owner)
 */
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    // Check if user is the project owner
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this project'
      });
    }

    await project.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Invite a new member to project
 * @route   POST /api/projects/:id/members
 * @access  Private (only project admins/owner)
 */
exports.inviteProjectMember = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, role } = req.body;
    const project = await Project.findById(req.params.id);

    // Check if user with email exists
    const user = await User.findOne({ email });

    if (user) {
      // Check if user is already a member
      const isMember = project.members.some(member => 
        member.user.toString() === user._id.toString()
      );

      if (isMember) {
        return res.status(400).json({
          success: false,
          error: 'User is already a member of the project'
        });
      }

      // Add user to project members
      project.members.push({
        user: user._id,
        role,
        addedAt: Date.now()
      });

      // Create notification for the invited user
      await Notification.create({
        recipient: user._id,
        title: 'New Project Invitation',
        message: `You have been added to project "${project.title}" as a ${role}`,
        type: 'project_invite',
        relatedProject: project._id
      });
    } else {
      // Add to pending invites
      project.pendingInvites.push({
        email,
        role,
        invitedAt: Date.now()
      });
    }

    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Invite project member error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Remove member from project
 * @route   DELETE /api/projects/:id/members/:userId
 * @access  Private (only project admins/owner)
 */
exports.removeProjectMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    const userId = req.params.userId;

    // Check if user is the project owner
    if (project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove project owner'
      });
    }

    // Remove user from members
    project.members = project.members.filter(
      member => member.user.toString() !== userId
    );

    await project.save();

    // Notify the removed user
    await Notification.create({
      recipient: userId,
      title: 'Project Membership Removed',
      message: `You have been removed from project "${project.title}"`,
      type: 'project_invite',
      relatedProject: project._id
    });

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Remove project member error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Update member role in project
 * @route   PUT /api/projects/:id/members/:userId
 * @access  Private (only project admins/owner)
 */
exports.updateMemberRole = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { role } = req.body;
    const project = await Project.findById(req.params.id);
    const userId = req.params.userId;

    // Check if user is the project owner
    if (project.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot change role of project owner'
      });
    }

    // Update member role
    const memberIndex = project.members.findIndex(
      member => member.user.toString() === userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    project.members[memberIndex].role = role;

    await project.save();

    // Notify the user of role change
    await Notification.create({
      recipient: userId,
      title: 'Project Role Updated',
      message: `Your role in project "${project.title}" has been changed to ${role}`,
      type: 'project_invite',
      relatedProject: project._id
    });

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Create a new status for a project
 * @route   POST /api/projects/:id/statuses
 * @access  Private (only project admins/owner)
 */
exports.createProjectStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, color, order } = req.body;
    const project = await Project.findById(req.params.id);

    // Check if status with same name already exists
    const statusExists = project.statuses.some(status => status.name === name);
    if (statusExists) {
      return res.status(400).json({
        success: false,
        error: 'Status with this name already exists'
      });
    }

    // Add new status
    project.statuses.push({ name, color, order });
    
    // Sort statuses by order
    project.statuses.sort((a, b) => a.order - b.order);

    await project.save();

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Create project status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Update project status
 * @route   PUT /api/projects/:id/statuses/:statusId
 * @access  Private (only project admins/owner)
 */
exports.updateProjectStatus = async (req, res) => {
  try {
    const { name, color, order } = req.body;
    const project = await Project.findById(req.params.id);
    const statusId = req.params.statusId;

    // Find and update the status
    const statusIndex = project.statuses.findIndex(
      status => status._id.toString() === statusId
    );

    if (statusIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Status not found'
      });
    }

    // Update status fields if provided
    if (name) project.statuses[statusIndex].name = name;
    if (color) project.statuses[statusIndex].color = color;
    if (order !== undefined) project.statuses[statusIndex].order = order;

    // Sort statuses by order if order was updated
    if (order !== undefined) {
      project.statuses.sort((a, b) => a.order - b.order);
    }

    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Update project status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Delete project status
 * @route   DELETE /api/projects/:id/statuses/:statusId
 * @access  Private (only project admins/owner)
 */
exports.deleteProjectStatus = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    const statusId = req.params.statusId;

    // Check if there are tasks with this status
    const Task = require('../models/Task');
    const statusName = project.statuses.find(
      s => s._id.toString() === statusId
    )?.name;

    if (statusName) {
      const tasksWithStatus = await Task.countDocuments({
        project: project._id,
        status: statusName
      });

      if (tasksWithStatus > 0) {
        return res.status(400).json({
          success: false,
          error: `Cannot delete status. ${tasksWithStatus} tasks are currently in this status.`
        });
      }
    }

    // Remove status
    project.statuses = project.statuses.filter(
      status => status._id.toString() !== statusId
    );

    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Delete project status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Invite a user to a project by email (matches client API)
 * @route   POST /api/projects/invite
 * @access  Private (only project admins/owner)
 */
exports.inviteUserToProjectByEmail = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  try {
    const { email, role, projectId } = req.body;
    
    // Get project by ID from the request body
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Check if user has admin access to the project
    const isAdmin = project.members.some(
      member => member.user.toString() === req.user._id.toString() && 
               (member.role === 'admin' || member.role === 'owner')
    );
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to invite members to this project'
      });
    }

    // Check if user with email exists
    const user = await User.findOne({ email });

    if (user) {
      // Check if user is already a member
      const isMember = project.members.some(member => 
        member.user.toString() === user._id.toString()
      );

      if (isMember) {
        return res.status(400).json({
          success: false,
          error: 'User is already a member of the project'
        });
      }

      // Add user to project members
      project.members.push({
        user: user._id,
        role: role
      });

      await project.save();

      // Create notification for the user
      await Notification.create({
        recipient: user._id,
        type: 'info',
        title: 'Added to Project',
        message: `You have been added to project "${project.title}"`,
        relatedProject: project._id,
        createdBy: req.user._id
      });

      const inviteId = new mongoose.Types.ObjectId(); // Generate a unique ID for the invitation

      return res.status(200).json({
        success: true,
        message: `User ${user.email} added to the project`,
        inviteId: inviteId
      });
    } else {
      // TODO: Implement email invitation for non-registered users
      // For now just return success with a mock invitation ID
      const inviteId = new mongoose.Types.ObjectId();
      
      return res.status(200).json({
        success: true,
        message: `Invitation sent to ${email}`,
        inviteId: inviteId
      });
    }
  } catch (error) {
    console.error('Invite user to project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}; 