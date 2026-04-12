const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      required: true,
      enum: ['phone', 'email'],
      index: true
    },
    identifier: {
      type: String,
      required: true,
      index: true
    },
    codeHash: {
      type: String,
      required: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    },
    verifiedAt: {
      type: Date
    },
    usedAt: {
      type: Date
    },

    // Rate limiting
    cooldownUntil: {
      type: Date
    },
    hourlyWindowStart: {
      type: Date
    },
    hourlySendCount: {
      type: Number,
      default: 0
    },
    lastSentAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

OTPSchema.index({ channel: 1, identifier: 1 }, { unique: true });

module.exports = mongoose.model('OTP', OTPSchema);
