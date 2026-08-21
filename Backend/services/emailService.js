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

    const fromEmail = process.env.EMAIL_FROM || (process.env.EMAIL_USER ? `"Jaladhaara" <${process.env.EMAIL_USER}>` : '"Jaladhaara" <noreply@jaladhaaraapp.com>');

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
 * Shared Jaladhaara Brand Email Shell
 */
const renderEmailShell = ({ title, badgeText, badgeBg = '#EFF6FF', badgeColor = '#0284C7', heroTitle, heroSubtitle, contentHtml }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 24px 10px; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1E293B;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02);">
        
        <!-- Brand Header Bar -->
        <tr>
          <td style="padding: 24px 32px; background: #FFFFFF; border-bottom: 1px solid #F1F5F9;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="left" vertical-align="middle">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-right: 12px;">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); border-radius: 12px; text-align: center; line-height: 40px; color: #FFFFFF; font-size: 20px; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);">💧</div>
                      </td>
                      <td>
                        <div style="font-size: 20px; font-weight: 800; color: #0284C7; letter-spacing: -0.5px; line-height: 1.2;">Jaladhaara</div>
                        <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 2px;">Groundwater Survey & Hydrogeology</div>
                      </td>
                    </tr>
                  </table>
                </td>
                ${badgeText ? `
                <td align="right" vertical-align="middle">
                  <span style="display: inline-block; padding: 5px 12px; font-size: 11px; font-weight: 700; color: ${badgeColor}; background: ${badgeBg}; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${badgeText}
                  </span>
                </td>
                ` : ''}
              </tr>
            </table>
          </td>
        </tr>

        <!-- Hero Header -->
        ${heroTitle ? `
        <tr>
          <td style="padding: 28px 32px 20px 32px; background: linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%); border-bottom: 1px solid #F1F5F9;">
            <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #0F172A; line-height: 1.3;">
              ${heroTitle}
            </h1>
            ${heroSubtitle ? `
            <p style="margin: 0; font-size: 13px; color: #64748B; line-height: 1.5;">
              ${heroSubtitle}
            </p>
            ` : ''}
          </td>
        </tr>
        ` : ''}

        <!-- Main Body Content -->
        <tr>
          <td style="padding: 28px 32px; font-size: 14px; line-height: 1.6; color: #334155;">
            ${contentHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 32px; text-align: center; color: #64748B;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="left" style="font-size: 12px; color: #64748B; line-height: 1.5;">
                  <strong style="color: #0F172A; font-weight: 700;">Jaladhaara Hydrogeological Services Pvt. Ltd.</strong><br>
                  India's Premier Groundwater Survey & Borewell QA Platform<br>
                  Raipur, Chhattisgarh, India • <a href="mailto:support@jaladhaaraapp.com" style="color: #0284C7; text-decoration: none;">support@jaladhaaraapp.com</a>
                </td>
              </tr>
              <tr>
                <td align="left" style="padding-top: 16px; border-top: 1px solid #E2E8F0; margin-top: 16px; font-size: 11px; color: #94A3B8;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="left" style="font-size: 11px; color: #94A3B8;">
                        © ${new Date().getFullYear()} Jaladhaara. All rights reserved.
                      </td>
                      <td align="right" style="font-size: 11px; color: #94A3B8;">
                        <a href="#" style="color: #64748B; text-decoration: none; margin-left: 10px;">Security</a>
                        <a href="#" style="color: #64748B; text-decoration: none; margin-left: 10px;">Privacy</a>
                        <a href="#" style="color: #64748B; text-decoration: none; margin-left: 10px;">Terms</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </body>
    </html>
  `;
};

/**
 * Send OTP email
 * @param {Object} params - { email, name, otp, type }
 */
const sendOTPEmail = async ({ email, name, otp, type = 'verification' }) => {
  let subject = 'Email Verification Code – Jaladhaara';
  let badgeText = 'Email Verification';
  let badgeBg = '#EFF6FF';
  let badgeColor = '#0284C7';
  let heroTitle = 'Verify Your Email Address';
  let heroSubtitle = 'Use the 6-digit authentication code below to verify your account.';
  let purposeDescription = 'We received a request to verify your email address on the Jaladhaara platform.';

  if (type === 'password_reset') {
    subject = 'Password Reset Code – Jaladhaara';
    badgeText = 'Password Reset';
    badgeBg = '#FEF3C7';
    badgeColor = '#B45309';
    heroTitle = 'Reset Your Password';
    heroSubtitle = 'A password reset was requested for your Jaladhaara account.';
    purposeDescription = 'Please use the one-time security code below to securely reset your password.';
  } else if (type === 'admin_registration') {
    subject = '🔐 Admin Portal Registration OTP – Jaladhaara';
    badgeText = '🛡️ Internal Admin Access';
    badgeBg = '#F3E8FF';
    badgeColor = '#7E22CE';
    heroTitle = 'Internal Admin Registration';
    heroSubtitle = 'Complete your internal administrator account verification.';
    purposeDescription = 'You have been invited to register as an internal administrator on the <strong>Jaladhaara Governance & Operations Portal</strong>.';
  }

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #1E293B;">
      Hello <strong>${name || 'Team Member'}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; color: #475569; font-size: 13.5px; line-height: 1.6;">
      ${purposeDescription}
    </p>

    <!-- OTP Display Box -->
    <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 16px; padding: 24px 20px; text-align: center; margin: 24px 0;">
      <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">
        One-Time Verification Code
      </div>
      <div style="display: inline-block; background: #FFFFFF; border: 1.5px solid #0284C7; border-radius: 12px; padding: 10px 24px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.08);">
        <span style="font-family: 'SF Pro Display', -apple-system, Roboto, Monaco, 'Courier New', monospace; font-size: 36px; font-weight: 800; color: #0284C7; letter-spacing: 8px; line-height: 1.2;">
          ${otp}
        </span>
      </div>
      <div style="margin-top: 14px; font-size: 12px; color: #64748B; font-weight: 500;">
        ⏱️ Code expires in <strong>10 minutes</strong> • Single use only
      </div>
    </div>

    <!-- Security Warning Box -->
    <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 12px 16px; margin-top: 24px;">
      <div style="font-size: 12px; font-weight: 700; color: #92400E; margin-bottom: 2px;">
        🔒 Security Advice
      </div>
      <div style="font-size: 11.5px; color: #B45309; line-height: 1.5;">
        Never share this verification code with anyone. Jaladhaara administrators or support agents will never ask for your OTP. If you did not make this request, you can safely disregard this email.
      </div>
    </div>
  `;

  const html = renderEmailShell({
    title: subject,
    badgeText,
    badgeBg,
    badgeColor,
    heroTitle,
    heroSubtitle,
    contentHtml
  });

  const text = `
Hello ${name},

Your OTP code for ${type === 'password_reset' ? 'password reset' : type === 'admin_registration' ? 'admin registration' : 'email verification'} is: ${otp}

This OTP is valid for 10 minutes. For your security, please do not share this OTP with anyone.

If you didn't request this, please ignore this email.

© ${new Date().getFullYear()} Jaladhaara. All rights reserved.
  `;

  return await sendEmail({ to: email, subject, html, text });
};

