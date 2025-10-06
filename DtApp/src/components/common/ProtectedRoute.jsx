import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

import toast from 'react-hot-toast';

function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute Check:', {
    path: location.pathname,
    currentUser: currentUser ? {
      email: currentUser.email,
      role: currentUser.role,
      emailVerified: currentUser.emailVerified
    } : null,
    allowedRoles
  });

  if (!currentUser) {
    console.log('No user found, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!currentUser.emailVerified) {
    console.log('Email not verified, redirecting to login');
    toast.error("Please verify your email before logging in. Check your inbox for a verification link.");
    return <Navigate to="/login" replace />;
  }

  // For complete-profile route, skip role check
  if (location.pathname === '/student/complete-profile') {
    console.log('Complete profile route, skipping role check');
    return children;
  }

  // Only check roles if allowedRoles is provided and we're not on the complete-profile route
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    console.log('Unauthorized role access, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  // If the user is logged in and has the correct role, render the page
  return children;
}

export default ProtectedRoute;