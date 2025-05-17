const express = require('express');
const { check } = require('express-validator');
const taskController = require('../controllers/tasks');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All task routes are protected
router.use(protect);

// @route   GET /api/tasks
// @desc    Get all tasks for a project
// @access  Private
router.get('/', taskController.getTasks);

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', taskController.getTaskById);

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post(
  '/',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('projectId', 'Project ID is required').not().isEmpty()
  ],
  taskController.createTask
);

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put(
  '/:id',
  [
    check('title', 'Title is required if provided').optional().not().isEmpty()
  ],
  taskController.updateTask
);

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', taskController.deleteTask);

// @route   POST /api/tasks/:id/comments
// @desc    Add a comment to a task
// @access  Private
router.post(
  '/:id/comments',
  [
    check('text', 'Comment text is required').not().isEmpty()
  ],
  taskController.addComment
);

module.exports = router; 