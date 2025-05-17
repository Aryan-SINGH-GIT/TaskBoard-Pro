import { Link } from 'react-router-dom';
import {
  Card,
  CardActionArea,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  LinearProgress
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';

const ProjectCard = ({ project }) => {
  // Calculate project progress based on completed tasks
  const calculateProgress = () => {
    if (!project.taskStats) return 0;
    const { total, completed } = project.taskStats;
    if (total === 0) return 0;
    return (completed / total) * 100;
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardActionArea 
        component={Link} 
        to={`/projects/${project._id}`}
        sx={{ flexGrow: 1 }}
      >
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom noWrap>
            {project.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden' }}>
            {project.description}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Progress
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={calculateProgress()} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {`${Math.round(calculateProgress())}%`}
              </Typography>
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            {project.createdAt ? (
              `Created ${formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}`
            ) : 'Recently created'}
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {project.taskStats?.total > 0 && (
            <Chip 
              size="small" 
              label={`${project.taskStats.total} tasks`}
              color="default" 
              variant="outlined"
            />
          )}
          
          {project.members?.length > 0 && (
            <Chip 
              size="small" 
              label={`${project.members.length} members`}
              color="primary" 
              variant="outlined"
            />
          )}
          
          {project.automations?.length > 0 && (
            <Chip 
              size="small" 
              label={`${project.automations.length} automations`}
              color="secondary" 
              variant="outlined"
            />
          )}
        </Box>
      </CardActions>
    </Card>
  );
};

export default ProjectCard; 