const mongoose = require('mongoose');
const Admin = require('../../models/Admin');
const Token = require('../../models/Token');
const { generateTokenPair } = require('../../utils/tokenService');
const { validationResult } = require('express-validator');
const { createOTPToken, verifyOTPToken, markTokenAsUsed } = require('../../services/otpService');
const { sendOTPEmail } = require('../../services/emailService');
const { TOKEN_TYPES } = require('../../utils/constants');
const { generateOTP, generateToken } = require('../../utils/generateOTP');

/**
 * Register new admin with admin code
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

    const { name, email, password, adminCode } = req.body;

    // Validate admin code
    const validAdminCode = process.env.ADMIN_REGISTRATION_CODE;
    if (!validAdminCode) {
      return res.status(500).json({
        success: false,
        message: 'Admin registration is not configured. Please contact system administrator.'
      });
    }

    if (adminCode !== validAdminCode) {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin registration code'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password,
      role: 'ADMIN',
      permissions: ['all'],
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Admin registration successful',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions
        }
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin registration failed',
      error: error.message
    });
  }
};

/**
 * Login admin (supports Email OR Mobile Number)
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
    const identifier = (email || '').trim();

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Email or mobile number is required'
      });
    }

    // Build flexible query matching email or mobile number
    let query;
    if (identifier.includes('@')) {
      query = { email: identifier.toLowerCase() };
    } else {
      const digitsOnly = identifier.replace(/\D/g, '');
      const last10 = digitsOnly.slice(-10);
      query = {
        $or: [
          { phone: identifier },
          { phone: digitsOnly },
          { phone: `+91${last10}` },
          { phone: last10 },
          { email: identifier.toLowerCase() }
        ]
      };
    }

    // Find admin with password
    const admin = await Admin.findOne(query).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email/mobile number and password.'
      });
    }

    // Check if account is active
    if (admin.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email/mobile number and password.'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair({
      userId: admin._id,
      role: admin.role,
      email: admin.email
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
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          lastLogin: admin.lastLogin
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
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

    const admin = await Admin.findOne({ email });
    if (!admin) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If the email exists, a password reset OTP has been sent.'
      });
    }

    // Create password reset OTP
    const { otp } = await createOTPToken({
      userId: admin._id,
      userModel: 'Admin',
      type: TOKEN_TYPES.PASSWORD_RESET,
      expiryMinutes: parseInt(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES) || 10
    });

    // Send OTP email
    await sendOTPEmail({
      email: admin.email,
      name: admin.name,
      otp,
      type: 'password_reset'
    });

    res.json({
      success: true,
      message: 'Password reset OTP sent to your email'
    });
  } catch (error) {
    console.error('Admin forgot password error:', error);
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

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Verify OTP
    const { isValid, tokenDoc, error } = await verifyOTPToken({
      userId: admin._id,
      userModel: 'Admin',
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
    admin.password = newPassword;
    await admin.save();

    // Mark token as used
    await markTokenAsUsed(tokenDoc._id);

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    console.error('Admin reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: error.message
    });
  }
};

/**
 * Logout admin
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
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

/**
 * Get current admin profile
 */
