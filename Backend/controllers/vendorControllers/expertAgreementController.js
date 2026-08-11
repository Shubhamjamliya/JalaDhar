const Settings = require('../../models/Settings');
const Vendor = require('../../models/Vendor');
const ExpertAgreementLog = require('../../models/ExpertAgreementLog');

const DEFAULT_EXPERT_AGREEMENT = `<p><strong>Jaladhaara Expert Onboarding Agreement</strong></p>
<p>By selecting "I Agree & Activate Account", I confirm that:</p>
<ol>
  <li><strong>Agreement Review:</strong> I have read and understood this Agreement.</li>
  <li><strong>Professional Standards:</strong> I will provide groundwater survey services professionally, ethically, and in compliance with applicable laws.</li>
  <li><strong>Sole Professional Responsibility:</strong> I am solely responsible for my surveys, technical opinions, recommendations, reports, and professional conduct.</li>
  <li><strong>Technology Platform Disclaimer:</strong> I understand that Jaladhaara is only a technology platform connecting Customers with independent Experts and is not responsible for my professional services or survey outcomes.</li>
  <li><strong>Privacy & Confidentiality:</strong> I will maintain the confidentiality of customer information and use it only for the booked service.</li>
  <li><strong>No Off-Platform Solicitation:</strong> I will not solicit customers outside the platform or accept unauthorized off-platform payments.</li>
  <li><strong>Groundwater Availability Disclaimer:</strong> I understand that groundwater occurrence depends on natural geological conditions, and I will not guarantee groundwater availability, borewell success, water yield, or water quality.</li>
  <li><strong>Platform Policies Compliance:</strong> I agree to comply with Jaladhaara's Terms & Conditions, Privacy Policy, Booking & Cancellation Policy, Refund Policy, and all other applicable platform policies.</li>
  <li><strong>Account Suspension & Termination:</strong> I understand that Jaladhaara may suspend or terminate my account if I violate this Agreement or any platform policy.</li>
  <li><strong>Governing Law & Jurisdiction:</strong> This Agreement shall be governed by the laws of India, and any dispute shall be subject to the exclusive jurisdiction of the competent courts at Hyderabad, Telangana.</li>
</ol>
<p><strong>Declaration:</strong> I declare that all information and documents submitted by me are true and correct. I voluntarily accept this Agreement and agree to be bound by its terms.</p>`;

/**
 * Generate unique Expert ID e.g. EX-2026-1082
 */
const generateUniqueExpertId = async () => {
  const currentYear = new Date().getFullYear();
  let unique = false;
  let newExpertId = '';
  
  while (!unique) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    newExpertId = `EX-${currentYear}-${randomNum}`;
    const existing = await Vendor.findOne({ expertId: newExpertId });
    if (!existing) {
      unique = true;
    }
  }
  return newExpertId;
};

/**
 * Get Expert Agreement status for logged-in Vendor / Expert
 */
const getExpertAgreementStatus = async (req, res) => {
  try {
    const agreementSetting = await Settings.findOne({ key: 'expert_onboarding_agreement' });
    const versionSetting = await Settings.findOne({ key: 'expert_onboarding_agreement_version' });

    const activeVersion = versionSetting ? versionSetting.value : 'v1.0';
    const agreementText = (agreementSetting && agreementSetting.value && agreementSetting.value.trim().length > 30)
      ? agreementSetting.value
      : DEFAULT_EXPERT_AGREEMENT;

    let requiresAcceptance = true;
    let vendorStatus = 'APPLICATION_SUBMITTED';
    let expertId = null;

    if (req.user) {
      const vendor = await Vendor.findById(req.user._id);
      if (vendor) {
        vendorStatus = vendor.verificationStatus || (vendor.isApproved ? 'ACTIVATED' : 'PENDING');
        expertId = vendor.expertId || null;

        // Requires acceptance if Admin approved documents (VERIFIED_PENDING_AGREEMENT) or if agreement version changed
        if (vendorStatus === 'ACTIVATED' && vendor.expertAgreementAcceptedVersion === activeVersion) {
          requiresAcceptance = false;
        } else if (vendorStatus === 'VERIFIED_PENDING_AGREEMENT' || vendor.isApproved) {
          requiresAcceptance = !vendor.expertAgreementAcceptedVersion || vendor.expertAgreementAcceptedVersion !== activeVersion;
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        activeVersion,
        requiresAcceptance,
        verificationStatus: vendorStatus,
        expertId,
        agreementText
      }
    });
  } catch (error) {
    console.error('Error fetching Expert Agreement status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Expert Agreement status',
      error: error.message
    });
  }
};

/**
 * Record Expert Electronic Agreement Acceptance & Issue Verified Expert ID
 */
