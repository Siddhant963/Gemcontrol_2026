const SubscriptionModel = require("../Models/SubscriptionModel");
const SubscriptionPlanModel = require("../Models/SubscriptionPlanModel");

const TRIAL_DAYS = 14;

// Called once, right after a new Firm is created during self-signup. Gives
// every new shop a free 14-day trial with no payment provider involved, so
// they can use the whole app before ever seeing a plan/paywall.
async function ensureTrialSubscription(firmId) {
  const existing = await SubscriptionModel.findOne({ firm: firmId });
  if (existing) return existing;

  // Trials aren't tied to a specific paid plan, but the schema requires one
  // -- fall back to whichever plan is marked active (lowest price first) so
  // the trial has something sensible to "become" if the admin just lets it
  // convert instead of picking explicitly.
  const defaultPlan = await SubscriptionPlanModel.findOne({ isActive: true }).sort({ price: 1 });
  if (!defaultPlan) {
    throw new Error("No subscription plans configured -- run the seed script first");
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  return SubscriptionModel.create({
    firm: firmId,
    plan: defaultPlan._id,
    status: "trialing",
    startDate,
    endDate,
    paymentProvider: "none",
  });
}

// True if `sub` currently grants access -- i.e. its status is one of the
// "paid for" states AND its endDate hasn't passed. Doesn't mutate anything;
// see requireActiveSubscription below for the self-healing status flip.
function isSubscriptionCurrentlyActive(sub) {
  if (!sub) return false;
  if (sub.status !== "trialing" && sub.status !== "active") return false;
  return sub.endDate.getTime() >= Date.now();
}

// Gate applied to every business route (see AdminRoutes.js) -- requires
// isLoggedIn to have already run so req.user.firm is set. A firm with no
// subscription, an expired one, or a cancelled one gets a 402 rather than a
// generic 403, so the frontend can tell "not paid" apart from "not allowed".
async function requireActiveSubscription(req, res, next) {
  try {
    if (!req.user?.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const sub = await SubscriptionModel.findOne({ firm: req.user.firm });
    if (!sub) {
      return res.status(402).json({
        message: "No subscription found for your firm. Please subscribe to continue.",
        code: "SUBSCRIPTION_REQUIRED",
      });
    }
    if (!isSubscriptionCurrentlyActive(sub)) {
      // Self-heal: a trial/active row whose endDate has simply passed since
      // the last check is lazily flipped to 'expired' here rather than
      // needing a cron job to keep every row's status truthful.
      if (sub.status === "trialing" || sub.status === "active") {
        sub.status = "expired";
        await sub.save();
      }
      return res.status(402).json({
        message:
          sub.status === "cancelled"
            ? "Your subscription was cancelled. Please subscribe to continue."
            : "Your subscription has expired. Please subscribe to continue.",
        code: "SUBSCRIPTION_REQUIRED",
      });
    }
    next();
  } catch (error) {
    console.error("Error checking subscription:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  TRIAL_DAYS,
  ensureTrialSubscription,
  isSubscriptionCurrentlyActive,
  requireActiveSubscription,
};
