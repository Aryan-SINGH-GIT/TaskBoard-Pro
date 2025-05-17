import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { getProject, getTasks, updateTask } from '../../services/api';
import TaskCard from './TaskCard';
import NewTaskDialog from './NewTaskDialog';
import { useSnackbar } from 'notistack';

const TaskBoard = () => {
  const { id: projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openNewTaskDialog, setOpenNewTaskDialog] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchProjectAndTasks = async () => {
      try {
        setLoading(true);
        
        // Fetch project details
        const projectResponse = await getProject(projectId);
        setProject(projectResponse.data);
        
        // Fetch tasks for this project
        const tasksResponse = await getTasks({ project: projectId });
        setTasks(tasksResponse.data);
        
        setError('');
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError('Failed to load project data');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectAndTasks();
    }
  }, [projectId]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the task that was dragged
    const task = tasks.find(t => t._id === draggableId);
    if (!task) return;

    try {
      // Create a new array and reorder tasks for optimistic update
      let updatedTasks = [...tasks];
      
      // If status changed
      if (destination.droppableId !== source.droppableId) {
        // Update the task's status in our local state first (optimistic update)
        updatedTasks = updatedTasks.map(t => {
          if (t._id === draggableId) {
            return { ...t, status: destination.droppableId };
          }
          return t;
        });
        
        setTasks(updatedTasks);
        
        // Send update to server
        await updateTask(draggableId, { status: destination.droppableId });
        
        // Add visual feedback
        enqueueSnackbar(`Task moved to ${destination.droppableId}`, { 
          variant: 'success',
          autoHideDuration: 2000
        });
      } 
      // If just reordering within same status (future enhancement)
      // We could implement order field in the task model
    } catch (err) {
      console.error('Error updating task status:', err);
      // Revert to original state on error
      setTasks([...tasks]);
      setError('Failed to update task status');
      
      enqueueSnackbar('Failed to update task status', { 
        variant: 'error',
        autoHideDuration: 2000
      });
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks([...tasks, newTask]);
  };

  const handleAddTask = (status) => {
    setCurrentStatus(status);
    setOpenNewTaskDialog(true);
  };

  // Group tasks by status
  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!project) {
    return <Alert severity="info">Project not found</Alert>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        {project.title} - Task Board
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box sx={{ display: 'flex', overflowX: 'auto', pb: 2 }}>
          {project.statuses.map((status) => (
            <Box 
              key={status.name} 
              sx={{ 
                minWidth: 280, 
                maxWidth: 280, 
                mr: 2,
                height: 'calc(100vh - 200px)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Paper 
                sx={{ 
                  p: 1, 
                  mb: 1, 
                  backgroundColor: status.color + '22', // Add transparency
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      backgroundColor: status.color,
                      mr: 1
                    }} 
                  />
                  <Typography variant="subtitle1" fontWeight="bold">
                    {status.name}
                  </Typography>
                  <Chip 
                    size="small" 
                    label={getTasksByStatus(status.name).length} 
                    sx={{ ml: 1 }} 
                  />
                </Box>
                <Box>
                  <Tooltip title="Add Task">
                    <IconButton 
                      size="small" 
                      onClick={() => handleAddTask(status.name)}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Column Options">
                    <IconButton size="small">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
              
              <Droppable droppableId={status.name} isDropDisabled={false} isCombineEnabled={false}>
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{ 
                      bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'background.default',
                      flexGrow: 1,
                      minHeight: 100,
                      overflowY: 'auto',
                      p: 1,
                      borderRadius: 1
                    }}
                  >
                    {getTasksByStatus(status.name).map((task, index) => (
                      <Draggable 
                        key={task._id} 
                        draggableId={task._id} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{ mb: 1 }}
                          >
                            <TaskCard 
                              task={task} 
                              isDragging={snapshot.isDragging} 
                            />
                          </Box>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </Box>
          ))}
        </Box>
      </DragDropContext>
      
      <NewTaskDialog
        open={openNewTaskDialog}
        onClose={() => setOpenNewTaskDialog(false)}
        projectId={projectId}
        initialStatus={currentStatus}
        onTaskCreated={handleTaskCreated}
      />
    </Box>
  );
};

export default TaskBoard; 