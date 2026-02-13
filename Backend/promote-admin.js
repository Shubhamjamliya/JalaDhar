const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from Backend root
dotenv.config();

const promote = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const email = process.argv[2];
    if (!email) {
      const admins = await Admin.find({}, 'email role');
      console.log('Current Admins:');
      admins.forEach(a => console.log(`- ${a.email} (${a.role})`));
      console.log('\nUsage: node promote-admin.js <email>');
      process.exit(0);
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.error(`Admin with email ${email} not found`);
      process.exit(1);
    }

    admin.role = 'SUPER_ADMIN';
    await admin.save();

    console.log(`Successfully promoted ${email} to SUPER_ADMIN`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

promote();
