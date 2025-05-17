import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

const Profile = () => {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Mock badges that would come from the user profile
  const [badges, setBadges] = useState([
    'quick_starter',
    'task_master'
  ]);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
      setPhotoURL(currentUser.photoURL || '');
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // This would update profile in a real implementation
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Profile updated:', {
        name,
        photoURL
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update profile');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeLabel = (badge) => {
    const badges = {
      'quick_starter': 'Quick Starter',
      'task_master': 'Task Master',
      'team_player': 'Team Player',
      'deadline_crusher': 'Deadline Crusher',
      'automation_expert': 'Automation Expert'
    };
    return badges[badge] || badge;
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>
      
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Profile updated successfully!
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            src={photoURL}
            alt={name}
            sx={{ width: 80, height: 80, mr: 3 }}
          />
          <Box>
            <Typography variant="h5">{name}</Typography>
            <Typography variant="body2" color="text.secondary">{email}</Typography>
            
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {badges.map((badge) => (
                <Chip 
                  key={badge} 
                  label={getBadgeLabel(badge)} 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Full Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            disabled
            id="email"
            label="Email Address"
            name="email"
            value={email}
            helperText="Email cannot be changed"
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="normal"
            fullWidth
            id="photoURL"
            label="Profile Photo URL"
            name="photoURL"
            value={photoURL || ''}
            onChange={(e) => setPhotoURL(e.target.value)}
            helperText="Enter a URL for your profile picture"
            sx={{ mb: 3 }}
          />
          
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile; 