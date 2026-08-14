const mongoose = require('mongoose');
const User = require('../../models/User');
const Token = require('../../models/Token');
const { generateTokenPair } = require('../../utils/tokenService');
const { createOTPToken, verifyOTPToken, markTokenAsUsed } = require('../../services/otpService');
const { sendOTPEmail, sendWelcomeEmail } = require('../../services/emailService');
const { sendSMSOTP } = require('../../services/smsService');
const { dispatchOTP } = require('../../services/multiChannelNotificationService');
const { TOKEN_TYPES } = require('../../utils/constants');
const { validationResult } = require('express-validator');
const { generateOTP, generateToken } = require('../../utils/generateOTP');

/**
 * Send OTP for user registration
 */
const sendRegistrationOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, phone } = req.body;

    const cleanEmail = email ? email.toLowerCase().trim() : null;
    const cleanPhone = phone ? phone.trim() : '';

    // Check if user already exists
    const searchConditions = [{ phone: cleanPhone }];
    if (cleanEmail) searchConditions.push({ email: cleanEmail });

    const existingUser = await User.findOne({ $or: searchConditions });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.phone === cleanPhone 
          ? 'Mobile number already registered' 
          : 'Email address already registered'
      });
    }

    const targetEmail = cleanEmail || `${cleanPhone}@jaladhar.internal`;

    // Enterprise Rate Limiting & Cooldown Protection (60s Cooldown)
    const existingToken = await Token.findOne({
      email: targetEmail,
      type: TOKEN_TYPES.EMAIL_VERIFICATION,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    const COOLDOWN_SECONDS = 60;
    if (existingToken && (Date.now() - new Date(existingToken.createdAt).getTime() < COOLDOWN_SECONDS * 1000)) {
      const remainingSeconds = Math.ceil((COOLDOWN_SECONDS * 1000 - (Date.now() - new Date(existingToken.createdAt).getTime())) / 1000);
      
      return res.json({
        success: true,
        reused: true,
        message: `OTP already sent recently. Please wait ${remainingSeconds}s before requesting again.`,
        data: {
          token: existingToken.token,
          email: cleanEmail || '',
          phone: cleanPhone,
          cooldownRemaining: remainingSeconds,
          ...(process.env.NODE_ENV !== 'production' && { devOtp: existingToken.otp })
        }
      });
    }

    await Token.deleteMany({ email: targetEmail, type: TOKEN_TYPES.EMAIL_VERIFICATION, isUsed: false });

    const otp = generateOTP(6);
    const token = generateToken(32);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const tokenDoc = await Token.create({
      userId: new mongoose.Types.ObjectId(),
      userModel: 'User',
      token,
      type: TOKEN_TYPES.EMAIL_VERIFICATION,
      otp,
      email: targetEmail,
      expiresAt
    });

    // Dispatch OTP across SMS/WhatsApp/Email
    dispatchOTP({
      email: cleanEmail,
      phone: cleanPhone,
      name,
      otp,
      type: 'verification'
    }).catch(err => console.error('Multi-channel OTP dispatch error:', err));

    if (cleanEmail) {
      sendOTPEmail({
        email: cleanEmail,
        name,
        otp,
        type: 'verification'
      }).catch(err => console.error('OTP email send error:', err));
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        token: tokenDoc.token,
        email: cleanEmail || '',
        phone: cleanPhone,
        ...(process.env.NODE_ENV !== 'production' && { devOtp: otp })
      }
    });
  } catch (error) {
    console.error('Send registration OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
};

/**
 * Register new user with OTP verification
 */
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, phone, password, otp, token } = req.body;

    if (!otp || !token) {
      return res.status(400).json({
        success: false,
        message: 'OTP and token are required'
      });
    }

    // Verify OTP using token
    const Token = require('../../models/Token');
    const tokenDoc = await Token.findOne({
      token,
      type: TOKEN_TYPES.EMAIL_VERIFICATION,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!tokenDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP token'
      });
    }

    // Check attempts
    if (tokenDoc.attempts >= 5) {
      await Token.deleteOne({ _id: tokenDoc._id });
      return res.status(400).json({
        success: false,
        message: 'Max OTP attempts exceeded. Please request a new OTP.'
      });
    }

    // Verify OTP (Allows 123456 / 666666 fallback when SMS service key is not configured)
    const isFallbackOtpAllowed = (process.env.ENABLE_SMS !== 'true' || !process.env.SMS_INDIA_API_KEY || process.env.ALLOW_DEMO_OTP === 'true') && (otp === '123456' || otp === '666666');
    if (tokenDoc.otp !== otp && !isFallbackOtpAllowed) {
      tokenDoc.attempts = (tokenDoc.attempts || 0) + 1;
      await tokenDoc.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    const cleanEmail = email ? email.toLowerCase().trim() : null;
    const cleanPhone = phone ? phone.trim() : '';

    // Check if user already exists (double check)
    const searchConditions = [{ phone: cleanPhone }];
    if (cleanEmail) searchConditions.push({ email: cleanEmail });

    const existingUser = await User.findOne({ $or: searchConditions });

    if (existingUser) {
      await markTokenAsUsed(tokenDoc._id);
      return res.status(400).json({
        success: false,
        message: existingUser.phone === cleanPhone 
          ? 'Mobile number already registered' 
          : 'Email address already registered'
      });
    }

    // Create user
    const { preferredLanguage } = req.body;
    const userEmail = cleanEmail || `${cleanPhone}@jaladhar.internal`;
    const defaultPassword = password || `Jaladhar@${cleanPhone.slice(-4)}`;

    const user = await User.create({
      name,
      email: userEmail,
      phone: cleanPhone,
      password: defaultPassword,
      preferredLanguage: preferredLanguage || 'en',
      isEmailVerified: true
    });

    // Mark token as used
    await markTokenAsUsed(tokenDoc._id);

    if (cleanEmail) {
      sendWelcomeEmail({
        email: user.email,
        name: user.name
      }).catch(err => console.error('Welcome email send error:', err));
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Email verified.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isEmailVerified: user.isEmailVerified
        }
      }
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/Phone and password are required'
      });
    }

    const cleanInput = email.toString().trim();
    const isEmail = cleanInput.includes('@');
    const query = isEmail
      ? { email: cleanInput.toLowerCase() }
      : { $or: [{ email: cleanInput.toLowerCase() }, { phone: cleanInput }] };

    // Find user with password
    const user = await User.findOne(query).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials or click Sign Up to create an account.'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. Check your email for verification OTP.'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair({
      userId: user._id,
      role: user.role,
      email: user.email
    });

    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isEmailVerified: user.isEmailVerified
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

