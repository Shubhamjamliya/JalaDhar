const { processSupportChat } = require('../services/ollamaSupportService');
const { verifyAccessToken } = require('../utils/tokenService');
const Booking = require('../models/Booking');
// Ensure referenced models are registered for Mongoose population
require('../models/User');
require('../models/Vendor');
require('../models/Service');

/**
 * Handle incoming support chat query
 * POST /api/support/chat
 */
const handleSupportChat = async (req, res) => {
  try {
    const { message, language = 'en', conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a non-empty string'
      });
    }

    // Attempt to identify logged-in user if token is provided
    let userId = null;
    let userName = req.body.userName || null;
    let liveBookings = [];
    let livePayments = [];
    let userWallet = { balance: 0, totalCredited: 0 };
    let recentWalletTransactions = [];
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        if (decoded && decoded.userId) {
          userId = decoded.userId;

          // Fetch user profile for name personalization and wallet balance
          const User = require('../models/User');
          const userDoc = await User.findById(userId).select('name phone email wallet').lean();
          if (userDoc) {
            if (!userName && userDoc.name) {
              userName = userDoc.name;
            }
            if (userDoc.wallet) {
              userWallet = {
                balance: Number(userDoc.wallet.walletBalance || 0),
                totalCredited: Number(userDoc.wallet.totalCredited || 0)
              };
            }
          }

          // Fetch user's recent actual bookings from database
          const docs = await Booking.find({ user: userId })
            .populate('vendor', 'name phone rating designation')
            .populate('service', 'name machineType')
            .sort({ createdAt: -1 })
            .limit(5);

          liveBookings = docs.map((b) => {
            const rawStatus = String(b.userStatus || b.status || '').toUpperCase();
            const isOngoing = ['PENDING', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'SCHEDULED', 'CONFIRMED', 'STARTED'].includes(rawStatus);
            const isCompleted = rawStatus === 'COMPLETED';

            return {
              id: b._id.toString(),
              displayId: b.bookingId || `JLD-${b._id.toString().slice(-5).toUpperCase()}`,
              category: b.surveyCategory || b.service?.name || b.purpose || 'Groundwater Survey',
              status: b.userStatus || b.status,
              isOngoing,
              isCompleted,
              scheduledDate: b.scheduledDate,
              scheduledTime: b.scheduledTime || 'TBD',
              expertName: b.vendor?.name || 'Verified Hydrogeologist',
              expertPhone: b.vendor?.phone || null,
              expertRating: typeof b.vendor?.rating === 'object' && b.vendor?.rating?.averageRating !== undefined
                ? b.vendor.rating.averageRating
                : (typeof b.vendor?.rating === 'number' ? b.vendor.rating : 4.9),
              location: b.address
                ? `${b.address.city || ''}, ${b.address.state || ''}`.trim().replace(/^,\s*/, '')
                : (b.district ? `${b.district}, ${b.state}` : 'Survey Location'),
              advanceAmount: b.payment?.baseServiceFee ? Math.round(b.payment.baseServiceFee * 0.25) : 1500,
              totalAmount: b.payment?.totalAmount || 6000
            };
          });

          // Fetch user's recent payments (sent)
          const Payment = require('../models/Payment');
          const paymentDocs = await Payment.find({ user: userId })
            .populate('booking', 'bookingId surveyCategory')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

          livePayments = paymentDocs.map((p) => ({
            id: p._id.toString(),
            type: p.paymentType,
            amount: p.amount,
            status: p.status,
            date: p.paidAt || p.createdAt,
            bookingId: p.booking?.bookingId || 'Survey',
            method: p.method,
            razorpayPaymentId: p.razorpayPaymentId
          }));

          // Fetch recent wallet transactions (refunds received / withdrawals)
          const UserWalletTransaction = require('../models/UserWalletTransaction');
          const walletDocs = await UserWalletTransaction.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

          recentWalletTransactions = walletDocs.map((w) => ({
            type: w.type,
            amount: w.amount,
            status: w.status,
            date: w.createdAt,
            description: w.description
          }));
        }
      } catch (authErr) {
        // Token expired or invalid - proceed gracefully as guest
        console.warn('[SupportChatController] Optional auth decode skipped:', authErr.message);
      }
    }

    const result = await processSupportChat({
      message: message.trim(),
      language: typeof language === 'string' ? language : 'en',
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
      liveBookings,
      livePayments,
      userWallet,
      recentWalletTransactions,
      userId,
      userName
    });

    return res.status(200).json({
      success: true,
      data: {
        ...result,
        userBookingsCount: liveBookings.length,
        userName
      }
    });
  } catch (error) {
    console.error('❌ [SupportChatController] Error processing chat query:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process support message',
      error: error.message
    });
  }
};

/**
 * Get initial quick actions and chatbot metadata
 * GET /api/support/quick-actions
 */
const getQuickActions = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        welcomeMessage: "🌊 Welcome to Jaladhaara Groundwater Survey Services at your fingertips.\n\nHow can we help you today?",
        quickButtons: [
          { id: 'booking', label: '📋 My Booking', trigger: 'My Booking' },
          { id: 'payment', label: '💳 Payment', trigger: 'Payment' },
          { id: 'report', label: '📄 My Report', trigger: 'My Report' },
          { id: 'track', label: '📍 Track Expert', trigger: 'Track Expert' },
          { id: 'support', label: '📞 Support Helpline', trigger: 'Support' }
        ],
        helpline: {
          phone: "+91 800-000-0000",
          email: "info@jaladhaaraapp.com",
          disputeUrl: "/user/disputes/create"
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve quick actions'
    });
  }
};

module.exports = {
  handleSupportChat,
  getQuickActions
};
