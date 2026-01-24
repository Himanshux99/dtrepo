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
import useFCM from '../hooks/useFCM';

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

  // ========== NEW: Initialize FCM for current user ==========
  const { requestPermission, notificationPermission } = useFCM(currentUser);
  // ===========================================================

  const refreshUser = async () => {
    const user = auth.currentUser;
    if (user && user.emailVerified) {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const enhancedUser = { 
          ...user, 
          role: userDoc.data().role,
          getIdToken: async (forceRefresh = false) => {
            try {
              return await user.getIdToken(forceRefresh);
            } catch (error) {
              console.error('Failed to get ID token:', error);
              return null;
            }
          }
        };
        setCurrentUser(enhancedUser);
      }
    }
  };

  // ========== NEW: Function to check and request notification permission ==========
  const checkNotificationPermission = async () => {
    // Only ask once per session to avoid annoying users
    const hasAskedThisSession = sessionStorage.getItem('fcm_permission_asked');
    
    // Only ask if permission is in 'default' state (not yet decided)
    if (!hasAskedThisSession && notificationPermission === 'default') {
      // Wait 2 seconds after login before asking (better UX)
      setTimeout(async () => {
        try {
          const granted = await requestPermission();
          if (granted) {
            console.log('User granted notification permission');
          } else {
            console.log('User denied notification permission');
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
        }
        // Mark that we've asked this session
        sessionStorage.setItem('fcm_permission_asked', 'true');
      }, 2000); // 2 second delay
    }
  };
  // ================================================================================

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
          const enhancedUser = { 
            ...user, 
            role: userDoc.data().role,
            getIdToken: async (forceRefresh = false) => {
              try {
                const token = await user.getIdToken(forceRefresh);
                console.log(token);
                return token;
              } catch (error) {
                console.error('Failed to get ID token:', error);
                return null;
              }
            }
          };
          setCurrentUser(enhancedUser);
          
          // ========== NEW: Check notification permission after login ==========
          checkNotificationPermission();
          // ====================================================================
        } else {
          // Handle case where user exists in Auth but not in Firestore
          const enhancedUser = {
            ...user,
            getIdToken: async (forceRefresh = false) => {
              try {
                return await user.getIdToken(forceRefresh);
              } catch (error) {
                console.error('Failed to get ID token:', error);
                return null;
              }
            }
          };
          setCurrentUser(enhancedUser);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [notificationPermission]); // Added notificationPermission as dependency

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