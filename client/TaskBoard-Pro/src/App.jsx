import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { SnackbarProvider } from 'notistack';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import ProjectDetails from './components/projects/ProjectDetails';
import Settings from './components/settings/Settings';
import Profile from './components/profile/Profile';

// Create a theme instance with modern black-blue-navy-white-orange color scheme
const theme = createTheme({
  palette: {
    primary: {
      main: '#0A1929', // Dark navy blue
      light: '#1E3A8A', // Medium blue
      dark: '#030712', // Almost black
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F97316', // Vibrant orange
      light: '#FDBA74', // Light orange
      dark: '#C2410C', // Dark orange
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC', // Light gray with slight blue tint
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A', // Dark navy for text
      secondary: '#64748B', // Medium gray-blue for secondary text
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(90deg, #0A1929 0%, #1E3A8A 100%)',
        },
        containedSecondary: {
          background: 'linear-gradient(90deg, #F97316 0%, #C2410C 100%)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}>
        <AuthProvider>
          <Router>
            <Navbar />
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route 
                path="/projects/:id" 
                element={
                  <PrivateRoute>
                    <ProjectDetails />
                  </PrivateRoute>
                }
              />
              <Route 
                path="/settings" 
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                }
              />
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Router>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App; 