const acceptExpertAgreement = async (req, res) => {
  try {
    const vendorId = req.user._id;
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor/Expert account not found' });
    }

    const versionSetting = await Settings.findOne({ key: 'expert_onboarding_agreement_version' });
    const activeVersion = versionSetting ? versionSetting.value : 'v1.0';

    // Extract client metadata
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'Unknown';
    const deviceId = req.body.deviceId || req.headers['user-agent'] || 'Web/Browser';
    const appVersion = req.body.appVersion || req.headers['app-version'] || '1.0.0';

    // Assign Verified Expert ID if not assigned yet
    if (!vendor.expertId) {
      vendor.expertId = await generateUniqueExpertId();
    }

    // Log electronic record
    const logRecord = await ExpertAgreementLog.create({
      vendor: vendor._id,
      expertName: vendor.name,
      expertId: vendor.expertId,
      mobileNumber: vendor.phone,
      agreementVersion: activeVersion,
      acceptedAt: new Date(),
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress.split(',')[0].trim(),
      deviceId,
      appVersion,
      status: 'ACCEPTED'
    });

    // Update vendor profile to ACTIVATED
    vendor.isApproved = true;
    vendor.isActive = true;
    vendor.verificationStatus = 'ACTIVATED';
    vendor.expertAgreementAcceptedVersion = activeVersion;
    vendor.expertAgreementAcceptedAt = new Date();
    await vendor.save();

    console.log(`✅ Expert Agreement ${activeVersion} accepted by ${vendor.name} (${vendor.expertId}) - Status: ACTIVATED`);

    return res.status(200).json({
      success: true,
      message: 'Expert Onboarding Agreement accepted & account activated successfully!',
      data: {
        expertId: vendor.expertId,
        verificationStatus: 'ACTIVATED',
        acceptedAt: vendor.expertAgreementAcceptedAt,
        logId: logRecord._id
      }
    });
  } catch (error) {
    console.error('Error accepting Expert Agreement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record Expert Agreement acceptance',
      error: error.message
    });
  }
};

/**
 * Generate & Download Signed Expert Agreement HTML/PDF page
 */
