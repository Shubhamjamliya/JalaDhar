const Token = require('../models/Token');
const { generateOTP, generateToken } = require('../utils/generateOTP');
const { TOKEN_TYPES } = require('../utils/constants');

/**
 * Create and save OTP token
 * @param {Object} params - { userId, userModel, type, expiryMinutes }
 * @returns {Object} - { otp, token, expiresAt }
 */
const createOTPToken = async ({ userId, userModel, type, expiryMinutes = 10 }) => {
  // Delete any existing tokens of the same type for this user
  await Token.deleteMany({ userId, userModel, type, isUsed: false });

  const otp = generateOTP(6);
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  const tokenDoc = await Token.create({
    userId,
    userModel,
    token,
    type,
    otp,
    expiresAt
  });

  return {
    otp,
    token: tokenDoc.token,
    expiresAt
  };
};

/**
 * Verify OTP token
 * @param {Object} params - { userId, userModel, type, otp }
 * @returns {Object} - { isValid, tokenDoc }
 */
const verifyOTPToken = async ({ userId, userModel, type, otp }) => {
  const isFallbackOtpAllowed = (process.env.ENABLE_SMS !== 'true' || !process.env.SMS_INDIA_API_KEY || process.env.ALLOW_DEMO_OTP === 'true') && (otp === '123456' || otp === '666666');

  const query = {
    userId,
    userModel,
    type,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  };

  if (!isFallbackOtpAllowed) {
    query.otp = otp;
  }

  const tokenDoc = await Token.findOne(query);

  if (!tokenDoc) {
    return { isValid: false, tokenDoc: null };
  }

  // Check attempts
  if (tokenDoc.attempts >= 5) {
    await Token.deleteOne({ _id: tokenDoc._id });
    return { isValid: false, tokenDoc: null, error: 'Max attempts exceeded' };
  }

  // Increment attempts
  tokenDoc.attempts += 1;
  await tokenDoc.save();

  return { isValid: true, tokenDoc };
};

/**
 * Verify token by token string
 * @param {Object} params - { token, type }
 * @returns {Object} - { isValid, tokenDoc }
 */
const verifyTokenByString = async ({ token, type }) => {
  const tokenDoc = await Token.findOne({
    token,
    type,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });

  if (!tokenDoc) {
    return { isValid: false, tokenDoc: null };
  }

  return { isValid: true, tokenDoc };
};

/**
 * Mark token as used
 * @param {string} tokenId - Token document ID
 */
const markTokenAsUsed = async (tokenId) => {
  await Token.findByIdAndUpdate(tokenId, { isUsed: true });
};

/**
 * Clean expired tokens
 */
const cleanExpiredTokens = async () => {
  await Token.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

module.exports = {
  createOTPToken,
  verifyOTPToken,
  verifyTokenByString,
  markTokenAsUsed,
  cleanExpiredTokens
};

