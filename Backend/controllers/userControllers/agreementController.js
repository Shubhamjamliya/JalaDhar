const Settings = require('../../models/Settings');
const User = require('../../models/User');
const AgreementAcceptanceLog = require('../../models/AgreementAcceptanceLog');

const DEFAULT_USER_AGREEMENT = `<p><strong>Jaladhaara User Agreement</strong></p>
<p>This User Agreement ("Agreement") is entered into between Jaladhaara Groundwater Survey Pvt. Ltd. ("Jaladhaara") and the registered User ("User"). By clicking "I Agree", the User accepts the following terms:</p>
<ol>
  <li><strong>Platform Services:</strong> Jaladhaara is a technology platform that enables Users to connect with independent Experts for groundwater survey services. Jaladhaara does not directly provide groundwater survey or borewell drilling services.</li>
  <li><strong>User Responsibilities:</strong> The User shall provide accurate information, ensure safe access to the survey location, cooperate with the Expert, and make payments through the Jaladhaara platform in accordance with the applicable policies.</li>
  <li><strong>Expert Services:</strong> Groundwater surveys are performed by independent Experts, who are solely responsible for their professional services, technical opinions, recommendations, and survey reports.</li>
  <li><strong>Survey Scope & Disclaimer:</strong> The survey is limited to identifying potential groundwater zones based on the Expert's professional assessment. Groundwater availability, borewell success, water yield, and water quality depend on natural geological conditions and cannot be guaranteed.</li>
  <li><strong>Payments & Policies:</strong> All bookings, payments, cancellations, refunds, rescheduling, and settlements shall be governed by Jaladhaara's applicable policies.</li>
  <li><strong>User Conduct:</strong> The User shall not misuse the platform, provide false information, engage in abusive or unlawful behaviour, or make unauthorized payments outside the Jaladhaara platform.</li>
  <li><strong>Privacy & Confidentiality:</strong> The User consents to the collection, processing, and use of personal information in accordance with Jaladhaara's Privacy Policy.</li>
  <li><strong>Limitation of Liability:</strong> Jaladhaara acts only as a technology platform and shall not be liable for the professional services provided by the Expert, borewell drilling outcomes, groundwater availability, property damage, financial loss, or any indirect or consequential damages arising from the use of the platform.</li>
  <li><strong>Suspension & Termination:</strong> Jaladhaara reserves the right to suspend or terminate any User account for violation of this Agreement, platform policies, or applicable laws.</li>
  <li><strong>Intellectual Property:</strong> All trademarks, logos, software, content, and other intellectual property associated with Jaladhaara are the exclusive property of Jaladhaara Groundwater Survey Pvt. Ltd. and may not be used without prior written permission.</li>
  <li><strong>Amendments:</strong> Jaladhaara may modify this Agreement or its policies from time to time. Continued use of the platform constitutes acceptance of the revised terms.</li>
  <li><strong>Governing Law & Jurisdiction:</strong> This Agreement shall be governed by the laws of India. Any dispute arising out of or relating to this Agreement or the use of the Jaladhaara platform shall be subject to the exclusive jurisdiction of the competent courts at Hyderabad, Telangana.</li>
  <li><strong>Electronic Acceptance:</strong> By clicking "I Agree", the User confirms that they have read, understood, and accepted this Agreement, the Terms & Conditions, Privacy Policy, Booking & Cancellation Policy, Refund Policy, No-Show Policy, and all other applicable Jaladhaara policies. This electronic acceptance shall have the same legal effect as a handwritten signature under applicable law.</li>
</ol>`;

/**
 * Get current active User Agreement & check acceptance status for logged-in user
 */
