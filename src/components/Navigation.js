import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav>
      <div className="logo">
        <h2>Irish Tax Assistant</h2>
      </div>
      <div className="nav-links">
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
      </div>
    </nav>
  );
}

export default Navigation;
