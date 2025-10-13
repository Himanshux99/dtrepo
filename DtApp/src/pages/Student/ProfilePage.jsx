// src/pages/Student/ProfilePage.jsx (Update the file)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { decodeRollNumber } from '../../utils/profileUtils';
import {CircleUser} from "lucide-react";

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
    <div className={"container !px-8 p-4 pb-16"}>
      <div className={"flex flex-col items-center gap-2 mt-4 mb-3 text-2xl font-bold font-inter"}>
        <CircleUser size={60}/>
        <h2>{decodedData.username}</h2>
        <p className='text-[var(--bg-tertiary)] text-lg border-t-2 border-white'>{profileData.email}</p>
      </div>
      
      <h3 className='flex flex-col items-center text-xl font-bold font-inter'>Academic Information</h3>
      <div className={'grid grid-cols-2 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg'}>
        <div className={`card text-secondary bg-tertiary font-bold font-inter`}><label>Roll Number : </label><span>{decodedData.rollNumber}</span></div>
        <div className={`card text-secondary bg-tertiary font-bold font-inter`}><label>Division : </label><span>{decodedData.division}</span></div>
        <div className={`card text-secondary bg-tertiary font-bold font-inter`}><label>Branch : </label><span>{decodedData.branch}</span></div>
        <div className={`card text-secondary bg-tertiary font-bold font-inter`}><label>Academic Year : </label><span>{decodedData.currentAcademicYear}</span></div>
        <div className={`card text-secondary bg-tertiary font-bold font-inter`}><label>Current Semester : </label><span>{decodedData.currentSemester}</span></div>
        <div className={`card text-secondary bg-tertiary font-bold font-inter`}><label>Phone Number : </label><span>{profileData.phone}</span></div>
      </div>
    </div>
  );
}

export default ProfilePage;