const downloadExpertAgreementPdf = async (req, res) => {
  try {
    const targetVendorId = req.query.vendorId || req.user?._id;
    let vendor = await Vendor.findById(targetVendorId);

    // If logged-in user is Admin or fallback required
    if (!vendor) {
      if (req.query.expertId) {
        vendor = await Vendor.findOne({ expertId: req.query.expertId });
      }
      if (!vendor) {
        vendor = await Vendor.findOne({ isApproved: true }).sort({ updatedAt: -1 }) || await Vendor.findOne().sort({ createdAt: -1 });
      }
    }

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor/Expert account not found' });
    }

    const logRecord = await ExpertAgreementLog.findOne({ vendor: vendor._id }).sort({ createdAt: -1 });

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Jaladhaara Expert Onboarding Agreement - ${vendor.expertId || 'EX-2026'}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; line-height: 1.6; padding: 16px; }
        .container { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
        .top-bar { display: flex; justify-content: flex-end; margin-bottom: 16px; }
        .print-btn { background: #0284c7; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 800; font-size: 13px; cursor: pointer; display: inline-flex; items-center; gap: 6px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25); transition: background 0.2s; }
        .print-btn:hover { background: #0369a1; }
        .header { text-align: center; border-bottom: 2px border #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
        .brand { font-size: 22px; font-weight: 900; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px; }
        .subtitle { font-size: 13px; font-weight: 700; color: #64748b; margin-top: 4px; }
        .expert-id-badge { display: inline-block; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; padding: 6px 16px; border-radius: 50px; font-size: 13px; font-weight: 900; font-family: monospace; margin-top: 12px; }
        .details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px; margin-bottom: 24px; }
        .detail-card { font-size: 12px; word-break: break-word; }
        .detail-card strong { display: block; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        .detail-card span { color: #0f172a; font-weight: 700; }
        .section-title { font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        ol { padding-left: 0; list-style: none; display: flex; flex-direction: column; gap: 10px; }
        li { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 12px 14px; font-size: 12px; color: #334155; }
        li strong { color: #0f172a; }
        .declaration-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 14px; padding: 16px; margin-top: 20px; font-size: 12px; color: #065f46; }
        .declaration-box strong { color: #047857; display: block; margin-bottom: 4px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
        .footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 10px; color: #94a3b8; font-weight: 600; }

        @media print {
          body { background: #fff; padding: 0; }
          .container { border: none; box-shadow: none; padding: 0; max-width: 100%; }
          .top-bar { display: none; }
          li { background: #fff; border: 1px solid #e2e8f0; page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="top-bar">
          <button class="print-btn" onclick="window.print()">🖨️ Save as PDF / Print Certificate</button>
        </div>

        <div class="header">
          <div class="brand">💧 Jaladhaara Groundwater Survey</div>
          <div class="subtitle">Official Expert Onboarding Agreement & Digital Consent Certificate</div>
          <div class="expert-id-badge">VERIFIED EXPERT ID: ${vendor.expertId || 'EX-2026-PENDING'}</div>
        </div>

        <div class="details-grid">
          <div class="detail-card"><strong>Expert Name</strong><span>${vendor.name}</span></div>
          <div class="detail-card"><strong>Registered Mobile</strong><span>${vendor.phone}</span></div>
          <div class="detail-card"><strong>Email Address</strong><span>${vendor.email}</span></div>
          <div class="detail-card"><strong>Agreement Version</strong><span>${logRecord ? logRecord.agreementVersion : 'v1.0'}</span></div>
          <div class="detail-card"><strong>Acceptance Date & Time</strong><span>${new Date(vendor.expertAgreementAcceptedAt || Date.now()).toLocaleString('en-IN')}</span></div>
          <div class="detail-card"><strong>IP Address</strong><span>${logRecord ? logRecord.ipAddress : 'Recorded'}</span></div>
        </div>

        <div class="section-title">📜 Agreement Clauses (10 Points)</div>
        <ol>
          <li><strong>1. Agreement Review:</strong> I have read and understood this Agreement.</li>
          <li><strong>2. Professional Standards:</strong> I will provide groundwater survey services professionally, ethically, and in compliance with applicable laws.</li>
          <li><strong>3. Sole Professional Responsibility:</strong> I am solely responsible for my surveys, technical opinions, recommendations, reports, and professional conduct.</li>
          <li><strong>4. Technology Platform Disclaimer:</strong> I understand that Jaladhaara is only a technology platform connecting Customers with independent Experts and is not responsible for my professional services or survey outcomes.</li>
          <li><strong>5. Privacy & Confidentiality:</strong> I will maintain the confidentiality of customer information and use it only for the booked service.</li>
          <li><strong>6. No Off-Platform Solicitation:</strong> I will not solicit customers outside the platform or accept unauthorized off-platform payments.</li>
          <li><strong>7. Groundwater Availability Disclaimer:</strong> I understand that groundwater occurrence depends on natural geological conditions, and I will not guarantee groundwater availability, borewell success, water yield, or water quality.</li>
          <li><strong>8. Platform Policies Compliance:</strong> I agree to comply with Jaladhaara's Terms & Conditions, Privacy Policy, Booking & Cancellation Policy, Refund Policy, and all other applicable platform policies.</li>
          <li><strong>9. Account Suspension & Termination:</strong> I understand that Jaladhaara may suspend or terminate my account if I violate this Agreement or any platform policy.</li>
          <li><strong>10. Governing Law & Jurisdiction:</strong> This Agreement shall be governed by the laws of India, and any dispute shall be subject to the exclusive jurisdiction of the competent courts at Hyderabad, Telangana.</li>
        </ol>

        <div class="declaration-box">
          <strong>Digital Consent Declaration:</strong>
          I declare that all information and documents submitted by me are true and correct. I voluntarily accept this Agreement and agree to be bound by its terms. (Digitally Accepted via Click-wrap Consent)
        </div>

        <div class="footer">
          Jaladhaara Groundwater Survey Pvt. Ltd. • Legal & Compliance Division • Hyderabad, Telangana, India<br>
          Document Hash Log ID: ${logRecord ? logRecord._id : 'N/A'}
        </div>
      </div>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(htmlContent);
  } catch (error) {
    console.error('Error generating Expert Agreement PDF page:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate agreement PDF', error: error.message });
  }
};

/**
 * Admin: Get all Expert Agreement Acceptance Audit Logs
 */
const getAdminExpertAgreementLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search || '';

    const query = {};

    if (search) {
      query.$or = [
        { expertName: { $regex: search, $options: 'i' } },
        { expertId: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await ExpertAgreementLog.countDocuments(query);
    const logs = await ExpertAgreementLog.find(query)
      .populate('vendor', 'email verificationStatus isApproved')
      .sort({ acceptedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin expert agreement logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Expert agreement logs',
      error: error.message
    });
  }
};

/**
 * Admin: Update Expert Onboarding Agreement text & bump version
 */
const updateAdminExpertAgreement = async (req, res) => {
  try {
    const { agreementText, newVersion } = req.body;

    if (!agreementText || !newVersion) {
      return res.status(400).json({
        success: false,
        message: 'agreementText and newVersion are required'
      });
    }

    await Settings.findOneAndUpdate(
      { key: 'expert_onboarding_agreement' },
      { value: agreementText, label: 'Jaladhaara Expert Onboarding Agreement (10 Clauses)', category: 'policy' },
      { upsert: true, new: true }
    );

    await Settings.findOneAndUpdate(
      { key: 'expert_onboarding_agreement_version' },
      { value: newVersion, label: 'Expert Onboarding Agreement Active Version', category: 'policy' },
      { upsert: true, new: true }
    );

    console.log(`📢 Admin updated Expert Onboarding Agreement to version ${newVersion}`);

    return res.status(200).json({
      success: true,
      message: `Expert Onboarding Agreement updated to version ${newVersion}. Experts will be prompted to accept the updated terms.`,
      data: {
        activeVersion: newVersion
      }
    });
  } catch (error) {
    console.error('Error updating admin expert agreement:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update expert agreement',
      error: error.message
    });
  }
};

module.exports = {
  getExpertAgreementStatus,
  acceptExpertAgreement,
  downloadExpertAgreementPdf,
  getAdminExpertAgreementLogs,
  updateAdminExpertAgreement
};
