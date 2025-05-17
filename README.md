# TaskBoard Pro - Advanced Task Collaboration App

TaskBoard Pro is a comprehensive project collaboration platform that enables teams to create projects, manage tasks, and automate workflows. It provides a Kanban-style interface for visualizing work progress and includes powerful automation features to streamline team workflows.

## Features

### Core Features
- **User Authentication**
  - Google OAuth (Firebase) login
  - User profile management
  
- **Project Management**
  - Create and manage projects
  - Invite team members by email
  - Role-based permissions (owner, admin, member)
  
- **Task Management**
  - Create tasks with title, description, due date, and assignee
  - Move tasks across statuses (Kanban board)
  - Custom statuses per project
  - Task commenting system
  
- **Workflow Automation**
  - Create custom automation rules
  - Trigger actions based on task status changes, assignments, etc.
  - Actions include status changes, user assignments, badge awards, notifications
  

### Bonus Features
- **User Badges**
  - Award badges based on task completion
  - Track user achievements
  
- **Notification System**
  - In-app notifications
  - Email notifications (configurable)
  
- **Task Comments**
  - Collaborate on tasks with threaded comments
  - @mention support

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- MongoDB
- Firebase account

### Backend Setup
1. Clone this repository
2. Navigate to the server directory:
   ```
   cd TaskBoard-Pro/server
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file based on `example.env` and add your configuration:
   ```
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Connection
   MONGODB_URI=your_mongodb_connection_string

   # JWT Secret
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d

   # Firebase Configuration
   FIREBASE_TYPE=service_account
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY="your-private-key"
   FIREBASE_CLIENT_EMAIL=your-client-email@your-project-id.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your-client-id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-client-email%40your-project-id.iam.gserviceaccount.com

   # Client URL (for CORS)
   CLIENT_URL=http://localhost:3000
   ```
5. Start the server:
   ```
   npm run server
   ```

### Frontend Setup
1. Navigate to the client directory:
   ```
   cd TaskBoard-Pro/client
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your Firebase configuration:
   ```
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_API_URL=http://localhost:5000/api
   ```
4. Start the client:
   ```
   npm start
   ```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile
- `GET /api/auth/notifications` - Get user notifications
- `PUT /api/auth/notifications/:id` - Mark notification as read

### Project Endpoints
- `GET /api/projects` - Get all projects for current user
- `POST /api/projects` - Create a new project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Invite project member
- `DELETE /api/projects/:id/members/:userId` - Remove project member
- `PUT /api/projects/:id/members/:userId` - Update member role
- `POST /api/projects/:id/statuses` - Create project status
- `PUT /api/projects/:id/statuses/:statusId` - Update project status
- `DELETE /api/projects/:id/statuses/:statusId` - Delete project status

### Task Endpoints
- `GET /api/tasks/project/:projectId` - Get all tasks for a project
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `PUT /api/tasks/:id/status` - Update task status
- `PUT /api/tasks/:id/assignee` - Update task assignee
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/comments` - Add comment to task
- `DELETE /api/tasks/:id/comments/:commentId` - Delete comment
- `GET /api/tasks/user/assigned` - Get tasks assigned to current user

### Automation Endpoints
- `GET /api/automations/project/:projectId` - Get project automations
- `POST /api/automations` - Create automation
- `GET /api/automations/:id` - Get automation by ID
- `PUT /api/automations/:id` - Update automation
- `DELETE /api/automations/:id` - Delete automation
- `PUT /api/automations/:id/toggle` - Toggle automation enabled/disabled

### Notification Endpoints
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification

## Database Schema

### User Schema
```javascript
{
  name: String,
  email: String,
  firebaseUid: String,
  photoURL: String,
  badges: [String],
  notifications: {
    email: Boolean,
    inApp: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Project Schema
```javascript
{
  title: String,
  description: String,
  owner: ObjectId (User),
  members: [
    {
      user: ObjectId (User),
      role: String (owner, admin, member),
      addedAt: Date
    }
  ],
  pendingInvites: [
    {
      email: String,
      role: String,
      invitedAt: Date
    }
  ],
  statuses: [
    {
      name: String,
      color: String,
      order: Number
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Task Schema
```javascript
{
  title: String,
  description: String,
  project: ObjectId (Project),
  status: String,
  priority: String,
  assignee: ObjectId (User),
  reporter: ObjectId (User),
  dueDate: Date,
  comments: [
    {
      text: String,
      user: ObjectId (User),
      createdAt: Date
    }
  ],
  attachments: [
    {
      filename: String,
      fileUrl: String,
      uploadedBy: ObjectId (User),
      uploadedAt: Date
    }
  ],
  statusHistory: [
    {
      from: String,
      to: String,
      changedBy: ObjectId (User),
      changedAt: Date
    }
  ],
  assigneeHistory: [
    {
      from: ObjectId (User),
      to: ObjectId (User),
      changedBy: ObjectId (User),
      changedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Automation Schema
```javascript
{
  project: ObjectId (Project),
  name: String,
  description: String,
  enabled: Boolean,
  trigger: {
    type: String,
    conditions: {
      fromStatus: String,
      toStatus: String,
      assignee: ObjectId (User),
      daysBeforeDue: Number
    }
  },
  action: {
    type: String,
    parameters: {
      newStatus: String,
      userId: ObjectId (User),
      badgeName: String,
      notificationTitle: String,
      notificationMessage: String
    }
  },
  createdBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Schema
```javascript
{
  recipient: ObjectId (User),
  title: String,
  message: String,
  type: String,
  isRead: Boolean,
  relatedTask: ObjectId (Task),
  relatedProject: ObjectId (Project),
  createdAt: Date
}
```

## Automation Examples

### Example 1: Move task to "In Progress" when assigned
```json
{
  "name": "Auto-start when assigned",
  "project": "60d5ec9af682d12345678901",
  "trigger": {
    "type": "taskAssigned",
    "conditions": {
      "assignee": "60d5ec9af682d12345678902"
    }
  },
  "action": {
    "type": "changeStatus",
    "parameters": {
      "newStatus": "In Progress"
    }
  }
}
```

### Example 2: Award badge when task completed
```json
{
  "name": "Award badge on completion",
  "project": "60d5ec9af682d12345678901",
  "trigger": {
    "type": "taskStatusChanged",
    "conditions": {
      "toStatus": "Done"
    }
  },
  "action": {
    "type": "addBadge",
    "parameters": {
      "badgeName": "task_master"
    }
  }
}
```

### Example 3: Send notification when due date approaches
```json
{
  "name": "Due date reminder",
  "project": "60d5ec9af682d12345678901",
  "trigger": {
    "type": "taskDueDateApproaching",
    "conditions": {
      "daysBeforeDue": 1
    }
  },
  "action": {
    "type": "sendNotification",
    "parameters": {
      "notificationTitle": "Task Due Tomorrow",
      "notificationMessage": "Task '{{taskTitle}}' is due tomorrow!"
    }
  }
}
```
