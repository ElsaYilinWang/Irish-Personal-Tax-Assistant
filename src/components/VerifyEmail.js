import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

function VerifyEmail() {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email from query params or current user
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || (currentUser ? currentUser.email : '');

  useEffect(() => {
    // If user is already verified, redirect to dashboard
    if (currentUser && currentUser.isVerified) {
      navigate('/');
    }
    
    // If no email is available, redirect to login
    if (!email) {
      toast.error('Email address is required for verification');
      navigate('/login');
    }
  }, [currentUser, navigate, email]);

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!verificationCode) {
      toast.warning('Please enter the verification code');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await authAPI.verifyEmail(email, verificationCode);
      
      if (response && response.success) {
        toast.success('Email verified successfully!');
        
        // Update user verification status
        if (currentUser) {
          updateUser({ ...currentUser, isVerified: true });
        }
        
        // Redirect to dashboard or previous page
        navigate('/');
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      toast.error(error.message || 'Failed to verify email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendDisabled(true);
    setCountdown(60); // Disable resend for 60 seconds
    
    try {
      const response = await authAPI.resendVerification(email);
      
      if (response && response.success) {
        toast.success('Verification code sent to your email');
      }
    } catch (error) {
      console.error('Error resending verification code:', error);
      toast.error(error.message || 'Failed to resend verification code');
      setResendDisabled(false);
      setCountdown(0);
    }
  };

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        <h1>Verify Your Email</h1>
        <p className="verify-email-info">
          We've sent a verification code to <strong>{email}</strong>. 
          Please enter the code below to verify your email address.
        </p>
        
        <form onSubmit={handleVerify} className="verify-email-form">
          <div className="form-group">
            <label htmlFor="verificationCode">Verification Code</label>
            <input
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength="6"
              className="form-control"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="verify-btn"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="small" /> : 'Verify Email'}
          </button>
        </form>
        
        <div className="verify-email-actions">
          <p>Didn't receive the code?</p>
          <button
            onClick={handleResendCode}
            disabled={resendDisabled}
            className="resend-btn"
          >
            {resendDisabled 
              ? `Resend Code (${countdown}s)` 
              : 'Resend Code'}
          </button>
          
          <div className="verify-email-help">
            <p>
              If you're having trouble, please check your spam folder or
              <button 
                onClick={() => navigate('/contact')}
                className="text-btn"
              >
                contact support
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;
