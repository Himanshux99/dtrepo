import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Login.module.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
import {GraduationCap } from 'lucide-react'


function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, logout, sendVerificationEmail, sendPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [showEmailRequired, setShowEmailRequired] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState(null);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await login(email, password);
      const user = userCredential.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!user.emailVerified) {
        setUnverifiedUser(user); // Store the user object to resend email
        setError("Please verify your email first. A link was sent to your inbox.");
        await logout(); // Log them out so they don't get stuck
        setLoading(false);
        return; // Stop the login process here
      }

      if (userDoc.exists()) {
        // Profile exists, redirect to the correct dashboard
        const userData = userDoc.data();
        console.log('User data found:', userData);
        setLoading(false);
        
        switch (userData.role) {
            case 'student':
              console.log('Navigating to student dashboard');
              navigate('/student',{ replace: true });
              break;
            case 'teacher':
              console.log('Navigating to teacher dashboard');
              navigate('/teacher',{ replace: true });
              break;
            case 'staff':
              console.log('Navigating to staff dashboard');
              navigate('/staff',{ replace: true });
              break;
            case 'admin':
              console.log('Navigating to admin dashboard');
              navigate('/admin',{ replace: true });
              break;
            default:
              console.log('No role found, navigating to home');
              navigate('/');
        }
      } else {
        // Profile DOES NOT exist, this is their first login.
        console.log('No user profile found, redirecting to complete profile');
        setLoading(false);
        navigate('/student/complete-profile', { replace: true });
      }

    } catch (err) {
      // --- THIS IS THE IMPROVED ERROR HANDLING ---
      console.error("Firebase Login Error Code:", err.code); // Log the specific code
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('The email address is not formatted correctly.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedUser) return;
    try {
      await sendVerificationEmail(unverifiedUser);


      toast.success("A new verification email has been sent!");

    } catch (error) {
      toast.error("Failed to resend verification email.");
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setShowEmailRequired(true);
      return toast.error("Please enter your email address to reset your password.");
    }
    const toastId = toast.loading("Sending password reset link...");
    try {
      await sendPasswordReset(email);
      toast.success("Password reset link sent! Please check your email.", { id: toastId });
    } catch (error) {
      console.error("Password Reset Error:", error);
      toast.error("Could not send reset link. Please check the email address.", { id: toastId });
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-primary py-12 px-4 text-primary">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="text-5xl mb-1"><GraduationCap size={60}/></div>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-[var(--bg-tertiary)] font-bold">Sign in to your College Portal account</p>
        </div>

        {/* Login Form */}
        <div className="flex flex-col bg-white text-red-600 font-bold px-6 pt-4 pb-2 rounded-lg shadow-md">
          {error && (
            <div className="mb-4 p-3 rounded-lg border !border-red-500 bg-red-50">
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {unverifiedUser && (
            <div className="mb-4 p-3 rounded-lg !bg-white border !border-[var(--bg-primary)] text-secondary text-center text-lg flex flex-col items-center !border-yellow-400 bg-yellow-50">
              <p className="mb-2">Please verify your email first.</p>
              <button 
                onClick={handleResendVerification} 
                className="flex flex-col py-2 px-4 text-sm bg-yellow-400 text-white rounded-lg font-bold  items-center justify-center"
              >
                Resend Verification Email
              </button>
            </div>
          )}

          {showEmailRequired && (
            <div className="mb-4 p-3 rounded-lg !bg-white border !border-[var(--bg-primary)] text-secondary text-center text-lg flex flex-col items-center">
              <p className="mb-2">Please enter your email first.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="">
            <div className="pb-2">
              <label htmlFor="email" className="text-secondary font-bold font-inter">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex flex-col p-3 border w-full font-bold font-inter bg-tertiary text-secondary rounded-lg"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="pb-2">
              <label htmlFor="password" className="text-secondary font-bold font-inter">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex flex-col p-3 border w-full font-bold font-inter bg-tertiary text-secondary rounded-lg"
                placeholder="Enter your password"
                required
              />
            </div>

            <button 
              type="submit" 
              className='btn-main' 
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-2 text-right">
            <button 
              onClick={handlePasswordReset} 
              className="text-secondary hover:text-secondary-600 text-sm font-medium"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        {/* Sign Up Links */}
        <div className="text-center">
          <p className="text-secondary mb-4">
            Don't have an account?
          </p>
          <div className="space-y-3">
            <Link to="/signup" className="btn-secondary">
              Don't have an Account? Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;