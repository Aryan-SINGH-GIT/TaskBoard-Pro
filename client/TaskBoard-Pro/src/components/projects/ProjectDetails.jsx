import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject } from '../../services/api';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import TaskBoard from './TaskBoard';
import AutomationsList from '../automations/AutomationsList';
import ProjectInviteDialog from './ProjectInviteDialog';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await getProject(id);
        setProject(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching project:', err);
        const errorMessage = err?.error || 'Failed to load project details';
        setError(errorMessage);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProject();
    } else {
      setError('Project ID is missing');
      setLoading(false);
    }
  }, [id]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleChangeTab = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleInviteSuccess = () => {
    // Optionally refresh project data to show updated member count
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToDashboard}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  if (!project) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info" sx={{ mb: 2 }}>Project not found</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToDashboard}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBackToDashboard}
        >
          Back to Dashboard
        </Button>

        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={() => setOpenInviteDialog(true)}
        >
          Invite Team Members
        </Button>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {project.title}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {project.description}
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
          <Tabs value={activeTab} onChange={handleChangeTab} aria-label="project tabs">
            <Tab label="Tasks" />
            <Tab label="Automations" />
            <Tab label="Settings" />
          </Tabs>
        </Box>

        <Box sx={{ mt: 2 }}>
          {activeTab === 0 && <TaskBoard />}
          {activeTab === 1 && <AutomationsList />}
          {activeTab === 2 && (
            <Box p={2}>
              <Typography variant="h6">Project Settings</Typography>
              <Typography variant="body2" color="text.secondary">
                Project settings will be implemented here...
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <ProjectInviteDialog
        open={openInviteDialog}
        onClose={() => setOpenInviteDialog(false)}
        projectId={id}
        onSuccess={handleInviteSuccess}
      />
    </Container>
  );
};

export default ProjectDetails; 