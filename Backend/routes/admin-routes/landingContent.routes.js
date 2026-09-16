const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { requirePermission } = require('../../middleware/roleMiddleware');
const {
  getLandingContent,
  updateLandingSection,
  uploadSectionImage,
  uploadSectionVideo
} = require('../../controllers/adminControllers/landingContentController');

// ── Public route (no auth) ──────────────────────────────────────────────────
// GET /api/landing  — used by the public landing page
router.get('/', getLandingContent);

module.exports = router;

// ── Admin routes (exported separately for mounting at /api/admin/landing) ───
const adminRouter = express.Router();
adminRouter.use(authenticate);
adminRouter.use(requirePermission('settings'));

adminRouter.patch('/:section', updateLandingSection);
adminRouter.post('/upload-image', uploadSectionImage);
adminRouter.post('/upload-video', uploadSectionVideo);

module.exports.adminRouter = adminRouter;
