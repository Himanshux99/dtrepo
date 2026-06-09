// src/pages/Student/ProfilePage.jsx (Update the file)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { decodeRollNumber } from '../../utils/profileUtils';
import styles from './ProfilePage.module.css';
// REMOVE: import ResetPasswordButton from '../../components/common/ResetPasswordButton'; 

function ProfilePage() {
  const { currentUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [decodedData, setDecodedData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ... existing logic ...

  useEffect(() => {
    if (!currentUser) return;

    const fetchUserData = async () => {
      setLoading(true);
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfileData(userData);
        setDecodedData(decodeRollNumber(userData.rollNumber, userData.email));      
      } else {
        console.error("No such user document!");
      }
      setLoading(false);
    };

    fetchUserData();
  }, [currentUser]);

  if (loading) {
    return <p>Loading Profile...</p>;
  }

  if (!profileData || !decodedData) {
    return <p>Could not load profile data.</p>;
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}>
        <h2>{decodedData.username}</h2>
        <p>Student Profile - {profileData.email}</p>
      </div>
      
      {/* REMOVE: <ResetPasswordButton /> */} 
      
      <h3>Academic Information</h3>
      <div className={styles.profileGrid}>
        <div className={styles.infoItem}><label>Roll Number</label><span>{decodedData.rollNumber}</span></div>
        <div className={styles.infoItem}><label>Division</label><span>{decodedData.division}</span></div>
        <div className={styles.infoItem}><label>Branch</label><span>{decodedData.branch}</span></div>
        <div className={styles.infoItem}><label>Academic Year</label><span>{decodedData.currentAcademicYear}</span></div>
        <div className={styles.infoItem}><label>Current Semester</label><span>{decodedData.currentSemester}</span></div>
        <div className={styles.infoItem}><label>Phone Number</label><span>{profileData.phone}</span></div>
      </div>
    </div>
  );
}

export default ProfilePage;