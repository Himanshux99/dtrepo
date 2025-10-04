import { useEffect } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext'; //
import { app, db } from '../../firebase/config'; //

function Notifications() {
  const { currentUser } = useAuth(); //

  useEffect(() => {
    if (!currentUser) return;

    const setupNotifications = async () => {
      try {
        const messaging = getMessaging(app);
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const currentToken = await getToken(messaging, {
            vapidKey: 'BCX4dwm8zvGkXQNRxhhgtcqz4dxCjUEBdVPQgUFLjBE4eVg_MP_iPNXvK1DuF9XnDXCCv4fTRHvPm7Ij0s8hJYw', // Get this from Project Settings -> Cloud Messaging
          });

          if (currentToken) {
            console.log('FCM Token:', currentToken);
            // Add the new token to the user's document without creating duplicates
            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
              fcmTokens: arrayUnion(currentToken)
            });
          }
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();
  }, [currentUser]);

  return null; // This component has no visible UI
}

export default Notifications;