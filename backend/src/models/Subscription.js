const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Active",
        "Expired",
        "Cancelled",
      ],
      default: "Active",
      index: true,
    },

    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
     * Snapshot the return amount at purchase time.
     * Future Plan edits will not change this subscription.
     */
    returnAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["Wallet", "Razorpay", "CDM"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Paid",
      index: true,
    },

    returnStatus: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Credited",
        "Failed",
        "NotApplicable",
      ],
      default: "Pending",
      index: true,
    },

    returnCreditedAt: {
      type: Date,
      default: null,
    },

    returnTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WalletTransaction",
      default: null,
    },

    returnFailureReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

subscriptionSchema.index({
  status: 1,
  returnStatus: 1,
  endDate: 1,
});
subscriptionSchema.index({
  returnStatus: 1,
  endDate: 1,
});

subscriptionSchema.index({
  user: 1,
  returnStatus: 1,
});

subscriptionSchema.index({
  status: 1,
  endDate: 1,
});
module.exports = mongoose.model(
  "Subscription",
  subscriptionSchema,
);