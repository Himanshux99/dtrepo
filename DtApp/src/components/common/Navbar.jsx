import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css';

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Function to determine the settings/profile link for all roles
  const getSettingsLink = () => {
    switch (currentUser.role) {
      case 'student':
      case 'teacher':
        // Student and Teacher click "Settings" but are sent to their Profile page
        return `/${currentUser.role}/settings`; 
      case 'staff':
      case 'admin':
        // Staff and Admin are sent to the generic Settings page
        return `/${currentUser.role}/settings`; 
      default:
        return '/';
    }
  };

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.brand}>College Portal</Link>
      <div className={styles.navLinks}>
        {currentUser ? (
          <>
            {/* Unified Settings Link in the Navbar */}
            {currentUser.role && (
              <Link to={getSettingsLink()} style={{ color: 'white', textDecoration: 'none' }}>
                Settings
              </Link>
            )}

            <span>Welcome, {currentUser.email}</span>
            <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;