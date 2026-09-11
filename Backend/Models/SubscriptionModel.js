const mongoose = require("mongoose");

// One subscription per firm (never per-user) -- a firm's staff all share
// their admin's subscription. See Utils/subscription.js for the gate that
// reads this, and requireActiveSubscription for how status/endDate combine
// to decide access.
const subscriptionSchema = mongoose.Schema({
  firm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Firm",
    required: true,
    unique: true,
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubscriptionPlan",
    required: true,
  },
  status: {
    type: String,
    enum: ["trialing", "active", "expired", "cancelled"],
    default: "trialing",
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  // 'none' during the free trial, 'manual' for a dev/test activation with no
  // money involved, 'razorpay' (or another gateway key) once a real payment
  // has gone through.
  paymentProvider: {
    type: String,
    enum: ["none", "manual", "razorpay"],
    default: "none",
  },
  paymentReference: {
    type: String,
    default: "",
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
