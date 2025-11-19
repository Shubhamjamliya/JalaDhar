const Vendor = require('../../models/Vendor');
const Token = require('../../models/Token');
const { generateTokenPair } = require('../../utils/tokenService');
const { createOTPToken, verifyOTPToken, markTokenAsUsed } = require('../../services/otpService');
const { sendOTPEmail, sendWelcomeEmail } = require('../../services/emailService');
const { TOKEN_TYPES } = require('../../utils/constants');
const { validationResult } = require('express-validator');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder = 'vendor-documents') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
};

/**
 * Register new vendor with documents
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

    const { 
      name, 
      email, 
      phone, 
      password, 
      bankDetails, 
      educationalQualifications, 
      experience, 
      address 
    } = req.body;

    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: existingVendor.email === email 
          ? 'Email already registered' 
          : 'Phone number already registered'
      });
    }

    // Handle document uploads
    const documents = {};
    if (req.files) {
      try {
        if (req.files.aadharCard && req.files.aadharCard[0]) {
          const aadharResult = await uploadToCloudinary(req.files.aadharCard[0].buffer, 'vendor-documents/aadhar');
          documents.aadharCard = {
            url: aadharResult.secure_url,
            publicId: aadharResult.public_id,
            uploadedAt: new Date()
          };
        }
        if (req.files.panCard && req.files.panCard[0]) {
          const panResult = await uploadToCloudinary(req.files.panCard[0].buffer, 'vendor-documents/pan');
          documents.panCard = {
            url: panResult.secure_url,
            publicId: panResult.public_id,
            uploadedAt: new Date()
          };
        }
        if (req.files.profilePicture && req.files.profilePicture[0]) {
          const profileResult = await uploadToCloudinary(req.files.profilePicture[0].buffer, 'vendor-documents/profile');
          documents.profilePicture = {
            url: profileResult.secure_url,
            publicId: profileResult.public_id,
            uploadedAt: new Date()
          };
        }
        // Handle multiple certificate photos
        if (req.files.certificates && req.files.certificates.length > 0) {
          documents.certificates = [];
          for (const certFile of req.files.certificates) {
            const certResult = await uploadToCloudinary(certFile.buffer, 'vendor-documents/certificates');
            documents.certificates.push({
              url: certResult.secure_url,
              publicId: certResult.public_id,
              uploadedAt: new Date(),
              name: certFile.originalname
            });
          }
        }
        // Handle cancelled cheque photo
        if (req.files.cancelledCheque && req.files.cancelledCheque[0]) {
          const chequeResult = await uploadToCloudinary(req.files.cancelledCheque[0].buffer, 'vendor-documents/cheque');
          documents.cancelledCheque = {
            url: chequeResult.secure_url,
            publicId: chequeResult.public_id,
            uploadedAt: new Date()
          };
        }
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload documents',
          error: uploadError.message
        });
      }
    }

    // Parse educational qualifications if it's a string
    let parsedQualifications = [];
    if (educationalQualifications) {
      if (typeof educationalQualifications === 'string') {
        parsedQualifications = JSON.parse(educationalQualifications);
      } else {
        parsedQualifications = educationalQualifications;
      }
    }

    // Create vendor
    const vendor = await Vendor.create({
      name,
      email,
      phone,
      password,
      bankDetails: typeof bankDetails === 'string' ? JSON.parse(bankDetails) : bankDetails,
      educationalQualifications: parsedQualifications,
      experience: parseInt(experience),
      documents,
      address: typeof address === 'string' ? JSON.parse(address) : address
    });

    // Generate email verification OTP
    const { otp } = await createOTPToken({
      userId: vendor._id,
      userModel: 'Vendor',
      type: TOKEN_TYPES.EMAIL_VERIFICATION,
      expiryMinutes: 10
    });

    // Send verification email
    await sendOTPEmail({
      email: vendor.email,
      name: vendor.name,
      otp,
      type: 'verification'
    });

    // Send welcome email
    await sendWelcomeEmail({
      email: vendor.email,
      name: vendor.name
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email. Your account is pending admin approval.',
      data: {
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          experience: vendor.experience,
          isEmailVerified: vendor.isEmailVerified,
          isApproved: vendor.isApproved
        }
      }
    });
  } catch (error) {
    console.error('Vendor registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

/**
 * Login vendor
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

    // Find vendor with password
    const vendor = await Vendor.findOne({ email }).select('+password');

    if (!vendor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!vendor.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Check if vendor is approved
    if (!vendor.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval. Please wait for approval.'
      });
    }

    // Verify password
    const isPasswordValid = await vendor.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair({
      userId: vendor._id,
      role: vendor.role,
      email: vendor.email
    });

    // Set cookies
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
        vendor: {
          id: vendor._id,
          name: vendor.name,
          email: vendor.email,
          phone: vendor.phone,
          experience: vendor.experience,
          isEmailVerified: vendor.isEmailVerified,
          isApproved: vendor.isApproved
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    console.error('Vendor login error:', error);
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

    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.json({
        success: true,
        message: 'If the email exists, a password reset OTP has been sent.'
      });
    }

    // Create password reset OTP
    const { otp } = await createOTPToken({
      userId: vendor._id,
      userModel: 'Vendor',
      type: TOKEN_TYPES.PASSWORD_RESET,
      expiryMinutes: parseInt(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES) || 10
    });

    // Send OTP email
    await sendOTPEmail({
      email: vendor.email,
      name: vendor.name,
      otp,
      type: 'password_reset'
    });

    res.json({
      success: true,
      message: 'Password reset OTP sent to your email'
    });
  } catch (error) {
    console.error('Vendor forgot password error:', error);
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

    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Verify OTP
    const { isValid, tokenDoc, error } = await verifyOTPToken({
      userId: vendor._id,
      userModel: 'Vendor',
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
    vendor.password = newPassword;
    await vendor.save();

    // Mark token as used
    await markTokenAsUsed(tokenDoc._id);

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    console.error('Vendor reset password error:', error);
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

    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (vendor.isEmailVerified) {
      return res.json({
        success: true,
        message: 'Email already verified'
      });
    }

    // Verify OTP
    const { isValid, tokenDoc, error } = await verifyOTPToken({
      userId: vendor._id,
      userModel: 'Vendor',
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
    vendor.isEmailVerified = true;
    await vendor.save();

    // Mark token as used
    await markTokenAsUsed(tokenDoc._id);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Vendor email verification error:', error);
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

    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (vendor.isEmailVerified) {
      return res.json({
        success: true,
        message: 'Email already verified'
      });
    }

    // Generate new OTP
    const { otp } = await createOTPToken({
      userId: vendor._id,
      userModel: 'Vendor',
      type: TOKEN_TYPES.EMAIL_VERIFICATION,
      expiryMinutes: 10
    });

    // Send OTP email
    await sendOTPEmail({
      email: vendor.email,
      name: vendor.name,
      otp,
      type: 'verification'
    });

    res.json({
      success: true,
      message: 'Verification OTP sent to your email'
    });
  } catch (error) {
    console.error('Vendor resend email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification OTP',
      error: error.message
    });
  }
};

/**
 * Logout vendor
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
    console.error('Vendor logout error:', error);
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
  verifyEmail,
  resendEmailVerification,
  logout
};

