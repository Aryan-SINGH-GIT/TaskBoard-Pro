import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { loginWithEmailAndPassword, registerWithEmailAndPassword, logoutUser } from '../config/firebase';
import { registerUser, getCurrentUser } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  // Register new user
  const signup = async (name, email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      // 1. Register with Firebase
      const firebaseUser = await registerWithEmailAndPassword(email, password);
      
      // 2. Register with our backend only if Firebase registration succeeds
      if (firebaseUser && firebaseUser.uid) {
        try {
          await registerUser({
            name,
            email,
            password,
            firebaseUid: firebaseUser.uid // Include firebaseUid for the backend
          });
        } catch (backendErr) {
          console.error("Backend registration failed:", backendErr);
          // If backend fails but Firebase succeeded, we should still return the Firebase user
          // but log the error
        }
      }
      
      setLoading(false);
      return firebaseUser;
    } catch (err) {
      console.error("Firebase registration error:", err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      // Login with Firebase
      const userCredential = await loginWithEmailAndPassword(email, password);
      
      // Get additional user data from our backend
      try {
        const userResponse = await getCurrentUser();
        console.log('Backend user data:', userResponse);
      } catch (err) {
        console.error('Error fetching user data from backend:', err);
        // Don't fail the login if backend user fetch fails
        // since Firebase auth succeeded
      }
      
      setLoading(false);
      return userCredential;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setLoading(true);
      await logoutUser();
      setCurrentUser(null);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    signup,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 