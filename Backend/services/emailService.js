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
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Jaladhar <noreply@jaladhar.com>',
      to,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send OTP email
 * @param {Object} params - { email, name, otp, type }
 */
const sendOTPEmail = async ({ email, name, otp, type = 'verification' }) => {
  const subject = type === 'password_reset' 
    ? 'Password Reset OTP - Jaladhar'
    : 'Email Verification OTP - Jaladhar';

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
          <p>Your OTP for ${type === 'password_reset' ? 'password reset' : 'email verification'} is:</p>
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
    
    Your OTP for ${type === 'password_reset' ? 'password reset' : 'email verification'} is: ${otp}
    
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

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendVendorApprovalEmail,
  sendVendorRejectionEmail
};

