import { getFirebaseMessaging, firebaseConfig, isFirebaseConfigured } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";
import api from "./api";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Deduplication tracker for foreground messages
const shownForegroundNotifications = new Set();

setInterval(() => {
  if (shownForegroundNotifications.size > 200) {
    shownForegroundNotifications.clear();
  }
}, 30 * 60 * 1000);

/**
 * Register Service Worker for Firebase Cloud Messaging
 */
async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("[FCM] Service Workers are not supported in this browser.");
    return null;
  }

  try {
    const encodedConfig = encodeURIComponent(JSON.stringify(firebaseConfig));
    const swUrl = `/firebase-messaging-sw.js?firebaseConfig=${encodedConfig}`;

    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/'
    });

    // Send config to active service worker as well
    if (registration.active) {
      registration.active.postMessage({
        type: 'FIREBASE_CONFIG',
        config: firebaseConfig
      });
    }

    console.log("[FCM] Service Worker registered successfully:", registration.scope);
    return registration;
  } catch (error) {
    console.error("[FCM] Service Worker registration failed:", error);
    return null;
  }
}

/**
 * Request notification permission from the user
 */
async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("[FCM] Desktop notifications are not supported in this browser.");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    console.warn("[FCM] Notification permission was previously denied by user.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    const granted = permission === "granted";
    console.log(`[FCM] Notification permission request result: ${permission}`);
    return granted;
  } catch (error) {
    console.error("[FCM] Error requesting notification permission:", error);
    return false;
  }
}

/**
 * Get FCM device token and register with the backend
 * @param {string} userRole - 'user', 'vendor', 'admin'
 */
async function registerFCMToken(userRole = 'user') {
  if (!isFirebaseConfigured) {
    console.log("[FCM] Firebase is not configured in frontend environment. Push registration skipped.");
    return null;
  }

  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    // 1. Request permission if not already granted
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
      return null;
    }

    // 2. Register Service Worker
    const registration = await registerServiceWorker();
    if (!registration) {
      return null;
    }

    // 3. Get Firebase Messaging instance
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return null;
    }

    // 4. Retrieve FCM Token
    const tokenOptions = {
      serviceWorkerRegistration: registration
    };

    if (VAPID_KEY && VAPID_KEY !== 'your-web-vapid-key') {
      tokenOptions.vapidKey = VAPID_KEY;
    }

    const token = await getToken(messaging, tokenOptions);

    if (!token) {
      console.warn("[FCM] No FCM token returned from Firebase.");
      return null;
    }

    // 5. Avoid duplicate API calls if token is already registered in current session
    const storageKey = `fcm_token_registered_${userRole.toLowerCase()}`;
    const lastRegisteredToken = localStorage.getItem(storageKey);

    if (lastRegisteredToken === token) {
      console.log(`[FCM] Token already registered with backend for ${userRole}`);
      return token;
    }

    // 6. Save token to backend
    await api.post("/fcm-tokens/save", {
      token,
      platform: "web"
    });

    localStorage.setItem(storageKey, token);
    console.log(`[FCM] ✅ Token successfully registered with backend for ${userRole}`);
    return token;
  } catch (error) {
    console.error("[FCM] Error registering FCM token:", error);
    return null;
  }
}

/**
 * Setup foreground notification handler with deduplication (SOP v3.0)
 * @param {Function} onMessageReceived - Custom callback invoked when a push message is received in foreground
 * @returns {Promise<Function>} Unsubscribe function
 */
async function setupForegroundHandler(onMessageReceived) {
  if (!isFirebaseConfigured) {
    return () => {};
  }

  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return () => {};

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("[FCM] 📬 Foreground message received:", payload);

      const notificationId =
        payload.data?.notificationId ||
        payload.data?.id ||
        `${payload.notification?.title || 'notif'}_${Date.now()}`;

      // Layer 3 Deduplication: Prevent duplicate display of the same notification
      if (shownForegroundNotifications.has(notificationId)) {
        console.log(`[FCM] Duplicate foreground notification suppressed: ${notificationId}`);
        return;
      }
      shownForegroundNotifications.add(notificationId);

      // Invoke custom callback (e.g. update state or in-app toast)
      if (typeof onMessageReceived === 'function') {
        onMessageReceived(payload);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error("[FCM] Error setting up foreground listener:", error);
    return () => {};
  }
}

/**
 * Remove FCM token from backend upon logout
 * @param {string} userRole - 'user', 'vendor', 'admin'
 */
async function unregisterFCMToken(userRole = 'user') {
  try {
    const storageKey = `fcm_token_registered_${userRole.toLowerCase()}`;
    const token = localStorage.getItem(storageKey);

    if (token) {
      await api.delete("/fcm-tokens/remove", { data: { token } });
      localStorage.removeItem(storageKey);
      console.log(`[FCM] Token unregistered from backend for ${userRole}`);
    }
  } catch (error) {
    console.error("[FCM] Error unregistering token:", error);
  }
}

export {
  registerFCMToken,
  unregisterFCMToken,
  setupForegroundHandler,
  requestNotificationPermission,
  registerServiceWorker
};
