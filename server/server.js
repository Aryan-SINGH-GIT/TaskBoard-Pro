const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const admin = require('./config/firebase');
const { protect } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const automationRoutes = require('./routes/automations');
const notificationRoutes = require('./routes/notifications');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('join-project', (projectId) => {
    socket.join(projectId);
    console.log(`User joined project: ${projectId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Make io accessible to routes
app.set('io', io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const health = {
    server: 'running',
    timestamp: new Date(),
    uptime: process.uptime(),
    mongodb: {
      connected: mongoose.connection.readyState === 1,
      state: getMongoConnectionState(mongoose.connection.readyState),
      host: mongoose.connection.host || 'Not connected',
      database: mongoose.connection.name || 'Not connected'
    },
    firebase: {
      initialized: admin.apps.length > 0,
      projectId: process.env.FIREBASE_PROJECT_ID || 'Not configured'
    },
    environment: process.env.NODE_ENV
  };

  console.log('Health check:', health);
  res.status(200).json(health);
});

// Test endpoint to verify auth middleware bypass
app.get('/api/test-auth', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authentication test successful',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    }
  });
});

// Function to get MongoDB connection state as string
function getMongoConnectionState(state) {
  const states = {
    0: 'Disconnected',
    1: 'Connected', 
    2: 'Connecting',
    3: 'Disconnecting'
  };
  return states[state] || 'Unknown';
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/notifications', notificationRoutes);

// Connect to MongoDB
connectDB()
  .then((conn) => {
    // Start server whether DB connection succeeds or not
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/api/health`);
      console.log(`Auth test available at: http://localhost:${PORT}/api/test-auth`);

      if (!conn) {
        console.log('⚠️ SERVER RUNNING IN TEST MODE WITHOUT DATABASE ⚠️');
        console.log('All data is mocked and changes will not be persisted');
      }
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB and unable to start in test mode:', err);
    process.exit(1);
  });

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
} 