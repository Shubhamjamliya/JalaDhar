const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const FCMToken = require('../models/FCMToken');
const { sendPushNotification, isFirebaseReady } = require('../services/firebaseAdmin');

/**
 * POST /api/fcm-tokens/save
 * Save an FCM token for the authenticated user
 */
router.post('/save', authenticate, async (req, res) => {
  try {
    const { token, platform = 'web' } = req.body;

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    const userId = req.userId;
    // Map the role to the correct model name
    const roleToModel = {
      'USER': 'User',
      'VENDOR': 'Vendor'
    };
    const userModel = roleToModel[req.userRole];

    if (!userModel) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported user role for push notifications'
      });
    }

    await FCMToken.saveToken(userId, userModel, token.trim(), platform);

    console.log(`[FCMToken] Token saved for ${userModel}:${userId} (${platform})`);

    res.json({
      success: true,
      message: 'FCM token saved successfully'
    });
  } catch (error) {
    console.error('[FCMToken] Error saving token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save FCM token'
    });
  }
});

/**
 * DELETE /api/fcm-tokens/remove
 * Remove an FCM token for the authenticated user
 */
router.delete('/remove', authenticate, async (req, res) => {
  try {
    const { token, platform = 'web' } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    const userId = req.userId;
    const roleToModel = {
      'USER': 'User',
      'VENDOR': 'Vendor'
    };
    const userModel = roleToModel[req.userRole];

    if (!userModel) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported user role'
      });
    }

    await FCMToken.removeToken(userId, userModel, token);

    // Also clear from localStorage key tracking on client side
    console.log(`[FCMToken] Token removed for ${userModel}:${userId}`);

    res.json({
      success: true,
      message: 'FCM token removed successfully'
    });
  } catch (error) {
    console.error('[FCMToken] Error removing token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove FCM token'
    });
  }
});

/**
 * POST /api/fcm-tokens/test
 * Send a test push notification to the authenticated user
 */
router.post('/test', authenticate, async (req, res) => {
  try {
    if (!isFirebaseReady()) {
      return res.status(503).json({
        success: false,
        message: 'Firebase is not configured'
      });
    }

    const userId = req.userId;
    const roleToModel = {
      'USER': 'User',
      'VENDOR': 'Vendor'
    };
    const userModel = roleToModel[req.userRole];

    if (!userModel) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported user role'
      });
    }

    const tokens = await FCMToken.getTokensForUser(userId, userModel);

    if (tokens.length === 0) {
      return res.json({
        success: false,
        message: 'No FCM tokens found for this user. Please allow notifications first.'
      });
    }

    const result = await sendPushNotification(tokens, {
      title: '🔔 Test Notification',
      body: 'Push notifications are working! This is a test from JalaDhaar.',
      data: {
        type: 'test',
        link: '/'
      }
    });

    // Cleanup invalid tokens
    if (result.invalidTokens.length > 0) {
      await FCMToken.removeInvalidTokens(result.invalidTokens);
    }

    res.json({
      success: true,
      message: `Test notification sent. Success: ${result.successCount}, Failed: ${result.failureCount}`,
      data: {
        tokensFound: tokens.length,
        successCount: result.successCount,
        failureCount: result.failureCount
      }
    });
  } catch (error) {
    console.error('[FCMToken] Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    });
  }
});

module.exports = router;
