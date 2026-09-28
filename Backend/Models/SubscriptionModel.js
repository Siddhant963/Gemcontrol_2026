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
  // money involved, 'razorpay' for Android/Web payments, 'apple_iap' for
  // iOS App Store subscriptions.
  paymentProvider: {
    type: String,
    enum: ["none", "manual", "razorpay", "apple_iap"],
    default: "none",
  },
  paymentReference: {
    type: String,
    default: "",
  },
  // Apple's stable identity for a subscription across renewals -- unlike
  // paymentReference (which for apple_iap holds the *latest* transaction
  // id), this never changes for the life of the subscription, so it's what
  // App Store Server Notifications (Utils/appleIap.js) key off of to find
  // the right Subscription doc on renewal/cancellation/refund events.
  // Undefined/absent for non-Apple subscriptions.
  appleOriginalTransactionId: {
    type: String,
    default: undefined,
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

// Unique + sparse: most subscriptions are razorpay/manual/none and have no
// Apple transaction id (sparse skips those), but a given Apple
// originalTransactionId must belong to exactly one firm -- unique is the
// database-level backstop for the ownership check in
// verifyAppleSubscription/appleAppStoreNotifications (Controllers/
// adminController.js), so two firms can never end up sharing one Apple
// subscription even under a concurrent-request race. Also lets
// appleAppStoreNotifications (Utils/appleIap.js) look a subscription up by
// originalTransactionId without a firm in hand.
//
// MIGRATION NOTE: if this index fails to build on an existing database
// because two Subscription docs already share the same
// appleOriginalTransactionId, Mongo will log the failure and leave the old
// index/no index in place -- it will NOT delete or modify any data. Run
// `node scripts/checkAppleOriginalTransactionIdDuplicates.js` first on any
// real deployment to check for and resolve duplicates before this index is
// expected to be active.
subscriptionSchema.index({ appleOriginalTransactionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);
