import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
  FormHelperText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { createTask, getProject, getProjectMembers } from '../../services/api';
import PersonIcon from '@mui/icons-material/Person';

const NewTaskDialog = ({ open, onClose, projectId, initialStatus, onTaskCreated }) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState(null);
  const [assigneeId, setAssigneeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projectMembers, setProjectMembers] = useState([]);
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    if (open && projectId) {
      fetchProjectData();
    }
  }, [open, projectId]);

  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus);
    }
  }, [initialStatus]);

  const fetchProjectData = async () => {
    try {
      const [projectResponse, membersResponse] = await Promise.all([
        getProject(projectId),
        getProjectMembers(projectId)
      ]);
      
      setStatuses(projectResponse.data.statuses || []);
      setProjectMembers(membersResponse.data || []);
      
      // Set default status if not already set
      if (!status && projectResponse.data.statuses && projectResponse.data.statuses.length > 0) {
        setStatus(initialStatus || projectResponse.data.statuses[0].name);
      }
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError('Failed to load project data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await createTask({
        title,
        description,
        projectId,
        status,
        priority,
        dueDate,
        assigneeId: assigneeId || undefined
      });
      
      if (onTaskCreated) {
        onTaskCreated(response.data);
      }
      
      handleClose();
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setStatus(initialStatus || '');
    setPriority('Medium');
    setDueDate(null);
    setAssigneeId('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Task</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={(e) => setStatus(e.target.value)}
              >
                {statuses.map((statusOption) => (
                  <MenuItem key={statusOption.name} value={statusOption.name}>
                    {statusOption.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priority}
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
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Assignee</InputLabel>
              <Select
                value={assigneeId}
                label="Assignee"
                onChange={(e) => setAssigneeId(e.target.value)}
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
                  onClick={() => setAssigneeId(currentUser.uid)}
                >
                  Assign to me
                </Button>
              </Box>
            </FormControl>
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date"
                value={dueDate}
                onChange={(newValue) => setDueDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                disablePast
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || !title.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default NewTaskDialog; 