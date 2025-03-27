import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';

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
  
  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    setLoading(false);
  }, []);
  
  // Register function
  const register = async (username, email, password) => {
    try {
      setLoading(true);
      
      // In a real application, this would be an API call to register the user
      // For now, we'll simulate the registration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a new user object
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        username,
        email
      };
      
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Update state
      setCurrentUser(newUser);
      
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      toast.error('Registration failed. Please try again.');
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
      
      // In a real application, this would be an API call to authenticate the user
      // For now, we'll simulate the login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data
      const mockUsers = [
        { id: '1', username: 'johndoe', email: 'john@example.com' },
        { id: '2', username: 'janedoe', email: 'jane@example.com' }
      ];
      
      // Find user by email
      const user = mockUsers.find(u => u.email === email);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update state
      setCurrentUser(user);
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error(error.message || 'Login failed. Please try again.');
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    // Remove user from localStorage
    localStorage.removeItem('user');
    
    // Update state
    setCurrentUser(null);
    
    toast.info('You have been logged out.');
  };
  
  // Context value
  const value = {
    currentUser,
    loading,
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
