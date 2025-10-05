import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Signup.module.css';
import toast, { Toaster } from 'react-hot-toast';

function Signup() {
  // 1. Unified state for all form fields
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  // 2. Single handler for all inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Corrected validation logic
  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[a-z]+\.[a-z]+(\d*)?@vit\.edu\.in$/;

    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please use a valid VIT email address';
    }
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setLoading(true);
    try {
      // 4. Use email and password from the unified state
      await signup(formData.email, formData.password);
      setSignupSuccess(true);
      toast.success('Account created! Please check your email to verify.');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered. Please log in.');
      } else {
        toast.error(error.message || 'Failed to create an account.');
      }
    }
    setLoading(false);
  };

  if (signupSuccess) {
    return (
      <div className={styles.signupContainer}>
        <h2>✅ Account Created!</h2>
        <p>We've sent a verification link to <strong>{formData.email}</strong>.</p>
        <p>Please click the link in the email to activate your account before logging in.</p>
        <Link to="/login" className={styles.submitButton} style={{ textAlign: 'center', textDecoration: 'none' }}>
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.signupContainer}>
      <Toaster position="top-center" />
      <h2>Create Student Account (Step 1 of 2)</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          {errors.email && <p className={styles.error}>{errors.email}</p>}
        </div>
        <div className={styles.formGroup}>
          <label>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          {errors.password && <p className={styles.error}>{errors.password}</p>}
        </div>
        <div className={styles.formGroup}>
          <label>Confirm Password</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
          {errors.confirmPassword && <p className={styles.error}>{errors.confirmPassword}</p>}
        </div>
        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? 'Creating Account...' : 'Sign Up & Verify'}
        </button>
      </form>
      <p className={styles.loginLink}>
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
}

export default Signup;