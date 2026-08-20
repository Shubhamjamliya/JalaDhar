const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * Supports:
 * 1. Environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
 * 2. Service account JSON string (FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_CONFIG)
 * 3. Service account JSON file path (FIREBASE_SERVICE_ACCOUNT_PATH or default config path)
 */
function initFirebase() {
  if (admin.apps.length > 0) {
    firebaseInitialized = true;
    return true;
  }

  try {
    // Option 1: Explicit Service Account file path
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, '../config/firebase-service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseInitialized = true;
      console.log('[Firebase] Admin SDK initialized via service account file');
      return true;
    }

    // Option 2: JSON string in environment variable
    const jsonConfig = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_CONFIG;
    if (jsonConfig) {
      const serviceAccount = JSON.parse(jsonConfig);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseInitialized = true;
      console.log('[Firebase] Admin SDK initialized via JSON environment variable');
      return true;
    }

    // Option 3: Individual environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey && projectId !== 'your-firebase-project-id' && !projectId.includes('your-project-id')) {
      // Clean up escaped newlines in private key
      privateKey = privateKey.replace(/\\n/g, '\n');
      // If wrapped in extra quotes, remove them
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        })
      });
      firebaseInitialized = true;
      console.log('[Firebase] Admin SDK initialized successfully via environment credentials');
      return true;
    }

    console.warn('[Firebase] Firebase credentials not configured or placeholder values detected. Push notifications are currently disabled.');
    return false;
  } catch (error) {
    console.error('[Firebase] Error initializing Firebase Admin SDK:', error.message);
    return false;
  }
}

// Attempt initialization on startup
initFirebase();

/**
 * Check if Firebase Admin SDK is ready
 */
function isFirebaseReady() {
  if (firebaseInitialized && admin.apps.length > 0) {
    return true;
  }
  // Try initializing if not already done
  return initFirebase();
}

/**
 * Serialize all data object values to strings (FCM Requirement)
 * @param {Object} data - Raw data dictionary
 * @returns {Object} String-only key-value map
 */
function sanitizeDataPayload(data = {}) {
  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      if (typeof value === 'object') {
        sanitized[key] = JSON.stringify(value);
      } else {
        sanitized[key] = String(value);
      }
    }
  }
  return sanitized;
}

/**
 * Send push notification to multiple FCM tokens (Duplicate-Safe Multicast)
 * @param {string[]} tokens - Array of FCM device tokens
 * @param {Object} payload - Notification payload { title, body, data }
 * @returns {Promise<Object>} Result with successCount, failureCount, invalidTokens
 */
async function sendPushNotification(tokens, payload) {
  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  // Deduplicate tokens array
  const uniqueTokens = [...new Set(tokens.filter(t => typeof t === 'string' && t.trim().length > 0))];
  if (uniqueTokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  if (!isFirebaseReady()) {
    console.warn('[Firebase] Cannot send push notification: Firebase Admin is not initialized.');
    return { successCount: 0, failureCount: 0, invalidTokens: [], notConfigured: true };
  }

  try {
    const stringData = sanitizeDataPayload(payload.data || {});

    const message = {
      tokens: uniqueTokens,
      notification: {
        title: payload.title || 'JalaDhar Notification',
        body: payload.body || ''
      },
      data: stringData,
      webpush: {
        fcmOptions: {
          link: stringData.link || '/'
        },
        notification: {
          icon: '/favicon.png',
          badge: '/favicon.png',
          tag: stringData.notificationId || undefined
        }
      }
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    const invalidTokens = [];

    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const errorCode = resp.error.code;
        // Collect invalid or expired registration tokens for cleanup
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/mismatched-credential'
        ) {
          invalidTokens.push(uniqueTokens[idx]);
        }
        console.warn(`[Firebase] Multicast send error for token [${uniqueTokens[idx].slice(0, 10)}...]:`, resp.error.message);
      }
    });

    console.log(`[Firebase] Push multicast result - Success: ${response.successCount}, Failed: ${response.failureCount}, Invalid cleaned: ${invalidTokens.length}`);

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
      responses: response.responses
    };
  } catch (error) {
    console.error('[Firebase] Error sending multicast push notification:', error);
    return {
      successCount: 0,
      failureCount: uniqueTokens.length,
      invalidTokens: [],
      error: error.message
    };
  }
}

module.exports = {
  admin,
  sendPushNotification,
  isFirebaseReady,
  initFirebase
};
