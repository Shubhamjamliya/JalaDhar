const mongoose = require('mongoose');
const Service = require('../models/Service');
const Vendor = require('../models/Vendor');
require('dotenv').config();

const runMigration = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // 1. Update Services
    const serviceResult = await Service.updateMany(
      {
        $or: [
          { name: /Ground\s*Water\s*Detection/i },
          { name: "Ground Water Detection" },
          { category: /Ground\s*Water\s*Detection/i }
        ]
      },
      {
        $set: {
          name: "Groundwater Survey",
          category: "Groundwater Survey"
        }
      }
    );
    console.log(`Updated Services: ${serviceResult.modifiedCount} documents`);

    // Update service skills
    await Service.updateMany(
      { skills: /Ground\s*Water\s*Detection/i },
      { $set: { "skills.$": "Groundwater Survey" } }
    );

    // 2. Update Vendors
    const vendorResult = await Vendor.updateMany(
      {
        $or: [
          { category: /Ground\s*Water\s*Detection/i },
          { skills: /Ground\s*Water\s*Detection/i }
        ]
      },
      {
        $set: {
          category: "Groundwater Survey"
        }
      }
    );
    console.log(`Updated Vendors: ${vendorResult.modifiedCount} documents`);

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

runMigration();
