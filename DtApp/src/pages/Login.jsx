import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Login.module.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';


function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, logout, sendVerificationEmail, sendPasswordReset } = useAuth();
  const navigate = useNavigate();

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
              navigate('/student');
              break;
            case 'teacher':
              console.log('Navigating to teacher dashboard');
              navigate('/teacher');
              break;
            case 'staff':
              console.log('Navigating to staff dashboard');
              navigate('/staff');
              break;
            case 'admin':
              console.log('Navigating to admin dashboard');
              navigate('/admin');
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

    <div className={styles.loginContainer}>
      <h2>Login</h2>
      {error && <p className={styles.error}>{error}</p>}
      {unverifiedUser && (
        <button onClick={handleResendVerification} style={{ marginBottom: '1rem', backgroundColor: '#ffc107', color: '#111' }}>
          Resend Verification Email
        </button>
      )}
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      <div style={{ textAlign: 'right', fontSize: '0.9em', margin: '-0.5rem 0 1rem 0' }}>
          <a href="#" onClick={handlePasswordReset} className={styles.forgotPassword}>
            Forgot Password?
          </a>
        </div>

      <p style={{ marginTop: '1rem' }}>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
      <p>
        Signing up as a Teacher? <Link to="/signup/teacher">Click Here</Link>
      </p>
    </div>
  );
}

export default Login;