import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { authAPI } from '../utils/api';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem('token');

      if (storedToken) {
        try {
          setToken(storedToken);
          // Fetch current user data from the backend
          const userData = await authAPI.getCurrentUser();
          setCurrentUser(userData.data);
        } catch (error) {
          console.error('Error fetching user data:', error);
          // If token is invalid or expired, clear it
          localStorage.removeItem('token');
          setToken(null);
          setCurrentUser(null);
        }
      }

      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Register function
  const register = async (username, email, password) => {
    try {
      setLoading(true);

      // Call the register API
      const response = await authAPI.register({ username, email, password });

      // Store token in localStorage
      localStorage.setItem('token', response.token);
      setToken(response.token);

      // Set current user
      setCurrentUser(response.data.user);

      toast.success('Registration successful!');
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);

      // Call the login API
      const response = await authAPI.login({ email, password });

      // Store token in localStorage
      localStorage.setItem('token', response.token);
      setToken(response.token);

      // Set current user
      setCurrentUser(response.data.user);

      toast.success('Login successful!');
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Invalid email or password';
      toast.error(errorMessage);
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    setToken(null);

    // Update state
    setCurrentUser(null);

    toast.info('You have been logged out.');
  };

  // Context value
  const value = {
    currentUser,
    loading,
    token,
    register,
    login,
    logout,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
