const mongoose = require("mongoose");

// Small admin-configurable catalog of plans a firm can subscribe to. Kept as
// its own collection (rather than hardcoded) so prices/features can change
// without a deploy -- see Backend/seed/seedSubscriptionPlans.js for the
// current Basic/Pro defaults.
const subscriptionPlanSchema = mongoose.Schema({
  key: {
    // Stable identifier used in code/URLs (e.g. "basic", "pro"); the display
    // name can change without breaking existing Subscription references.
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    // In INR (paise-free -- whole rupees), 0 for a free/manual plan.
    type: Number,
    required: true,
    default: 0,
  },
  billingInterval: {
    type: String,
    enum: ["month", "year"],
    default: "month",
  },
  // Null/0 means unlimited staff.
  maxStaff: {
    type: Number,
    default: 0,
  },
  features: {
    type: [String],
    default: [],
  },
  // Retire a plan without deleting it (existing subscriptions on it keep
  // working; it just stops being offered to new signups).
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
