const mongoose = require("mongoose");

const CdmSetting = require("../models/CdmSetting");
const Plan = require("../models/Plan");
const User = require("../models/User");
const Payment = require("../models/Payment");
const PaymentProof = require("../models/PaymentProof");
const Subscription = require("../models/Subscription");
const WalletTransaction = require("../models/WalletTransaction");
const ReferralSettings = require("../models/ReferralSettings");
const { sendNotification } = require("../services/notificationService");

/* --------------------------------------------------------------------
 * CDM deposit instructions (admin manages, user sees)
 * ------------------------------------------------------------------ */
const getCdmSetting = async (req, res) => {
  try {
    const record = await CdmSetting.findOne();

    return res.status(200).json({
      success: true,
      data: record || { image: null, description: "" },
    });
  } catch (error) {
    console.error("Get CDM setting error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const updateCdmSetting = async (req, res) => {
  try {
    const { description } = req.body;

    let record = await CdmSetting.findOne();

    if (!record) {
      record = new CdmSetting();
    }

    if (description !== undefined) {
      record.description = description;
    }

    if (req.file) {
      record.image = `/uploads/cdm/${req.file.filename}`;
    }

    await record.save();

    return res.status(200).json({
      success: true,
      message: "CDM payment info updated successfully",
      data: record,
    });
  } catch (error) {
    console.error("Update CDM setting error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* --------------------------------------------------------------------
 * User: submit a CDM plan-purchase request with a receipt screenshot
 * ------------------------------------------------------------------ */
const createCdmRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId, accountDetails, transactionId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Receipt screenshot is required",
      });
    }

    if (!accountDetails) {
      return res.status(400).json({
        success: false,
        message: "Please provide your deposit details",
      });
    }

    if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({
        success: false,
        message: "Valid plan ID is required",
      });
    }

    const plan = await Plan.findOne({ _id: planId, status: true });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found or inactive",
      });
    }

    const amount = Number(plan.price);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan price",
      });
    }

    const user = await User.findById(userId).select("isActive");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    const receipt =
      `CDM-${Date.now()}-${userId.toString().slice(-6)}`;

    const payment = await Payment.create({
      user: userId,
      plan: plan._id,
      amount,
      currency: "INR",
      method: "CDM",
      transactionId: transactionId || receipt,
      receipt,
      status: "Pending",
    });

    const proof = await PaymentProof.create({
      user: userId,
      type: "plan_cdm",
      plan: plan._id,
      payment: payment._id,
      screenshot: `/uploads/proofs/${req.file.filename}`,
      accountDetails,
      transactionId: transactionId || "",
      status: "pending",
    });

    /*
     * Create a subscription with status "Pending" so the user can see
     * it in My Subscription while waiting for admin approval.
     */
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Number(plan.duration));

    const subscription = await Subscription.create({
      user: userId,
      plan: plan._id,
      startDate,
      endDate,
      status: "Pending",
      amountPaid: amount,
      returnAmount: Number(plan.returnAmount || 0),
      paymentMethod: "CDM",
      paymentStatus: "Pending",
      returnStatus: Number(plan.returnAmount || 0) > 0 ? "Pending" : "NotApplicable",
    });

    // Link the subscription to payment and proof
    payment.subscription = subscription._id;
    await payment.save();

    proof.subscription = subscription._id;
    await proof.save();

    return res.status(201).json({
      success: true,
      message:
        "CDM payment submitted. Our team will review your receipt and activate your plan once approved.",
      data: proof,
      payment: { _id: payment._id, status: payment.status, amount },
      subscription,
    });
  } catch (error) {
    console.error("Create CDM request error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* ------------------------------------------------------------------
 * User: list their own CDM plan-purchase requests
 * ------------------------------------------------------------------ */
const getMyCdmRequests = async (req, res) => {
  try {
    const proofs = await PaymentProof.find({
      user: req.user.id,
      type: "plan_cdm",
    })
      .populate("plan", "title price duration")
      .populate("payment", "amount status receipt")
      .populate("subscription", "status startDate endDate")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, proofs });
  } catch (error) {
    console.error("Get my CDM requests error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* ------------------------------------------------------------------
 * Admin: list all CDM plan-purchase requests
 * ------------------------------------------------------------------ */
const getAllCdmRequests = async (req, res) => {
  try {
    const proofs = await PaymentProof.find({ type: "plan_cdm" })
      .populate("user", "fullName email mobile")
      .populate("plan", "title price duration returnAmount")
      .populate("payment", "amount status method transactionId")
      .populate("subscription", "status startDate endDate")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, proofs });
  } catch (error) {
    console.error("Get CDM requests error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* ------------------------------------------------------------------
 * Admin: approve (activates subscription) or reject a CDM request
 * ------------------------------------------------------------------ */
const updateCdmRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected", "deleted"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved, rejected, or deleted",
      });
    }

    const proof = await PaymentProof.findById(req.params.id).populate("plan");

    if (!proof || proof.type !== "plan_cdm") {
      return res.status(404).json({
        success: false,
        message: "CDM request not found",
      });
    }

    // Allow rejection/deletion of pending OR approved items
    if (status === "rejected" || status === "deleted") {
      if (proof.status === "rejected") {
        return res.status(400).json({
          success: false,
          message: "This request was already rejected",
        });
      }

      const isDeleted = status === "deleted";
      proof.status = "rejected";
      await proof.save();

      const payment = await Payment.findById(proof.payment);
      if (payment) {
        payment.status = "Failed";
        payment.failureReason = isDeleted ? "Deleted by admin" : "Rejected by admin";
        await payment.save();
      }

      // For deleted items: skip subscription cancellation — just clean up admin panel
      // For rejected items: cancel pending subscription
      if (!isDeleted && proof.subscription) {
        const sub = await Subscription.findById(proof.subscription);
        if (sub && sub.status === "Pending") {
          sub.status = "Cancelled";
          sub.paymentStatus = "Failed";
          await sub.save();
        }
      }

      return res.status(200).json({
        success: true,
        message: isDeleted ? "CDM receipt removed" : "CDM request rejected",
      });
    }

    // Only pending items can be approved
    if (proof.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `This request was already ${proof.status}`,
      });
    }

    const payment = await Payment.findById(proof.payment);

    /* -------- Approve: activate the plan subscription -------- */
    const plan = proof.plan;

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Plan for this request no longer exists",
      });
    }

    /*
     * If a pending subscription was created at CDM submit time, activate it.
     * Otherwise create one (legacy requests submitted before this change).
     */
    let subscription = proof.subscription
      ? await Subscription.findById(proof.subscription)
      : null;

    if (subscription) {
      subscription.status = "Active";
      subscription.paymentStatus = "Paid";
      await subscription.save();
    } else {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Number(plan.duration));

      subscription = await Subscription.create({
        user: proof.user,
        plan: plan._id,
        startDate,
        endDate,
        status: "Active",
        amountPaid: Number(plan.price || 0),
        returnAmount: Number(plan.returnAmount || 0),
        paymentMethod: "CDM",
        paymentStatus: "Paid",
        returnStatus: Number(plan.returnAmount || 0) > 0 ? "Pending" : "NotApplicable",
      });
    }

    if (payment) {
      payment.status = "Success";
      payment.subscription = subscription._id;
      await payment.save();
    }

    proof.status = "approved";
    proof.subscription = subscription._id;
    await proof.save();

    // Best-effort notification — never blocks the approval.
    try {
      await sendNotification({
        user: proof.user,
        title: "Plan Approved",
        message: `Your ${plan.title} plan has been approved and activated.`,
        type: "Plan",
        action: "MySubscription",
      });
    } catch (notifyError) {
      console.error("CDM approval notification error:", notifyError);
    }

    // Best-effort referral reward — fires once, on first successful purchase.
    try {
      const buyer = await User.findById(proof.user);

      if (buyer && buyer.referredBy && !buyer.referralRewardGiven) {
        const settings = await ReferralSettings.findOne();

        if (settings && settings.enabled) {
          const purchaseAmount = Number(payment?.amount || plan.price || 0);

          if (purchaseAmount >= Number(settings.minPurchaseAmount || 0)) {
            const rewardAmount =
              settings.rewardType === "percentage"
                ? (purchaseAmount * Number(settings.rewardValue)) / 100
                : Number(settings.rewardValue);

            if (rewardAmount > 0) {
              const referrer = await User.findById(buyer.referredBy);

              if (referrer) {
                referrer.walletBalance = Number(referrer.walletBalance || 0) + rewardAmount;
                await referrer.save();

                await WalletTransaction.create({
                  user: referrer._id,
                  type: "credit",
                  category: "ReferralBonus",
                  amount: rewardAmount,
                  description: `Referral bonus for ${buyer.fullName}'s first plan purchase`,
                  createdBy: "System",
                  referenceId: `REFERRAL_${buyer._id}`,
                });
              }
            }
          }
        }

        buyer.referralRewardGiven = true;
        await buyer.save();
      }
    } catch (referralError) {
      console.error("CDM referral reward error:", referralError);
    }

    return res.status(200).json({
      success: true,
      message: "CDM payment approved and plan activated",
      subscription,
    });
  } catch (error) {
    console.error("Update CDM request status error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* ------------------------------------------------------------------
 * Admin: delete a CDM request (receipt + related payment/subscription)
 * ------------------------------------------------------------------ */
const deleteCdmRequest = async (req, res) => {
  try {
    const proof = await PaymentProof.findById(req.params.id);

    if (!proof || proof.type !== "plan_cdm") {
      return res.status(404).json({
        success: false,
        message: "CDM request not found",
      });
    }

    // Delete associated payment
    if (proof.payment) {
      await Payment.findByIdAndDelete(proof.payment);
    }

    // Delete associated subscription (only if still Pending)
    if (proof.subscription) {
      const sub = await Subscription.findById(proof.subscription);
      if (sub && sub.status === "Pending") {
        await Subscription.findByIdAndDelete(proof.subscription);
      }
    }

    // Delete the proof itself
    await PaymentProof.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "CDM request deleted successfully",
    });
  } catch (error) {
    console.error("Delete CDM request error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  getCdmSetting,
  updateCdmSetting,
  createCdmRequest,
  getMyCdmRequests,
  getAllCdmRequests,
  updateCdmRequestStatus,
  deleteCdmRequest,
};