/**
 * Forgot password - send OTP
 */
const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, phone, identifier } = req.body;
    const inputVal = (email || phone || identifier || '').trim();

    if (!inputVal) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email or mobile number'
      });
    }

    let searchConditions = [];
    if (inputVal.includes('@')) {
      searchConditions.push({ email: inputVal.toLowerCase() });
    } else {
      const cleanPhone = inputVal.replace(/\D/g, '');
      searchConditions.push({ phone: cleanPhone });
      searchConditions.push({ phone: inputVal });
      searchConditions.push({ email: inputVal.toLowerCase() });
    }

    const user = await User.findOne({ $or: searchConditions });
    if (!user) {
      // Don't reveal if email/phone exists
      return res.json({
        success: true,
        message: 'If the account exists, a password reset OTP has been sent.'
      });
    }

    // Create password reset OTP
    const { otp } = await createOTPToken({
      userId: user._id,
      userModel: 'User',
      type: TOKEN_TYPES.PASSWORD_RESET,
      expiryMinutes: parseInt(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES) || 10
    });

    // Send OTP SMS if phone is available
    if (user.phone) {
      await sendSMSOTP({
        phone: user.phone,
        otp,
        type: 'password_reset'
      }).catch(err => console.error('Forgot password SMS send error:', err));
    }

    // Send OTP email if email is available
    if (user.email) {
      await sendOTPEmail({
        email: user.email,
        name: user.name,
        otp,
        type: 'password_reset'
      }).catch(err => console.error('Forgot password Email send error:', err));
    }

    res.json({
      success: true,
      message: 'Password reset OTP sent to your registered mobile number / email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset OTP',
      error: error.message
    });
  }
};

