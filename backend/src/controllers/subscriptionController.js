const Subscription = require("../models/Subscription");
const User = require("../models/User");
const Plan = require("../models/Plan");
const mongoose = require('mongoose');
const WalletTransaction = require("../models/WalletTransaction");
const Payment = require("../models/Payment");
const crypto = require('crypto');
const {
  sendNotification,
} = require('../services/notificationService');

// Get all subscriptions
const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate("user", "name email")
      .populate("plan", "title price");

    res.json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
const subscribePlan = async (req, res) => {
  let debitedUser = null;
  let debitedAmount = 0;
  let createdSubscription = null;
  let createdWalletTransaction = null;
  let createdPayment = null;

  try {
    const userId = req.user.id;
    const {planId} = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "Plan ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID",
      });
    }

    const plan = await Plan.findOne({
      _id: planId,
      status: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found or inactive",
      });
    }

    const planPrice = Number(plan.price);

    if (!Number.isFinite(planPrice) || planPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan price",
      });
    }

    const now = new Date();

    // Mark expired subscriptions.
    await Subscription.updateMany(
      {
        user: userId,
        status: "Active",
        endDate: {$lt: now},
      },
      {
        $set: {status: "Expired"},
      },
    );

    // User cannot purchase another plan while one is active.
    const existingSubscription =
      await Subscription.findOne({
        user: userId,
        status: "Active",
        endDate: {$gte: now},
      }).populate(
        "plan",
        "title price duration",
      );

    if (existingSubscription) {
      return res.status(409).json({
        success: false,
        message: "You already have an active plan",
        subscription: existingSubscription,
      });
    }

    /*
     * Atomically debit only when wallet balance is sufficient.
     * This avoids two simultaneous requests spending the same balance.
     */
    debitedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        walletBalance: {$gte: planPrice},
        isActive: true,
      },
      {
        $inc: {
          walletBalance: -planPrice,
        },
      },
      {
        new: true,
      },
    );

    if (!debitedUser) {
      const user = await User.findById(userId).select(
        "walletBalance isActive",
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Your account is inactive",
        });
      }

      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Required ₹${planPrice.toFixed(
          2,
        )}, available ₹${Number(
          user.walletBalance || 0,
        ).toFixed(2)}.`,
        walletBalance: Number(
          user.walletBalance || 0,
        ),
      });
    }
    
    debitedAmount = planPrice;

    const startDate = new Date();
    const endDate = new Date(startDate);

    endDate.setDate(
      endDate.getDate() + Number(plan.duration),
    );

    createdSubscription =
      await Subscription.create({
       user: userId,
       plan: plan._id,
       startDate,
       endDate,
       status: "Active",
       amountPaid: planPrice,
       returnAmount: Number(
        plan.returnAmount || 0,
       ),
       paymentMethod: "Wallet",
       paymentStatus: "Paid",
       returnStatus:
        Number(plan.returnAmount || 0) > 0
         ? "Pending"
         : "NotApplicable",
      });
    createdWalletTransaction =
      await WalletTransaction.create({
       user: userId,
       type: "debit",
       category: "PlanPurchase",
       amount: planPrice,
       description: `Purchased ${plan.title} plan`,
       createdBy: "User",
       subscription:
       createdSubscription._id,
       referenceId:
        `PLAN_PURCHASE_WALLET_${createdSubscription._id}`,
      });

    const transactionId =
      `WALLET_${Date.now()}_${crypto
        .randomBytes(4)
        .toString('hex')}`;

    createdPayment = await Payment.create({
     user: userId,
     plan: plan._id,
     subscription:
       createdSubscription._id,
       amount: planPrice,
       currency: "INR",
       method: "Wallet",
       transactionId,
       status: "Success",
    });

    await createdSubscription.populate(
      "plan",
      "title description price duration returnAmount category image",
    );

    // Best-effort notification — must never block or fail the purchase itself.
    try {
      await sendNotification({
        user: userId,
        title: 'Subscription Activated',
        message: `Your ${plan.title} plan has been activated successfully.`,
        type: 'Plan',
        action: 'MySubscription',
      });
    } catch (notifyError) {
      console.error(
        'Subscription activation notification error:',
        notifyError,
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Plan purchased successfully using wallet",
      subscription: createdSubscription,
      payment: createdPayment,
      walletTransaction: createdWalletTransaction,
      transactionId,
      walletBalance: debitedUser.walletBalance,
    });
  } catch (error) {
    console.error(
      "Wallet plan purchase error:",
      error,
    );

    /*
     * Compensating rollback for local MongoDB installations
     * that are not configured as replica sets.
     */
    try {
      if (createdPayment?._id) {
        await Payment.findByIdAndDelete(
          createdPayment._id,
        );
      }

      if (createdWalletTransaction?._id) {
        await WalletTransaction.findByIdAndDelete(
          createdWalletTransaction._id,
        );
      }

      if (createdSubscription?._id) {
        await Subscription.findByIdAndDelete(
          createdSubscription._id,
        );
      }

      if (debitedUser?._id && debitedAmount > 0) {
        await User.findByIdAndUpdate(
          debitedUser._id,
          {
            $inc: {
               walletBalance: debitedAmount,
              },
            },
          );
        }

    } catch (rollbackError) {
      console.error(
        "Purchase rollback error:",
        rollbackError,
      );
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to purchase plan. Your wallet was not charged.",
    });
  }
};


const getUserSubscription = async (
  req,
  res,
) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    await Subscription.updateMany(
      {
        user: userId,
        status: 'Active',
        endDate: {
          $lt: now,
        },
      },
      {
        $set: {
          status: 'Expired',
        },
      },
    );

    // Also mark expired Pending subscriptions
    await Subscription.updateMany(
      {
        user: userId,
        status: 'Pending',
        endDate: {
          $lt: now,
        },
      },
      {
        $set: {
          status: 'Expired',
        },
      },
    );

    const subscription =
  await Subscription.findOne({
    user: userId,
   })
    .populate(
      "plan",
      "title description price duration returnAmount category image",
    )
    .sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      subscription: subscription || null,
    });
  } catch (error) {
    console.error(
      'Get subscription error:',
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to load subscription',
    });
  }
};
const getSubscriptionHistory = async (
  req,
  res,
) => {
  try {
    const userId = req.user.id;

    const subscriptions =
      await Subscription.find({
        user: userId,
      })
        .populate(
          'plan',
          'title price duration category',
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    console.error(
      'Subscription history error:',
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        'Unable to load subscription history',
    });
  }
};
const renewSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findById(subscriptionId)
      .populate("plan");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    const currentEndDate = new Date(subscription.endDate);
    const today = new Date();

    // If already expired, renew from today.
    // Otherwise, extend from the existing expiry date.
    const renewalStart =
      currentEndDate > today ? currentEndDate : today;

    renewalStart.setDate(
      renewalStart.getDate() + subscription.plan.duration
    );

    subscription.endDate = renewalStart;
    subscription.status = "Active";
    subscription.amountPaid += subscription.plan.price;

    await subscription.save();

    res.json({
      success: true,
      message: "Subscription Renewed",
      subscription,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
const getAllSubscriptions = async (req, res) => {
  try {

    const subscriptions = await Subscription
      .find()
      .populate("user", "name email")
      .populate("plan", "title price")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      subscriptions,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};

module.exports = {
  getSubscriptions,
  subscribePlan,
  getUserSubscription,
  getSubscriptionHistory,
  renewSubscription,
  getAllSubscriptions,
};