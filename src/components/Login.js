import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        // If user is not verified, redirect to verification page
        if (result.user && !result.user.isVerified) {
          navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        } else {
          // Otherwise go to dashboard
          navigate('/');
        }
      }
    }
  };
  
  const handleForgotPassword = () => {
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors({
        ...errors,
        email: 'Please enter a valid email to reset your password'
      });
      return;
    }
    
    if (formData.email) {
      navigate(`/forgot-password?email=${encodeURIComponent(formData.email)}`);
    } else {
      navigate('/forgot-password');
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h1>Login</h1>
        <p>Please log in to access your tax information.</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <div className="error-message">{errors.password}</div>}
            <div className="forgot-password">
              <button 
                type="button" 
                className="text-btn"
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </button>
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                <span>Logging in...</span>
              </>
            ) : 'Login'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>Don't have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