const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.userId);
    res.json({
      success: true,
      data: {
        admin
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

/**
 * Send OTP for admin registration (supports EMAIL and PHONE)
 */
const sendAdminRegistrationOTP = async (req, res) => {
  try {
    const { email, phone, name, verifyMethod = 'EMAIL' } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    if (verifyMethod === 'PHONE') {
      if (!phone || phone.trim().length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Valid mobile number is required for SMS OTP verification'
        });
      }
      const existingAdmin = await Admin.findOne({ phone: phone.trim() });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Admin with this mobile number already exists'
        });
      }
    } else {
      if (!email || !email.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'Valid email address is required for Email OTP verification'
        });
      }
      const existingAdmin = await Admin.findOne({ email: email.toLowerCase().trim() });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Admin with this email already exists'
        });
      }
    }

    // Delete any existing tokens for this target
    const tokenQuery = { type: TOKEN_TYPES.ADMIN_REGISTRATION, isUsed: false };
    if (verifyMethod === 'PHONE') {
      tokenQuery.phone = phone.trim();
    } else {
      tokenQuery.email = email.toLowerCase().trim();
    }
    await Token.deleteMany(tokenQuery);

    const otp = generateOTP(6);
    const token = generateToken(32);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const tokenDoc = await Token.create({
      userId: new mongoose.Types.ObjectId(), // Dummy ObjectId for schema validation
      userModel: 'Admin',
      token,
      type: TOKEN_TYPES.ADMIN_REGISTRATION,
      otp,
      email: email ? email.toLowerCase().trim() : undefined,
      phone: phone ? phone.trim() : undefined,
      expiresAt
    });

    let sentSuccessfully = false;
    let channelMessage = '';

    if (verifyMethod === 'PHONE') {
      try {
        const smsService = require('../../services/smsService');
        const smsResult = await smsService.sendSMSOTP({
          phone: phone.trim(),
          otp,
          type: 'admin_registration'
        });
        sentSuccessfully = smsResult?.success === true;
      } catch (e) {
        console.warn('⚠️ SMS warning during admin registration OTP:', e.message);
      }
      console.log(`🔑 [ADMIN_REGISTRATION_PHONE_OTP] -> Phone: ${phone} | Code: ${otp} | Name: ${name}`);
      channelMessage = `OTP sent to mobile number ${phone} successfully`;
    } else {
      try {
        const emailResult = await sendOTPEmail({
          email: email.toLowerCase().trim(),
          name,
          otp,
          type: 'admin_registration'
        });
        sentSuccessfully = emailResult?.success === true;
      } catch (e) {
        console.warn('⚠️ SMTP warning during admin registration OTP:', e.message);
      }
      console.log(`🔑 [ADMIN_REGISTRATION_EMAIL_OTP] -> Email: ${email} | Code: ${otp} | Name: ${name}`);
      channelMessage = `OTP sent to email ${email} successfully`;
    }

    res.json({
      success: true,
      message: channelMessage,
      data: {
        token: tokenDoc.token,
        email: email ? email.toLowerCase().trim() : '',
        phone: phone ? phone.trim() : '',
        verifyMethod,
        devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
      }
    });
  } catch (error) {
    console.error('Send admin registration OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
};

/**
 * Register new admin with OTP verification (supports EMAIL and PHONE)
 */
const registerAdminWithOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, otp, token, role, phone, permissions, verifyMethod = 'EMAIL' } = req.body;

    // Verify OTP using token
    const tokenQuery = {
      token,
      type: TOKEN_TYPES.ADMIN_REGISTRATION,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    };
    if (verifyMethod === 'PHONE' && phone) {
      tokenQuery.phone = phone.trim();
    } else if (email) {
      tokenQuery.email = email.toLowerCase().trim();
    }

    const tokenDoc = await Token.findOne(tokenQuery);

    if (!tokenDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP token. Please request a new OTP.'
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
        message: `Invalid OTP. ${5 - tokenDoc.attempts} attempts remaining.`
      });
    }

    // Determine clean email (fallback for phone-only registration)
    const adminEmail = email && email.trim()
      ? email.toLowerCase().trim()
      : `${phone.replace(/\D/g, '')}@jaladhar.internal`;

    // Check if admin already exists (double check)
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (existingAdmin) {
      await markTokenAsUsed(tokenDoc._id);
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Mark token as used
    tokenDoc.isUsed = true;
    await tokenDoc.save();

    // Map role to department
    let department = 'GENERAL';
    if (role === 'SUPER_ADMIN') department = 'SUPER';
    else if (role === 'EXPERT_VERIFICATION_ADMIN' || role === 'VERIFIER_ADMIN') department = 'VERIFICATION';
    else if (role === 'OPERATIONS_ADMIN') department = 'OPERATIONS';
    else if (role === 'FINANCE_ADMIN') department = 'FINANCE';
    else if (role === 'SUPPORT_ADMIN') department = 'SUPPORT';
    else if (role === 'QC_ADMIN') department = 'QUALITY_CONTROL';

    // Helper for default role permissions
    const getDefaultPermissions = (r) => {
      switch (r) {
        case 'SUPER_ADMIN':
        case 'ADMIN':
          return ['all', 'operations', 'verification', 'finance', 'support', 'qc', 'reports', 'settings'];
        case 'OPERATIONS_ADMIN':
          return ['operations', 'reports'];
        case 'EXPERT_VERIFICATION_ADMIN':
        case 'VERIFIER_ADMIN':
          return ['verification'];
        case 'FINANCE_ADMIN':
          return ['finance', 'reports'];
        case 'SUPPORT_ADMIN':
          return ['support'];
        case 'QC_ADMIN':
          return ['qc'];
        default:
          return ['operations'];
      }
    };

    const resolvedPermissions = (Array.isArray(permissions) && permissions.length > 0)
      ? permissions
      : getDefaultPermissions(role || 'ADMIN');

    // Create admin
    const admin = await Admin.create({
      name: name.trim(),
      email: adminEmail,
      password,
      role: role || 'ADMIN',
      department,
      phone: phone ? phone.trim() : null,
      permissions: resolvedPermissions,
      isActive: true,
      isAvailableForAssignment: true
    });

    // Mark token as used
    await markTokenAsUsed(tokenDoc._id);

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          phone: admin.phone,
          permissions: admin.permissions
        }
      }
    });
  } catch (error) {
    console.error('Admin registration with OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin registration failed',
      error: error.message
    });
  }
};

