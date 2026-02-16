import { messaging } from "../firebase";
// import { getToken, onMessage } from "firebase/messaging";
import api from "./api"; // Assuming this is the configured axios instance

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Register service worker
 */
async function registerServiceWorker() {
  /*
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      console.log("✅ Service Worker registered:", registration);
      return registration;
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error);
      throw error;
    }
  } else {
    throw new Error("Service Workers are not supported");
  }
  */
  return null;
}

/**
 * Request notification permission
 */
async function requestNotificationPermission() {
  /*
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications.");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    console.log("✅ Notification permission granted");
    return true;
  } else {
    console.warn("❌ Notification permission denied");
    return false;
  }
  */
  return false;
}

/**
 * Get FCM token and register with backend
 * @param {string} userRole - 'user' or 'vendor'
 */
async function registerFCMToken(userRole = 'user') {
  /*
  try {
    // 1. Check if notifications are supported
    if (!("Notification" in window)) return;

    // 2. Request permission if not already granted
    if (Notification.permission !== "granted") {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }

    // 3. Register Service Worker
    const registration = await registerServiceWorker();

    // 4. Get FCM Token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.error("❌ No FCM token obtained");
      return;
    }

    // 5. Check if token already registered for this user in this session
    const storageKey = `fcm_token_registered_${userRole}`;
    const lastRegisteredToken = localStorage.getItem(storageKey);

    if (lastRegisteredToken === token) {
      console.log(`[FCM] Token already registered for ${userRole}`);
      return;
    }

    // 6. Register with backend
    // We use the common endpoint /api/fcm-tokens/save
    await api.post("/fcm-tokens/save", {
      token,
      platform: "web",
    });

    localStorage.setItem(storageKey, token);
    console.log(`✅ FCM token registered with backend for ${userRole}`);
  } catch (error) {
    console.error("❌ Error registering FCM token:", error);
  }
  */
  console.log("[FCM] Push notifications are disabled");
}

/**
 * Setup foreground notification handler
 * @param {Function} onMessageReceived - Custom callback for messages
 */
function setupForegroundHandler(onMessageReceived) {
  /*
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    console.log("📬 Foreground message received:", payload);

    // Only show native notification if the custom handler doesn't handle it
    // or if we want both
    if (onMessageReceived) {
      onMessageReceived(payload);
    }

    // Optionally show a native notification for foreground too
    if (Notification.permission === "granted") {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: payload.notification.icon || "/favicon.png",
        data: payload.data,
      });
    }
  });
  */
  return () => { };
}

/**
 * Remove FCM token from backend
 */
async function unregisterFCMToken(userRole = 'user') {
  /*
  try {
    const storageKey = `fcm_token_registered_${userRole}`;
    const token = localStorage.getItem(storageKey);

    if (token) {
      await api.delete("/fcm-tokens/remove", { data: { token } });
      localStorage.removeItem(storageKey);
      console.log(`[FCM] Token removed for ${userRole}`);
    }
  } catch (error) {
    console.error("❌ Error unregistering FCM token:", error);
  }
  */
}

export {
  registerFCMToken,
  unregisterFCMToken,
  setupForegroundHandler,
  requestNotificationPermission
};

