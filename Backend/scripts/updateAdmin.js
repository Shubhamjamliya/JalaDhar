const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const updatePassword = async (email, newPassword) => {
  await connectDB();
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log(`Admin not found with email: ${email}`);
      return;
    }

    // Setting password directly; pre-save hook will hash it
    admin.password = newPassword;
    await admin.save();

    console.log(`Password updated successfully for ${email}`);
  } catch (err) {
    console.error('Error updating password:', err);
  } finally {
    mongoose.connection.close();
  }
};

const email = 'shubhamjamliya116@gmail.com';
const newPassword = 'Test@123';

updatePassword(email, newPassword);
