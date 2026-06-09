import React, { useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Make sure setDoc is imported
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
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

  // --- Authentication Functions ---
  function signup(email, password, additionalData, role = 'student') { // Takes 'role' as an argument
    return createUserWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        // After user is created in Auth, save their data in Firestore
        const user = userCredential.user;
        const userDocRef = doc(db, 'users', user.uid);
        return setDoc(userDocRef, {
          uid: user.uid,
          email: email,
          role: role, // Uses the 'role' variable passed to the function
          ...additionalData
        });
      });
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
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
  };

  // Render children only when not loading
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}