/**
 * JalaDhar Firebase Messaging Service Worker (SOP v3.0)
 * Duplicate-safe background push notification handling
 */

// Import Firebase scripts (Compat version for Service Workers)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Set-based deduplication tracker for background notifications
const shownNotifications = new Set();

// Prune tracked IDs periodically to prevent memory leaks
setInterval(() => {
  if (shownNotifications.size > 200) {
    shownNotifications.clear();
  }
}, 30 * 60 * 1000);

let messaging = null;

/**
 * Initialize Firebase within the Service Worker
 */
function initFirebaseInSW(config) {
  if (!config || !config.apiKey || !config.projectId) return;

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    if (!messaging && firebase.messaging.isSupported()) {
      messaging = firebase.messaging();
      attachBackgroundHandler();
    }
  } catch (error) {
    console.error('[firebase-messaging-sw] Init error:', error);
  }
}

/**
 * Attach the background message handler with deduplication
 */
function attachBackgroundHandler() {
  if (!messaging) return;

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw] Received background message:', payload);

    const notificationId =
      payload.data?.notificationId ||
      payload.data?.id ||
      `${payload.notification?.title || 'alert'}_${Date.now()}`;

    // Deduplication check: Prevent duplicate notification display
    if (shownNotifications.has(notificationId)) {
      console.log('[firebase-messaging-sw] Duplicate background notification blocked:', notificationId);
      return;
    }
    shownNotifications.add(notificationId);

    const title = payload.notification?.title || payload.data?.title || 'JalaDhar Notification';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || '',
      icon: payload.notification?.icon || '/favicon.png',
      badge: '/favicon.png',
      data: {
        ...(payload.data || {}),
        link: payload.data?.link || '/',
        notificationId
      },
      tag: notificationId // OS-level deduplication
    };

    return self.registration.showNotification(title, notificationOptions);
  });
}

// 1. Check for configuration passed in the Service Worker URL
try {
  const urlParams = new URL(self.location.href).searchParams;
  const configString = urlParams.get('firebaseConfig');
  if (configString) {
    const parsedConfig = JSON.parse(decodeURIComponent(configString));
    initFirebaseInSW(parsedConfig);
  }
} catch (err) {
  // Silent fallback
}

// 2. Listen for configuration sent from main thread via postMessage
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    initFirebaseInSW(event.data.config);
  }
});

// 3. Fallback push event handler for raw push messages
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const notificationId =
      payload.data?.notificationId ||
      payload.data?.id ||
      `${payload.notification?.title || 'push'}_${Date.now()}`;

    if (shownNotifications.has(notificationId)) {
      return;
    }
    shownNotifications.add(notificationId);

    const title = payload.notification?.title || payload.data?.title || 'JalaDhar Notification';
    const options = {
      body: payload.notification?.body || payload.data?.body || '',
      icon: payload.notification?.icon || '/favicon.png',
      badge: '/favicon.png',
      data: {
        ...(payload.data || {}),
        link: payload.data?.link || '/',
        notificationId
      },
      tag: notificationId
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    // If payload is not JSON, FCM SDK handler handles it
  }
});

// 4. Handle Notification Click Navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const urlToOpen = data.link || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If window with app is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          if (urlToOpen && client.url && !client.url.endsWith(urlToOpen)) {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
