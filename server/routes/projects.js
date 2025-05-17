const express = require('express');
const { check } = require('express-validator');
const projectController = require('../controllers/projects');
const { protect, projectMember, projectAdmin } = require('../middleware/auth');

const router = express.Router();

// All project routes are protected
router.use(protect);

// @route   GET /api/projects
// @desc    Get all projects for the current user
// @access  Private
router.get('/', projectController.getUserProjects);

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private
router.post(
  '/',
  [
    check('title', 'Project title is required').not().isEmpty(),
  ],
  projectController.createProject
);

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private (only project members)
router.get('/:id', projectMember, projectController.getProjectById);

// @route   PUT /api/projects/:id
// @desc    Update project details
// @access  Private (only project admins/owner)
router.put(
  '/:id',
  [
    check('title', 'Project title is required').not().isEmpty(),
  ],
  projectAdmin,
  projectController.updateProject
);

// @route   DELETE /api/projects/:id
// @desc    Delete a project
// @access  Private (only project owner)
router.delete('/:id', projectAdmin, projectController.deleteProject);

// @route   POST /api/projects/invite
// @desc    Invite a user to a project (matches client API)
// @access  Private (only project admins/owner)
router.post(
  '/invite',
  [
    check('email', 'Valid email is required').isEmail(),
    check('role', 'Role must be either admin or member').isIn(['admin', 'member']),
    check('projectId', 'Project ID is required').not().isEmpty(),
  ],
  projectController.inviteUserToProjectByEmail
);

// @route   POST /api/projects/:id/members
// @desc    Invite a new member to project
// @access  Private (only project admins/owner)
router.post(
  '/:id/members',
  [
    check('email', 'Valid email is required').isEmail(),
    check('role', 'Role must be either admin or member').isIn(['admin', 'member'])
  ],
  projectAdmin,
  projectController.inviteProjectMember
);

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Remove member from project
// @access  Private (only project admins/owner)
router.delete('/:id/members/:userId', projectAdmin, projectController.removeProjectMember);

// @route   PUT /api/projects/:id/members/:userId
// @desc    Update member role in project
// @access  Private (only project admins/owner)
router.put(
  '/:id/members/:userId',
  [
    check('role', 'Role must be either admin or member').isIn(['admin', 'member'])
  ],
  projectAdmin,
  projectController.updateMemberRole
);

// @route   POST /api/projects/:id/statuses
// @desc    Create a new status for a project
// @access  Private (only project admins/owner)
router.post(
  '/:id/statuses',
  [
    check('name', 'Status name is required').not().isEmpty(),
    check('color', 'Status color is required').not().isEmpty(),
    check('order', 'Status order is required').isNumeric()
  ],
  projectAdmin,
  projectController.createProjectStatus
);

// @route   PUT /api/projects/:id/statuses/:statusId
// @desc    Update project status
// @access  Private (only project admins/owner)
router.put(
  '/:id/statuses/:statusId',
  projectAdmin,
  projectController.updateProjectStatus
);

// @route   DELETE /api/projects/:id/statuses/:statusId
// @desc    Delete project status
// @access  Private (only project admins/owner)
router.delete('/:id/statuses/:statusId', projectAdmin, projectController.deleteProjectStatus);

module.exports = router; 