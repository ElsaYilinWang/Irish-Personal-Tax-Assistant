import axios from 'axios';
import { toast } from 'react-toastify';

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
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for global error handling
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errorMessage = error.response.data?.message || `Error: ${error.response.status}`;
      
      // Handle specific status codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - token expired or invalid
          localStorage.removeItem('token');
          if (window.location.pathname !== '/login') {
            toast.error('Your session has expired. Please log in again.');
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
          }
          break;
        case 403:
          // Forbidden
          errorMessage = 'You do not have permission to perform this action';
          break;
        case 404:
          // Not found
          errorMessage = 'The requested resource was not found';
          break;
        case 422:
          // Validation error
          errorMessage = 'Please check your input and try again';
          break;
        case 500:
          // Server error
          errorMessage = 'Server error. Please try again later';
          break;
        default:
          // Other errors
          errorMessage = error.response.data?.message || 'An error occurred';
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response from server. Please check your internet connection';
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = error.message || 'An unexpected error occurred';
    }
    
    // Log the error for debugging
    console.error('API Error:', errorMessage, error);
    
    return Promise.reject({ ...error, message: errorMessage });
  }
);

// Tax-related API calls
export const taxAPI = {
  // Calculate tax based on income, deductions, and tax credits
  calculateTax: async (income, deductions, taxCredits) => {
    try {
      const response = await API.post('/tax/calculate', {
        income,
        deductions,
        taxCredits
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
      const response = await API.post('/tax/save', taxData);
      return response.data;
    } catch (error) {
      console.error('Error saving tax return:', error);
      throw error;
    }
  },

  // Get all tax returns for the current user
  getUserTaxReturns: async (userId) => {
    try {
      const response = await API.get('/tax/returns');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching tax returns:', error);
      throw error;
    }
  },
  
  // Get a specific tax return
  getTaxReturn: async (id) => {
    try {
      const response = await API.get(`/tax/returns/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching tax return:', error);
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
      const response = await API.post('/tax/upload', formData);
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
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },
  
  // Download a document
  downloadDocument: async (documentId) => {
    try {
      const response = await API.get(`/tax/documents/${documentId}`, {
        responseType: 'blob'
      });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      
      // Get filename from Content-Disposition header if available
      let filename = 'document';
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  },

  // Delete a document
  deleteDocument: async (documentId) => {
    try {
      const response = await API.delete(`/tax/documents/${documentId}`);
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
  },
  
  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await API.put('/auth/profile', userData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
  
  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const response = await API.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw error;
    }
  },
  
  // Reset password with token
  resetPassword: async (token, newPassword) => {
    try {
      const response = await API.post('/auth/reset-password', { 
        token, 
        password: newPassword 
      });
      return response.data;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },
  
  // Verify email with token
  verifyEmail: async (token) => {
    try {
      const response = await API.post('/auth/verify-email', { token });
      return response.data;
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  }
};

export default API;
