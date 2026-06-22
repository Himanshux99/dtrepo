// src/hooks/useFCM.js
import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../firebase/config';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';

const useFCM = (currentUser) => {
  const [fcmToken, setFcmToken] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  // Request notification permission
  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        await getFCMToken();
        return true;
      } else {
        console.log('Notification permission denied.');
        toast.error('Please enable notifications to receive updates.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // Get FCM token
  const getFCMToken = async () => {
    if (!messaging) {
      console.log('Messaging not supported');
      return null;
    }

    try {
      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      console.log('Using service worker:', registration.active?.scriptURL);

      // Get FCM token using the active service worker
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (token) {
        // console.log('FCM Token:', token);
        setFcmToken(token);
        
        // Save token to Firestore
        if (currentUser) {
          await saveFCMTokenToFirestore(token);
        }
        
        return token;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  };

  // Save token to user's document in Firestore
  const saveFCMTokenToFirestore = async (token) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
        lastTokenUpdate: new Date()
      });
      console.log('FCM token saved to Firestore');
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  };

  // Listen for foreground messages
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      const { title, body } = payload.notification || {};
      
      // Show toast notification when app is in foreground
      toast.custom((t) => {
        return (
          <div
            style={{
              background: '#333',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #007bff',
              maxWidth: '400px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>
              {title || 'New Notification'}
            </div>
            <div style={{ fontSize: '14px' }}>
              {body || 'You have a new notification'}
            </div>
          </div>
        );
      }, { duration: 5000 });
    });

    return () => unsubscribe();
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (currentUser && notificationPermission === 'granted') {
      getFCMToken();
    }
  }, [currentUser]);

  return {
    fcmToken,
    notificationPermission,
    requestPermission,
    getFCMToken
  };
};

export default useFCM;