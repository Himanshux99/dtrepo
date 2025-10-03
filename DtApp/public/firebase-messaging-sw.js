// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

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

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});