import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from './LoadingSpinner';

function Profile() {
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // In a real application, this would be an API call to update the profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile.');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!currentUser) {
    return (
      <div className="auth-container">
        <div className="auth-form-container">
          <h1>Profile</h1>
          <p>Please log in to view your profile.</p>
          <button onClick={() => navigate('/login')}>Login</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Your Profile</h1>
        <p>Manage your account information and preferences.</p>
      </div>
      
      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-info">
            <h2>Account Information</h2>
            <div className="info-item">
              <span className="label">Username:</span>
              <span className="value">{currentUser.username}</span>
            </div>
            <div className="info-item">
              <span className="label">Email:</span>
              <span className="value">{currentUser.email}</span>
            </div>
            <div className="info-item">
              <span className="label">Account ID:</span>
              <span className="value">{currentUser.id}</span>
            </div>
          </div>
          
          <div className="profile-actions">
            <button className="update-btn" onClick={handleUpdateProfile} disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
          
          {loading && <LoadingSpinner />}
        </div>
        
        <div className="profile-card">
          <h2>Privacy Settings</h2>
          <div className="settings-item">
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
            <div className="setting-info">
              <span className="setting-name">Email Notifications</span>
              <span className="setting-description">Receive email notifications about tax deadlines and updates.</span>
            </div>
          </div>
          
          <div className="settings-item">
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
            <div className="setting-info">
              <span className="setting-name">Data Sharing</span>
              <span className="setting-description">Allow anonymous data sharing for service improvement.</span>
            </div>
          </div>
          
          <div className="settings-item">
            <label className="switch">
              <input type="checkbox" />
              <span className="slider"></span>
            </label>
            <div className="setting-info">
              <span className="setting-name">Two-Factor Authentication</span>
              <span className="setting-description">Enable two-factor authentication for added security.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
