import axios from 'axios';
import { auth } from '../config/firebase';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting Firebase token:', error);
        // Continue without token - server will handle unauthorized access
      }
    } else {
      console.log('No authenticated user found');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API calls
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Projects API calls
export const getProjects = async () => {
  try {
    const response = await api.get('/projects');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getProject = async (id) => {
  try {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createProject = async (projectData) => {
  try {
    const response = await api.post('/projects', projectData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateProject = async (id, projectData) => {
  try {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteProject = async (id) => {
  try {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getProjectMembers = async (id) => {
  try {
    const response = await api.get(`/projects/${id}/members`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const inviteUserToProject = async (inviteData) => {
  try {
    const response = await api.post(`/projects/invite`, inviteData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getPendingInvitations = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}/invitations`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const cancelInvitation = async (inviteId) => {
  try {
    const response = await api.delete(`/projects/invitations/${inviteId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const acceptProjectInvitation = async (token) => {
  try {
    const response = await api.post(`/projects/invitations/accept`, { token });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Tasks API calls
export const getTasks = async (params) => {
  try {
    const response = await api.get('/tasks', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTaskById = async (id) => {
  try {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createTask = async (taskData) => {
  try {
    const response = await api.post('/tasks', taskData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateTask = async (id, taskData) => {
  try {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteTask = async (id) => {
  try {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const addTaskComment = async (id, commentData) => {
  try {
    const response = await api.post(`/tasks/${id}/comments`, commentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Automations API calls
export const getAutomations = async (params) => {
  try {
    const response = await api.get('/automations', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAutomationById = async (id) => {
  try {
    const response = await api.get(`/automations/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createAutomation = async (automationData) => {
  try {
    const response = await api.post('/automations', automationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateAutomation = async (id, automationData) => {
  try {
    const response = await api.put(`/automations/${id}`, automationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const toggleAutomationStatus = async (id) => {
  try {
    const response = await api.put(`/automations/${id}/toggle`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteAutomation = async (id) => {
  try {
    const response = await api.delete(`/automations/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Notifications API calls
export const getNotifications = async () => {
  try {
    const response = await api.get('/notifications');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markNotificationAsRead = async (id) => {
  try {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default api; 