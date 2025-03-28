import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter code, 3: New password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Get email from query params if available
    const queryParams = new URLSearchParams(location.search);
    const emailParam = queryParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [location]);
  
  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);
  
  const handleRequestCode = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.warning('Please enter your email address');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.warning('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await authAPI.requestPasswordReset(email);
      
      if (response.success) {
        toast.success('Password reset code sent to your email');
        setStep(2);
        setResendDisabled(true);
        setCountdown(60); // Disable resend for 60 seconds
      }
    } catch (error) {
      console.error('Error requesting password reset:', error);
      toast.error(error.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!code) {
      toast.warning('Please enter the verification code');
      return;
    }
    
    // Move to password reset step
    setStep(3);
  };
  
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword) {
      toast.warning('Please enter a new password');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.warning('Password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.warning('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await authAPI.resetPassword(email, code, newPassword);
      
      if (response.success) {
        toast.success('Password reset successfully! You can now log in with your new password.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendCode = async () => {
    setResendDisabled(true);
    setCountdown(60); // Disable resend for 60 seconds
    
    try {
      const response = await authAPI.requestPasswordReset(email);
      
      if (response.success) {
        toast.success('Password reset code sent to your email');
      }
    } catch (error) {
      console.error('Error resending code:', error);
      toast.error(error.message || 'Failed to resend code');
      setResendDisabled(false);
      setCountdown(0);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h1>Reset Password</h1>
        
        {step === 1 && (
          <>
            <p>Enter your email address to receive a password reset code.</p>
            
            <form onSubmit={handleRequestCode} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="auth-button"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>Sending...</span>
                  </>
                ) : 'Send Reset Code'}
              </button>
            </form>
          </>
        )}
        
        {step === 2 && (
          <>
            <p>We've sent a verification code to <strong>{email}</strong>.</p>
            <p>Please enter the code below to continue.</p>
            
            <form onSubmit={handleVerifyCode} className="auth-form">
              <div className="form-group">
                <label htmlFor="code">Verification Code</label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="auth-button"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>Verifying...</span>
                  </>
                ) : 'Verify Code'}
              </button>
              
              <div className="resend-code">
                <p>Didn't receive the code?</p>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendDisabled}
                  className="text-btn"
                >
                  {resendDisabled 
                    ? `Resend Code (${countdown}s)` 
                    : 'Resend Code'}
                </button>
              </div>
            </form>
          </>
        )}
        
        {step === 3 && (
          <>
            <p>Create a new password for your account.</p>
            
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
                <div className="password-requirements">
                  Password must be at least 6 characters long
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="auth-button"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>Resetting Password...</span>
                  </>
                ) : 'Reset Password'}
              </button>
            </form>
          </>
        )}
        
        <div className="auth-links">
          <p>Remember your password? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
