const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: '',
      trim: true,
    },

    image: {
      type: String,
      default: '',
      trim: true,
    },

    category: {
      type: String,
      default: 'General',
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Duration is stored as days + hours + minutes so a plan can run shorter
     * than a day (e.g. 2 hours) or exactly on an hour/minute boundary
     * (e.g. 1 day 2 hours 30 minutes). `duration` holds the days part and
     * stays required for backwards compatibility with older plan documents.
     */
    duration: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    durationHours: {
      type: Number,
      default: 0,
      min: 0,
      max: 23,
    },

    durationMinutes: {
      type: Number,
      default: 0,
      min: 0,
      max: 59,
    },

    returnAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    displayOrder: {
      type: Number,
      default: 1,
      min: 0,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Plan', planSchema);