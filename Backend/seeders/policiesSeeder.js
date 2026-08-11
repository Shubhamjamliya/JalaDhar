const mongoose = require('mongoose');
const Settings = require('../models/Settings');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const policies = [
  {
    key: 'general_terms',
    label: 'General Terms & Conditions',
    value: `<ul>
      <li>By creating an account or logging in, you agree to abide by Jaladhaara platform guidelines and privacy terms.</li>
      <li>Users are responsible for maintaining the confidentiality of their credentials and account access.</li>
      <li>Survey requests must represent genuine land testing requirements with accurate location data.</li>
    </ul>`,
    category: 'policy',
    type: 'string',
    description: 'General terms and conditions shown on login/signup'
  },
  {
    key: 'booking_policy',
    label: 'Booking Policy',
    value: `<ul>
      <li><strong>Slot Booking:</strong> Bookings must be requested with an accurate land location and survey requirements.</li>
      <li><strong>Confirmation:</strong> Your booking is confirmed once the advance payment is completed.</li>
      <li><strong>Expert Assignment:</strong> A qualified groundwater survey expert will be assigned to your booking.</li>
    </ul>`,
    category: 'policy',
    type: 'string',
    description: 'Policy shown during booking creation'
  },
  {
    key: 'cancellation_policy',
    label: 'Cancellation Policy',
    value: `<ul>
      <li><strong>Cancellation Before 24h:</strong> Full refund of advance payment if cancelled at least 24 hours before the scheduled visit.</li>
      <li><strong>Late Cancellation:</strong> 50% of the advance amount will be forfeited if cancelled between 12-24 hours before the visit.</li>
      <li><strong>Same Day Cancellation:</strong> No refund for cancellations made within 12 hours of the visit.</li>
    </ul>`,
    category: 'policy',
    type: 'string',
    description: 'Policy shown for booking cancellations'
  },
  {
    key: 'refund_policy',
    label: 'Refund Policy',
    value: `<ul>
      <li><strong>Refund Processing:</strong> Approved refunds will be processed back to the original payment method within 5-7 business days.</li>
      <li><strong>Failed Survey Visits:</strong> If an expert fails to attend due to platform issues, a 100% refund will be issued.</li>
      <li><strong>Inquiries:</strong> Contact support for any refund status queries.</li>
    </ul>`,
    category: 'policy',
    type: 'string',
    description: 'Policy shown for payment refunds'
  },
  {
    key: 'advance_payment_policy',
    label: 'Advance Payment Policy',
    value: `<ul>
      <li><strong>Advance Split:</strong> A 40% advance payment of the total estimated amount is required to lock your appointment.</li>
      <li><strong>Payment Gateways:</strong> Secure online payment via Razorpay, UPI, Cards, or Net Banking.</li>
      <li><strong>Instant Receipt:</strong> Digital receipt is generated immediately upon successful transaction.</li>
    </ul>`,
    category: 'policy',
    type: 'string',
    description: 'Policy shown for advance payments'
  },
  {
    key: 'remaining_payment_policy',
    label: 'Remaining Payment Policy',
    value: `<ul>
      <li><strong>Remaining Split:</strong> The 60% balance amount is payable after the physical survey visit is completed.</li>
      <li><strong>Report Release:</strong> Survey findings and PDF report will be unlocked upon receipt of full payment.</li>
    </ul>`,
    category: 'policy',
    type: 'string',
    description: 'Policy shown for remaining balance payments'
  },
  {
    key: 'terms_of_service',
    label: 'Terms of Service',
    value: `<ol>
      <li>Jaladhaara is a technology platform that connects customers with independent groundwater survey experts.</li>
      <li>Survey services are provided solely by the selected expert. Jaladhaara is not the survey service provider.</li>
      <li>Groundwater occurrence is governed by natural geological conditions. Jaladhaara doesn't guarantee the successful borewell drilling, groundwater availability, water quantity, or water quality.</li>
      <li>The survey report is a professional opinion based on scientific observations and available data and should not be considered a guarantee of drilling success.</li>
      <li>Customers are responsible for providing the correct survey location, site access, and obtaining any required permissions.</li>
      <li>Jaladhaara is not liable for borewell failure, dry borewells, low yield, drilling costs, financial losses, crop loss, or any indirect or consequential damages.</li>
      <li>Booking, cancellation, refund, and rescheduling are governed by the applicable policies available in the app.</li>
      <li>By proceeding with the booking, you confirm that you have read, understood, and agreed to these Terms & Conditions.</li>
    </ol>`,
    category: 'policy',
    type: 'string',
    description: 'General Terms of Service'
  },
  {
    key: 'privacy_policy',
    label: 'Privacy Policy',
    value: `<p>Jaladhaara Groundwater Survey Pvt. Ltd. ("Jaladhaara") respects your privacy and is committed to protecting your personal information.</p>
    <ol>
      <li>We collect information such as your name, mobile number, email address, survey location, payment details, and other information required to provide our services.</li>
      <li>Your location is used only to facilitate groundwater survey bookings and enable experts to reach the correct survey land.</li>
      <li>Your personal information is shared only with authorised experts, payment service providers, and service partners as necessary to deliver the requested services or comply with applicable laws.</li>
      <li>We use reasonable security measures to protect your personal information from unauthorised access, loss, or misuse.</li>
      <li>We do not sell or rent your personal information to third parties.</li>
      <li>You are responsible for providing accurate information and keeping your account details up to date.</li>
      <li>By using the Jaladhaara app, you consent to the collection, use, storage, and processing of your information in accordance with this Privacy Policy.</li>
      <li>Jaladhaara may update this Privacy Policy from time to time. The latest version will always be available within the app and on our website.</li>
    </ol>
    <p>For more information, please refer to the full Privacy Policy available in the app or contact Jaladhaara Customer Support.</p>`,
    category: 'policy',
    type: 'string',
    description: 'Privacy policy for users and experts'
  },
  {
    key: 'user_agreement_version',
    label: 'User Agreement Active Version',
    value: 'v1.0.0',
    category: 'policy',
    type: 'string',
    description: 'Active version identifier of the Jaladhaara User Agreement'
  },
  {
    key: 'user_agreement',
    label: 'Jaladhaara User Agreement (13 Clauses)',
    value: `<p><strong>Jaladhaara User Agreement</strong></p>
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
    </ol>`,
    category: 'policy',
    type: 'string',
    description: 'Official 13-clause Jaladhaara User Agreement text'
  },
  {
    key: 'expert_onboarding_agreement_version',
    label: 'Expert Onboarding Agreement Active Version',
    value: 'v1.0',
    category: 'policy',
    type: 'string',
    description: 'Active version identifier of the Jaladhaara Expert Onboarding Agreement'
  },
  {
    key: 'expert_onboarding_agreement',
    label: 'Jaladhaara Expert Onboarding Agreement (10 Clauses)',
    value: `<p><strong>Jaladhaara Expert Onboarding Agreement</strong></p>
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
    <p><strong>Declaration:</strong> I declare that all information and documents submitted by me are true and correct. I voluntarily accept this Agreement and agree to be bound by its terms.</p>`,
    category: 'policy',
    type: 'string',
    description: 'Official 10-clause Jaladhaara Expert Onboarding Agreement text'
  }
];

const seedPolicies = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    for (const policy of policies) {
      await Settings.findOneAndUpdate(
        { key: policy.key },
        policy,
        { upsert: true, new: true }
      );
      console.log(`Seeded/Updated policy: ${policy.key}`);
    }

    console.log('Policy seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding policies:', error);
    process.exit(1);
  }
};

seedPolicies();
