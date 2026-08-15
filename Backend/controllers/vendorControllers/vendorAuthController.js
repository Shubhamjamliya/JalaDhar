const mongoose = require('mongoose');
const Vendor = require('../../models/Vendor');
const VendorBankDetails = require('../../models/VendorBankDetails');
const VendorDocument = require('../../models/VendorDocument');
const Token = require('../../models/Token');
const Service = require('../../models/Service');
const { generateTokenPair } = require('../../utils/tokenService');
const { createOTPToken, verifyOTPToken, markTokenAsUsed } = require('../../services/otpService');
const { sendOTPEmail, sendWelcomeEmail } = require('../../services/emailService');
const { sendSMSOTP } = require('../../services/smsService');
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

    // Send OTP SMS via SMS India Hub
    const smsResult = await sendSMSOTP({
      phone,
      otp,
      type: 'verification'
    });

    if (!emailResult.success && !smsResult.success) {
      await Token.deleteOne({ _id: tokenDoc._id });
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP via email and SMS',
        error: emailResult.error || smsResult.error
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to mobile & email successfully',
      data: {
        token: tokenDoc.token,
        email,
        phone
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
      dob,
      bloodGroup,
      panNo,
      isGstRegistered,
      gstNumber,
      languages,
      bankDetails,
      educationalQualifications,
      education,
      institution,
      graduationYear,
      specialization,
      experience,
      experienceDetails,
      surveysCompleted,
      instruments,
      machineType,
      servicePrice,
      address,
      otp,
      token,
      gender,
      designation,
      district,
      state,
      serviceRadius,
      multipleStates,
      willingToTravel,
      modeOfTravel,
      travelChargesPerKm
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

    // Verify OTP (Allows 123456 / 666666 fallback when SMS service key is not configured)
    const isFallbackOtpAllowed = (process.env.ENABLE_SMS !== 'true' || !process.env.SMS_INDIA_API_KEY || process.env.ALLOW_DEMO_OTP === 'true') && (otp === '123456' || otp === '666666');
    if (tokenDoc.otp !== otp && !isFallbackOtpAllowed) {
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
        if (req.files.aadharCards && req.files.aadharCards.length > 0) {
          documents.aadharCards = [];
          for (const aadharFile of req.files.aadharCards) {
            const aadharResult = await uploadToCloudinary(aadharFile.buffer, 'vendor-documents/aadhar');
            documents.aadharCards.push({
              url: aadharResult.secure_url,
              publicId: aadharResult.public_id,
              uploadedAt: new Date(),
              name: aadharFile.originalname
            });
          }
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
        // Handle service images
        if (req.files.serviceImages && req.files.serviceImages.length > 0) {
          documents.serviceImages = [];
          for (const sImg of req.files.serviceImages) {
            const sImgResult = await uploadToCloudinary(sImg.buffer, 'vendor-services', 'service-images');
            documents.serviceImages.push({
              url: sImgResult.secure_url,
              publicId: sImgResult.public_id,
              uploadedAt: new Date()
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

    // Parse educational qualifications
    let parsedQualifications = [];
    if (educationalQualifications) {
      if (typeof educationalQualifications === 'string') {
        try {
          parsedQualifications = JSON.parse(educationalQualifications);
        } catch (e) {
          // If parse fails, assume it's a raw string, but schema expects array of objects
          // We can't easily map a single string to [{degree, ...}] without institution
          console.log("Failed to parse educationalQualifications JSON", e);
        }
      } else {
        parsedQualifications = educationalQualifications;
      }
    } else if (education) {
      // Construct from separate fields
      parsedQualifications = [{
        degree: education,
        institution: institution || 'Not Specified',
        year: new Date().getFullYear(), // Default as not asked in form
        percentage: 0 // Default
      }];
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

    // Parse instruments if it's a string or from machineType
    let parsedInstruments = [];
    if (instruments) {
      parsedInstruments = typeof instruments === 'string' ? JSON.parse(instruments) : instruments;
    } else if (machineType) {
      const machineNames = machineType.split(',').map(m => m.trim()).filter(Boolean);
      parsedInstruments = machineNames.map(m => ({
        name: m,
        category: m.includes('Resistivity') ? 'Resistivity Meter' : (m.includes('PQWT') ? 'PQWT' : (m.includes('ADMT') ? 'ADMT' : (m.includes('3D') ? '3D Locator' : (m.includes('Dowsing') ? 'Dowsing Rods' : 'Other'))))
      }));
    }

    // Parse languages if provided
    let parsedLanguages = ['English', 'Hindi'];
    if (languages) {
      if (Array.isArray(languages)) {
        parsedLanguages = languages;
      } else if (typeof languages === 'string') {
        parsedLanguages = languages.split(',').map(l => l.trim()).filter(Boolean);
      }
    }

    // Parse multiple states if it's a string or array
    let parsedMultipleStates = [];
    if (multipleStates) {
      if (typeof multipleStates === 'string') {
        try {
          parsedMultipleStates = JSON.parse(multipleStates);
        } catch (e) {
          parsedMultipleStates = multipleStates.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else if (Array.isArray(multipleStates)) {
        parsedMultipleStates = multipleStates;
      }
    }

    // Parse mode of travel if it's a string or array
    let parsedModeOfTravel = [];
    if (modeOfTravel) {
      if (typeof modeOfTravel === 'string') {
        try {
          parsedModeOfTravel = JSON.parse(modeOfTravel);
        } catch (e) {
          parsedModeOfTravel = modeOfTravel.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else if (Array.isArray(modeOfTravel)) {
        parsedModeOfTravel = modeOfTravel;
      }
    }

    // Determine initial service areas array
    let serviceAreasList = [];
    if (district && state) {
      serviceAreasList.push(`${district}, ${state}`);
    } else if (state) {
      serviceAreasList.push(state);
    }
    if (parsedMultipleStates && parsedMultipleStates.length > 0) {
      serviceAreasList.push(...parsedMultipleStates);
    }
    serviceAreasList = Array.from(new Set(serviceAreasList.filter(Boolean)));

    // Create vendor with email verified (without bankDetails and documents)
    const vendorId = new mongoose.Types.ObjectId();
    const vendorData = {
      _id: vendorId,
      expertId: `EXP-${vendorId.toString().slice(-6).toUpperCase()}`,
      name,
      email,
      phone,
      password,
      dob: dob || null,
      bloodGroup: bloodGroup || null,
      panNo: panNo || null,
      isGstRegistered: isGstRegistered || null,
      gstNumber: gstNumber || null,
      languages: parsedLanguages,
      education: education || null,
      institution: institution || null,
      graduationYear: graduationYear || null,
      specialization: specialization || null,
      surveysCompleted: surveysCompleted ? parseInt(surveysCompleted) : 0,
      machineType: machineType || null,
      educationalQualifications: parsedQualifications,
      experience: parseInt(experience) || 0,
      experienceDetails,
      instruments: parsedInstruments,
      servicePrice: servicePrice ? parseFloat(servicePrice) : null,
      address: parsedAddress,
      district: district || (parsedAddress?.district || null),
      state: state || (parsedAddress?.state || null),
      serviceRadius: serviceRadius || "50 km",
      multipleStates: parsedMultipleStates,
      willingToTravel: willingToTravel || "Yes",
      modeOfTravel: parsedModeOfTravel,
      travelChargesPerKm: travelChargesPerKm ? parseFloat(travelChargesPerKm) : 0,
      serviceAreas: serviceAreasList.length > 0 ? serviceAreasList : undefined,
      isEmailVerified: true, // Email is verified via OTP
      gender,
      designation
    };

    if (documents?.profilePicture?.url) {
      vendorData.profilePicture = documents.profilePicture.url;
    }

    const vendor = await Vendor.create(vendorData);

    // Create bank details in separate collection
    let parsedBankDetails = null;
    if (bankDetails) {
      if (typeof bankDetails === 'string') {
        try {
          parsedBankDetails = JSON.parse(bankDetails);
        } catch (e) {
          parsedBankDetails = null;
        }
      } else if (typeof bankDetails === 'object') {
        parsedBankDetails = bankDetails;
      }
    }

    if (!parsedBankDetails) {
      const accountHolder = req.body['bankDetails[accountHolderName]'] || req.body['bankDetails.accountHolderName'] || req.body.accountHolderName;
      const accountNum = req.body['bankDetails[accountNumber]'] || req.body['bankDetails.accountNumber'] || req.body.accountNumber;
      const ifsc = req.body['bankDetails[ifscCode]'] || req.body['bankDetails.ifscCode'] || req.body.ifscCode;
      const bank = req.body['bankDetails[bankName]'] || req.body['bankDetails.bankName'] || req.body.bankName;
      const branch = req.body['bankDetails[branchName]'] || req.body['bankDetails.branchName'] || req.body.branchName;

      if (accountHolder && accountNum && ifsc && bank) {
        parsedBankDetails = {
          accountHolderName: accountHolder,
          accountNumber: accountNum,
          ifscCode: ifsc,
          bankName: bank,
          branchName: branch || null
        };
      }
    }

    if (parsedBankDetails && parsedBankDetails.accountNumber) {
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
    if (documents.aadharCards && documents.aadharCards.length > 0) {
      for (const card of documents.aadharCards) {
        documentPromises.push(
          VendorDocument.create({
            vendor: vendor._id,
            documentType: 'AADHAR',
            url: card.url,
            publicId: card.publicId,
            uploadedAt: card.uploadedAt,
            name: card.name,
            status: 'PENDING'
          })
        );
      }
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

    // Create Service if machineType is provided
    if (machineType) {
      const newService = await Service.create({
        vendor: vendor._id,
        name: "Groundwater Survey",
        description: "Expert Groundwater Survey Services using advanced instruments.",
        machineType: machineType,
        skills: ["Groundwater Survey"],
        price: servicePrice ? parseFloat(servicePrice) : 0,
        duration: 60,
        status: "PENDING",
        images: documents.serviceImages || [],
        category: "Groundwater Survey",
        isActive: true
      });

      // Update vendor with service reference
      vendor.services.push(newService._id);
      await vendor.save();
    }

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

    const { email, phone, identifier, password } = req.body;
    const inputVal = (email || phone || identifier || '').trim();

    if (!inputVal || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/Phone and password are required'
      });
    }

    const cleanPhone = inputVal.replace(/\D/g, '');
    const searchConditions = [
      { email: inputVal.toLowerCase() },
      { phone: inputVal },
      { phone: cleanPhone },
      { phone: `+91${cleanPhone}` },
      { phone: `91${cleanPhone}` }
    ];

    let vendor = await Vendor.findOne({ $or: searchConditions }).select('+password');

    if (!vendor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/phone or password. Please check your credentials.'
      });
    }

    // Check if account is active
    if (vendor.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await vendor.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/phone or password'
      });
    }

    // Check if email/phone is verified (auto-verify in dev/demo mode if needed)
    if (!vendor.isEmailVerified && process.env.NODE_ENV === 'development') {
      vendor.isEmailVerified = true;
      await vendor.save();
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

    const { email, phone, identifier } = req.body;
    const inputVal = (email || phone || identifier || '').trim();

    if (!inputVal) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email or mobile number'
      });
    }

    const cleanPhone = inputVal.replace(/\D/g, '');
    const searchConditions = [
      { email: inputVal.toLowerCase() },
      { phone: inputVal },
      { phone: cleanPhone },
      { phone: `+91${cleanPhone}` },
      { phone: `91${cleanPhone}` }
    ];

    const vendor = await Vendor.findOne({ $or: searchConditions });
    if (!vendor) {
      return res.json({
        success: true,
        message: 'If the email or phone exists, a password reset OTP has been sent.'
      });
    }

    // Create password reset OTP
    const { otp } = await createOTPToken({
      userId: vendor._id,
      userModel: 'Vendor',
      type: TOKEN_TYPES.PASSWORD_RESET,
      expiryMinutes: parseInt(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES) || 10
    });

    // Send OTP SMS if phone is available
    if (vendor.phone) {
      await sendSMSOTP({
        phone: vendor.phone,
        otp,
        type: 'password_reset'
      }).catch(err => console.error('Vendor forgot password SMS send error:', err));
    }

    // Send OTP email if email is available
    if (vendor.email) {
      await sendOTPEmail({
        email: vendor.email,
        name: vendor.name,
        otp,
        type: 'password_reset'
      }).catch(err => console.error('Vendor forgot password Email send error:', err));
    }

    res.json({
      success: true,
      message: 'Password reset OTP sent to your registered mobile number / email'
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
    const { email, phone, identifier, otp, newPassword } = req.body;
    const inputVal = (email || phone || identifier || '').trim();

    if (!inputVal) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email or mobile number'
      });
    }

    const cleanPhone = inputVal.replace(/\D/g, '');
    const searchConditions = [
      { email: inputVal.toLowerCase() },
      { phone: inputVal },
      { phone: cleanPhone },
      { phone: `+91${cleanPhone}` },
      { phone: `91${cleanPhone}` }
    ];

    let vendor = await Vendor.findOne({ $or: searchConditions });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'No registered Expert account found for this mobile number or email.'
      });
    }

    const isSmsConfigured = process.env.ENABLE_SMS === 'true' && Boolean(process.env.SMS_INDIA_API_KEY);
    const isFallbackOtpAllowed = (!isSmsConfigured || process.env.ALLOW_DEMO_OTP === 'true' || process.env.NODE_ENV === 'development') && (otp === '123456' || otp === '666666');

    // Verify OTP if not fallback
    const { isValid, tokenDoc, error } = await verifyOTPToken({
      userId: vendor._id,
      userModel: 'Vendor',
      type: TOKEN_TYPES.PASSWORD_RESET,
      otp
    });

    if (!isValid && !isFallbackOtpAllowed) {
      return res.status(400).json({
        success: false,
        message: error || 'Invalid or expired OTP'
      });
    }

    // Update password on original existing vendor document
    vendor.password = newPassword;
    await vendor.save();

    if (tokenDoc) {
      await markTokenAsUsed(tokenDoc._id);
    }

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

/**
 * Verify password reset OTP for Vendor
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

    const cleanPhone = inputVal.replace(/\D/g, '');
    let searchConditions = [
      { email: inputVal.toLowerCase() },
      { phone: inputVal },
      { phone: cleanPhone },
      { phone: `+91${cleanPhone}` },
      { phone: `91${cleanPhone}` }
    ];

    const vendor = await Vendor.findOne({ $or: searchConditions });

    const isSmsConfigured = process.env.ENABLE_SMS === 'true' && Boolean(process.env.SMS_INDIA_API_KEY);
    const isFallbackOtpAllowed = (!isSmsConfigured || process.env.ALLOW_DEMO_OTP === 'true' || process.env.NODE_ENV === 'development') && (otp === '123456' || otp === '666666');

    if (!vendor) {
      if (isFallbackOtpAllowed) {
        return res.json({
          success: true,
          message: 'OTP verified successfully'
        });
      }
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Verify OTP
    const { isValid, error } = await verifyOTPToken({
      userId: vendor._id,
      userModel: 'Vendor',
      type: TOKEN_TYPES.PASSWORD_RESET,
      otp
    });

    if (!isValid && !isFallbackOtpAllowed) {
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
    console.error('Vendor verify reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message
    });
  }
};

module.exports = {
  sendRegistrationOTP,
  register,
  login,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  verifyEmail,
  resendEmailVerification,
  logout
};

