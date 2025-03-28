import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png'; // Import the actual logo

function Navigation() {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  
  return (
    <nav>
      <div className="logo">
        <Link to="/">
          <img src={logo} alt="CáinSábháil Logo" className="nav-logo" />
          <h2>CáinSábháil</h2>
        </Link>
      </div>
      <div className="nav-links">
        {currentUser ? (
          <>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Dashboard
            </Link>
            <Link to="/tax-form" className={location.pathname === '/tax-form' ? 'active' : ''}>
              Tax Form
            </Link>
            <Link to="/documents" className={location.pathname === '/documents' ? 'active' : ''}>
              Documents
            </Link>
            <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
              Profile
            </Link>
            <button className="logout-nav-btn" onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>
              Login
            </Link>
            <Link to="/register" className={location.pathname === '/register' ? 'active' : ''}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
