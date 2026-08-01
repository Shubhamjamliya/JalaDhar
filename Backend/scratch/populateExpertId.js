const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Vendor = require('../models/Vendor');

async function populateExpertIds() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jaladhar';
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);

    const vendorsWithoutExpertId = await Vendor.find({
      $or: [
        { expertId: { $exists: false } },
        { expertId: null },
        { expertId: "" }
      ]
    });

    console.log(`Found ${vendorsWithoutExpertId.length} vendors missing expertId.`);

    let updatedCount = 0;
    for (const vendor of vendorsWithoutExpertId) {
      const generatedId = `EXP-${vendor._id.toString().slice(-6).toUpperCase()}`;
      vendor.expertId = generatedId;
      await vendor.save();
      updatedCount++;
      console.log(`Updated Vendor ${vendor.name} (${vendor._id}) -> expertId: ${generatedId}`);
    }

    console.log(`Successfully populated expertId for ${updatedCount} vendors.`);
  } catch (err) {
    console.error('Error populating expertId:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

populateExpertIds();
