const Payment = require('../../models/Payment');
const Booking = require('../../models/Booking');
const { PAYMENT_STATUS, BOOKING_STATUS } = require('../../utils/constants');
const { verifyPayment, getPaymentDetails } = require('../../services/razorpayService');
const { generateInvoice } = require('../../services/pdfService');
const { sendPaymentConfirmationEmail } = require('../../services/emailService');
const { sendNotification } = require('../../services/notificationService');
const { getIO } = require('../../sockets');
const { creditToVendorWallet } = require('../../services/walletService');

/**
 * Verify and process advance payment
 */
const verifyAdvancePayment = async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification details'
      });
    }

    // Verify payment signature
    const isValid = verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Find booking
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email')
      .populate('vendor', 'name email')
      .populate('service', 'name price');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if already paid
    if (booking.payment.advancePaid) {
      return res.status(400).json({
        success: false,
        message: 'Advance payment already processed'
      });
    }

    // Get payment details from Razorpay (optional - signature verification is primary)
    let paymentDetails = null;
    try {
      paymentDetails = await getPaymentDetails(razorpayPaymentId);
    } catch (error) {
      console.error('Error fetching payment details from Razorpay:', error);
      // Continue with verification - signature verification is the most important check
      // If we can't fetch details, we'll still proceed if signature is valid
    }

    // Update booking payment
    booking.payment.advancePaid = true;
    booking.payment.advanceRazorpayPaymentId = razorpayPaymentId;
    booking.payment.advancePaidAt = new Date();
    booking.payment.status = PAYMENT_STATUS.SUCCESS;
    
    // Only set booking to ASSIGNED after payment is verified
    // This ensures booking is not active if payment fails
    booking.status = BOOKING_STATUS.ASSIGNED;
    booking.vendorStatus = BOOKING_STATUS.ASSIGNED;
    booking.userStatus = BOOKING_STATUS.ASSIGNED;
    
    await booking.save();

    // Credit travel charges to vendor wallet when booking is confirmed
    // Check if travel charges have already been credited to avoid duplicates
    if (booking.payment.travelCharges && booking.payment.travelCharges > 0) {
      try {
        // Check if travel charges were already credited for this booking
        const WalletTransaction = require('../../models/WalletTransaction');
        const existingTransaction = await WalletTransaction.findOne({
          vendor: booking.vendor._id,
          booking: booking._id,
          type: 'TRAVEL_CHARGES',
          status: 'SUCCESS'
        });

        if (!existingTransaction) {
          // Credit travel charges to vendor wallet
          const walletResult = await creditToVendorWallet(
            booking.vendor._id,
            booking.payment.travelCharges,
            'TRAVEL_CHARGES',
            booking._id,
            {
              description: `Travel charges for booking #${booking._id.toString().slice(-6)}`,
              bookingId: booking._id.toString(),
              distance: booking.payment.distance || null
            }
          );
          
          if (!walletResult.success) {
            console.error('Failed to credit travel charges to vendor wallet:', walletResult.error);
            // Don't fail the payment verification if wallet credit fails
            // The transaction is recorded as failed and can be retried
          }
        }
      } catch (walletError) {
        console.error('Error crediting travel charges to vendor wallet:', walletError);
        // Don't fail the payment verification if wallet credit fails
      }
    }

    // Update payment record
    const payment = await Payment.findOne({
      booking: bookingId,
      paymentType: 'ADVANCE',
      razorpayOrderId
    });

    if (payment) {
      payment.status = PAYMENT_STATUS.SUCCESS;
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      payment.paidAt = new Date();
      await payment.save();
    }

    // Send confirmation email
    try {
      await sendPaymentConfirmationEmail({
        email: booking.user.email,
        name: booking.user.name,
        bookingId: booking._id.toString(),
        amount: booking.payment.advanceAmount,
        paymentType: 'Advance Payment'
      });

      // Send real-time notifications
      const io = getIO();
      
      // Notify user
      await sendNotification({
        recipient: booking.user._id,
        recipientModel: 'User',
        type: 'PAYMENT_ADVANCE_SUCCESS',
        title: 'Advance Payment Successful',
        message: `Advance payment of ₹${booking.payment.advanceAmount} completed successfully. Booking assigned to vendor.`,
        relatedEntity: {
          entityType: 'Booking',
          entityId: booking._id
        },
        metadata: {
          amount: booking.payment.advanceAmount,
          bookingId: booking._id.toString()
        }
      }, io);

      // Notify vendor - booking confirmed and assigned
      await sendNotification({
        recipient: booking.vendor._id,
        recipientModel: 'Vendor',
        type: 'BOOKING_ASSIGNED',
        title: 'Booking Confirmed and Assigned',
        message: `New booking confirmed and assigned from ${booking.user.name} for ${booking.service.name}. Please review and accept.`,
        relatedEntity: {
          entityType: 'Booking',
          entityId: booking._id
        },
        metadata: {
          userName: booking.user.name,
          serviceName: booking.service.name,
          bookingId: booking._id.toString()
        }
      }, io);

      // Notify admin about payment
      try {
        const Admin = require('../../models/Admin');
        const admins = await Admin.find({ isActive: true });
        for (const admin of admins) {
          await sendNotification({
            recipient: admin._id,
            recipientModel: 'Admin',
            type: 'PAYMENT_ADVANCE_SUCCESS',
            title: 'Advance Payment Received',
            message: `User ${booking.user.name} paid advance payment of ₹${booking.payment.advanceAmount} for booking #${booking._id.toString().slice(-6)}`,
            relatedEntity: {
              entityType: 'Booking',
              entityId: booking._id
            },
            metadata: {
              amount: booking.payment.advanceAmount,
              bookingId: booking._id.toString(),
              userId: booking.user._id.toString(),
              vendorId: booking.vendor._id.toString()
            }
          }, io);
        }
      } catch (adminError) {
        console.error('Admin notification error:', adminError);
      }
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    res.json({
      success: true,
      message: 'Advance payment verified and processed successfully',
      data: {
        booking: {
          id: booking._id,
          status: booking.status,
          payment: {
            advancePaid: booking.payment.advancePaid,
            remainingAmount: booking.payment.remainingAmount
          }
        }
      }
    });
  } catch (error) {
    console.error('Verify advance payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

/**
 * Verify and process remaining payment
 */
const verifyRemainingPayment = async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification details'
      });
    }

    // Verify payment signature
    const isValid = verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Find booking
    const booking = await Booking.findOne({
      _id: bookingId,
      userStatus: BOOKING_STATUS.AWAITING_PAYMENT
    })
      .populate('user', 'name email')
      .populate('vendor', 'name email')
      .populate('service', 'name price');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or payment not required'
      });
    }

    // Check if already paid
    if (booking.payment.remainingPaid) {
      return res.status(400).json({
        success: false,
        message: 'Remaining payment already processed'
      });
    }

    // Get payment details from Razorpay
    const paymentDetails = await getPaymentDetails(razorpayPaymentId);

    // Update booking payment
    booking.payment.remainingPaid = true;
    booking.payment.remainingRazorpayPaymentId = razorpayPaymentId;
    booking.payment.remainingPaidAt = new Date();
    booking.payment.status = PAYMENT_STATUS.SUCCESS;
    // When user pays remaining 60%:
    // - User status: PAYMENT_SUCCESS (can now see report)
    // - Vendor status: Still REPORT_UPLOADED (waiting for admin to pay 50%)
    booking.status = BOOKING_STATUS.PAYMENT_SUCCESS;
    booking.userStatus = BOOKING_STATUS.PAYMENT_SUCCESS;
    // vendorStatus remains REPORT_UPLOADED until admin pays
    await booking.save();

    // Update payment record
    const payment = await Payment.findOne({
      booking: bookingId,
      paymentType: 'REMAINING',
      razorpayOrderId
    });

    if (payment) {
      payment.status = PAYMENT_STATUS.SUCCESS;
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      payment.paidAt = new Date();
      await payment.save();
    }

    // Generate invoice
    try {
      const invoiceResult = await generateInvoice(booking);
      booking.invoice = {
        invoiceNumber: invoiceResult.invoiceNumber,
        invoiceUrl: invoiceResult.invoiceUrl,
        publicId: invoiceResult.publicId,
        generatedAt: new Date()
      };
      await booking.save();
    } catch (invoiceError) {
      console.error('Invoice generation error:', invoiceError);
      // Continue even if invoice generation fails
    }

    // Send confirmation email
    try {
      await sendPaymentConfirmationEmail({
        email: booking.user.email,
        name: booking.user.name,
        bookingId: booking._id.toString(),
        amount: booking.payment.remainingAmount,
        paymentType: 'Remaining Payment',
        invoiceUrl: booking.invoice?.invoiceUrl
      });

      // Send real-time notifications
      const io = getIO();
      
      // Notify user
      await sendNotification({
        recipient: booking.user._id,
        recipientModel: 'User',
        type: 'PAYMENT_REMAINING_SUCCESS',
        title: 'Payment Successful',
        message: `Remaining payment of ₹${booking.payment.remainingAmount} completed. You can now view your report.`,
        relatedEntity: {
          entityType: 'Booking',
          entityId: booking._id
        },
        metadata: {
          amount: booking.payment.remainingAmount,
          bookingId: booking._id.toString()
        }
      }, io);

      // No notification to vendor for remaining payment (vendor doesn't need to know about user payments)

      // Notify admin about remaining payment
      try {
        const Admin = require('../../models/Admin');
        const admins = await Admin.find({ isActive: true });
        for (const admin of admins) {
      await sendNotification({
            recipient: admin._id,
            recipientModel: 'Admin',
        type: 'PAYMENT_REMAINING_SUCCESS',
            title: 'Remaining Payment Received',
            message: `User ${booking.user.name} paid remaining amount of ₹${booking.payment.remainingAmount} for booking #${booking._id.toString().slice(-6)}`,
        relatedEntity: {
          entityType: 'Booking',
          entityId: booking._id
        },
        metadata: {
          amount: booking.payment.remainingAmount,
              bookingId: booking._id.toString(),
              userId: booking.user._id.toString(),
              vendorId: booking.vendor._id.toString()
        }
      }, io);
        }
      } catch (adminError) {
        console.error('Admin notification error:', adminError);
      }
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    res.json({
      success: true,
      message: 'Remaining payment verified and processed successfully. Report is now accessible.',
      data: {
        booking: {
          id: booking._id,
          status: booking.status,
          payment: {
            remainingPaid: booking.payment.remainingPaid,
            totalPaid: booking.payment.totalAmount
          },
          invoice: booking.invoice
        }
      }
    });
  } catch (error) {
    console.error('Verify remaining payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

/**
 * Razorpay webhook handler
 */
const handleWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = JSON.stringify(req.body);

    // Verify webhook signature
    const { verifyWebhook } = require('../../services/razorpayService');
    const isValid = verifyWebhook(webhookBody, webhookSignature);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const event = req.body.event;
    const paymentData = req.body.payload.payment.entity;

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        // Payment captured successfully
        await handlePaymentCaptured(paymentData);
        break;
      case 'payment.failed':
        // Payment failed
        await handlePaymentFailed(paymentData);
        break;
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
};

/**
 * Handle payment captured event
 */
const handlePaymentCaptured = async (paymentData) => {
  try {
    const payment = await Payment.findOne({
      razorpayPaymentId: paymentData.id
    });

    if (payment && payment.status !== PAYMENT_STATUS.SUCCESS) {
      payment.status = PAYMENT_STATUS.SUCCESS;
      payment.paidAt = new Date();
      await payment.save();

      // Update booking if needed
      const booking = await Booking.findById(payment.booking);
      if (booking) {
        if (payment.paymentType === 'ADVANCE') {
          booking.payment.advancePaid = true;
          booking.payment.advanceRazorpayPaymentId = paymentData.id;
          booking.payment.advancePaidAt = new Date();
        } else if (payment.paymentType === 'REMAINING') {
          booking.payment.remainingPaid = true;
          booking.payment.remainingRazorpayPaymentId = paymentData.id;
          booking.payment.remainingPaidAt = new Date();
          booking.status = BOOKING_STATUS.PAYMENT_SUCCESS;
          booking.userStatus = BOOKING_STATUS.PAYMENT_SUCCESS;
        }
        booking.payment.status = PAYMENT_STATUS.SUCCESS;
        await booking.save();
      }
    }
  } catch (error) {
    console.error('Handle payment captured error:', error);
  }
};

/**
 * Handle payment failed event
 */
const handlePaymentFailed = async (paymentData) => {
  try {
    const payment = await Payment.findOne({
      razorpayPaymentId: paymentData.id
    });

    if (payment) {
      payment.status = PAYMENT_STATUS.FAILED;
      payment.failedAt = new Date();
      await payment.save();
    }
  } catch (error) {
    console.error('Handle payment failed error:', error);
  }
};

module.exports = {
  verifyAdvancePayment,
  verifyRemainingPayment,
  handleWebhook
};