/**
 * Get all admins (Super Admin only)
 */
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: { admins }
    });
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admins',
      error: error.message
    });
  }
};

/**
 * Update admin role, profile, phone, password, or permissions (Super Admin only)
 */
const updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { name, role, isActive, isAvailableForAssignment, department, phone, password, permissions } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Don't allow changing own role if it's the last super admin
    if (admin._id.toString() === req.userId && role && role !== 'SUPER_ADMIN') {
      const superAdminCount = await Admin.countDocuments({ role: 'SUPER_ADMIN', isActive: true });
      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change role of the last active Super Admin'
        });
      }
    }

    if (name !== undefined) admin.name = name.trim();
    if (role !== undefined) admin.role = role;
    if (isActive !== undefined) admin.isActive = isActive;
    if (isAvailableForAssignment !== undefined) admin.isAvailableForAssignment = isAvailableForAssignment;
    if (department !== undefined) admin.department = department;
    if (phone !== undefined) admin.phone = phone ? phone.trim() : null;
    if (password && typeof password === 'string' && password.trim().length >= 6) {
      admin.password = password.trim();
    }
    if (permissions !== undefined && Array.isArray(permissions)) {
      admin.permissions = permissions;
    }

    await admin.save();

    res.json({
      success: true,
      message: 'Admin updated successfully',
      data: { admin }
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin',
      error: error.message
    });
  }
};

/**
 * Delete admin (Super Admin only)
 */
const deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Don't allow deleting self
    if (admin._id.toString() === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Check if it's the last super admin
    if (admin.role === 'SUPER_ADMIN') {
      const superAdminCount = await Admin.countDocuments({ role: 'SUPER_ADMIN' });
      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last Super Admin'
        });
      }
    }

    await Admin.findByIdAndDelete(adminId);

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete admin',
      error: error.message
    });
  }
};

/**
 * Get Department Auto-Assignment Master Toggles (Super Admin only)
 */
