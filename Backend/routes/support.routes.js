const express = require('express');
const router = express.Router();
const { handleSupportChat, getQuickActions } = require('../controllers/supportChatController');

// Public Support Chat Endpoints
router.post('/chat', handleSupportChat);
router.get('/quick-actions', getQuickActions);

module.exports = router;
