// public/firebase-messaging-sw.js
// This service worker handles background notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
const firebaseConfig = {
  apiKey: "AIzaSyAk-lL8ZPWQrLujqqiRN3JurzI2GNh5i98",
  authDomain: "dtapp-228b6.firebaseapp.com",
  projectId: "dtapp-228b6",
  storageBucket: "dtapp-228b6.firebasestorage.app",
  messagingSenderId: "193516575243",
  appId: "1:193516575243:web:6dbb92c60cbfbd4038c50e",
  measurementId: "G-EL1XN2BQR2"
};
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification.body || 'You have a new notification',
    icon: '/vite.svg', // Your app icon
    badge: '/vite.svg',
    tag: payload.data?.tag || 'default-notification',
    data: payload.data,
    requireInteraction: true, // Keep notification until user interacts
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();
  
  // Get the URL to open from notification data
  const urlToOpen = event.notification.data?.url || '/';
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});