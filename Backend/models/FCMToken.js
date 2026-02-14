const mongoose = require('mongoose');

const fcmTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['User', 'Vendor']
  },
  token: {
    type: String,
    required: true,
    index: true
  },
  platform: {
    type: String,
    enum: ['web', 'mobile'],
    default: 'web'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to enforce unique token per user per platform
fcmTokenSchema.index({ userId: 1, userModel: 1, token: 1 }, { unique: true });

// Index for efficient lookups
fcmTokenSchema.index({ userId: 1, userModel: 1, isActive: 1 });

// Statics: get all active tokens for a user
fcmTokenSchema.statics.getTokensForUser = async function (userId, userModel) {
  const docs = await this.find({
    userId,
    userModel,
    isActive: true
  }).select('token platform').lean();
  return docs.map(d => d.token);
};

// Statics: remove invalid tokens
fcmTokenSchema.statics.removeInvalidTokens = async function (tokenStrings) {
  if (!tokenStrings || tokenStrings.length === 0) return;
  await this.deleteMany({ token: { $in: tokenStrings } });
  console.log(`[FCMToken] Removed ${tokenStrings.length} invalid tokens`);
};

// Statics: save or update a token for a user (upsert)
fcmTokenSchema.statics.saveToken = async function (userId, userModel, token, platform = 'web') {
  try {
    const result = await this.findOneAndUpdate(
      { userId, userModel, token },
      {
        userId,
        userModel,
        token,
        platform,
        isActive: true,
        lastUsedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Limit to 10 tokens per user per platform
    const count = await this.countDocuments({ userId, userModel, platform, isActive: true });
    if (count > 10) {
      const oldest = await this.find({ userId, userModel, platform, isActive: true })
        .sort({ lastUsedAt: 1 })
        .limit(count - 10)
        .select('_id');
      await this.deleteMany({ _id: { $in: oldest.map(d => d._id) } });
    }

    return result;
  } catch (error) {
    // Handle duplicate key error gracefully (race condition)
    if (error.code === 11000) {
      return await this.findOne({ userId, userModel, token });
    }
    throw error;
  }
};

// Statics: remove a specific token
fcmTokenSchema.statics.removeToken = async function (userId, userModel, token) {
  return await this.deleteOne({ userId, userModel, token });
};

// Statics: remove all tokens for a user
fcmTokenSchema.statics.removeAllTokens = async function (userId, userModel) {
  return await this.deleteMany({ userId, userModel });
};

const FCMToken = mongoose.model('FCMToken', fcmTokenSchema);

module.exports = FCMToken;
