// What a firm's CURRENT plan actually allows. The plan's text ("Up to 3 staff",
// "Girvi management") used to be display-only; this is the single place that
// turns it into rules, enforced server-side by the middleware/guards below.
//
// Rules (agreed with the product owner):
//   * A running free TRIAL gets Pro-level access (try everything).
//   * A paid ACTIVE plan gets what that plan includes:
//       - Girvi: only plans that include it (Pro).
//       - Staff accounts: limited to plan.maxStaff (0/null = unlimited).
//   * Existing data is never removed: a Basic firm that already has Girvi
//     loans or more staff keeps and can service them; only CREATING new
//     Girvi entries / new staff past the limit needs the right plan.
const SubscriptionModel = require("../Models/SubscriptionModel");
const UserModel = require("../Models/UserModel");
const { effectiveSubscriptionState } = require("./platformStats");

// Fallbacks for plan documents created before these fields existed, so a
// Pro firm never loses Girvi just because the plan row wasn't re-seeded.
const DEFAULT_GIRVI_BY_KEY = { pro: true };
const DEFAULT_MAX_STAFF_BY_KEY = { basic: 3 };

function planIncludesGirvi(plan) {
  if (!plan) return false;
  if (typeof plan.includesGirvi === "boolean") return plan.includesGirvi;
  return DEFAULT_GIRVI_BY_KEY[plan.key] === true;
}

// 0 = unlimited (same convention as SubscriptionPlan.maxStaff).
function planMaxStaff(plan) {
  if (!plan) return 0;
  if (typeof plan.maxStaff === "number") return plan.maxStaff;
  return DEFAULT_MAX_STAFF_BY_KEY[plan.key] ?? 0;
}

// Pure: subscription row (with `plan` populated) -> entitlements.
function entitlementsFor(sub, now = Date.now()) {
  const state = effectiveSubscriptionState(sub, now);
  if (state === "trial") return { state, girvi: true, staffLimit: 0 };
  if (state === "active") {
    return { state, girvi: planIncludesGirvi(sub.plan), staffLimit: planMaxStaff(sub.plan) };
  }
  return { state, girvi: false, staffLimit: 0 };
}

// Active (non-removed) accounts of a firm EXCLUDING the owner account.
// The owner is not a "staff account", so Basic = owner + 3 more.
async function countExtraAccounts(firmId) {
  const total = await UserModel.countDocuments({ firm: firmId, removeAt: null });
  return Math.max(total - 1, 0);
}

async function loadEntitlements(firmId) {
  const sub = await SubscriptionModel.findOne({ firm: firmId }).populate("plan");
  return { sub, ...entitlementsFor(sub) };
}

const UPGRADE_CODE = "PLAN_UPGRADE_REQUIRED";

// Express middleware factory: blocks the route unless the firm's plan
// includes `feature` (currently only "girvi").
function requirePlanFeature(feature) {
  return async (req, res, next) => {
    try {
      if (!req.user?.firm) return next(); // other guards deal with firm-less users
      const ent = await loadEntitlements(req.user.firm);
      if (ent[feature]) return next();
      return res.status(403).json({
        code: UPGRADE_CODE,
        feature,
        message: "Girvi / Borrows management is part of the Pro plan. Upgrade your plan to add new entries.",
      });
    } catch (error) {
      console.error("requirePlanFeature error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}

// Returns null when one more account may be added, otherwise the 403 body.
async function staffLimitViolation(firmId) {
  const ent = await loadEntitlements(firmId);
  if (!ent.staffLimit) return null; // unlimited
  const used = await countExtraAccounts(firmId);
  if (used < ent.staffLimit) return null;
  return {
    code: UPGRADE_CODE,
    feature: "staff",
    message: `Your plan allows up to ${ent.staffLimit} staff accounts. Upgrade to Pro for unlimited staff.`,
  };
}

// Everything the apps need to show the right UI (backend stays the authority).
async function describeEntitlements(firmId, sub = undefined) {
  const row = sub === undefined ? await SubscriptionModel.findOne({ firm: firmId }).populate("plan") : sub;
  const ent = entitlementsFor(row);
  return {
    girvi: ent.girvi,
    staffLimit: ent.staffLimit, // 0 = unlimited
    staffUsed: await countExtraAccounts(firmId),
  };
}

module.exports = {
  UPGRADE_CODE,
  planIncludesGirvi,
  planMaxStaff,
  entitlementsFor,
  loadEntitlements,
  requirePlanFeature,
  staffLimitViolation,
  describeEntitlements,
};
