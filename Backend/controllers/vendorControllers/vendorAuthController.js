const mongoose = require('mongoose');
const Vendor = require('../../models/Vendor');
const VendorBankDetails = require('../../models/VendorBankDetails');
const VendorDocument = require('../../models/VendorDocument');
const Token = require('../../models/Token');
const { generateTokenPair } = require('../../utils/tokenService');
const { createOTPToken, verifyOTPToken, markTokenAsUsed } = require('../../services/otpService');
const { sendOTPEmail, sendWelcomeEmail } = require('../../services/emailService');
const { geocodeAddress } = require('../../services/geocodingService');
const { TOKEN_TYPES } = require('../../utils/constants');
const { validationResult } = require('express-validator');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const { generateOTP, generateToken } = require('../../utils/generateOTP');

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
 * Send OTP for vendor registration
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

    // Create OTP token with email stored separately
    await Token.deleteMany({ email, type: TOKEN_TYPES.EMAIL_VERIFICATION, isUsed: false });

    const otp = generateOTP(6);
    const token = generateToken(32);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const tokenDoc = await Token.create({
      userId: new mongoose.Types.ObjectId(), // Dummy ObjectId
      userModel: 'Vendor',
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
    console.error('Send vendor registration OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
};

/**
 * Register new vendor with documents and OTP verification
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
      experienceDetails,
      address,
      otp,
      token
    } = req.body;

    if (!otp || !token) {
      return res.status(400).json({
        success: false,
        message: 'OTP and token are required'
      });
    }

    // Verify OTP using token
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

    // Check if vendor already exists (double check)
    const existingVendor = await Vendor.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingVendor) {
      await markTokenAsUsed(tokenDoc._id);
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
        // Handle groundwater registration
        if (req.files.groundwaterRegDetails && req.files.groundwaterRegDetails[0]) {
          const gwResult = await uploadToCloudinary(req.files.groundwaterRegDetails[0].buffer, 'vendor-documents/groundwater');
          documents.groundwaterRegDetails = {
            url: gwResult.secure_url,
            publicId: gwResult.public_id,
            uploadedAt: new Date()
          };
        }
        // Handle training certificates
        if (req.files.trainingCertificates && req.files.trainingCertificates.length > 0) {
          documents.trainingCertificates = [];
          for (const trainFile of req.files.trainingCertificates) {
            const trainResult = await uploadToCloudinary(trainFile.buffer, 'vendor-documents/training');
            documents.trainingCertificates.push({
              url: trainResult.secure_url,
              publicId: trainResult.public_id,
              uploadedAt: new Date(),
              name: trainFile.originalname
            });
          }
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

    // Parse address if it's a string
    let parsedAddress = typeof address === 'string' ? JSON.parse(address) : address;

    // Parse location if it's a string (from "Use Current Location" button) - merge into address
    if (req.body.location) {
      const parsedLocation = typeof req.body.location === 'string' ? JSON.parse(req.body.location) : req.body.location;
      // If location has coordinates but address doesn't, copy them to address
      if (parsedLocation?.coordinates?.lat && parsedLocation?.coordinates?.lng && !parsedAddress?.coordinates?.lat) {
        if (!parsedAddress) parsedAddress = {};
        parsedAddress.coordinates = {
          lat: parsedLocation.coordinates.lat,
          lng: parsedLocation.coordinates.lng
        };
      }
    }

    // Parse selectedPlace if it's a string (from dropdown selection)
    let parsedSelectedPlace = null;
    if (req.body.selectedPlace) {
      parsedSelectedPlace = typeof req.body.selectedPlace === 'string' ? JSON.parse(req.body.selectedPlace) : req.body.selectedPlace;
    }

    // Check if coordinates are available
    const hasAddressCoordinates = parsedAddress?.coordinates?.lat && parsedAddress?.coordinates?.lng;
    const hasSelectedPlace = parsedSelectedPlace && parsedSelectedPlace.placeId;

    // Priority: 1. Selected address from dropdown 2. Geocode address text

    // If address was selected from dropdown, use its coordinates and place info
    if (hasAddressCoordinates && hasSelectedPlace) {
      // Address was selected from dropdown - use its coordinates and place info
      parsedAddress.geoLocation = {
        formattedAddress: parsedSelectedPlace.formattedAddress || '',
        placeId: parsedSelectedPlace.placeId || '',
        geocodedAt: new Date()
      };
      // Coordinates are already in parsedAddress.coordinates from frontend
    } else if (hasAddressCoordinates && !parsedAddress.geoLocation) {
      // If we have coordinates but no geoLocation, try to reverse geocode for formatted address
      try {
        const { reverseGeocode } = require('../../services/geocodingService');
        const reverseData = await reverseGeocode(
          parsedAddress.coordinates.lat,
          parsedAddress.coordinates.lng
        );
        if (reverseData) {
          parsedAddress.geoLocation = {
            formattedAddress: reverseData.formattedAddress,
            placeId: reverseData.placeId,
            geocodedAt: new Date()
          };
        }
      } catch (reverseError) {
        // Silently fail - not critical
      }
    } else if (!hasAddressCoordinates && parsedAddress && (parsedAddress.street || parsedAddress.city || parsedAddress.state || parsedAddress.pincode)) {
      // No coordinates available - geocode the address text
      try {
        const geocodedData = await geocodeAddress(parsedAddress);
        if (geocodedData) {
          // Store coordinates in address.coordinates
          parsedAddress.coordinates = {
            lat: geocodedData.lat,
            lng: geocodedData.lng
          };
          // Store geocoded location data
          parsedAddress.geoLocation = {
            formattedAddress: geocodedData.formattedAddress,
            placeId: geocodedData.placeId,
            geocodedAt: new Date()
          };
        }
      } catch (geocodeError) {
        // Log error but don't fail registration if geocoding fails
      }
    }

    // Create vendor with email verified (without bankDetails and documents)
    const vendorData = {
      name,
      email,
      phone,
      password,
      educationalQualifications: parsedQualifications,
      experience: parseInt(experience),
      experienceDetails,
      address: parsedAddress,
      isEmailVerified: true // Email is verified via OTP
    };

    const vendor = await Vendor.create(vendorData);

    // Create bank details in separate collection
    const parsedBankDetails = typeof bankDetails === 'string' ? JSON.parse(bankDetails) : bankDetails;
    if (parsedBankDetails) {
      await VendorBankDetails.create({
        vendor: vendor._id,
        accountHolderName: parsedBankDetails.accountHolderName,
        accountNumber: parsedBankDetails.accountNumber,
        ifscCode: parsedBankDetails.ifscCode,
        bankName: parsedBankDetails.bankName,
        branchName: parsedBankDetails.branchName || null,
        isActive: true,
        isVerified: false
      });
    }

    // Create documents in separate collection
    const documentPromises = [];
    if (documents.aadharCard) {
      documentPromises.push(
        VendorDocument.create({
          vendor: vendor._id,
          documentType: 'AADHAR',
          url: documents.aadharCard.url,
          publicId: documents.aadharCard.publicId,
          uploadedAt: documents.aadharCard.uploadedAt,
          status: 'PENDING'
        })
      );
    }
    if (documents.panCard) {
      documentPromises.push(
        VendorDocument.create({
          vendor: vendor._id,
          documentType: 'PAN',
          url: documents.panCard.url,
          publicId: documents.panCard.publicId,
          uploadedAt: documents.panCard.uploadedAt,
          status: 'PENDING'
        })
      );
    }
    if (documents.profilePicture) {
      documentPromises.push(
        VendorDocument.create({
          vendor: vendor._id,
          documentType: 'PROFILE_PICTURE',
          url: documents.profilePicture.url,
          publicId: documents.profilePicture.publicId,
          uploadedAt: documents.profilePicture.uploadedAt,
          status: 'PENDING'
        })
      );
    }
    if (documents.cancelledCheque) {
      documentPromises.push(
        VendorDocument.create({
          vendor: vendor._id,
          documentType: 'CHEQUE',
          url: documents.cancelledCheque.url,
          publicId: documents.cancelledCheque.publicId,
          uploadedAt: documents.cancelledCheque.uploadedAt,
          status: 'PENDING'
        })
      );
    }
    if (documents.certificates && Array.isArray(documents.certificates)) {
      for (const cert of documents.certificates) {
        documentPromises.push(
          VendorDocument.create({
            vendor: vendor._id,
            documentType: 'CERTIFICATE',
            url: cert.url,
            publicId: cert.publicId,
            uploadedAt: cert.uploadedAt,
            name: cert.name,
            certificateName: cert.name,
            status: 'PENDING'
          })
        );
      }
    }
    if (documents.trainingCertificates && Array.isArray(documents.trainingCertificates)) {
      for (const tCert of documents.trainingCertificates) {
        documentPromises.push(
          VendorDocument.create({
            vendor: vendor._id,
            documentType: 'TRAINING_CERTIFICATE',
            url: tCert.url,
            publicId: tCert.publicId,
            uploadedAt: tCert.uploadedAt,
            name: tCert.name,
            certificateName: tCert.name,
            status: 'PENDING'
          })
        );
      }
    }
    if (documents.groundwaterRegDetails) {
      documentPromises.push(
        VendorDocument.create({
          vendor: vendor._id,
          documentType: 'GROUNDWATER_REG',
          url: documents.groundwaterRegDetails.url,
          publicId: documents.groundwaterRegDetails.publicId,
          uploadedAt: documents.groundwaterRegDetails.uploadedAt,
          status: 'PENDING'
        })
      );
    }
    await Promise.all(documentPromises);

    // Mark token as used
    await markTokenAsUsed(tokenDoc._id);

    // Send welcome email
    await sendWelcomeEmail({
      email: vendor.email,
      name: vendor.name
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Email verified. Your account is pending admin approval.',
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

    // Check if email is verified
    if (!vendor.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. Check your email for verification OTP.'
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
  sendRegistrationOTP,
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendEmailVerification,
  logout
};

