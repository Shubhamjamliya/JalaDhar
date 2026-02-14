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

/**
 * Send push notification to multiple FCM tokens
 * @param {string[]} tokens - Array of FCM tokens
 * @param {Object} payload - { title, body, data, icon }
 * @returns {Object} - { successCount, failureCount, invalidTokens }
 */
async function sendPushNotification(tokens, payload) {
  if (!firebaseInitialized) {
    console.warn('[Firebase] Not initialized - skipping push notification');
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  if (!tokens || tokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  // Remove duplicates and empty tokens
  const uniqueTokens = [...new Set(tokens.filter(t => t && t.trim()))];

  if (uniqueTokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  try {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/favicon.png',
          badge: '/favicon.png',
          requireInteraction: false,
        },
        fcmOptions: {
          link: payload.data?.link || '/',
        },
      },
      data: payload.data || {},
      tokens: uniqueTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(`[Firebase] Push sent: ${response.successCount} success, ${response.failureCount} failed`);

    // Collect invalid tokens for cleanup
    const invalidTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          invalidTokens.push(uniqueTokens[idx]);
        }
        // Log other errors
        if (errorCode && !errorCode.includes('registration-token')) {
          console.error(`[Firebase] Token error [${idx}]:`, resp.error?.message);
        }
      }
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
    };
  } catch (error) {
    console.error('[Firebase] Error sending push notification:', error.message);
    return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
  }
}

/**
 * Check if Firebase is initialized
 */
function isFirebaseReady() {
  return firebaseInitialized;
}

module.exports = { sendPushNotification, isFirebaseReady };
