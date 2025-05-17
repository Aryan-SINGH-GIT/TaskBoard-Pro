import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { inviteUserToProject } from '../../services/api';

const ProjectInviteDialog = ({ open, onClose, projectId, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingInvites, setPendingInvites] = useState([]);
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await inviteUserToProject({
        projectId,
        email: email.trim(),
        role
      });

      // Add to pending invites list for UI
      setPendingInvites([...pendingInvites, {
        email: email.trim(),
        role,
        id: response.inviteId || response.data?.inviteId || Date.now().toString()
      }]);

      // Reset form
      setEmail('');
      
      enqueueSnackbar('Invitation sent successfully', { 
        variant: 'success' 
      });
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError(err?.error || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('member');
    setError('');
    onClose();
  };

  const handleDeletePendingInvite = async (inviteId) => {
    try {
      // Implement canceling invitation API call here
      // await cancelInvitation(inviteId);
      
      // For now just remove from local state
      setPendingInvites(pendingInvites.filter(invite => invite.id !== inviteId));
      enqueueSnackbar('Invitation canceled', { variant: 'info' });
    } catch (err) {
      console.error('Error canceling invitation:', err);
      enqueueSnackbar('Failed to cancel invitation', { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Invite Users to Project</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Send email invitations to collaborate on this project
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Invited users will receive an email with a link to join the project.
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
            />
            
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                value={role}
                label="Role"
                onChange={(e) => setRole(e.target.value)}
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Button
            type="submit"
            variant="contained"
            disabled={!email.trim() || loading}
            sx={{ mb: 3 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Invitation'}
          </Button>
          
          {pendingInvites.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Pending Invitations
              </Typography>
              <Stack spacing={1}>
                {pendingInvites.map((invite) => (
                  <Chip
                    key={invite.id}
                    label={`${invite.email} (${invite.role})`}
                    onDelete={() => handleDeletePendingInvite(invite.id)}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProjectInviteDialog; 