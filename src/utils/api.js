import axios from 'axios';

// Create an axios instance with default config
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't set Content-Type for FormData (multipart/form-data)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Tax-related API calls
export const taxAPI = {
  // Calculate tax based on income, deductions, and tax credits
  calculateTax: async (income, deductions, taxCredits) => {
    try {
      const response = await API.get('/tax/calculate', {
        params: { income, deductions, taxCredits }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error calculating tax:', error);
      throw error;
    }
  },

  // Save a tax return
  saveTaxReturn: async (taxData) => {
    try {
      const response = await API.post('/tax/create', taxData);
      return response.data;
    } catch (error) {
      console.error('Error saving tax return:', error);
      throw error;
    }
  },

  // Get all tax returns for the current user
  getUserTaxReturns: async (userId) => {
    try {
      const response = await API.get(`/tax/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tax returns:', error);
      throw error;
    }
  },

  // Get tax deadlines
  getTaxDeadlines: async () => {
    try {
      const response = await API.get('/tax/deadlines');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching tax deadlines:', error);
      throw error;
    }
  },

  // Get user's tax filing progress
  getTaxProgress: async () => {
    try {
      const response = await API.get('/tax/progress');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching tax progress:', error);
      throw error;
    }
  },

  // Upload a tax document
  uploadDocument: async (formData) => {
    try {
      const response = await API.post('/tax/document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  // Get all documents for the current user
  getUserDocuments: async () => {
    try {
      const response = await API.get('/tax/documents');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  // Delete a document
  deleteDocument: async (documentId) => {
    try {
      const response = await API.delete(`/tax/document/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
};

// Authentication-related API calls
export const authAPI = {
  // Register a new user
  register: async (userData) => {
    try {
      const response = await API.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  // Login a user
  login: async (credentials) => {
    try {
      const response = await API.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  // Get current user profile
  getCurrentUser: async () => {
    try {
      const response = await API.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }
};

export default API;
