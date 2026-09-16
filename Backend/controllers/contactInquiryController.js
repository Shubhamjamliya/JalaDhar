const ContactInquiry = require('../models/ContactInquiry');
const Admin = require('../models/Admin');
const { sendNotification } = require('../services/notificationService');
const { sendContactInquiryAdminEmail } = require('../services/emailService');

/**
 * Public: Submit a new contact inquiry from the landing page
 * POST /api/contact
 */
const submitInquiry = async (req, res) => {
  try {
    const { name, mobile, email, userType, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }
    if (!mobile || !mobile.trim()) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number' });
    }

    const inquiry = await ContactInquiry.create({
      name: name.trim(),
      mobile: cleanMobile.slice(-10),
      email: email.trim().toLowerCase(),
      userType: userType || 'Customer / User',
      message: message.trim(),
      ipAddress: req.ip || req.connection?.remoteAddress || ''
    });

    // 1. Dispatch Email Notification to Admin (non-blocking)
    sendContactInquiryAdminEmail({ inquiry })
      .then(res => console.log('📧 Contact inquiry alert email dispatched'))
      .catch(err => console.error('Failed to send admin inquiry email:', err.message));

    // 2. Dispatch In-App Notification to all active Super Admins / Support Admins
    try {
      const activeAdmins = await Admin.find({ isActive: { $ne: false } }).select('_id name email');
      for (const admin of activeAdmins) {
        await sendNotification({
          recipient: admin._id,
          recipientModel: 'Admin',
          type: 'NEW_CONTACT_INQUIRY',
          title: `New Inquiry: ${inquiry.name}`,
          message: `${inquiry.name} (${inquiry.userType}) sent a message: "${inquiry.message.slice(0, 80)}${inquiry.message.length > 80 ? '...' : ''}"`,
          relatedEntity: {
            entityType: 'ContactInquiry',
            entityId: inquiry._id
          },
          actionUrl: '/admin/inquiries',
          metadata: {
            inquiryId: inquiry._id.toString(),
            name: inquiry.name,
            mobile: inquiry.mobile,
            email: inquiry.email,
            userType: inquiry.userType,
            link: '/admin/inquiries'
          }
        }).catch(notifErr => console.error('Admin notification dispatch error:', notifErr.message));
      }
    } catch (notifErr) {
      console.warn('Could not dispatch in-app notifications to admins:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Your message has been received. Our team will get back to you shortly.',
      data: {
        id: inquiry._id,
        createdAt: inquiry.createdAt
      }
    });
  } catch (error) {
    console.error('Contact inquiry submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit inquiry. Please try again or reach us directly via phone or WhatsApp.',
      error: error.message
    });
  }
};

/**
 * Admin: Get all contact inquiries with pagination, status filter, and search
 * GET /api/admin/inquiries
 */
const getInquiries = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;
    const { status, search, userType } = req.query;

    const query = {};

    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }

    if (userType && userType !== 'ALL') {
      query.userType = userType;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { mobile: { $regex: s, $options: 'i' } },
        { message: { $regex: s, $options: 'i' } }
      ];
    }

    const [inquiries, total] = await Promise.all([
      ContactInquiry.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('respondedBy', 'name email')
        .lean(),
      ContactInquiry.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: inquiries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact inquiries',
      error: error.message
    });
  }
};

/**
 * Admin: Get stats for inquiries (Total, New, Contacted, Resolved)
 * GET /api/admin/inquiries/stats
 */
const getInquiryStats = async (req, res) => {
  try {
    const [total, newCount, contactedCount, resolvedCount] = await Promise.all([
      ContactInquiry.countDocuments(),
      ContactInquiry.countDocuments({ status: 'NEW' }),
      ContactInquiry.countDocuments({ status: 'CONTACTED' }),
      ContactInquiry.countDocuments({ status: 'RESOLVED' })
    ]);

    res.json({
      success: true,
      data: {
        total,
        new: newCount,
        contacted: contactedCount,
        resolved: resolvedCount
      }
    });
  } catch (error) {
    console.error('Get inquiry stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inquiry stats',
      error: error.message
    });
  }
};

/**
 * Admin: Update inquiry status and notes
 * PATCH /api/admin/inquiries/:id
 */
const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const inquiry = await ContactInquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    if (status) {
      inquiry.status = status;
      if (status === 'CONTACTED' || status === 'RESOLVED') {
        inquiry.respondedAt = new Date();
        inquiry.respondedBy = req.admin?._id || null;
      }
    }

    if (adminNotes !== undefined) {
      inquiry.adminNotes = adminNotes;
    }

    await inquiry.save();

    res.json({
      success: true,
      message: 'Inquiry updated successfully',
      data: inquiry
    });
  } catch (error) {
    console.error('Update inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inquiry',
      error: error.message
    });
  }
};

/**
 * Admin: Delete inquiry
 * DELETE /api/admin/inquiries/:id
 */
const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const inquiry = await ContactInquiry.findByIdAndDelete(id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    res.json({
      success: true,
      message: 'Inquiry deleted successfully'
    });
  } catch (error) {
    console.error('Delete inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inquiry',
      error: error.message
    });
  }
};

module.exports = {
  submitInquiry,
  getInquiries,
  getInquiryStats,
  updateInquiryStatus,
  deleteInquiry
};
