const mongoose = require('mongoose');

const paymentProofSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    screenshot: {
      type: String,
      required: true,
    },

    accountDetails: {
      type: String,
      required: true,
    },

    // Distinguishes a CDM plan-purchase request from an old wallet
    // deposit proof. Existing rows have no value -> treated as
    // 'wallet_deposit' for backward compatibility.
    type: {
      type: String,
      enum: ['wallet_deposit', 'plan_cdm'],
      default: 'wallet_deposit',
    },

    // For CDM plan purchases: which plan the user is paying for, the
    // linked Payment record, and the Subscription created on approval.
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      default: null,
    },

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },

    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
    },

    transactionId: {
      type: String,
      default: '',
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentProof', paymentProofSchema);