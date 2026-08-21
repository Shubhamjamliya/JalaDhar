const express = require('express');
const router = express.Router();
const {
  getAllRatings,
  getRatingStatistics,
  getRatingDetails,
  deleteRating
} = require('../../controllers/adminControllers/ratingController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requirePermission } = require('../../middleware/roleMiddleware');
const { ROLES } = require('../../utils/constants');

// Routes (Requires ratings permission or Support role)
const isRatingAdmin = requirePermission('ratings', ROLES.SUPPORT_ADMIN);

router.use(authenticate, isRatingAdmin);

router.get('/', getAllRatings);
router.get('/statistics', getRatingStatistics);
router.get('/:ratingId', getRatingDetails);
router.delete('/:ratingId', deleteRating);

module.exports = router;