/**
 * Send welcome email
 * @param {Object} params - { email, name }
 */
const sendWelcomeEmail = async ({ email, name }) => {
  const subject = 'Welcome to Jaladhaara! 💧';
  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #1E293B;">
      Hello <strong>${name}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; color: #475569; font-size: 13.5px; line-height: 1.6;">
      Thank you for joining <strong>Jaladhaara</strong>! We're excited to have you on board India's premier groundwater survey and hydrogeological assessment platform.
    </p>
    <p style="margin: 0 0 20px 0; color: #475569; font-size: 13.5px; line-height: 1.6;">
      Your account is now active. You can explore certified hydrogeologists, request borewell surveys, track real-time assessments, and download certified QA survey reports.
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display: inline-block; padding: 12px 28px; background: #0284C7; color: #FFFFFF; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);">
        Explore Jaladhaara Platform
      </a>
    </div>
  `;

  const html = renderEmailShell({
    title: subject,
    badgeText: '✨ New Account',
    heroTitle: 'Welcome to Jaladhaara',
    heroSubtitle: 'Groundwater Survey & Certified Hydrogeological Services',
    contentHtml
  });

  return await sendEmail({ to: email, subject, html });
};

/**
 * Send vendor approval email
 * @param {Object} params - { email, name }
 */
const sendVendorApprovalEmail = async ({ email, name }) => {
  const subject = '🎉 Vendor Account Approved – Jaladhaara';
  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #1E293B;">
      Hello <strong>${name}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; color: #475569; font-size: 13.5px; line-height: 1.6;">
      Great news! Your Expert / Vendor profile has been successfully reviewed and <strong>approved</strong> by our technical verification team.
    </p>
    <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <div style="font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 8px;">What You Can Do Now:</div>
      <ul style="margin: 0; padding-left: 20px; color: #15803D; font-size: 12.5px; line-height: 1.7;">
        <li>Login to your Expert Dashboard</li>
        <li>Set your service coverage zones & equipment specs</li>
        <li>Accept customer survey bookings in real-time</li>
        <li>Submit survey readings and receive automated wallet payouts</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${(process.env.FRONTEND_URL || 'http://localhost:5173') + '/vendor/login'}" style="display: inline-block; padding: 12px 28px; background: #16A34A; color: #FFFFFF; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);">
        Login to Expert Dashboard
      </a>
    </div>
  `;

  const html = renderEmailShell({
    title: subject,
    badgeText: '✅ Approved',
    badgeBg: '#DCFCE7',
    badgeColor: '#15803D',
    heroTitle: 'Expert Profile Approved',
    heroSubtitle: 'You are now certified to accept groundwater survey requests.',
    contentHtml
  });

  return await sendEmail({ to: email, subject, html });
};

