const Payment = require('../../models/Payment');
const Booking = require('../../models/Booking');
const Vendor = require('../../models/Vendor');
const WalletTransaction = require('../../models/WalletTransaction');
const UserWalletTransaction = require('../../models/UserWalletTransaction');
const VendorWithdrawalRequest = require('../../models/VendorWithdrawalRequest');
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
 * Get comprehensive admin payment overview
 */
const getAdminPaymentOverview = async (req, res) => {
  try {
    // 1. Total money from users (all successful payments - ADVANCE + REMAINING)
    const [totalFromUsers] = await Payment.aggregate([
      {
        $match: {
          paymentType: { $in: ['ADVANCE', 'REMAINING'] },
          status: PAYMENT_STATUS.SUCCESS
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // 2. Pending money from users (pending payments)
    const [pendingFromUsers] = await Payment.aggregate([
      {
        $match: {
          paymentType: { $in: ['ADVANCE', 'REMAINING'] },
          status: PAYMENT_STATUS.PENDING
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // 3. Pending to vendors (pending vendor settlements + pending withdrawal requests)
    const [pendingVendorSettlements] = await Booking.aggregate([
      {
        $match: {
          'payment.vendorSettlement.status': 'PENDING'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$payment.vendorSettlement.amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get pending vendor withdrawal requests
    const vendors = await Vendor.find({
      'paymentCollection.withdrawalRequests.status': 'PENDING'
    }).select('paymentCollection.withdrawalRequests');

    let pendingWithdrawals = 0;
    let pendingWithdrawalCount = 0;
    vendors.forEach(vendor => {
      if (vendor.paymentCollection?.withdrawalRequests) {
        vendor.paymentCollection.withdrawalRequests.forEach(request => {
          if (request.status === 'PENDING') {
            pendingWithdrawals += request.amount || 0;
            pendingWithdrawalCount++;
          }
        });
      }
    });

    const totalPendingToVendors = (pendingVendorSettlements?.total || 0) + pendingWithdrawals;

    // 4. Released money through withdrawals to vendors (approved/processed vendor withdrawals)
    const [releasedToVendors] = await WalletTransaction.aggregate([
      {
        $match: {
          type: 'WITHDRAWAL_PROCESSED',
          status: 'SUCCESS'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Also check vendor withdrawal requests with status APPROVED/PROCESSED
    const processedVendors = await Vendor.find({
      'paymentCollection.withdrawalRequests.status': { $in: ['APPROVED', 'PROCESSED'] }
    }).select('paymentCollection.withdrawalRequests');

    let processedWithdrawals = 0;
    processedVendors.forEach(vendor => {
      if (vendor.paymentCollection?.withdrawalRequests) {
        vendor.paymentCollection.withdrawalRequests.forEach(request => {
          if (request.status === 'APPROVED' || request.status === 'PROCESSED') {
            processedWithdrawals += request.amount || 0;
          }
        });
      }
    });

    const totalReleasedToVendors = (releasedToVendors?.total || 0) + processedWithdrawals;

    // 5. Total paid to vendors (settlements + travel charges + site visits + report uploads + final settlement rewards)
    const [totalPaidToVendors] = await WalletTransaction.aggregate([
      {
        $match: {
          type: { $in: ['TRAVEL_CHARGES', 'SITE_VISIT', 'REPORT_UPLOAD', 'FINAL_SETTLEMENT_REWARD'] },
          status: 'SUCCESS'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Add vendor settlements from Payment model
    const [vendorSettlements] = await Payment.aggregate([
      {
        $match: {
          paymentType: 'SETTLEMENT',
          status: PAYMENT_STATUS.SUCCESS
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalPaidToVendorsAmount = (totalPaidToVendors?.total || 0) + (vendorSettlements?.total || 0);

    // 6. Paid to users against failure (user final settlement remittances for failed borewells)
    const [paidToUsersForFailure] = await UserWalletTransaction.aggregate([
      {
        $match: {
          type: 'REFUND',
          status: 'SUCCESS'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Also check bookings with final settlement remittance for failed borewells
    const [userRemittances] = await Booking.aggregate([
      {
        $match: {
          'finalSettlement.status': 'PROCESSED',
          'finalSettlement.remittanceAmount': { $gt: 0 },
          'borewellResult.status': 'FAILED'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$finalSettlement.remittanceAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalPaidToUsersForFailure = (paidToUsersForFailure?.total || 0) + (userRemittances?.total || 0);

    // 7. Total revenue of admin (total from users - total paid to vendors - refunds - user remittances)
    const totalAdminRevenue = (totalFromUsers?.total || 0) - totalPaidToVendorsAmount - totalPaidToUsersForFailure;

    // Additional stats
    const [advancePayments] = await Payment.aggregate([
      {
        $match: {
          paymentType: 'ADVANCE',
          status: PAYMENT_STATUS.SUCCESS
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const [remainingPayments] = await Payment.aggregate([
      {
        $match: {
          paymentType: 'REMAINING',
          status: PAYMENT_STATUS.SUCCESS
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      message: 'Admin payment overview retrieved successfully',
      data: {
        overview: {
          // Total money from users
          totalFromUsers: {
            amount: totalFromUsers?.total || 0,
            count: totalFromUsers?.count || 0,
            breakdown: {
              advance: {
                amount: advancePayments?.total || 0,
                count: advancePayments?.count || 0
              },
              remaining: {
                amount: remainingPayments?.total || 0,
                count: remainingPayments?.count || 0
              }
            }
          },
          // Pending money from users
          pendingFromUsers: {
            amount: pendingFromUsers?.total || 0,
            count: pendingFromUsers?.count || 0
          },
          // Pending to vendors
          pendingToVendors: {
            amount: totalPendingToVendors,
            breakdown: {
              settlements: {
                amount: pendingVendorSettlements?.total || 0,
                count: pendingVendorSettlements?.count || 0
              },
              withdrawals: {
                amount: pendingWithdrawals,
                count: pendingWithdrawalCount
              }
            }
          },
          // Released money through withdrawals to vendors
          releasedToVendors: {
            amount: totalReleasedToVendors,
            count: releasedToVendors?.count || 0
          },
          // Total paid to vendors
          totalPaidToVendors: {
            amount: totalPaidToVendorsAmount,
            breakdown: {
              walletCredits: totalPaidToVendors?.total || 0,
              settlements: vendorSettlements?.total || 0,
              withdrawals: totalReleasedToVendors
            }
          },
          // Paid to users against failure
          paidToUsersForFailure: {
            amount: totalPaidToUsersForFailure,
            breakdown: {
              refunds: paidToUsersForFailure?.total || 0,
              remittances: userRemittances?.total || 0,
              remittanceCount: userRemittances?.count || 0
            }
          },
          // Total admin revenue
          totalAdminRevenue: {
            amount: totalAdminRevenue,
            calculation: {
              totalFromUsers: totalFromUsers?.total || 0,
              totalPaidToVendors: totalPaidToVendorsAmount,
              paidToUsersForFailure: totalPaidToUsersForFailure
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Get admin payment overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin payment overview',
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

/**
 * Get vendor payment overview statistics
 */
const getVendorPaymentOverview = async (req, res) => {
  try {
    // Get all wallet transactions grouped by type
    const [
      travelChargesData,
      siteVisitData,
      reportUploadData,
      firstInstallmentData,
      secondInstallmentData,
      finalSettlementRewards,
      finalSettlementPenalties,
      withdrawalRequests,
      totalWalletBalance,
      totalVendors
    ] = await Promise.all([
      // Travel charges
      WalletTransaction.aggregate([
        {
          $match: {
            type: 'TRAVEL_CHARGES',
            status: 'SUCCESS'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      // Site visit payments
      WalletTransaction.aggregate([
        {
          $match: {
            type: 'SITE_VISIT',
            status: 'SUCCESS'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      // Report upload payments
      WalletTransaction.aggregate([
        {
          $match: {
            type: 'REPORT_UPLOAD',
            status: 'SUCCESS'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      // First installment (from bookings)
      Booking.aggregate([
        {
          $match: {
            'firstInstallment.paid': true
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$firstInstallment.amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      // Second installment (from bookings)
      Booking.aggregate([
        {
          $match: {
            'payment.vendorSettlement.status': 'COMPLETED'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$payment.vendorSettlement.amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      // Final settlement rewards
      WalletTransaction.aggregate([
        {
          $match: {
            type: 'FINAL_SETTLEMENT_REWARD',
            status: 'SUCCESS'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      // Final settlement penalties
      WalletTransaction.aggregate([
        {
          $match: {
            type: 'FINAL_SETTLEMENT_PENALTY',
            status: 'SUCCESS'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $abs: '$amount' } }, // Penalties are negative, so use abs
            count: { $sum: 1 }
          }
        }
      ]),
      // Withdrawal requests
      VendorWithdrawalRequest.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$amount' }
          }
        }
      ]),
      // Total wallet balance across all vendors
      Vendor.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$paymentCollection.walletBalance' }
          }
        }
      ]),
      // Total vendors count
      Vendor.countDocuments({ isActive: true, isApproved: true })
    ]);

    // Process withdrawal requests
    const withdrawalStats = {
      pending: { count: 0, amount: 0 },
      approved: { count: 0, amount: 0 },
      processed: { count: 0, amount: 0 },
      rejected: { count: 0, amount: 0 }
    };

    withdrawalRequests.forEach(stat => {
      if (stat._id === 'PENDING') {
        withdrawalStats.pending = { count: stat.count, amount: stat.total };
      } else if (stat._id === 'APPROVED') {
        withdrawalStats.approved = { count: stat.count, amount: stat.total };
      } else if (stat._id === 'PROCESSED') {
        withdrawalStats.processed = { count: stat.count, amount: stat.total };
      } else if (stat._id === 'REJECTED') {
        withdrawalStats.rejected = { count: stat.count, amount: stat.total };
      }
    });

    // Calculate total payments to vendors
    const totalPaymentsToVendors = 
      (travelChargesData[0]?.total || 0) +
      (siteVisitData[0]?.total || 0) +
      (reportUploadData[0]?.total || 0) +
      (firstInstallmentData[0]?.total || 0) +
      (secondInstallmentData[0]?.total || 0) +
      (finalSettlementRewards[0]?.total || 0) -
      (finalSettlementPenalties[0]?.total || 0);

    const totalPaymentCount = 
      (travelChargesData[0]?.count || 0) +
      (siteVisitData[0]?.count || 0) +
      (reportUploadData[0]?.count || 0) +
      (firstInstallmentData[0]?.count || 0) +
      (secondInstallmentData[0]?.count || 0) +
      (finalSettlementRewards[0]?.count || 0) +
      (finalSettlementPenalties[0]?.count || 0);

    res.json({
      success: true,
      message: 'Vendor payment overview retrieved successfully',
      data: {
        totalPayments: {
          count: totalPaymentCount,
          amount: totalPaymentsToVendors
        },
        travelCharges: {
          count: travelChargesData[0]?.count || 0,
          amount: travelChargesData[0]?.total || 0
        },
        siteVisit: {
          count: siteVisitData[0]?.count || 0,
          amount: siteVisitData[0]?.total || 0
        },
        reportUpload: {
          count: reportUploadData[0]?.count || 0,
          amount: reportUploadData[0]?.total || 0
        },
        firstInstallment: {
          count: firstInstallmentData[0]?.count || 0,
          amount: firstInstallmentData[0]?.total || 0
        },
        secondInstallment: {
          count: secondInstallmentData[0]?.count || 0,
          amount: secondInstallmentData[0]?.total || 0
        },
        finalSettlementRewards: {
          count: finalSettlementRewards[0]?.count || 0,
          amount: finalSettlementRewards[0]?.total || 0
        },
        finalSettlementPenalties: {
          count: finalSettlementPenalties[0]?.count || 0,
          amount: finalSettlementPenalties[0]?.total || 0
        },
        withdrawalRequests: withdrawalStats,
        totalWalletBalance: totalWalletBalance[0]?.total || 0,
        totalVendors: totalVendors
      }
    });
  } catch (error) {
    console.error('Get vendor payment overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vendor payment overview',
      error: error.message
    });
  }
};

module.exports = {
  getAllPayments,
  getPaymentStatistics,
  getPaymentDetails,
  getAdminPaymentOverview,
  getVendorPaymentOverview
};

