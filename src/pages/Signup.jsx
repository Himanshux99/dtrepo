 import React, { useState } from 'react';
import { useAuth } from './../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Signup.module.css';
import toast, { Toaster } from 'react-hot-toast';

function Signup() {
  const [formData, setFormData] = useState({
    rollNumber: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[a-z]+\.[a-z]+(\d*)?@vit\.edu\.in$/;
    // Allows 2 digits, then 101/102/104/108, then one letter, then 4 digits.
    const rollNumberRegex = /^\d{2}(101|102|104|108)([A-Z]|[a-z])\d{4}$/;

    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please use a valid VIT email address.';
    }
    if (!rollNumberRegex.test(formData.rollNumber)) {
      newErrors.rollNumber = 'Invalid Roll Number format or branch code.';
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
      const { email, password, rollNumber, phone } = formData;
      await signup(email, password, { rollNumber, phone });
      toast.success('Account created successfully! Redirecting...');
      setTimeout(() => navigate('/student'), 2000);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to create an account.');
    }
    setLoading(false);
  };

  return (
    <div className={styles.signupContainer}>
      <Toaster position="top-center" />
      <h2>Create Student Account</h2>
      <form onSubmit={handleSubmit}>
        {/* Roll Number */}
        <div className={styles.formGroup}>
          <label>Roll Number</label>
          <input type="text" name="rollNumber" onChange={handleChange} required />
          {errors.rollNumber && <p className={styles.error}>{errors.rollNumber}</p>}
        </div>
        {/* Email */}
        <div className={styles.formGroup}>
          <label>Email</label>
          <input type="email" name="email" onChange={handleChange} required />
          {errors.email && <p className={styles.error}>{errors.email}</p>}
        </div>
        {/* Phone Number */}
        <div className={styles.formGroup}>
          <label>Phone Number</label>
          <input type="tel" name="phone" onChange={handleChange} required />
        </div>
        {/* Password */}
        <div className={styles.formGroup}>
          <label>Password</label>
          <input type="password" name="password" onChange={handleChange} required />
          {errors.password && <p className={styles.error}>{errors.password}</p>}
        </div>
        {/* Confirm Password */}
        <div className={styles.formGroup}>
          <label>Confirm Password</label>
          <input type="password" name="confirmPassword" onChange={handleChange} required />
          {errors.confirmPassword && <p className={styles.error}>{errors.confirmPassword}</p>}
        </div>

        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      <p className={styles.loginLink}>
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
}

export default Signup;