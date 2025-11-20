const Payment = require('../../models/Payment');
const Booking = require('../../models/Booking');
const { PAYMENT_STATUS } = require('../../utils/constants');

/**
 * Get all payments with filters
 */
const getAllPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (paymentType) {
      query.paymentType = paymentType;
    }

    if (search) {
      query.$or = [
        { razorpayOrderId: { $regex: search, $options: 'i' } },
        { razorpayPaymentId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('user', 'name email phone')
        .populate('vendor', 'name email phone')
        .populate('booking', 'bookingId status')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Payments retrieved successfully',
      data: {
        payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalPayments: total
        }
      }
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments',
      error: error.message
    });
  }
};

/**
 * Get payment statistics
 */
const getPaymentStatistics = async (req, res) => {
  try {
    const [
      totalPayments,
      successPayments,
      pendingPayments,
      failedPayments,
      totalRevenue,
      advancePayments,
      remainingPayments,
      settlements,
      pendingSettlements
    ] = await Promise.all([
      Payment.countDocuments(),
      Payment.countDocuments({ status: PAYMENT_STATUS.SUCCESS }),
      Payment.countDocuments({ status: PAYMENT_STATUS.PENDING }),
      Payment.countDocuments({ status: PAYMENT_STATUS.FAILED }),
      Payment.aggregate([
        { $match: { status: PAYMENT_STATUS.SUCCESS } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { 
          $match: { 
            paymentType: 'ADVANCE',
            status: PAYMENT_STATUS.SUCCESS 
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Payment.aggregate([
        { 
          $match: { 
            paymentType: 'REMAINING',
            status: PAYMENT_STATUS.SUCCESS 
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Payment.aggregate([
        { 
          $match: { 
            paymentType: 'SETTLEMENT',
            status: PAYMENT_STATUS.SUCCESS 
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Booking.countDocuments({ 'payment.vendorSettlement.status': 'PENDING' })
    ]);

    res.json({
      success: true,
      message: 'Payment statistics retrieved successfully',
      data: {
        statistics: {
          totalPayments,
          successPayments,
          pendingPayments,
          failedPayments,
          totalRevenue: totalRevenue[0]?.total || 0,
          advancePayments: {
            total: advancePayments[0]?.total || 0,
            count: advancePayments[0]?.count || 0
          },
          remainingPayments: {
            total: remainingPayments[0]?.total || 0,
            count: remainingPayments[0]?.count || 0
          },
          settlements: {
            total: settlements[0]?.total || 0,
            count: settlements[0]?.count || 0
          },
          pendingSettlements
        }
      }
    });
  } catch (error) {
    console.error('Get payment statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment statistics',
      error: error.message
    });
  }
};

/**
 * Get payment details
 */
const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('user', 'name email phone')
      .populate('vendor', 'name email phone bankDetails')
      .populate('booking', 'bookingId status scheduledDate address');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment details retrieved successfully',
      data: {
        payment
      }
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment details',
      error: error.message
    });
  }
};

module.exports = {
  getAllPayments,
  getPaymentStatistics,
  getPaymentDetails
};