const getAssignmentToggles = async (req, res) => {
  try {
    const Settings = require('../../models/Settings');
    const settings = await Settings.find({ category: 'assignment' });
    
    const toggles = {
      AUTO_ASSIGN_VERIFICATION: true,
      AUTO_ASSIGN_OPERATIONS: true,
      AUTO_ASSIGN_FINANCE: true,
      AUTO_ASSIGN_SUPPORT: true,
      AUTO_ASSIGN_QC: true
    };

    settings.forEach(s => {
      toggles[s.key] = s.value === true || s.value === 'true';
    });

    res.json({
      success: true,
      data: { toggles }
    });
  } catch (error) {
    console.error('Get assignment toggles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment toggles',
      error: error.message
    });
  }
};

/**
 * Update Department Auto-Assignment Master Toggle (Super Admin only)
 */
const updateAssignmentToggle = async (req, res) => {
  try {
    const { key, value } = req.body;
    const Settings = require('../../models/Settings');

    const validKeys = [
      'AUTO_ASSIGN_VERIFICATION',
      'AUTO_ASSIGN_OPERATIONS',
      'AUTO_ASSIGN_FINANCE',
      'AUTO_ASSIGN_SUPPORT',
      'AUTO_ASSIGN_QC'
    ];

    if (!validKeys.includes(key)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment toggle key'
      });
    }

    const setting = await Settings.findOneAndUpdate(
      { key },
      {
        key,
        value: Boolean(value),
        label: key.replace(/_/g, ' '),
        category: 'assignment',
        type: 'boolean',
        updatedBy: req.userId
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: `Assignment toggle ${key} updated to ${value}`,
      data: { setting }
    });
  } catch (error) {
    console.error('Update assignment toggle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment toggle',
      error: error.message
    });
  }
};

/**
 * Get Team Performance & Evaluation Statistics (Super Admin only)
 */
const getTeamPerformanceStats = async (req, res) => {
  try {
    const Dispute = require('../../models/Dispute');
    const admins = await Admin.find({ isActive: { $ne: false } }).select(
      'name email role department isAvailableForAssignment activeTicketsCount lastAssignedAt createdAt'
    );

    let disputeStats = [];
    try {
      disputeStats = await Dispute.aggregate([
        { $match: { assignedTo: { $ne: null } } },
        {
          $group: {
            _id: '$assignedTo',
            totalAssigned: { $sum: 1 },
            resolvedCount: {
              $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'CLOSED']] }, 1, 0] }
            },
            pendingCount: {
              $sum: { $cond: [{ $in: ['$status', ['PENDING', 'IN_PROGRESS']] }, 1, 0] }
            }
          }
        }
      ]);
    } catch (aggErr) {
      console.warn('Dispute aggregation warning:', aggErr.message);
    }

    const statsMap = {};
    if (Array.isArray(disputeStats)) {
      disputeStats.forEach((s) => {
        if (s._id) statsMap[s._id.toString()] = s;
      });
    }

    const performance = admins.map((admin) => {
      const stats = statsMap[admin._id.toString()] || {
        totalAssigned: 0,
        resolvedCount: 0,
        pendingCount: 0
      };
      const resolutionRate =
        stats.totalAssigned > 0
          ? Math.round((stats.resolvedCount / stats.totalAssigned) * 100)
          : 100;

      return {
        adminId: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        department: admin.department,
        isAvailableForAssignment: admin.isAvailableForAssignment,
        activeTicketsCount: admin.activeTicketsCount || stats.pendingCount,
        lastAssignedAt: admin.lastAssignedAt,
        totalAssigned: stats.totalAssigned,
        resolvedCount: stats.resolvedCount,
        resolutionRate: `${resolutionRate}%`,
        joinedAt: admin.createdAt
      };
    });

    return res.json({
      success: true,
      data: { performance }
    });
  } catch (error) {
    console.error('Get team performance stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch team performance statistics',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  sendAdminRegistrationOTP,
  registerAdminWithOTP,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  getAssignmentToggles,
  updateAssignmentToggle,
  getTeamPerformanceStats
};

