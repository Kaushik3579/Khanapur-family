/* global importScripts, firebase */
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB15T16GssGcB15oWk-1iD8OGnIqV_Rgwg',
  authDomain: 'family-d61ac.firebaseapp.com',
  projectId: 'family-d61ac',
  storageBucket: 'family-d61ac.firebasestorage.app',
  messagingSenderId: '258397774604',
  appId: '1:258397774604:web:23dac4b1826700e26adf29',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'New Connect message';
  const options = {
    body: payload.notification?.body || 'Open Connect to view the message.',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: {
      link: payload.fcmOptions?.link || '/connect',
    },
    renotify: true,
    tag: 'connect-chat-message',
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.link || '/connect';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
      return undefined;
    }),
  );
});
