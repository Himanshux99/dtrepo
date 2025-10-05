import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { extractUsernameFromEmail } from '../../utils/profileUtils';
import styles from '../Student/ProfilePage.module.css'; // Reusing styles
import AssignmentForm from '../../components/teacher/AssignmentForm';
import ResetPasswordButton from '../../components/common/ResetPasswordButton'; // NEW IMPORT
import toast, { Toaster } from 'react-hot-toast';

function TeacherProfilePage() {
  const { currentUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // ... existing fetchUserData and handleAddAssignment logic ...
  const fetchUserData = async () => {
    if (!currentUser) return;
    setLoading(true);
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      setProfileData(userDoc.data());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  const handleAddAssignment = async (newAssignment) => {
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      await updateDoc(userDocRef, {
        teachingAssignments: arrayUnion(newAssignment)
      });
      toast.success('New assignment added successfully!');
      setShowAssignmentForm(false);
      fetchUserData(); // Refresh the data
    } catch (error) {
      console.error("Error adding assignment: ", error);
      toast.error("Failed to add assignment.");
    }
  };


  if (loading) return <p>Loading Profile...</p>;
  if (!profileData) return <p>Could not load profile data.</p>;

  const teacherName = extractUsernameFromEmail(profileData.email);

  return (
    <div className={styles.profileContainer}>
      <Toaster position="top-center" />
      <div className={styles.profileHeader}>
        <h2>{teacherName}</h2>
        <p>Teacher Profile - {profileData.email}</p>
      </div>
      
      {/* INTEGRATE RESET BUTTON */}
      

      <h4>Your Teaching Assignments:</h4>
      {profileData.teachingAssignments?.map((a, i) => (
        <div key={i} className={styles.infoItem}>
          <label>{a.subject}</label>
          <span>{a.year} Year {a.branch}, Division {a.division}</span>
          <small style={{display: 'block', color: '#aaa'}}>Batches: {a.batches.join(', ')}</small>
        </div>
      ))}
       {profileData.teachingAssignments?.length === 0 && <p>You have not added any assignments yet.</p>}

      {showAssignmentForm && (
        <AssignmentForm 
          onAdd={handleAddAssignment} 
          onCancel={() => setShowAssignmentForm(false)} 
        />
      )}
      
      {!showAssignmentForm && (
        <button 
          type="button" 
          onClick={() => setShowAssignmentForm(true)} 
          style={{width: '100%', marginTop: '1rem', padding: '0.75rem', cursor: 'pointer'}}>
          + Add a New Class
        </button>
      )}
    </div>
  );
}

export default TeacherProfilePage;