const getAgreementStatus = async (req, res) => {
  try {
    let agreementSetting = await Settings.findOne({ key: 'user_agreement' });
    let versionSetting = await Settings.findOne({ key: 'user_agreement_version' });

    if (!versionSetting || !versionSetting.value) {
      versionSetting = await Settings.findOneAndUpdate(
        { key: 'user_agreement_version' },
        { value: 'v1.0.0', label: 'User Agreement Active Version', category: 'policy' },
        { upsert: true, new: true }
      );
    }

    if (!agreementSetting || !agreementSetting.value || agreementSetting.value.trim().length < 30) {
      agreementSetting = await Settings.findOneAndUpdate(
        { key: 'user_agreement' },
        { value: DEFAULT_USER_AGREEMENT, label: 'Jaladhaara User Agreement (13 Clauses)', category: 'policy' },
        { upsert: true, new: true }
      );
    }

    const activeVersion = versionSetting ? versionSetting.value : 'v1.0.0';
    const agreementText = agreementSetting ? agreementSetting.value : DEFAULT_USER_AGREEMENT;

    let requiresAcceptance = true;
    let userAcceptedVersion = null;

    if (req.user) {
      const user = await User.findById(req.user._id);
      userAcceptedVersion = user ? user.agreementAcceptedVersion : null;
      requiresAcceptance = !userAcceptedVersion || userAcceptedVersion !== activeVersion;
    }

    return res.status(200).json({
      success: true,
      data: {
        activeVersion,
        userAcceptedVersion,
        requiresAcceptance,
        agreementText
      }
    });
  } catch (error) {
    console.error('Error fetching agreement status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch agreement status',
      error: error.message
    });
  }
};

/**
 * Record electronic agreement acceptance by user
 */
const acceptAgreement = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const versionSetting = await Settings.findOne({ key: 'user_agreement_version' });
    const activeVersion = versionSetting ? versionSetting.value : 'v1.0.0';

    // Extract client metadata
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'Unknown';
    const deviceId = req.body.deviceId || req.headers['user-agent'] || 'Web/Browser';
    const appVersion = req.body.appVersion || req.headers['app-version'] || '1.0.0';

    // Log electronic record
    const logRecord = await AgreementAcceptanceLog.create({
      user: user._id,
      userName: user.name,
      mobileNumber: user.phone,
      agreementVersion: activeVersion,
      acceptedAt: new Date(),
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress.split(',')[0].trim(),
      deviceId,
      appVersion,
      status: 'ACCEPTED'
    });

    // Update user record
    user.agreementAcceptedVersion = activeVersion;
    user.agreementAcceptedAt = new Date();
    await user.save();

    console.log(`✅ User Agreement ${activeVersion} accepted by ${user.name} (${user.phone}) - Log ID: ${logRecord._id}`);

    return res.status(200).json({
      success: true,
      message: 'User agreement accepted successfully',
      data: {
        agreementVersion: activeVersion,
        acceptedAt: user.agreementAcceptedAt,
        logId: logRecord._id
      }
    });
  } catch (error) {
    console.error('Error recording agreement acceptance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record agreement acceptance',
      error: error.message
    });
  }
};

/**
 * Admin: Get all electronic agreement acceptance logs with search & pagination
 */
const getAdminAcceptanceLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search || '';
    const version = req.query.version || '';

    const query = {};

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } }
      ];
    }

    if (version) {
      query.agreementVersion = version;
    }

    const total = await AgreementAcceptanceLog.countDocuments(query);
    const logs = await AgreementAcceptanceLog.find(query)
      .populate('user', 'email role')
      .sort({ acceptedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get list of distinct versions for filtering dropdown
    const availableVersions = await AgreementAcceptanceLog.distinct('agreementVersion');

    return res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        },
        availableVersions
      }
    });
  } catch (error) {
    console.error('Error fetching admin acceptance logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch agreement acceptance logs',
      error: error.message
    });
  }
};

/**
 * Admin: Update User Agreement text & bump version
 */
const updateAdminAgreement = async (req, res) => {
  try {
    const { agreementText, newVersion } = req.body;

    if (!agreementText || !newVersion) {
      return res.status(400).json({
        success: false,
        message: 'agreementText and newVersion are required'
      });
    }

    await Settings.findOneAndUpdate(
      { key: 'user_agreement' },
      { value: agreementText, label: 'Jaladhaara User Agreement (13 Clauses)', category: 'policy' },
      { upsert: true, new: true }
    );

    await Settings.findOneAndUpdate(
      { key: 'user_agreement_version' },
      { value: newVersion, label: 'User Agreement Active Version', category: 'policy' },
      { upsert: true, new: true }
    );

    console.log(`📢 Admin updated User Agreement to version ${newVersion}`);

    return res.status(200).json({
      success: true,
      message: `User Agreement updated to version ${newVersion}. Users will be prompted to accept the updated agreement.`,
      data: {
        activeVersion: newVersion
      }
    });
  } catch (error) {
    console.error('Error updating admin agreement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user agreement',
      error: error.message
    });
  }
};

module.exports = {
  getAgreementStatus,
  acceptAgreement,
  getAdminAcceptanceLogs,
  updateAdminAgreement
};
