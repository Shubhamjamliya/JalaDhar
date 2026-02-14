/*
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK using environment variables
let firebaseInitialized = false;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    firebaseInitialized = true;
    console.log('[Firebase] Admin SDK initialized successfully');
  } else {
    console.warn('[Firebase] Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY. Push notifications disabled.');
  }
} catch (error) {
  console.error('[Firebase] Error initializing Admin SDK:', error.message);
}
*/

/**
 * Send push notification to multiple FCM tokens (DISABLED)
 */
async function sendPushNotification(tokens, payload) {
  // console.warn('[Firebase] Push notifications are currently disabled');
  return { successCount: 0, failureCount: 0, invalidTokens: [] };
}

/**
 * Check if Firebase is initialized (ALWAYS FALSE)
 */
function isFirebaseReady() {
  return false;
}

module.exports = { sendPushNotification, isFirebaseReady };
