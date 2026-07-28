const mongoose = require('mongoose');
const Settings = require('../models/Settings');
require('dotenv').config();

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
    value: `<ul>
      <li>The location provided must be accurate and accessible for the expert and equipment.</li>
      <li>While we use scientific methods, water yield results are estimates based on geographical data and do not guarantee 100% success.</li>
      <li>Customers are responsible for obtaining any local permissions required for the survey.</li>
      <li>All reports are for informational purposes only.</li>
    </ul>`,
    category: 'policy',
    type: 'string',
    description: 'General Terms of Service'
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
