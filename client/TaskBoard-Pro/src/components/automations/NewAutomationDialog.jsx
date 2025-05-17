import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { createAutomation, getProject, getProjectMembers } from '../../services/api';

const NewAutomationDialog = ({ open, onClose, projectId, onAutomationCreated }) => {
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('');
  const [triggerConditions, setTriggerConditions] = useState({});
  const [actionType, setActionType] = useState('');
  const [actionParams, setActionParams] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projectData, setProjectData] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);

  useEffect(() => {
    if (open && projectId) {
      fetchProjectData();
    }
  }, [open, projectId]);

  useEffect(() => {
    // Reset form when dialog opens
    if (open) {
      resetForm();
    }
  }, [open]);

  const fetchProjectData = async () => {
    try {
      const [projectResponse, membersResponse] = await Promise.all([
        getProject(projectId),
        getProjectMembers(projectId)
      ]);
      
      setProjectData(projectResponse.data);
      setProjectMembers(membersResponse.data || []);
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError('Failed to load project data');
    }
  };

  const resetForm = () => {
    setName('');
    setTriggerType('');
    setTriggerConditions({});
    setActionType('');
    setActionParams({});
    setError('');
  };

  const handleTriggerTypeChange = (e) => {
    setTriggerType(e.target.value);
    setTriggerConditions({});
  };

  const handleActionTypeChange = (e) => {
    setActionType(e.target.value);
    setActionParams({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!triggerType) {
      setError('Trigger type is required');
      return;
    }
    
    if (!actionType) {
      setError('Action type is required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await createAutomation({
        name,
        projectId,
        trigger: {
          type: triggerType,
          conditions: triggerConditions
        },
        action: {
          type: actionType,
          params: actionParams
        }
      });
      
      if (onAutomationCreated) {
        onAutomationCreated(response.data);
      }
      
      onClose();
    } catch (err) {
      console.error('Error creating automation:', err);
      setError('Failed to create automation');
    } finally {
      setLoading(false);
    }
  };

  const renderTriggerConditions = () => {
    switch (triggerType) {
      case 'taskStatusChange':
        return (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>From Status (Optional)</InputLabel>
              <Select
                value={triggerConditions.fromStatus || ''}
                label="From Status (Optional)"
                onChange={(e) => setTriggerConditions({
                  ...triggerConditions,
                  fromStatus: e.target.value || undefined
                })}
              >
                <MenuItem value="">Any Status</MenuItem>
                {projectData?.statuses?.map(status => (
                  <MenuItem key={status.name} value={status.name}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Leave blank to trigger on any status change
              </FormHelperText>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>To Status (Optional)</InputLabel>
              <Select
                value={triggerConditions.toStatus || ''}
                label="To Status (Optional)"
                onChange={(e) => setTriggerConditions({
                  ...triggerConditions,
                  toStatus: e.target.value || undefined
                })}
              >
                <MenuItem value="">Any Status</MenuItem>
                {projectData?.statuses?.map(status => (
                  <MenuItem key={status.name} value={status.name}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Leave blank to trigger on change to any status
              </FormHelperText>
            </FormControl>
          </Box>
        );
      
      case 'taskAssigneeChange':
        return (
          <FormControl fullWidth>
            <InputLabel>Assignee (Optional)</InputLabel>
            <Select
              value={triggerConditions.assigneeId || ''}
              label="Assignee (Optional)"
              onChange={(e) => setTriggerConditions({
                ...triggerConditions,
                assigneeId: e.target.value || undefined
              })}
            >
              <MenuItem value="">Any Assignee</MenuItem>
              {projectMembers.map(member => (
                <MenuItem key={member._id} value={member._id}>
                  {member.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Leave blank to trigger on assignment to anyone
            </FormHelperText>
          </FormControl>
        );
      
      case 'taskDueDatePassed':
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              This trigger fires when a task's due date passes without the task being completed.
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Notification Timing</InputLabel>
              <Select
                value={triggerConditions.notifyTiming || 'onDay'}
                label="Notification Timing"
                onChange={(e) => setTriggerConditions({
                  ...triggerConditions,
                  notifyTiming: e.target.value
                })}
              >
                <MenuItem value="onDay">On due date</MenuItem>
                <MenuItem value="dayBefore">One day before</MenuItem>
                <MenuItem value="twoDaysBefore">Two days before</MenuItem>
                <MenuItem value="weekBefore">One week before</MenuItem>
                <MenuItem value="overdue">When overdue</MenuItem>
              </Select>
              <FormHelperText>
                When to send the notification relative to the due date
              </FormHelperText>
            </FormControl>
          </Box>
        );
      
      default:
        return null;
    }
  };

  const renderActionParams = () => {
    switch (actionType) {
      case 'changeTaskStatus':
        return (
          <FormControl fullWidth required>
            <InputLabel>New Status</InputLabel>
            <Select
              value={actionParams.status || ''}
              label="New Status *"
              onChange={(e) => setActionParams({
                ...actionParams,
                status: e.target.value
              })}
            >
              {projectData?.statuses?.map(status => (
                <MenuItem key={status.name} value={status.name}>
                  {status.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      
      case 'assignBadge':
        return (
          <TextField
            label="Badge Name"
            fullWidth
            required
            value={actionParams.badgeName || ''}
            onChange={(e) => setActionParams({
              ...actionParams,
              badgeName: e.target.value
            })}
            helperText="Enter the badge name to award (e.g. 'Fast Finisher', 'Team Player')"
          />
        );
      
      case 'sendNotification':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Message Template</InputLabel>
              <Select
                value={actionParams.messageTemplate || 'custom'}
                label="Message Template"
                onChange={(e) => {
                  const template = e.target.value;
                  let message = '';
                  
                  // Set message based on template
                  switch(template) {
                    case 'dueDate':
                      message = 'Your task "${taskTitle}" is due soon.';
                      break;
                    case 'pastDue':
                      message = 'The task "${taskTitle}" is past its due date.';
                      break;
                    case 'reminder':
                      message = 'Reminder: Task "${taskTitle}" needs to be completed.';
                      break;
                    default:
                      message = actionParams.notificationMessage || '';
                  }
                  
                  setActionParams({
                    ...actionParams,
                    messageTemplate: template,
                    notificationMessage: message
                  });
                }}
              >
                <MenuItem value="custom">Custom Message</MenuItem>
                <MenuItem value="dueDate">Due Date Reminder</MenuItem>
                <MenuItem value="pastDue">Past Due Alert</MenuItem>
                <MenuItem value="reminder">General Reminder</MenuItem>
              </Select>
              <FormHelperText>
                Choose a template or create a custom message. You can use ${taskTitle} as a placeholder.
              </FormHelperText>
            </FormControl>
            
            <TextField
              label="Notification Message"
              fullWidth
              required
              multiline
              rows={2}
              value={actionParams.notificationMessage || ''}
              onChange={(e) => setActionParams({
                ...actionParams,
                notificationMessage: e.target.value
              })}
              placeholder="Enter notification message. You can use ${taskTitle} as a placeholder."
            />
            
            <FormControl fullWidth>
              <InputLabel>Notification Type</InputLabel>
              <Select
                value={actionParams.notificationType || 'info'}
                label="Notification Type"
                onChange={(e) => setActionParams({
                  ...actionParams,
                  notificationType: e.target.value
                })}
              >
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="success">Success</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Automation</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TextField
            label="Automation Name"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 3 }}
          />
          
          <Typography variant="h6" gutterBottom>Trigger</Typography>
          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel>When should this automation run?</InputLabel>
            <Select
              value={triggerType}
              label="When should this automation run? *"
              onChange={handleTriggerTypeChange}
            >
              <MenuItem value="taskStatusChange">When a task status changes</MenuItem>
              <MenuItem value="taskAssigneeChange">When a task is assigned</MenuItem>
              <MenuItem value="taskDueDatePassed">When a task due date passes</MenuItem>
            </Select>
          </FormControl>
          
          {triggerType && (
            <Box sx={{ mb: 3 }}>
              {renderTriggerConditions()}
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom>Action</Typography>
          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel>What should happen?</InputLabel>
            <Select
              value={actionType}
              label="What should happen? *"
              onChange={handleActionTypeChange}
            >
              <MenuItem value="changeTaskStatus">Change task status</MenuItem>
              <MenuItem value="assignBadge">Award a badge</MenuItem>
              <MenuItem value="sendNotification">Send a notification</MenuItem>
            </Select>
          </FormControl>
          
          {actionType && (
            <Box sx={{ mb: 2 }}>
              {renderActionParams()}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || !name.trim() || !triggerType || !actionType}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Automation'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default NewAutomationDialog; 