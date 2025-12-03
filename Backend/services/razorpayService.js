const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create a Razorpay order
 * @param {Number} amount - Amount in paise (smallest currency unit)
 * @param {String} currency - Currency code (default: INR)
 * @param {Object} options - Additional options (receipt, notes, etc.)
 * @returns {Promise<Object>} Razorpay order object
 */
const createOrder = async (amount, currency = 'INR', options = {}) => {
  try {
    // Validate Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }

    // Validate amount
    const amountInPaise = Math.round(amount * 100);
    if (amountInPaise < 100) {
      throw new Error('Minimum payment amount is ₹1.00');
    }

    const orderOptions = {
      amount: amountInPaise, // Convert to paise
      currency: currency,
      receipt: options.receipt || `receipt_${Date.now()}`,
      notes: options.notes || {},
      ...options
    };

    const order = await razorpay.orders.create(orderOptions);
    
    if (!order || !order.id) {
      throw new Error('Invalid order response from Razorpay');
    }

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      createdAt: order.created_at
    };
  } catch (error) {
    console.error('Razorpay create order error:', error);
    // Provide more detailed error message
    if (error.statusCode === 401) {
      throw new Error('Invalid Razorpay credentials. Please check your API keys.');
    } else if (error.statusCode === 400) {
      throw new Error(`Invalid payment request: ${error.error?.description || error.message}`);
    } else {
      throw new Error(`Failed to create Razorpay order: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Verify Razorpay payment signature
 * @param {String} razorpayOrderId - Order ID
 * @param {String} razorpayPaymentId - Payment ID
 * @param {String} razorpaySignature - Payment signature
 * @returns {Boolean} True if signature is valid
 */
const verifyPayment = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  try {
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === razorpaySignature;
  } catch (error) {
    console.error('Razorpay verify payment error:', error);
    return false;
  }
};

/**
 * Fetch payment details from Razorpay
 * @param {String} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      paymentId: payment.id,
      orderId: payment.order_id,
      amount: payment.amount / 100, // Convert from paise to rupees
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      description: payment.description,
      createdAt: payment.created_at,
      captured: payment.captured
    };
  } catch (error) {
    console.error('Razorpay get payment details error:', error);
    throw new Error(`Failed to fetch payment details: ${error.message}`);
  }
};

/**
 * Create a refund
 * @param {String} paymentId - Razorpay payment ID
 * @param {Number} amount - Amount to refund (in rupees)
 * @param {String} notes - Refund notes
 * @returns {Promise<Object>} Refund details
 */
const createRefund = async (paymentId, amount, notes = {}) => {
  try {
    const refundOptions = {
      amount: Math.round(amount * 100), // Convert to paise
      notes: notes
    };

    const refund = await razorpay.payments.refund(paymentId, refundOptions);
    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100, // Convert from paise to rupees
      status: refund.status,
      createdAt: refund.created_at
    };
  } catch (error) {
    console.error('Razorpay create refund error:', error);
    throw new Error(`Failed to create refund: ${error.message}`);
  }
};

/**
 * Verify webhook signature
 * @param {String} webhookBody - Raw webhook body
 * @param {String} signature - Webhook signature
 * @returns {Boolean} True if signature is valid
 */
const verifyWebhook = (webhookBody, signature) => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookBody)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Razorpay verify webhook error:', error);
    return false;
  }
};

/**
 * Create a Razorpay payout (transfer to vendor bank account)
 * Note: This requires Razorpay Payouts API and vendor's fund account
 * @param {Number} amount - Amount in rupees
 * @param {String} fundAccountId - Razorpay fund account ID
 * @param {Object} options - Additional options (mode, purpose, queue_if_low_balance, etc.)
 * @returns {Promise<Object>} Payout details
 */
const createPayout = async (amount, fundAccountId, options = {}) => {
  try {
    // Validate Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }

    // Validate amount
    const amountInPaise = Math.round(amount * 100);
    if (amountInPaise < 100) {
      throw new Error('Minimum payout amount is ₹1.00');
    }

    const payoutOptions = {
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER || '', // Your Razorpay account number
      fund_account_id: fundAccountId,
      amount: amountInPaise,
      currency: 'INR',
      mode: options.mode || 'NEFT', // NEFT, IMPS, RTGS
      purpose: options.purpose || 'payout',
      queue_if_low_balance: options.queue_if_low_balance !== false,
      reference_id: options.reference_id || `payout_${Date.now()}`,
      narration: options.narration || `Payout for withdrawal`,
      ...options
    };

    // Note: Razorpay Payouts API endpoint
    const payout = await razorpay.payouts.create(payoutOptions);
    
    return {
      success: true,
      payoutId: payout.id,
      amount: payout.amount / 100, // Convert from paise to rupees
      currency: payout.currency,
      status: payout.status,
      mode: payout.mode,
      fundAccountId: payout.fund_account_id,
      utr: payout.utr,
      createdAt: payout.created_at
    };
  } catch (error) {
    console.error('Razorpay create payout error:', error);
    throw new Error(`Failed to create payout: ${error.message || 'Unknown error'}`);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentDetails,
  createRefund,
  verifyWebhook,
  createPayout,
  razorpay
};

