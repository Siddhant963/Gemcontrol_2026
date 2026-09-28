const SubscriptionModel = require("../Models/SubscriptionModel");
const SubscriptionPlanModel = require("../Models/SubscriptionPlanModel");

const TRIAL_DAYS = 14;

// Thrown by activatePaidSubscription when writing appleOriginalTransactionId
// would collide with a DIFFERENT firm's Subscription doc -- the database
// unique index on that field (SubscriptionModel.js) is the last-resort
// backstop against a race between two concurrent requests for two
// different firms both passing an earlier in-memory ownership check before
// either has written (see verifyAppleSubscription's explicit pre-check for
// the common case; this is the TOCTOU backstop for the rare one). Callers
// on the Apple path catch this and respond 409; Razorpay/manual callers
// never set appleOriginalTransactionId, so they can never trigger it.
class AppleTransactionOwnershipConflictError extends Error {
  constructor(appleOriginalTransactionId) {
    super(
      `appleOriginalTransactionId ${appleOriginalTransactionId} is already associated with a different firm`
    );
    this.name = "AppleTransactionOwnershipConflictError";
    this.appleOriginalTransactionId = appleOriginalTransactionId;
  }
}

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

// Shared by verifySubscriptionPayment (client-callback path), the
// order.paid webhook, and the Apple IAP verify endpoint/notifications --
// all may fire more than once for the same successful payment, so this is
// idempotent: if the subscription already recorded this exact
// paymentReference, it's returned unchanged instead of re-extending endDate
// a second time.
//
// appleOriginalTransactionId is optional and only ever set by the Apple
// IAP path (Utils/appleIap.js) -- Razorpay/manual callers simply omit it,
// which leaves the field untouched on an existing doc and unset on a new
// one, so this is fully backward compatible with the existing Razorpay flow.
async function activatePaidSubscription({
  firm,
  plan,
  paymentProvider,
  paymentReference,
  amountPaid,
  startDate,
  endDate,
  appleOriginalTransactionId,
}) {
  const existing = await SubscriptionModel.findOne({ firm });
  if (existing && existing.paymentReference === paymentReference) {
    return existing.populate("plan");
  }

  const update = {
    firm,
    plan: plan._id,
    status: "active",
    startDate,
    endDate,
    paymentProvider,
    paymentReference,
    amountPaid,
  };
  if (appleOriginalTransactionId) {
    update.appleOriginalTransactionId = appleOriginalTransactionId;
  }

  try {
    return await SubscriptionModel.findOneAndUpdate({ firm }, update, {
      new: true,
      upsert: true,
    }).populate("plan");
  } catch (error) {
    // E11000 on the appleOriginalTransactionId unique index means some
    // OTHER firm's Subscription doc already has this value -- this firm's
    // write must not silently overwrite or duplicate it.
    if (error?.code === 11000 && appleOriginalTransactionId) {
      throw new AppleTransactionOwnershipConflictError(appleOriginalTransactionId);
    }
    throw error;
  }
}

// Looks up the Subscription doc that owns a given Apple subscription,
// independent of firm -- needed by the App Store Server Notifications
// handler, which only ever gets an originalTransactionId from Apple, never
// a firm id. Used for the lifecycle events that aren't "activate a
// payment" (expire, cancel/revoke) as well as to find which firm a renewal
// notification belongs to before calling activatePaidSubscription above.
function findSubscriptionByAppleOriginalTransactionId(appleOriginalTransactionId) {
  return SubscriptionModel.findOne({ appleOriginalTransactionId }).populate("plan");
}

// Directly sets status for lifecycle events that are NOT a successful
// payment (expired, cancelled/revoked) -- activatePaidSubscription above
// is only for the "grant/extend access" path, so those cases update the
// existing row in place instead of going through it. No-op (returns null)
// if no subscription is associated with this Apple subscription yet.
async function setStatusByAppleOriginalTransactionId(appleOriginalTransactionId, status) {
  return SubscriptionModel.findOneAndUpdate(
    { appleOriginalTransactionId },
    { status },
    { new: true }
  ).populate("plan");
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
  activatePaidSubscription,
  findSubscriptionByAppleOriginalTransactionId,
  setStatusByAppleOriginalTransactionId,
  isSubscriptionCurrentlyActive,
  requireActiveSubscription,
  AppleTransactionOwnershipConflictError,
};
