const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    walletBalance: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    profileImage: {
    type: String,
    default: '',
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    
    isVerified: {
      type: Boolean,
      default: false,
    },

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },

    resetCode: {
      type: String,
      default: null,
    },

    resetCodeExpiresAt: {
      type: Date,
      default: null,
    },

    // Active refresh tokens (one per logged-in device). Only the SHA-256 digest
    // is stored, and the field is never selected by default.
    refreshSessions: {
      type: [
        new mongoose.Schema(
          {
            tokenHash: { type: String, required: true },
            expiresAt: { type: Date, required: true },
          },
          { _id: false }
        ),
      ],
      default: [],
      select: false,
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    referralRewardGiven: {
      type: Boolean,
      default: false,
    },

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);