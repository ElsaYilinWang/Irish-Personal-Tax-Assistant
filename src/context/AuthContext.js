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
          setCurrentUser(userData.user);
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
      setCurrentUser(response.user);

      toast.success(response.message || 'Registration successful! Please verify your email.');
      return { success: true, user: response.user };
    } catch (error) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      console.error('Registration error:', error);
      return { success: false, error: errorMessage };
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
      setCurrentUser(response.user);

      toast.success('Login successful!');
      
      // Check if email is verified
      if (response.user && !response.user.isVerified) {
        toast.warning('Please verify your email address to access all features.');
      }
      
      return { success: true, user: response.user };
    } catch (error) {
      const errorMessage = error.message || 'Invalid email or password';
      toast.error(errorMessage);
      console.error('Login error:', error);
      return { success: false, error: errorMessage };
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
  
  // Update user data
  const updateUser = (userData) => {
    setCurrentUser(userData);
  };
  
  // Verify email
  const verifyEmail = async (email, code) => {
    try {
      setLoading(true);
      const response = await authAPI.verifyEmail(email, code);
      
      if (response.success && currentUser) {
        // Update user verification status
        setCurrentUser({
          ...currentUser,
          isVerified: true
        });
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Email verification failed';
      console.error('Email verification error:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  
  // Resend verification code
  const resendVerification = async (email) => {
    try {
      setLoading(true);
      const response = await authAPI.resendVerification(email);
      return { success: true, message: response.message };
    } catch (error) {
      const errorMessage = error.message || 'Failed to resend verification code';
      console.error('Resend verification error:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  
  // Request password reset
  const requestPasswordReset = async (email) => {
    try {
      setLoading(true);
      const response = await authAPI.requestPasswordReset(email);
      return { success: true, message: response.message };
    } catch (error) {
      const errorMessage = error.message || 'Failed to request password reset';
      console.error('Password reset request error:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  
  // Reset password
  const resetPassword = async (email, code, newPassword) => {
    try {
      setLoading(true);
      const response = await authAPI.resetPassword(email, code, newPassword);
      return { success: true, message: response.message };
    } catch (error) {
      const errorMessage = error.message || 'Failed to reset password';
      console.error('Password reset error:', error);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    currentUser,
    loading,
    token,
    register,
    login,
    logout,
    updateUser,
    verifyEmail,
    resendVerification,
    requestPasswordReset,
    resetPassword,
    isAuthenticated: !!currentUser,
    isVerified: currentUser ? currentUser.isVerified : false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
