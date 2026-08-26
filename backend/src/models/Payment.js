const mongoose = require('mongoose');

const paymentSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },

      plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
        required: true,
      },

      subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription',
        default: null,
      },

      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      currency: {
        type: String,
        default: 'INR',
      },

      method: {
        type: String,
        enum: ['Wallet', 'Razorpay', 'CDM'],
        required: true,
      },

      transactionId: {
        type: String,
        default: undefined,
        index: true,
      },

      razorpayOrderId: {
        type: String,
        default: undefined,
        unique: true,
        sparse: true,
      },

      razorpayPaymentId: {
        type: String,
        default: undefined,
        unique: true,
        sparse: true,
      },

      razorpaySignature: {
        type: String,
        default: undefined,
      },

      receipt: {
        type: String,
        default: undefined,
      },

      status: {
        type: String,
        enum: [
          'Created',
          'Pending',
          'Success',
          'Failed',
          'Refunded',
        ],
        default: 'Created',
        index: true,
      },

      failureReason: {
        type: String,
        default: '',
      },
    },
    {
      timestamps: true,
    },
  );

paymentSchema.index({
  user: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  'Payment',
  paymentSchema,
);