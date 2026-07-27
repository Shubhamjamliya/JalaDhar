const dns = require('node:dns');
const mongoose = require('mongoose');

dns.setServers(['8.8.8.8', '1.1.1.1']);

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);

    if (error.message.includes('querySrv ECONNREFUSED')) {
      console.error(
        'Atlas SRV lookup failed. This usually means your DNS, firewall, VPN, or internet connection is blocking mongodb+srv resolution.'
      );
      console.error(
        'Try one of these: switch networks, disable VPN/proxy temporarily, allow MongoDB Atlas in firewall, or use a standard mongodb:// host list URI instead of mongodb+srv://.'
      );
    }

    process.exit(1);
  }
};

module.exports = connectDB;




