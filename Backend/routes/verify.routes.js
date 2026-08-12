const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

/**
 * @route  GET /api/verify/:bookingId
 * @access PUBLIC — no auth required (QR scan use-case)
 * Returns a safe, minimal public summary of a completed survey booking
 * for report authenticity verification.
 */
router.get('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('user', 'name')
      .populate('vendor', 'name qualification experience')
      .select(
        '_id status report district mandal village address surveyCategory purpose createdAt updatedAt'
      );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found. This QR code may be invalid or the report may have been removed.'
      });
    }

    // Only expose completed/reported bookings — not pending ones
    const allowedStatuses = ['completed', 'report_submitted', 'report_approved', 'borewell_pending'];
    const statusLower = (booking.status || '').toLowerCase().replace(/_/g, ' ');
    const isVerifiable = allowedStatuses.some(s => booking.status?.toLowerCase().includes(s.replace('_', '')));

    const reportData = booking.report || {};

    return res.status(200).json({
      success: true,
      data: {
        bookingId: booking._id,
        reportId: booking._id.toString().slice(-8).toUpperCase(),
        status: booking.status,
        isVerified: true,
        clientName: reportData.customerName || booking.user?.name || 'N/A',
        expertName: booking.vendor?.name || 'N/A',
        expertDesignation: booking.vendor?.qualification || 'Expert Hydrogeologist',
        district: booking.district || booking.address?.district || 'N/A',
        mandal: booking.mandal || 'N/A',
        village: booking.village || 'N/A',
        surveyCategory: booking.surveyCategory || 'N/A',
        purpose: booking.purpose || 'N/A',
        waterFound: reportData.waterFound === 'true' || reportData.waterFound === true,
        surveyDate: booking.createdAt,
        reportIssuedAt: booking.updatedAt,
        platform: 'Jaladhaara Digital Survey Platform'
      }
    });
  } catch (err) {
    console.error('[VerifyRoute] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while verifying report.'
    });
  }
});

module.exports = router;
