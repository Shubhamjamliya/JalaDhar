const express = require('express');
const router = express.Router();
const {
  getAllRatings,
  getRatingStatistics,
  getRatingDetails,
  deleteRating
} = require('../../controllers/adminControllers/ratingController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');

// Routes
router.get('/', authenticate, isAdmin, getAllRatings);
router.get('/statistics', authenticate, isAdmin, getRatingStatistics);
router.get('/:ratingId', authenticate, isAdmin, getRatingDetails);
router.delete('/:ratingId', authenticate, isAdmin, deleteRating);

module.exports = router;

