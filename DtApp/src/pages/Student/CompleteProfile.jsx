import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import styles from '../Signup.module.css'; // Reusing signup styles
import toast, { Toaster } from 'react-hot-toast';

function CompleteProfile() {
  const navigate = useNavigate();
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
   const { currentUser, refreshUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!currentUser) {
      toast.error("You are not logged in!");
      setLoading(false);
      return;
    }

    const userData = {
      uid: currentUser.uid,
      email: currentUser.email,
      role: 'student',
      rollNumber,
      phone,
    };

    try {
      // 1. Save the new document to Firestore
      await setDoc(doc(db, 'users', currentUser.uid), userData);
      
      // 2. Refresh the user state in the context
      await refreshUser();
      
      toast.success("Profile completed successfully!");
      
      // 3. Now navigate to the dashboard
      navigate('/student');
    } catch (error) {
      console.error("Error completing profile:", error);
      toast.error("Failed to save profile details.");
    }
    setLoading(false);
  };

  return (
    <div className={styles.signupContainer}>
      <Toaster position="top-center" />
      <h2>Complete Your Profile (Step 2 of 2)</h2>
      <p>Please provide your remaining details to continue.</p>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>Roll Number</label>
          <input type="text" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} required />
        </div>
        <div className={styles.formGroup}>
          <label>Phone Number</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <button type="submit" className={styles.submitButton} disabled={loading}>
          {loading ? 'Saving...' : 'Complete Profile'}
        </button>
      </form>
    </div>
  );
}

export default CompleteProfile;