import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'AIzaSy...' &&
  !firebaseConfig.apiKey.includes('your-')
);

let app = null;
let messagingInstance = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  } catch (error) {
    console.error("[Firebase] Initialization error:", error);
  }
}

/**
 * Get Firebase Messaging instance safely with browser support check
 * @returns {Promise<import('firebase/messaging').Messaging|null>}
 */
export const getFirebaseMessaging = async () => {
  if (!isFirebaseConfigured || !app) {
    return null;
  }

  if (messagingInstance) {
    return messagingInstance;
  }

  try {
    const supported = await isSupported();
    if (supported) {
      messagingInstance = getMessaging(app);
      return messagingInstance;
    } else {
      console.warn("[Firebase] Firebase Cloud Messaging is not supported in this browser environment.");
      return null;
    }
  } catch (error) {
    console.error("[Firebase] Error checking messaging support:", error);
    return null;
  }
};

export { app, firebaseConfig, isFirebaseConfigured };
export default app;
