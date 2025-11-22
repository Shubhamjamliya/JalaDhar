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
 * Send booking confirmation email
 * @param {Object} params - { email, name, bookingId, serviceName, vendorName }
 */
const sendBookingConfirmationEmail = async ({ email, name, bookingId, serviceName, vendorName }) => {
  const subject = 'Booking Confirmed - Jaladhar';
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
        .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #0A84FF; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>Your booking has been confirmed successfully!</p>
          <div class="info-box">
            <p><strong>Booking ID:</strong> ${bookingId}</p>
            <p><strong>Service:</strong> ${serviceName}</p>
            <p><strong>Vendor:</strong> ${vendorName}</p>
          </div>
          <p>Please complete the advance payment (40%) to proceed. The vendor will be notified once payment is confirmed.</p>
          <p>Best regards,<br>The Jaladhar Team</p>
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

