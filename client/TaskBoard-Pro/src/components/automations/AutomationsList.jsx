import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Switch,
  Divider,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getAutomations, toggleAutomationStatus, deleteAutomation } from '../../services/api';
import NewAutomationDialog from './NewAutomationDialog';
import EditAutomationDialog from './EditAutomationDialog';
import ConfirmDialog from '../common/ConfirmDialog';

const AutomationsList = () => {
  const { id: projectId } = useParams();
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [editAutomation, setEditAutomation] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, automation: null });

  useEffect(() => {
    if (projectId) {
      fetchAutomations();
    }
  }, [projectId]);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      const response = await getAutomations({ project: projectId });
      setAutomations(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching automations:', err);
      setError('Failed to load automations');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (automation) => {
    try {
      await toggleAutomationStatus(automation._id);
      
      // Update local state
      setAutomations(automations.map(a => 
        a._id === automation._id ? { ...a, active: !a.active } : a
      ));
    } catch (err) {
      console.error('Error toggling automation status:', err);
      setError('Failed to update automation status');
    }
  };

  const handleDeleteAutomation = async () => {
    if (!deleteConfirm.automation) return;
    
    try {
      await deleteAutomation(deleteConfirm.automation._id);
      
      // Remove from local state
      setAutomations(automations.filter(a => a._id !== deleteConfirm.automation._id));
      setDeleteConfirm({ open: false, automation: null });
    } catch (err) {
      console.error('Error deleting automation:', err);
      setError('Failed to delete automation');
    }
  };

  const handleAutomationCreated = (newAutomation) => {
    setAutomations([...automations, newAutomation]);
  };

  const handleAutomationUpdated = (updatedAutomation) => {
    setAutomations(automations.map(a => 
      a._id === updatedAutomation._id ? updatedAutomation : a
    ));
  };

  const getTriggerDescription = (trigger) => {
    switch (trigger.type) {
      case 'taskStatusChange':
        return `When a task status changes${trigger.conditions.fromStatus ? ` from "${trigger.conditions.fromStatus}"` : ''}${trigger.conditions.toStatus ? ` to "${trigger.conditions.toStatus}"` : ''}`;
      case 'taskAssigneeChange':
        return 'When a task is assigned to someone';
      case 'taskDueDatePassed':
        return 'When a task due date passes';
      default:
        return 'Unknown trigger';
    }
  };

  const getActionDescription = (action) => {
    switch (action.type) {
      case 'changeTaskStatus':
        return `Change task status to "${action.params.status}"`;
      case 'assignBadge':
        return `Award "${action.params.badgeName}" badge`;
      case 'sendNotification':
        return 'Send notification';
      default:
        return 'Unknown action';
    }
  };

  if (loading && automations.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Project Automations</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setOpenNewDialog(true)}
        >
          New Automation
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {automations.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No automations created yet. Create your first automation to streamline your workflow.
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <List>
            {automations.map((automation, index) => (
              <Box key={automation._id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {automation.name}
                        </Typography>
                        <Switch
                          edge="end"
                          checked={automation.active}
                          onChange={() => handleToggleStatus(automation)}
                          sx={{ ml: 2 }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" component="div" sx={{ mb: 0.5 }}>
                          <strong>Trigger:</strong> {getTriggerDescription(automation.trigger)}
                        </Typography>
                        <Typography variant="body2" component="div">
                          <strong>Action:</strong> {getActionDescription(automation.action)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Edit">
                      <IconButton 
                        edge="end" 
                        onClick={() => setEditAutomation(automation)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        edge="end" 
                        onClick={() => setDeleteConfirm({ open: true, automation })}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              </Box>
            ))}
          </List>
        </Paper>
      )}
      
      <NewAutomationDialog
        open={openNewDialog}
        onClose={() => setOpenNewDialog(false)}
        projectId={projectId}
        onAutomationCreated={handleAutomationCreated}
      />
      
      <EditAutomationDialog
        open={!!editAutomation}
        onClose={() => setEditAutomation(null)}
        automation={editAutomation}
        onAutomationUpdated={handleAutomationUpdated}
      />
      
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, automation: null })}
        onConfirm={handleDeleteAutomation}
        title="Delete Automation"
        content={`Are you sure you want to delete the automation "${deleteConfirm.automation?.name}"? This action cannot be undone.`}
      />
    </Box>
  );
};

export default AutomationsList; 