const mongoose = require('mongoose');
const Settings = require('../models/Settings');
require('dotenv').config();

const policies = [
  {
    key: 'booking_policy',
    label: 'Booking & Payment Policy',
    value: `<ul>
      <li><strong>Advance Payment:</strong> A 40% advance payment of the total service fee is required to confirm your booking slot.</li>
      <li><strong>Payment Confirmation:</strong> Your booking is only confirmed once the payment is successfully processed.</li>
      <li><strong>Balance Payment:</strong> The remaining 60% of the service fee must be paid after the survey visit is completed and before the final report is released.</li>
      <li><strong>Pricing:</strong> Total amount includes base service fee, travel charges based on distance, and applicable GST (18%).</li>
    </ul>`,
    category: 'policy',
    type: 'string',
    description: 'Policy shown for booking and payment'
  },
  {
    key: 'cancellation_policy',
    label: 'Cancellation & Refund Policy',
    value: `<ul>
      <li><strong>Cancellation Before 24h:</strong> Full refund of the advance payment if cancelled at least 24 hours before the scheduled visit.</li>
      <li><strong>Late Cancellation:</strong> 50% of the advance amount will be forfeited if cancelled between 12-24 hours before the scheduled time.</li>
      <li><strong>No Refund:</strong> No refund will be provided for cancellations made within 12 hours of the scheduled visit or if the expert has already reached the site.</li>
      <li><strong>Processing Time:</strong> Refunds, if applicable, will be processed back to the original payment method within 5-7 business days.</li>
    </ul>`,
    category: 'policy',
    type: 'string',
    description: 'Policy shown for cancellations and refunds'
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
