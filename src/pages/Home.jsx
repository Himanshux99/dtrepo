import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // This effect runs when the component loads or when currentUser changes.
  useEffect(() => {
    // If a user is logged in, redirect them to their dashboard.
    if (currentUser && currentUser.role) {
      switch (currentUser.role) {
        case 'student':
          navigate('/student', { replace: true });
          break;
        case 'teacher':
          navigate('/teacher', { replace: true });
          break;
        case 'staff':
          navigate('/staff', { replace: true });
          break;
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        default:
          // Stay on the home page if the role is unknown
          break;
      }
    }
  }, [currentUser, navigate]);

  // While the check is happening, or if there's no user, show the public home page.
  // This content will only be seen by users who are not logged in.
  return (
    <div>
      <h1>Welcome to the College Portal</h1>
      <p>Please log in to continue.</p>
      <Link to="/login">Go to Login</Link>
    </div>
  );
}

export default Home;