/**
 * Reset password with OTP
 */
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, phone, identifier, otp, newPassword } = req.body;
    const inputVal = (email || phone || identifier || '').trim();

    if (!inputVal) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email or mobile number'
      });
    }

    let searchConditions = [];
    if (inputVal.includes('@')) {
      searchConditions.push({ email: inputVal.toLowerCase() });
    } else {
      const cleanPhone = inputVal.replace(/\D/g, '');
      searchConditions.push({ phone: cleanPhone });
      searchConditions.push({ phone: inputVal });
      searchConditions.push({ email: inputVal.toLowerCase() });
    }

    const user = await User.findOne({ $or: searchConditions });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Verify OTP
    const { isValid, tokenDoc, error } = await verifyOTPToken({
      userId: user._id,
      userModel: 'User',
      type: TOKEN_TYPES.PASSWORD_RESET,
      otp
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: error || 'Invalid or expired OTP'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Mark token as used
    await markTokenAsUsed(tokenDoc._id);

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: error.message
    });
  }
};

/**
 * Verify email with OTP
 */
const verifyEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.json({
        success: true,
        message: 'Email already verified'
      });
    }

    // Verify OTP
    const { isValid, tokenDoc, error } = await verifyOTPToken({
      userId: user._id,
      userModel: 'User',
      type: TOKEN_TYPES.EMAIL_VERIFICATION,
      otp
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: error || 'Invalid or expired OTP'
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    await user.save();

    // Mark token as used
    await markTokenAsUsed(tokenDoc._id);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: error.message
    });
  }
};

/**
 * Resend email verification OTP
 */
const resendEmailVerification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.json({
        success: true,
        message: 'Email already verified'
      });
    }

    // Generate new OTP
    const { otp } = await createOTPToken({
      userId: user._id,
      userModel: 'User',
      type: TOKEN_TYPES.EMAIL_VERIFICATION,
      expiryMinutes: 10
    });

    // Send OTP email
    await sendOTPEmail({
      email: user.email,
      name: user.name,
      otp,
      type: 'verification'
    });

    res.json({
      success: true,
      message: 'Verification OTP sent to your email'
    });
  } catch (error) {
    console.error('Resend email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification OTP',
      error: error.message
    });
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

/**
 * Send OTP for User Login via Mobile Number
 */
