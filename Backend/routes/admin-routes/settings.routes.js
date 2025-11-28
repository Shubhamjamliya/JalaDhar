const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  updateMultipleSettings
} = require('../../controllers/adminControllers/settingsController');

router.use(authenticate);
router.use(isAdmin);

router.get('/', getAllSettings);
router.get('/:key', getSettingByKey);
router.put('/:key', updateSetting);
router.put('/', updateMultipleSettings);

module.exports = router;

