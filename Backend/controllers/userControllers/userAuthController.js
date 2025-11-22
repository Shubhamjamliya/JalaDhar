const mongoose = require('mongoose');
const User = require('../../models/User');
const Token = require('../../models/Token');
const { generateTokenPair } = require('../../utils/tokenService');
const { createOTPToken, verifyOTPToken, markTokenAsUsed } = require('../../services/otpService');
const { sendOTPEmail, sendWelcomeEmail } = require('../../services/emailService');
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

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Phone number already registered'
      });
    }

    // Create OTP token with email stored separately (user doesn't exist yet)
    // Delete any existing tokens for this email
    await Token.deleteMany({ email, type: TOKEN_TYPES.EMAIL_VERIFICATION, isUsed: false });

    const otp = generateOTP(6);
    const token = generateToken(32);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const tokenDoc = await Token.create({
      userId: new mongoose.Types.ObjectId(), // Dummy ObjectId
      userModel: 'User',
      token,
      type: TOKEN_TYPES.EMAIL_VERIFICATION,
      otp,
      email, // Store email directly
      expiresAt
    });

    // Send OTP email
    const emailResult = await sendOTPEmail({
      email,
      name,
      otp,
      type: 'verification'
    });

    if (!emailResult.success) {
      await Token.deleteOne({ _id: tokenDoc._id });
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email',
        error: emailResult.error
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to email successfully',
      data: {
        token: tokenDoc.token,
        email
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
      email,
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

    // Verify OTP
    if (tokenDoc.otp !== otp) {
      tokenDoc.attempts += 1;
      await tokenDoc.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    // Check if user already exists (double check)
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      await markTokenAsUsed(tokenDoc._id);
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Phone number already registered'
      });
    }

    // Create user with email verified
    const user = await User.create({
      name,
      email,
      phone,
      password,
      isEmailVerified: true // Email is verified via OTP
    });

    // Mark token as used
    await markTokenAsUsed(tokenDoc._id);

    // Send welcome email
    await sendWelcomeEmail({
      email: user.email,
      name: user.name
    });

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

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
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

    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If the email exists, a password reset OTP has been sent.'
      });
    }

    // Create password reset OTP
    const { otp } = await createOTPToken({
      userId: user._id,
      userModel: 'User',
      type: TOKEN_TYPES.PASSWORD_RESET,
      expiryMinutes: parseInt(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES) || 10
    });

    // Send OTP email
    await sendOTPEmail({
      email: user.email,
      name: user.name,
      otp,
      type: 'password_reset'
    });

    res.json({
      success: true,
      message: 'Password reset OTP sent to your email'
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

    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
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

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  sendRegistrationOTP,
  verifyEmail,
  resendEmailVerification,
  logout
};

