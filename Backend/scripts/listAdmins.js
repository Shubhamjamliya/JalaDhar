const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('URI:', process.env.MONGODB_URI ? 'Loaded' : 'Not Loaded');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const listAdmins = async () => {
  await connectDB();
  try {
    const admins = await Admin.find({});
    console.log('Found', admins.length, 'admins:');
    admins.forEach(admin => {
      console.log(`- ID: ${admin._id}, Name: ${admin.name}, Email: ${admin.email}, Role: ${admin.role}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
};

listAdmins();
