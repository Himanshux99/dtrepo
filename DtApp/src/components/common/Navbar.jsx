import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css';
import { CircleUserRound } from 'lucide-react';

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    switch (currentUser?.role) {
      case 'student':
      case 'teacher':
        return `/${currentUser.role}/settings`;
      case 'staff':
      case 'admin':
        return `/${currentUser.role}/settings`;
      default:
        return '/';
    }
  };

  // Function to get dashboard link based on role
  const getDashboardLink = () => {
    switch (currentUser?.role) {
      case 'student':
        return '/student';
      case 'teacher':
        return '/teacher';
      case 'staff':
        return '/staff';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  // Function to get role display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'student':
        return 'Student';
      case 'teacher':
        return 'Teacher';
      case 'staff':
        return 'Staff';
      case 'admin':
        return 'Admin';
      default:
        return 'User';
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer+ " bg-none"}>
        <Link to="/" className={styles.brand}>
          <div className={styles.brandIcon}>🎓</div>
          <span className='text-2xl'>V++</span>
        </Link>

        {/* Desktop Navigation */}
        <div className={styles.navLinks}>
          {currentUser ? (
            <>

            </>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
          )}
        </div>

        <button
          className={"size-12 rounded-full  flex items-center justify-center transition-colors "}
          onClick={() => navigate(getDashboardLink() + '/profile')}
          aria-label="Profile Menu"
        >
          <CircleUserRound size={50} strokeWidth={1} />
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className={styles.mobileMenu}>
          {currentUser ? (
            <>
              <Link
                to={getDashboardLink()}
                className={styles.mobileNavLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>

              {currentUser.role && (
                <Link
                  to={getSettingsLink()}
                  className={styles.mobileNavLink}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Settings
                </Link>
              )}

              <div className={styles.mobileUserInfo}>
                <div className={styles.userAvatar}>
                  {currentUser.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className={styles.userName}>
                    {getRoleDisplayName(currentUser.role)}
                  </div>
                  <div className={styles.userEmail}>
                    {currentUser.email}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className={styles.mobileLogoutButton}
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className={styles.mobileNavLink}
              onClick={() => setIsMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;