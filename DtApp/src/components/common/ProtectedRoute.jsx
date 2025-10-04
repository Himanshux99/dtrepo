import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

import toast from 'react-hot-toast';

function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // If user is not logged in, redirect them to the login page
    // We also pass the original location they tried to visit
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!currentUser.emailVerified) {
    // Give a helpful message and redirect
    toast.error("Please verify your email before logging in. Check your inbox for a verification link.");
    return <Navigate to="/login" replace />;
  }


  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // If the user's role is not in the allowedRoles array, redirect them
    return <Navigate to="/unauthorized" replace />;
  }

  // If the user is logged in and has the correct role, render the page
  return children;
}

export default ProtectedRoute;