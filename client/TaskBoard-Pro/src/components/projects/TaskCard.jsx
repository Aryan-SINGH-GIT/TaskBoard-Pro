import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { format } from 'date-fns';
import TaskDetailDialog from './TaskDetailDialog';

const priorityColors = {
  Low: '#4CAF50',
  Medium: '#2196F3',
  High: '#FF9800',
  Urgent: '#F44336'
};

const TaskCard = ({ task, isDragging }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  
  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event) => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
  };

  const handleCardClick = () => {
    setOpenDetail(true);
  };

  const handleEdit = (event) => {
    event.stopPropagation();
    // Implement edit functionality
    handleMenuClose();
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    // Implement delete functionality
    handleMenuClose();
  };

  return (
    <>
      <Paper
        elevation={isDragging ? 6 : 1}
        sx={{
          p: 2,
          cursor: 'pointer',
          '&:hover': {
            boxShadow: 3
          },
          bgcolor: isDragging ? 'background.paper' : 'background.default'
        }}
        onClick={handleCardClick}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="medium" noWrap>
            {task.title}
          </Typography>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ ml: 1 }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
        
        {task.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {task.description}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Chip
              label={task.priority}
              size="small"
              sx={{
                bgcolor: `${priorityColors[task.priority]}22`,
                color: priorityColors[task.priority],
                fontWeight: 'bold',
                fontSize: '0.7rem'
              }}
            />
            
            {task.dueDate && (
              <Chip
                label={format(new Date(task.dueDate), 'MMM d')}
                size="small"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Box>
          
          {task.assignee && (
            <Avatar
              src={task.assignee.photoURL}
              alt={task.assignee.name}
              sx={{ width: 24, height: 24 }}
            />
          )}
        </Box>
      </Paper>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
      
      <TaskDetailDialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        task={task}
      />
    </>
  );
};

export default TaskCard; 