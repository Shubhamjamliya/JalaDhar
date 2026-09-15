const multer = require('multer');
const LandingContent = require('../../models/LandingContent');
const { uploadToCloudinary, deleteFromCloudinary } = require('../../services/cloudinaryService');
const { logAdminActivity } = require('../../services/auditLogger');

// ─── Multer config (memory storage for Cloudinary) ──────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

// Export multer middleware for use in routes
const uploadMiddleware = upload.single('image');

// ─── Seed defaults ───────────────────────────────────────────────────────────
const seedDefaultLandingContent = async () => {
  try {
    const existing = await LandingContent.findOne({ page: 'landing' });
    if (!existing) {
      const doc = new LandingContent({ page: 'landing' });
      await doc.save();
      console.log('[LandingContent] Default landing content seeded.');
    } else {
      console.log('[LandingContent] Landing content already exists — skipping seed.');
    }
  } catch (err) {
    console.error('[LandingContent] Seed error:', err.message);
  }
};

// ─── GET /api/landing (public) ───────────────────────────────────────────────
const getLandingContent = async (req, res) => {
  try {
    let content = await LandingContent.findOne({ page: 'landing' });
    if (!content) {
      content = new LandingContent({ page: 'landing' });
      await content.save();
    }

    res.set('Cache-Control', 'public, max-age=300'); // 5-min CDN / browser cache
    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('[getLandingContent] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load landing content',
      error: error.message
    });
  }
};

// ─── PATCH /api/admin/landing/:section (admin) ───────────────────────────────
const updateLandingSection = async (req, res) => {
  try {
    const { section } = req.params;
    const adminId = req.userId;
    const updateData = req.body;

    const allowedSections = [
      'hero', 'services', 'howItWorksCustomers', 'howItWorksExperts',
      'founder', 'stats', 'faqs', 'ecosystemApps', 'ctaBanner', 'footer'
    ];

    if (!allowedSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: `Invalid section. Allowed: ${allowedSections.join(', ')}`
      });
    }

    let content = await LandingContent.findOne({ page: 'landing' });
    if (!content) {
      content = new LandingContent({ page: 'landing' });
    }

    // Deep-set the section field
    content.set(section, updateData);
    content.updatedBy = adminId;
    content.markModified(section);
    await content.save();

    // Audit log (non-blocking)
    logAdminActivity({
      req,
      adminId,
      action: 'LANDING_CONTENT_UPDATED',
      module: 'SETTINGS',
      targetEntity: 'LandingContent',
      targetId: content._id.toString(),
      targetLabel: `Landing page section updated: ${section}`,
      notes: `Section "${section}" updated by admin`
    }).catch(err => console.error('[LandingContent] Audit log error:', err));

    res.json({
      success: true,
      message: `Section "${section}" updated successfully`,
      data: content[section]
    });
  } catch (error) {
    console.error('[updateLandingSection] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update landing section',
      error: error.message
    });
  }
};

// ─── POST /api/admin/landing/upload-image (admin) ───────────────────────────
const uploadSectionImage = async (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    try {
      const { section = 'landing', oldPublicId } = req.body;

      // Delete old Cloudinary image if provided
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId);
        } catch (delErr) {
          console.warn('[LandingContent] Could not delete old image:', delErr.message);
        }
      }

      const result = await uploadToCloudinary(req.file.buffer, `landing-content/${section}`, {
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }]
      });

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: result.secure_url,
          publicId: result.public_id
        }
      });
    } catch (uploadErr) {
      console.error('[uploadSectionImage] Error:', uploadErr);
      res.status(500).json({
        success: false,
        message: 'Image upload failed',
        error: uploadErr.message
      });
    }
  });
};

module.exports = {
  getLandingContent,
  updateLandingSection,
  uploadSectionImage,
  seedDefaultLandingContent
};
