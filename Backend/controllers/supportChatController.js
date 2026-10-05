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

    // Attempt to identify logged-in user or expert/vendor if token is provided
    let userRole = (req.body.userRole || 'USER').toUpperCase();
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
          if (decoded.role) {
            userRole = String(decoded.role).toUpperCase();
          }

          if (userRole === 'VENDOR') {
            // ── VENDOR / GROUNDWATER EXPERT CONTEXT ─────────────────────────────
            const Vendor = require('../models/Vendor');
            const vendorDoc = await Vendor.findById(userId).select('name phone email designation rating wallet').lean();
            if (vendorDoc) {
              if (!userName && vendorDoc.name) {
                userName = vendorDoc.name;
              }
            }

            // Fetch vendor wallet balance
            try {
              const { getVendorWalletBalance } = require('../services/walletService');
              const walletInfo = await getVendorWalletBalance(userId);
              if (walletInfo) {
                userWallet = {
                  balance: Number(walletInfo.walletBalance || 0),
                  totalCredited: Number(walletInfo.totalCredited || 0),
                  thisMonthEarnings: Number(walletInfo.thisMonthEarnings || 0)
                };
              }
            } catch (wErr) {
              console.warn('[SupportChatController] Vendor wallet fetch skipped:', wErr.message);
            }

            // Fetch recent vendor wallet transactions
            try {
              const WalletTransaction = require('../models/WalletTransaction');
              const walletDocs = await WalletTransaction.find({ vendor: userId })
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
            } catch (wtErr) {
              console.warn('[SupportChatController] Vendor wallet transactions fetch skipped:', wtErr.message);
            }

            // Fetch vendor's assigned bookings
            const docs = await Booking.find({ vendor: userId })
              .populate('user', 'name phone')
              .populate('service', 'name machineType price')
              .sort({ createdAt: -1 })
              .limit(5);

            liveBookings = docs.map((b) => {
              const rawStatus = String(b.status || '').toUpperCase();
              const isOngoing = ['PENDING', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'SCHEDULED', 'CONFIRMED', 'STARTED', 'EN_ROUTE', 'VISITED'].includes(rawStatus);
              const isCompleted = rawStatus === 'COMPLETED';

              return {
                id: b._id.toString(),
                displayId: b.bookingId || `JLD-${b._id.toString().slice(-5).toUpperCase()}`,
                category: b.surveyCategory || b.service?.name || b.purpose || 'Groundwater Survey',
                status: b.status,
                isOngoing,
                isCompleted,
                scheduledDate: b.scheduledDate,
                scheduledTime: b.scheduledTime || 'TBD',
                customerName: b.user?.name || 'Valued Customer',
                customerPhone: b.user?.phone || null,
                location: [
                  b.village || b.address?.village || b.address?.street || b.address?.city,
                  b.mandal || b.address?.mandal,
                  b.district || b.address?.district,
                  b.state || b.address?.state
                ].map(p => p && String(p).trim()).filter(Boolean).join(', ') || (b.district ? `${b.district}, ${b.state}` : 'Survey Location'),
                totalAmount: b.payment?.totalAmount || 6000,
                payoutAmount: b.payment?.vendorAmount || b.pricing?.vendorShare || 0
              };
            });
          } else {
            // ── CUSTOMER / USER CONTEXT ──────────────────────────────────────────
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
                location: [
                  b.village || b.address?.village || b.address?.city,
                  b.mandal || b.address?.mandal,
                  b.district || b.address?.district,
                  b.state || b.address?.state
                ].map(p => p && String(p).trim()).filter(Boolean).join(', ') || (b.district ? `${b.district}, ${b.state}` : 'Survey Location'),
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
      userName,
      userRole
    });

    return res.status(200).json({
      success: true,
      data: {
        ...result,
        userBookingsCount: liveBookings.length,
        bookingsCount: liveBookings.length,
        userName,
        userRole
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
    const isVendor = String(req.query.role || '').toUpperCase() === 'VENDOR';

    if (isVendor) {
      return res.status(200).json({
        success: true,
        data: {
          welcomeMessage: "🌊 Welcome to Jaladhaara 24/7 Expert Partner Support.\n\nHow can we assist your field operations today?",
          quickButtons: [
            { id: 'booking', label: '📋 Assigned Bookings', trigger: 'My Bookings' },
            { id: 'wallet', label: '💰 Wallet & Payouts', trigger: 'Wallet' },
            { id: 'report', label: '📄 Upload Report', trigger: 'Upload Report' },
            { id: 'dispute', label: '⚖️ Partner Resolution', trigger: 'Disputes' },
            { id: 'agreement', label: '📜 Expert Agreement', trigger: 'Agreement' }
          ],
          helpline: {
            phone: "+91 800-000-0000",
            email: "expert-support@jaladhaaraapp.com",
            disputeUrl: "/vendor/disputes"
          }
        }
      });
    }

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