/**
 * Send vendor rejection email
 * @param {Object} params - { email, name, rejectionReason }
 */
const sendVendorRejectionEmail = async ({ email, name, rejectionReason }) => {
  const subject = 'Application Status Update – Jaladhaara';
  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #1E293B;">
      Hello <strong>${name}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; color: #475569; font-size: 13.5px; line-height: 1.6;">
      Thank you for applying to become a certified Expert on Jaladhaara. After reviewing your credentials and submitted documents, our verification team was unable to approve your application at this time.
    </p>
    <div style="background: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 8px; padding: 14px 16px; margin: 20px 0;">
      <div style="font-size: 12px; font-weight: 700; color: #991B1B; margin-bottom: 4px;">Review Feedback:</div>
      <p style="margin: 0; font-size: 13px; color: #B91C1C; line-height: 1.5;">${rejectionReason || 'Uploaded documents did not satisfy hydrogeological certification criteria.'}</p>
    </div>
    <p style="margin: 16px 0 0 0; color: #64748B; font-size: 12.5px; line-height: 1.5;">
      If you believe this decision was in error or have updated certifications to provide, please reply directly or contact <a href="mailto:support@jaladhaaraapp.com" style="color: #0284C7; text-decoration: none;">support@jaladhaaraapp.com</a>.
    </p>
  `;

  const html = renderEmailShell({
    title: subject,
    badgeText: '⚠️ Status Update',
    badgeBg: '#FEE2E2',
    badgeColor: '#B91C1C',
    heroTitle: 'Application Status Update',
    heroSubtitle: 'Feedback regarding your expert onboarding submission.',
    contentHtml
  });

  return await sendEmail({ to: email, subject, html });
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
                <div style="font-size: 12px; color: #475569;">✉️ info@jaladhaaraapp.com</div>
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
  const subject = `Booking Update (${status}) – Jaladhaara`;
  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #1E293B;">
      Hello <strong>${name}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; color: #475569; font-size: 13.5px; line-height: 1.6;">
      There is an update regarding your groundwater survey booking.
    </p>
    <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span style="font-size: 12px; color: #64748B; font-weight: 600;">Booking Reference:</span>
        <strong style="font-size: 13px; color: #0F172A;">${bookingId}</strong>
      </div>
      <div style="margin-bottom: 12px;">
        <span style="font-size: 12px; color: #64748B; font-weight: 600;">Current Status:</span>
        <span style="display: inline-block; padding: 3px 10px; background: #EFF6FF; color: #0284C7; font-weight: 700; font-size: 12px; border-radius: 6px; margin-left: 6px;">${status}</span>
      </div>
      <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.5; border-top: 1px solid #E2E8F0; padding-top: 10px;">
        ${message || 'Your survey schedule has been updated.'}
      </p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${(process.env.FRONTEND_URL || 'http://localhost:5173') + '/user/bookings/' + bookingId}" style="display: inline-block; padding: 12px 28px; background: #0284C7; color: #FFFFFF; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);">
        Track Live Status
      </a>
    </div>
  `;

  const html = renderEmailShell({
    title: subject,
    badgeText: `Status: ${status}`,
    heroTitle: 'Survey Status Update',
    heroSubtitle: `Update for Booking #${bookingId}`,
    contentHtml
  });

  return await sendEmail({ to: email, subject, html });
};

