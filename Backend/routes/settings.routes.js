const express = require('express');
const router = express.Router();
const { getPublicSettings, updateSetting } = require('../controllers/settingsController');
const { authenticate } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

router.get('/', getPublicSettings);
router.put('/', authenticate, isAdmin, updateSetting);

module.exports = router;
