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
  // Max staff accounts besides the owner. 0 means UNLIMITED. Deliberately no
  // default: a plan row that never stored a value must not silently read as
  // "unlimited" -- Utils/planAccess.js falls back per plan key instead
  // (Basic = 3). Seeded plans always set it explicitly.
  maxStaff: {
    type: Number,
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
  // Apple App Store Connect product identifier for this plan's iOS
  // auto-renewable subscription (e.g. "Ratnsetu" for basic, "Ratnsetu1" for
  // pro). Optional -- existing plans/documents with no Apple product don't
  // need one, and a plan not sold on iOS can simply leave this unset. This
  // is the single source of truth for the Apple productId -> internal plan
  // mapping; see Utils/appleIap.js, which looks plans up by this field
  // rather than hardcoding the mapping in controller code.
  // Whether this plan includes Girvi / Borrows management. Deliberately has
  // NO default: plan rows created before this field existed fall back to a
  // per-key default in Utils/planAccess.js (so Pro never loses it by accident).
  includesGirvi: {
    type: Boolean,
  },
  appleProductId: {
    type: String,
    default: undefined,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Sparse: only iOS-sold plans set this, and a plain unique index would
// otherwise collide across every plan that leaves it unset (undefined).
subscriptionPlanSchema.index({ appleProductId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
