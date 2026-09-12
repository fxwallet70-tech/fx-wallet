const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: 'admin',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Active refresh tokens, stored as SHA-256 digests and never selected by
    // default so they cannot leak through an admin lookup.
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Admin', adminSchema);