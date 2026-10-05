// Single place that turns the backend's verified subscription state
// ({ subscription, isActive } from GET /getMySubscription) into what the
// Subscription screen shows. The backend stays the source of truth:
//   isActive  = status is "trialing"/"active" AND endDate has not passed
//               (Backend/Utils/subscription.js isSubscriptionCurrentlyActive)
//   status    = trialing | active | expired | cancelled
// No new statuses are invented here. The backend does not store an
// auto-renew flag, so "cancelled but active until expiry" is simply an
// active subscription with a future endDate and is shown as such.

export const SUBSCRIPTION_PHASE = {
  NONE: "none", // no subscription row yet
  TRIAL: "trial", // free trial still running
  ACTIVE: "active", // paid plan currently granting access
  ENDED: "ended", // expired or cancelled
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysLeft(endDate, now = Date.now()) {
  if (!endDate) return 0;
  return Math.max(Math.ceil((new Date(endDate).getTime() - now) / DAY_MS), 0);
}

export function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getSubscriptionPresentation(mySubscription, now = Date.now()) {
  const sub = mySubscription?.subscription ?? null;
  const base = {
    phase: SUBSCRIPTION_PHASE.NONE,
    endedReason: null,
    planId: null,
    planName: "",
    endDate: null,
    daysLeft: 0,
  };
  if (!sub) return base;

  const common = {
    ...base,
    planId: sub.plan?._id ?? sub.plan ?? null,
    planName: sub.plan?.name ?? "",
    endDate: sub.endDate ?? null,
    daysLeft: daysLeft(sub.endDate, now),
  };

  if (mySubscription?.isActive) {
    return {
      ...common,
      phase: sub.status === "trialing" ? SUBSCRIPTION_PHASE.TRIAL : SUBSCRIPTION_PHASE.ACTIVE,
    };
  }
  return {
    ...common,
    phase: SUBSCRIPTION_PHASE.ENDED,
    endedReason: sub.status === "cancelled" ? "cancelled" : "expired",
  };
}

export function getSubscriptionCopy(p) {
  switch (p.phase) {
    case SUBSCRIPTION_PHASE.TRIAL:
      return {
        heading: "Choose a Plan Anytime",
        message: `Your free trial is active — ${p.daysLeft} day(s) left.`,
        severity: "info",
      };
    case SUBSCRIPTION_PHASE.ACTIVE:
      return {
        heading: "Your Subscription",
        message: `${p.planName ? `You're on the ${p.planName} plan` : "Your subscription is active"} — active until ${formatDate(p.endDate)}.`,
        severity: "success",
      };
    case SUBSCRIPTION_PHASE.ENDED:
      return {
        heading: "Subscribe to Continue",
        message:
          p.endedReason === "cancelled"
            ? "Your subscription was cancelled. Pick a plan below to keep using RatnSetu."
            : "Your subscription has ended. Pick a plan below to keep using RatnSetu.",
        severity: "warning",
      };
    default:
      return {
        heading: "Subscribe to Continue",
        message: "Pick a plan below to start using RatnSetu.",
        severity: "info",
      };
  }
}

// Only a PAID, currently-active plan counts as "the current plan". A trial
// row (which points at a default plan) or an ended subscription must not
// disable that plan's button -- otherwise an expired user could never renew
// the very plan they were on.
export function getPlanAction(p, planId, { activating = false } = {}) {
  const isCurrent = p.phase === SUBSCRIPTION_PHASE.ACTIVE && p.planId === planId;
  if (activating) return { isCurrent, label: "Opening checkout...", disabled: true };
  if (isCurrent) return { isCurrent, label: "Current Plan", disabled: true };
  switch (p.phase) {
    case SUBSCRIPTION_PHASE.ACTIVE:
      return { isCurrent, label: "Switch plan", disabled: false };
    case SUBSCRIPTION_PHASE.ENDED:
      return { isCurrent, label: "Renew", disabled: false };
    default:
      return { isCurrent, label: "Subscribe", disabled: false };
  }
}