/**
 * Send payment confirmation email
 * @param {Object} params - { email, name, bookingId, amount, paymentType, invoiceUrl }
 */
const sendPaymentConfirmationEmail = async ({ email, name, bookingId, amount, paymentType, invoiceUrl }) => {
  const subject = '💳 Payment Received – Jaladhaara';
  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #1E293B;">
      Hello <strong>${name}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; color: #475569; font-size: 13.5px; line-height: 1.6;">
      We have successfully received your payment for the groundwater survey.
    </p>
    <div style="background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: 14px; padding: 20px; margin: 20px 0; text-align: center;">
      <div style="font-size: 11px; font-weight: 700; color: #15803D; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Payment Confirmed</div>
      <div style="font-size: 32px; font-weight: 800; color: #166534; margin-bottom: 8px;">₹${typeof amount === 'number' ? amount.toFixed(2) : amount}</div>
      <div style="font-size: 12px; color: #15803D;">Type: <strong>${paymentType}</strong> • Booking: <strong>#${bookingId}</strong></div>
    </div>
    ${invoiceUrl ? `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${invoiceUrl}" style="display: inline-block; padding: 12px 28px; background: #0284C7; color: #FFFFFF; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);">
        Download Tax Invoice
      </a>
    </div>
    ` : ''}
  `;

  const html = renderEmailShell({
    title: subject,
    badgeText: 'Payment Success',
    badgeBg: '#DCFCE7',
    badgeColor: '#15803D',
    heroTitle: 'Payment Received',
    heroSubtitle: `Receipt for Booking #${bookingId}`,
    contentHtml
  });

  return await sendEmail({ to: email, subject, html });
};

/**
 * Send settlement notification email to vendor
 * @param {Object} params - { email, name, bookingId, settlementAmount, settlementType, incentive, penalty }
 */
const sendSettlementNotificationEmail = async ({ email, name, bookingId, settlementAmount, settlementType, incentive, penalty }) => {
  const isSuccess = settlementType === 'SUCCESS';
  const subject = `Payout Settlement ${isSuccess ? 'Processed' : 'Failed'} – Jaladhaara`;
  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #1E293B;">
      Hello <strong>${name}</strong>,
    </p>
    <p style="margin: 0 0 16px 0; color: #475569; font-size: 13.5px; line-height: 1.6;">
      Your expert survey payout settlement has been processed for booking <strong>#${bookingId}</strong>.
    </p>
    <div style="background: ${isSuccess ? '#F0FDF4' : '#FEF2F2'}; border: 1.5px solid ${isSuccess ? '#BBF7D0' : '#FECACA'}; border-radius: 14px; padding: 20px; margin: 20px 0;">
      <div style="font-size: 12px; color: ${isSuccess ? '#15803D' : '#B91C1C'}; font-weight: 600; margin-bottom: 4px;">Settlement Amount:</div>
      <div style="font-size: 28px; font-weight: 800; color: ${isSuccess ? '#166534' : '#991B1B'}; margin-bottom: 10px;">₹${typeof settlementAmount === 'number' ? settlementAmount.toFixed(2) : settlementAmount}</div>
      ${incentive > 0 ? `<div style="font-size: 12px; color: #15803D; margin-bottom: 3px;">+ Incentive: ₹${incentive.toFixed(2)}</div>` : ''}
      ${penalty > 0 ? `<div style="font-size: 12px; color: #B91C1C; margin-bottom: 3px;">- Penalty: ₹${penalty.toFixed(2)}</div>` : ''}
    </div>
    <p style="margin: 0; color: #64748B; font-size: 12px; line-height: 1.5;">
      ${isSuccess ? 'Funds will reflect in your registered bank account per standard banking settlement cycles (T+2 business days).' : 'Please check your bank details in settings or contact support.'}
    </p>
  `;

  const html = renderEmailShell({
    title: subject,
    badgeText: isSuccess ? 'Payout Processed' : 'Payout Failed',
    badgeBg: isSuccess ? '#DCFCE7' : '#FEE2E2',
    badgeColor: isSuccess ? '#15803D' : '#B91C1C',
    heroTitle: 'Survey Payout Settlement',
    heroSubtitle: `Settlement for Booking #${bookingId}`,
    contentHtml
  });

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

