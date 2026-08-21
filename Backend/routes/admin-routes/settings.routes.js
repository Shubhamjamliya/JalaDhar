const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { requirePermission } = require('../../middleware/roleMiddleware');
const {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  updateMultipleSettings
} = require('../../controllers/adminControllers/settingsController');

router.use(authenticate);
router.use(requirePermission('settings'));

router.get('/', getAllSettings);
router.get('/:key', getSettingByKey);
router.put('/:key', updateSetting);
router.put('/', updateMultipleSettings);

module.exports = router;