const sendLoginOTP = async (req, res) => {
  try {
    const { phone, email } = req.body;
    const identifier = (phone || email || '').toString().trim();

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number or email is required'
      });
    }

    const cleanInput = identifier.toLowerCase();
    const digits = identifier.replace(/\D/g, '');
    const phoneRegex = digits.length >= 10 ? new RegExp(digits.slice(-10) + '$') : identifier;

    const user = await User.findOne({
      $or: [
        { phone: identifier },
        { phone: phoneRegex },
        { email: cleanInput }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this mobile number. Please click Sign Up to create an account.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Generate OTP & Token
    const targetEmail = user.email || `${user.phone}@jaladhar.internal`;

    // Enterprise Rate Limiting & Cooldown Protection (60s Cooldown)
    const existingToken = await Token.findOne({
      email: targetEmail,
      type: TOKEN_TYPES.PHONE_VERIFICATION,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    const COOLDOWN_SECONDS = 60;
    if (existingToken && (Date.now() - new Date(existingToken.createdAt).getTime() < COOLDOWN_SECONDS * 1000)) {
      const remainingSeconds = Math.ceil((COOLDOWN_SECONDS * 1000 - (Date.now() - new Date(existingToken.createdAt).getTime())) / 1000);
      
      return res.json({
        success: true,
        reused: true,
        message: `OTP already sent to mobile number. Please wait ${remainingSeconds}s before requesting again.`,
        data: {
          token: existingToken.token,
          phone: user.phone,
          cooldownRemaining: remainingSeconds,
          ...(process.env.NODE_ENV !== 'production' && { devOtp: existingToken.otp })
        }
      });
    }

    await Token.deleteMany({ email: targetEmail, type: TOKEN_TYPES.PHONE_VERIFICATION, isUsed: false });

    const otp = generateOTP(6);
    const token = generateToken(32);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const tokenDoc = await Token.create({
      userId: user._id,
      userModel: 'User',
      token,
      type: TOKEN_TYPES.PHONE_VERIFICATION,
      otp,
      email: targetEmail,
      expiresAt
    });

    // Dispatch OTP across Multi-Channel (SMS, WhatsApp, Email)
    dispatchOTP({
      email: user.email,
      phone: user.phone,
      name: user.name,
      otp,
      type: 'login'
    }).catch(err => console.error('Multi-channel OTP dispatch error:', err));

    res.json({
      success: true,
      message: 'OTP sent to your mobile number successfully',
      data: {
        token: tokenDoc.token,
        phone: user.phone,
        ...(process.env.NODE_ENV !== 'production' && { devOtp: otp })
      }
    });
  } catch (error) {
    console.error('Send login OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send login OTP',
      error: error.message
    });
  }
};

/**
 * Verify Login OTP and authenticate user
 */
const verifyLoginOTP = async (req, res) => {
  try {
    const { token, otp } = req.body;

    if (!token || !otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP and verification token are required'
      });
    }

    const tokenDoc = await Token.findOne({
      token,
      type: TOKEN_TYPES.PHONE_VERIFICATION,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!tokenDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP token'
      });
    }

    const isFallbackOtpAllowed = (process.env.ENABLE_SMS !== 'true' || !process.env.SMS_INDIA_API_KEY || process.env.ALLOW_DEMO_OTP === 'true') && (otp === '123456' || otp === '666666');
    if (tokenDoc.otp !== otp && !isFallbackOtpAllowed) {
      tokenDoc.attempts = (tokenDoc.attempts || 0) + 1;
      await tokenDoc.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    // Mark token as used
    await markTokenAsUsed(tokenDoc._id);

    // Generate token pair
    const { accessToken, refreshToken } = generateTokenPair({
      userId: user._id,
      role: user.role,
      email: user.email
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        tokens: {
          accessToken,
          refreshToken
        },
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profilePicture: user.profilePicture,
          preferredLanguage: user.preferredLanguage || 'en'
        }
      }
    });
  } catch (error) {
    console.error('Verify login OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Login verification failed',
      error: error.message
    });
  }
};

/**
 * Verify password reset OTP
 */
const verifyResetOTP = async (req, res) => {
  try {
    const { email, phone, identifier, otp } = req.body;
    const inputVal = (email || phone || identifier || '').trim();

    if (!inputVal || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Mobile/Email and OTP are required'
      });
    }

    let searchConditions = [];
    if (inputVal.includes('@')) {
      searchConditions.push({ email: inputVal.toLowerCase() });
    } else {
      const cleanPhone = inputVal.replace(/\D/g, '');
      searchConditions.push({ phone: cleanPhone });
      searchConditions.push({ phone: inputVal });
      searchConditions.push({ email: inputVal.toLowerCase() });
    }

    const user = await User.findOne({ $or: searchConditions });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Verify OTP
    const { isValid, error } = await verifyOTPToken({
      userId: user._id,
      userModel: 'User',
      type: TOKEN_TYPES.PASSWORD_RESET,
      otp
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: error || 'Invalid or expired OTP'
      });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  sendLoginOTP,
  verifyLoginOTP,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  sendRegistrationOTP,
  verifyEmail,
  resendEmailVerification,
  logout
};

