import React, { useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';

// Create the context
const AuthContext = React.createContext();


// Custom hook to use the context
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

// Provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);




  const refreshUser = async () => {
    const user = auth.currentUser;
    if (user && user.emailVerified) {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setCurrentUser({ ...user, role: userDoc.data().role });
      }
    }
  };

  // --- Authentication Functions ---
  async function signup(email, password, additionalData = null, role = 'student') {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user document in Firestore with role and additional data
      if (role && role !== 'student') {
        const userDocRef = doc(db, 'users', user.uid);
        const userData = {
          email: user.email,
          role: role,
          createdAt: Timestamp.now(),
          ...additionalData
        };
        await setDoc(userDocRef, userData);
      }
      
      await sendEmailVerification(user);
      return userCredential;
    } catch (error) {
      console.error("Error during signup:", error);
      throw error;
    }
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  function sendVerificationEmail(user) {
    return sendEmailVerification(user);
  }

  function sendPasswordReset(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // --- User State Management ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // If user is logged in, fetch their role from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setCurrentUser({ ...user, role: userDoc.data().role });
        } else {
          // Handle case where user exists in Auth but not in Firestore
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    refreshUser,
    sendPasswordReset,
  };

  // Render children only when not loading
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}