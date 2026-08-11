const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send email
 * @param {Object} options - { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();

    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Jaladhar <noreply@jaladhar.com>';

    const mailOptions = {
      from: fromEmail,
      to,
      subject,
      html,
      text
    };

    console.log('📧 Sending email:', {
      from: fromEmail,
      to,
      subject,
      emailFrom: process.env.EMAIL_FROM || fromEmail || 'NOT SET',
      emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com'
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      emailFrom: process.env.EMAIL_FROM || fromEmail || 'NOT SET',
      emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com'
    });
    return { success: false, error: error.message };
  }
};

/**
 * Send OTP email
 * @param {Object} params - { email, name, otp, type }
 */
const sendOTPEmail = async ({ email, name, otp, type = 'verification' }) => {
  let subject = 'Email Verification OTP - Jaladhar';
  if (type === 'password_reset') {
    subject = 'Password Reset OTP - Jaladhar';
  } else if (type === 'admin_registration') {
    subject = 'Admin Registration OTP - Jaladhar';
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .otp-box { background: white; padding: 20px; text-align: center; margin: 20px 0; border: 2px dashed #4CAF50; }
        .otp { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Jaladhar</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>Your OTP for ${type === 'password_reset' ? 'password reset' : type === 'admin_registration' ? 'admin registration' : 'email verification'} is:</p>
          <div class="otp-box">
            <div class="otp">${otp}</div>
          </div>
          <p>This OTP is valid for 10 minutes. Please do not share this OTP with anyone.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Jaladhar. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hello ${name},
    
    Your OTP for ${type === 'password_reset' ? 'password reset' : type === 'admin_registration' ? 'admin registration' : 'email verification'} is: ${otp}
    
    This OTP is valid for 10 minutes. Please do not share this OTP with anyone.
    
    If you didn't request this, please ignore this email.
    
    © ${new Date().getFullYear()} Jaladhar. All rights reserved.
  `;

  return await sendEmail({ to: email, subject, html, text });
};

/**
 * Send welcome email
 * @param {Object} params - { email, name }
 */
const sendWelcomeEmail = async ({ email, name }) => {
  const subject = 'Welcome to Jaladhar!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Jaladhar!</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>Thank you for joining Jaladhar! We're excited to have you on board.</p>
          <p>Your account has been successfully created. You can now start booking services.</p>
          <p>Best regards,<br>The Jaladhar Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
};

/**
 * Send vendor approval email
 * @param {Object} params - { email, name }
 */
const sendVendorApprovalEmail = async ({ email, name }) => {
  const subject = 'Vendor Account Approved - Jaladhar';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Account Approved!</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>Great news! Your vendor account has been approved by our admin team.</p>
          <p>You can now:</p>
          <ul>
            <li>Login to your vendor dashboard</li>
            <li>Add and manage your services</li>
            <li>Accept booking requests from customers</li>
            <li>Start earning on Jaladhar platform</li>
          </ul>
          <p>We're excited to have you on board!</p>
          <p>Best regards,<br>The Jaladhar Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hello ${name},
    
    Great news! Your vendor account has been approved by our admin team.
    
    You can now login to your vendor dashboard and start accepting bookings.
    
    Best regards,
    The Jaladhar Team
  `;

  return await sendEmail({ to: email, subject, html, text });
};

/**
 * Send vendor rejection email
 * @param {Object} params - { email, name, rejectionReason }
 */
const sendVendorRejectionEmail = async ({ email, name, rejectionReason }) => {
  const subject = 'Vendor Account Status Update - Jaladhar';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .reason-box { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #f44336; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Account Status Update</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>We regret to inform you that your vendor account application has been reviewed and unfortunately, we cannot approve it at this time.</p>
          <div class="reason-box">
            <strong>Reason:</strong>
            <p>${rejectionReason || 'Please contact support for more details.'}</p>
          </div>
          <p>If you believe this is an error or would like to reapply with updated information, please contact our support team.</p>
          <p>Best regards,<br>The Jaladhar Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hello ${name},
    
    We regret to inform you that your vendor account application has been reviewed and unfortunately, we cannot approve it at this time.
    
    Reason: ${rejectionReason || 'Please contact support for more details.'}
    
    If you believe this is an error or would like to reapply, please contact our support team.
    
    Best regards,
    The Jaladhar Team
  `;

  return await sendEmail({ to: email, subject, html, text });
};

/**
 * Helper to get survey category information and image
 */
const getCategoryDetails = (categoryName = '', baseUrl = '') => {
  const cat = (categoryName || '').toLowerCase();
  const host = baseUrl || process.env.BACKEND_URL || process.env.APP_URL || 'http://localhost:5000';

  if (cat.includes('residen')) {
    return {
      title: 'Residential Survey',
      imageUrl: `${host}/public/images/email/residential_survey.png`,
      description: 'This survey helps determine optimum groundwater points for independent houses, apartments, and residential properties.'
    };
  } else if (cat.includes('commerc')) {
    return {
      title: 'Commercial Survey',
      imageUrl: `${host}/public/images/email/commercial_survey.png`,
      description: 'This survey evaluates groundwater potential for commercial complexes, resorts, business parks, and institutions.'
    };
  } else if (cat.includes('industr')) {
    return {
      title: 'Industrial Survey',
      imageUrl: `${host}/public/images/email/industrial_survey.png`,
      description: 'This survey assesses high-capacity groundwater sources and deep aquifers required for industrial units and factories.'
    };
  } else {
    // Default to Agriculture
    return {
      title: 'Agriculture Survey',
      imageUrl: `${host}/public/images/email/agriculture_survey.png`,
      description: 'This survey helps in identifying the best borewell points to ensure better water yield for agricultural use and irrigation.'
    };
  }
};

/**
 * Send booking confirmation email
 * @param {Object} params
 */
const sendBookingConfirmationEmail = async ({
  email,
  name,
  bookingId,
  displayBookingId,
  serviceName = 'Groundwater Survey',
  surveyCategory = 'Agriculture Survey',
  surveyDate = '12 Aug 2026',
  location = 'Nizamabad, Telangana',
  propertyType = 'Residential',
  vendorName = 'Dr. Ramesh Kumar',
  vendorDesignation = 'Geophysicist',
  surveyPurpose = 'Borewell',
  area = '3.50 Acres',
  totalAmount = 15000,
  advancePaidPercentage = '40%',
  paymentStatus = 'Advance Paid',
  bookingUrl
}) => {
  const subject = 'Booking Confirmed – Your Groundwater Survey';
  const baseUrl = process.env.BACKEND_URL || process.env.APP_URL || 'http://localhost:5000';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const categoryInfo = getCategoryDetails(surveyCategory, baseUrl);

  const formattedBookingId = displayBookingId || (bookingId && bookingId.startsWith('JLD') ? bookingId : `JLD-${(bookingId || '10245').toString().slice(-5).toUpperCase()}`);
  const viewBookingUrl = bookingUrl || `${frontendUrl}/user/bookings/${bookingId || ''}`;
  
  const formattedDate = surveyDate instanceof Date ? surveyDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (surveyDate || '12 Aug 2026');
  const formattedPrice = typeof totalAmount === 'number' ? `₹${totalAmount.toLocaleString('en-IN')}` : totalAmount;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmed – Your Groundwater Survey</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #1E293B; background-color: #F1F5F9; margin: 0; padding: 20px 10px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        
        <!-- Header / Logo Bar -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 24px 30px; border-bottom: 1px solid #F1F5F9; background: #ffffff;">
          <tr>
            <td align="left" vertical-align="middle">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right: 10px;">
                    <div style="width: 38px; height: 38px; background: #0284C7; border-radius: 50%; text-align: center; line-height: 38px; color: #ffffff; font-weight: bold; font-size: 20px;">💧</div>
                  </td>
                  <td>
                    <div style="font-size: 22px; font-weight: 800; color: #0284C7; letter-spacing: -0.5px;">Jaladhaara</div>
                    <div style="font-size: 11px; color: #64748B; font-weight: 600; margin-top: 1px;">India's First Groundwater Survey Booking Platform</div>
                  </td>
                </tr>
              </table>
            </td>
            <td align="right" vertical-align="middle">
              <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Booking ID</div>
              <div style="font-size: 18px; font-weight: 800; color: #0284C7;">${formattedBookingId}</div>
            </td>
          </tr>
        </table>

        <!-- Confirmation Banner -->
        <div style="padding: 28px 30px 20px; text-align: center;">
          <div style="display: inline-block; width: 60px; height: 60px; background: #22C55E; border-radius: 50%; line-height: 60px; text-align: center; color: white; font-size: 32px; font-weight: bold; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);">✓</div>
          <h2 style="font-size: 24px; font-weight: 800; color: #0F172A; margin: 0 0 10px 0;">Your Booking is Confirmed!</h2>
          <p style="font-size: 14px; color: #475569; margin: 0 auto; max-width: 480px; line-height: 1.6;">
            Great news! Your groundwater survey booking has been successfully confirmed. Our expert will contact you soon to proceed with the survey.
          </p>
        </div>

        <!-- Category Card -->
        <div style="margin: 15px 30px; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; background: #F8FAFC;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="35%" style="vertical-align: top; background: #E2E8F0;">
                <img src="${categoryInfo.imageUrl}" alt="${categoryInfo.title}" style="width: 100%; height: 140px; object-fit: cover; display: block;" />
              </td>
              <td width="65%" style="padding: 16px 20px; vertical-align: top;">
                <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Category of Survey</div>
                <div style="font-size: 17px; font-weight: 800; color: #16A34A; margin: 3px 0 6px 0;">${categoryInfo.title}</div>
                <div style="font-size: 12px; color: #64748B; line-height: 1.5;">${categoryInfo.description}</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Booking Details Grid -->
        <div style="margin: 20px 30px; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px 24px; background: #ffffff;">
          <div style="font-size: 16px; font-weight: 800; color: #2563EB; margin-bottom: 18px;">
            📋 Booking Details
          </div>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <!-- Column 1 -->
              <td width="50%" vertical-align="top" style="padding-bottom: 14px; padding-right: 10px;">
                <div style="font-size: 12px; color: #64748B; margin-bottom: 2px;">📅 Survey Date</div>
                <div style="font-size: 14px; font-weight: 700; color: #0F172A;">${formattedDate}</div>
              </td>
              <!-- Column 2 -->
              <td width="50%" vertical-align="top" style="padding-bottom: 14px; padding-left: 10px;">
                <div style="font-size: 12px; color: #64748B; margin-bottom: 2px;">📋 Service</div>
                <div style="font-size: 14px; font-weight: 700; color: #0F172A;">${serviceName}</div>
              </td>
            </tr>

            <tr>
              <!-- Column 1 -->
              <td width="50%" vertical-align="top" style="padding-bottom: 14px; padding-right: 10px;">
                <div style="font-size: 12px; color: #64748B; margin-bottom: 2px;">📍 Location</div>
                <div style="font-size: 14px; font-weight: 700; color: #0F172A;">${location}</div>
              </td>
              <!-- Column 2 -->
              <td width="50%" vertical-align="top" style="padding-bottom: 14px; padding-left: 10px;">
                <div style="font-size: 12px; color: #64748B; margin-bottom: 2px;">🎯 Survey Purpose</div>
                <div style="font-size: 14px; font-weight: 700; color: #0F172A;">${surveyPurpose}</div>
              </td>
            </tr>

            <tr>
              <!-- Column 1 -->
              <td width="50%" vertical-align="top" style="padding-bottom: 14px; padding-right: 10px;">
                <div style="font-size: 12px; color: #64748B; margin-bottom: 2px;">🏠 Property Type</div>
                <div style="font-size: 14px; font-weight: 700; color: #0F172A;">${propertyType}</div>
              </td>
              <!-- Column 2 -->
              <td width="50%" vertical-align="top" style="padding-bottom: 14px; padding-left: 10px;">
                <div style="font-size: 12px; color: #64748B; margin-bottom: 2px;">🗺️ Area</div>
                <div style="font-size: 14px; font-weight: 700; color: #0F172A;">${area}</div>
              </td>
            </tr>

            <tr>
              <!-- Column 1 -->
              <td width="50%" vertical-align="top" style="padding-bottom: 14px; padding-right: 10px;">
                <div style="font-size: 12px; color: #64748B; margin-bottom: 2px;">🔲 Category of Survey</div>
                <div style="font-size: 14px; font-weight: 700; color: #16A34A;">${categoryInfo.title}</div>
              </td>
              <!-- Column 2 -->
              <td width="50%" vertical-align="top" style="padding-bottom: 14px; padding-left: 10px;">
                <div style="font-size: 12px; color: #64748B; margin-bottom: 2px;">💰 Total Amount</div>
                <div style="font-size: 15px; font-weight: 800; color: #16A34A;">${formattedPrice}</div>
              </td>
            </tr>

            <tr>
              <!-- Column 1 -->
              <td width="50%" vertical-align="top" style="padding-right: 10px;">
                <div style="font-size: 12px; color: #64748B; margin-bottom: 2px;">👤 Expert</div>
                <div style="font-size: 14px; font-weight: 700; color: #0F172A;">
                  ${vendorName} ${vendorDesignation ? `<span style="font-size: 12px; color: #64748B; font-weight: normal;">(${vendorDesignation})</span>` : ''}
                </div>
              </td>
              <!-- Column 2 -->
              <td width="50%" vertical-align="top" style="padding-left: 10px;">
                <div style="font-size: 12px; color: #64748B; margin-bottom: 4px;">💳 Payment Status</div>
                <div>
                  <span style="display: inline-block; padding: 4px 10px; background: #DCFCE7; color: #15803D; font-weight: 700; font-size: 12px; border-radius: 6px;">
                    ${paymentStatus} (${advancePaidPercentage})
                  </span>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Support Callout -->
        <div style="margin: 20px 30px; background: #F0FDF4; border: 1px solid #DCFCE7; border-radius: 12px; padding: 16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="40" vertical-align="middle">
                <div style="width: 36px; height: 36px; background: #DCFCE7; border-radius: 50%; text-align: center; line-height: 36px; font-size: 18px;">🎧</div>
              </td>
              <td vertical-align="middle" style="padding-left: 10px;">
                <div style="font-size: 13px; color: #166534; font-weight: 600; line-height: 1.4;">
                  Our expert will contact you soon and share the next steps.<br>
                  <strong style="color: #15803D;">Thank you for choosing Jaladhaara!</strong>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <!-- View Booking CTA Button -->
        <div style="text-align: center; margin: 28px 0 32px 0;">
          <a href="${viewBookingUrl}" style="display: inline-block; background: #0284C7; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 12px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);">
            View My Booking
          </a>
        </div>

        <!-- Footer -->
        <div style="background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 28px 30px; text-align: center; color: #64748B;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="left" vertical-align="top" width="45%">
                <div style="font-size: 16px; font-weight: 800; color: #0284C7;">💧 Jaladhaara</div>
                <div style="font-size: 11px; color: #64748B; margin-top: 4px; line-height: 1.4;">
                  India's First Groundwater Survey Booking Platform
                </div>
              </td>

              <td align="left" vertical-align="top" width="30%" style="padding-left: 15px;">
                <div style="font-size: 12px; font-weight: 700; color: #0F172A; margin-bottom: 6px;">Need Help?</div>
                <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">📞 +91 6300 123 456</div>
                <div style="font-size: 12px; color: #475569;">✉️ support@jaladhaara.com</div>
              </td>

              <td align="right" vertical-align="top" width="25%">
                <div style="font-size: 12px; font-weight: 700; color: #0F172A; margin-bottom: 8px; text-align: right;">Follow Us</div>
                <div style="font-size: 16px;">
                  <a href="#" style="text-decoration: none; margin-left: 4px;">📘</a>
                  <a href="#" style="text-decoration: none; margin-left: 4px;">📷</a>
                  <a href="#" style="text-decoration: none; margin-left: 4px;">💼</a>
                  <a href="#" style="text-decoration: none; margin-left: 4px;">▶️</a>
                </div>
              </td>
            </tr>
          </table>

          <div style="border-top: 1px solid #E2E8F0; margin-top: 20px; padding-top: 16px; font-size: 11px; color: #94A3B8;">
            <a href="#" style="color: #64748B; text-decoration: underline; margin-right: 12px;">Privacy Policy</a> |
            <a href="#" style="color: #64748B; text-decoration: underline; margin-left: 12px;">Terms & Conditions</a>
            <div style="margin-top: 8px;">
              © ${new Date().getFullYear()} Jaladhaara Groundwater Survey Pvt Ltd. All rights reserved.
            </div>
          </div>
        </div>

      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
};

/**
 * Send booking status update email
 * @param {Object} params - { email, name, bookingId, status, message }
 */
const sendBookingStatusUpdateEmail = async ({ email, name, bookingId, status, message }) => {
  const subject = `Booking Update - ${status} - Jaladhar`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0A84FF; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .status-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #0A84FF; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Status Update</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <div class="status-box">
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Status:</strong> ${status}</p>
            <p>${message}</p>
          </div>
          <p>Best regards,<br>The Jaladhar Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
};

/**
 * Send payment confirmation email
 * @param {Object} params - { email, name, bookingId, amount, paymentType, invoiceUrl }
 */
const sendPaymentConfirmationEmail = async ({ email, name, bookingId, amount, paymentType, invoiceUrl }) => {
  const subject = 'Payment Confirmed - Jaladhar';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .payment-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
        .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>Your ${paymentType} payment has been confirmed successfully!</p>
          <div class="payment-box">
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Payment Type:</strong> ${paymentType}</p>
            <p><strong>Amount:</strong> ₹${amount.toFixed(2)}</p>
          </div>
          ${invoiceUrl ? `<p><a href="${invoiceUrl}" class="button">Download Invoice</a></p>` : ''}
          <p>Best regards,<br>The Jaladhar Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
};

/**
 * Send settlement notification email to vendor
 * @param {Object} params - { email, name, bookingId, settlementAmount, settlementType, incentive, penalty }
 */
const sendSettlementNotificationEmail = async ({ email, name, bookingId, settlementAmount, settlementType, incentive, penalty }) => {
  const subject = 'Vendor Settlement Processed - Jaladhar';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${settlementType === 'SUCCESS' ? '#4CAF50' : '#f44336'}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .settlement-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid ${settlementType === 'SUCCESS' ? '#4CAF50' : '#f44336'}; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Settlement Processed</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>Your vendor settlement has been processed for the following booking:</p>
          <div class="settlement-box">
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Result:</strong> ${settlementType === 'SUCCESS' ? 'Success' : 'Failed'}</p>
            <p><strong>Settlement Amount:</strong> ₹${settlementAmount.toFixed(2)}</p>
            ${incentive > 0 ? `<p><strong>Incentive:</strong> ₹${incentive.toFixed(2)}</p>` : ''}
            ${penalty > 0 ? `<p><strong>Penalty:</strong> ₹${penalty.toFixed(2)}</p>` : ''}
          </div>
          <p>The amount will be transferred to your registered bank account within 3-5 business days.</p>
          <p>Best regards,<br>The Jaladhar Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendVendorApprovalEmail,
  sendVendorRejectionEmail,
  sendBookingConfirmationEmail,
  sendBookingStatusUpdateEmail,
  sendPaymentConfirmationEmail,
  sendSettlementNotificationEmail
};

