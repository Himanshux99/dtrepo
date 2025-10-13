// public/sw-unified.js
// Unified Service Worker - Handles both PWA caching AND Firebase notifications

console.log('[SW] Starting to load unified service worker...');

// ============================================
// PART 1: Firebase Cloud Messaging Setup (Load First)
// ============================================


try {
  // Import Firebase scripts
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');
  
  console.log('[SW] Firebase scripts loaded successfully');

  // Initialize Firebase
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
  
  console.log('[SW] Firebase initialized successfully');

  // Handle background push notifications
  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Received background message:', payload);
    
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new notification',
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: payload.data?.tag || 'default-notification',
      data: payload.data,
      requireInteraction: true,
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });

  console.log('[SW] Firebase messaging handlers registered');

} catch (error) {
  console.error('[SW] Error initializing Firebase:', error);
}

// ============================================
// PART 2: Workbox PWA Caching Setup
// ============================================

try {
  // Import Workbox for caching
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');
  
  console.log('[SW] Workbox loaded successfully');

  const { registerRoute } = workbox.routing;
  const { CacheFirst, NetworkFirst } = workbox.strategies;
  const { CacheableResponsePlugin } = workbox.cacheableResponse;
  const { ExpirationPlugin } = workbox.expiration;

  // Cache static assets
  registerRoute(
    ({ request }) => request.destination === 'style' || 
                     request.destination === 'script' ||
                     request.destination === 'worker',
    new CacheFirst({
      cacheName: 'static-cache',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );

  // Cache images
  registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
      cacheName: 'image-cache',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    })
  );

  // Cache API calls
  registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new NetworkFirst({
      cacheName: 'api-cache',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // Cache HTML pages
  registerRoute(
    ({ request }) => request.destination === 'document',
    new NetworkFirst({
      cacheName: 'html-cache',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  console.log('[SW] Workbox caching initialized');

} catch (error) {
  console.error('[SW] Error initializing Workbox:', error);
}

// ============================================
// Handle notification clicks
// ============================================

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if found
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if none found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================
// Service Worker Lifecycle
// ============================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing unified service worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating unified service worker');
  event.waitUntil(
    clients.claim().then(() => {
      console.log('[SW] Service worker activated and claimed clients');
    })
  );
});

console.log('[SW] Unified Service Worker loaded successfully!');