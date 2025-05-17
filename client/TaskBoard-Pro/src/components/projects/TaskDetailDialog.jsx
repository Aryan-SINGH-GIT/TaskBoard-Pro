import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Avatar,
  Divider,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import { format } from 'date-fns';
import { getTaskById, updateTask, addTaskComment, getProjectMembers } from '../../services/api';

const priorityColors = {
  Low: '#4CAF50',
  Medium: '#2196F3',
  High: '#FF9800',
  Urgent: '#F44336'
};

const TaskDetailDialog = ({ open, onClose, task: initialTask }) => {
  const { currentUser } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [projectMembers, setProjectMembers] = useState([]);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setPriority] = useState('');
  const [editDueDate, setEditDueDate] = useState(null);
  const [editAssigneeId, setEditAssigneeId] = useState('');

  useEffect(() => {
    if (open && initialTask) {
      setTask(initialTask);
      resetEditForm(initialTask);
      
      // Fetch the latest task data
      refreshTaskData();
      
      // Fetch project members for assignee dropdown
      if (initialTask.project) {
        fetchProjectMembers(initialTask.project);
      }
    }
  }, [open, initialTask]);

  const resetEditForm = (taskData) => {
    setEditTitle(taskData.title || '');
    setEditDescription(taskData.description || '');
    setEditStatus(taskData.status || '');
    setPriority(taskData.priority || 'Medium');
    setEditDueDate(taskData.dueDate ? new Date(taskData.dueDate) : null);
    setEditAssigneeId(taskData.assignee?._id || '');
  };

  const refreshTaskData = async () => {
    if (!initialTask?._id) return;
    
    try {
      setLoading(true);
      const response = await getTaskById(initialTask._id);
      setTask(response.data);
      resetEditForm(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching task details:', err);
      setError('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectMembers = async (projectId) => {
    try {
      const response = await getProjectMembers(projectId);
      setProjectMembers(response.data || []);
    } catch (err) {
      console.error('Error fetching project members:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    resetEditForm(task);
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      setError('');
      
      const updatedData = {
        title: editTitle,
        description: editDescription,
        status: editStatus,
        priority: editPriority,
        dueDate: editDueDate,
        assigneeId: editAssigneeId || undefined
      };
      
      const response = await updateTask(task._id, updatedData);
      setTask(response.data);
      setEditMode(false);
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      setLoading(true);
      setError('');
      
      await addTaskComment(task._id, { text: commentText });
      setCommentText('');
      
      // Refresh task data to show the new comment
      await refreshTaskData();
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  if (!task) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {!editMode ? (
          <>
            <Typography variant="h6">{task.title}</Typography>
            <Box>
              <IconButton onClick={handleEditClick} size="small">
                <EditIcon />
              </IconButton>
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </>
        ) : (
          <TextField
            fullWidth
            variant="outlined"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Task title"
            size="small"
            autoFocus
          />
        )}
      </DialogTitle>
      
      <Divider />
      
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Details" />
          <Tab label="Comments" />
          <Tab label="History" />
        </Tabs>
        
        {tabValue === 0 && (
          <Box>
            {!editMode ? (
              <>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    label={task.status} 
                    color="primary" 
                    variant="outlined" 
                  />
                  <Chip
                    label={task.priority}
                    sx={{
                      bgcolor: `${priorityColors[task.priority]}22`,
                      color: priorityColors[task.priority],
                      fontWeight: 'bold'
                    }}
                  />
                  {task.dueDate && (
                    <Chip
                      label={`Due: ${format(new Date(task.dueDate), 'MMM d, yyyy')}`}
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </Box>
                
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {task.description || 'No description provided.'}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 4, mt: 3 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Assignee
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {task.assignee ? (
                        <>
                          <Avatar 
                            src={task.assignee.photoURL} 
                            alt={task.assignee.name}
                            sx={{ width: 32, height: 32, mr: 1 }}
                          />
                          <Typography>{task.assignee.name}</Typography>
                        </>
                      ) : (
                        <Typography color="text.secondary">Unassigned</Typography>
                      )}
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Reporter
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {task.reporter && (
                        <>
                          <Avatar 
                            src={task.reporter.photoURL} 
                            alt={task.reporter.name}
                            sx={{ width: 32, height: 32, mr: 1 }}
                          />
                          <Typography>{task.reporter.name}</Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Description"
                  multiline
                  rows={4}
                  fullWidth
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  variant="outlined"
                />
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editStatus}
                      label="Status"
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <MenuItem value="To Do">To Do</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="Done">Done</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={editPriority}
                      label="Priority"
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <MenuItem value="Low">Low</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Urgent">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Assignee</InputLabel>
                    <Select
                      value={editAssigneeId}
                      label="Assignee"
                      onChange={(e) => setEditAssigneeId(e.target.value)}
                    >
                      <MenuItem value="">Unassigned</MenuItem>
                      {projectMembers.map((member) => (
                        <MenuItem key={member._id} value={member._id}>
                          {member.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <Box sx={{ mt: 1 }}>
                      <Button 
                        size="small"
                        variant="outlined"
                        startIcon={<PersonIcon />}
                        onClick={() => setEditAssigneeId(currentUser.uid)}
                      >
                        Assign to me
                      </Button>
                    </Box>
                  </FormControl>
                  
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Due Date"
                      value={editDueDate}
                      onChange={(newValue) => setEditDueDate(newValue)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </Box>
              </Box>
            )}
          </Box>
        )}
        
        {tabValue === 1 && (
          <Box>
            <List sx={{ mb: 2 }}>
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((comment) => (
                  <Paper key={comment._id} sx={{ mb: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ListItemAvatar>
                        <Avatar 
                          src={comment.user?.photoURL} 
                          alt={comment.user?.name}
                        />
                      </ListItemAvatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {comment.user?.name || 'Unknown User'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body1" sx={{ pl: 7 }}>
                      {comment.text}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography color="text.secondary">No comments yet</Typography>
              )}
            </List>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                label="Add a comment"
                multiline
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                variant="outlined"
              />
              <IconButton 
                color="primary" 
                onClick={handleAddComment}
                disabled={!commentText.trim() || loading}
                sx={{ mt: 1 }}
              >
                {loading ? <CircularProgress size={24} /> : <SendIcon />}
              </IconButton>
            </Box>
          </Box>
        )}
        
        {tabValue === 2 && (
          <List>
            {task.history && task.history.length > 0 ? (
              task.history.map((record, index) => (
                <ListItem key={index} divider={index < task.history.length - 1}>
                  <ListItemAvatar>
                    <Avatar 
                      src={record.changedBy?.photoURL} 
                      alt={record.changedBy?.name}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography>
                        <strong>{record.changedBy?.name || 'Unknown User'}</strong>
                        {' changed '}
                        <strong>{record.field}</strong>
                        {' from '}
                        <strong>{record.oldValue || 'none'}</strong>
                        {' to '}
                        <strong>{record.newValue}</strong>
                      </Typography>
                    }
                    secondary={format(new Date(record.changedAt), 'MMM d, yyyy h:mm a')}
                  />
                </ListItem>
              ))
            ) : (
              <Typography color="text.secondary">No history records</Typography>
            )}
          </List>
        )}
      </DialogContent>
      
      <DialogActions>
        {editMode ? (
          <>
            <Button onClick={handleCancelEdit}>Cancel</Button>
            <Button 
              onClick={handleSaveChanges} 
              variant="contained" 
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailDialog; 