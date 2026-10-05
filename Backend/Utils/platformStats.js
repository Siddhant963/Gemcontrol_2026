// Pure helpers for the platform-owner panel (Controllers/platformController.js).
// No DB, no I/O -- plain data in, plain data out, so they are unit-testable.

const DAY_MS = 24 * 60 * 60 * 1000;

// Presentation state of a firm's subscription, from the same rule the access
// gate uses (Utils/subscription.js isSubscriptionCurrentlyActive): it only
// grants access when status is trialing/active AND endDate has not passed.
//   none      no subscription row
//   trial     trialing and still running
//   active    paid and still running
//   cancelled status "cancelled" (revoked / account deleted)
//   expired   anything else that no longer grants access (incl. a trialing or
//             active row whose endDate has passed but wasn't flipped yet)
function effectiveSubscriptionState(sub, now = Date.now()) {
  if (!sub) return "none";
  const end = sub.endDate ? new Date(sub.endDate).getTime() : 0;
  if ((sub.status === "trialing" || sub.status === "active") && end >= now) {
    return sub.status === "trialing" ? "trial" : "active";
  }
  if (sub.status === "cancelled") return "cancelled";
  return "expired";
}

// ["2026-05", ..., "2026-10"] -- the last `n` calendar months, oldest first
// (UTC, to match MongoDB's $dateToString default).
function lastMonthKeys(n, now = new Date()) {
  const keys = [];
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

// Turns sparse rows ({ _id: "2026-09", ...fields }) into one entry per month
// key, with `empty` fields for months that had no data.
function fillMonths(keys, rows, empty) {
  const byKey = new Map(rows.map((r) => [r._id ?? r.month, r]));
  return keys.map((month) => {
    const row = byKey.get(month);
    const out = { month, ...empty };
    if (row) for (const k of Object.keys(empty)) out[k] = row[k] ?? empty[k];
    return out;
  });
}

function monthKeyOf(date) {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Breaks a list of firms' subscriptions down for the overview cards.
// `firmIds` are the (non-removed) firms; firms with no row count as "none".
// NOTE: a Subscription row stores only the LATEST payment for a firm
// (amountPaid / paymentReference), not a payment history, so the money figure
// here is "latest payment of currently active paid plans", not lifetime revenue.
function summarizeSubscriptions(firmIds, subscriptions, now = Date.now()) {
  const subByFirm = new Map(subscriptions.map((s) => [String(s.firm), s]));
  const states = { none: 0, trial: 0, active: 0, expired: 0, cancelled: 0 };
  const byPlan = new Map();
  const providers = { razorpay: 0, apple_iap: 0, manual: 0, none: 0 };
  let activePaidValue = 0;
  let expiring7 = 0;
  let expiring30 = 0;

  for (const id of firmIds) {
    const sub = subByFirm.get(String(id));
    const state = effectiveSubscriptionState(sub, now);
    states[state] += 1;
    if (!sub) continue;

    const planKey = sub.plan?.key ?? "unknown";
    const planName = sub.plan?.name ?? "Unknown plan";
    const entry = byPlan.get(planKey) ?? {
      key: planKey, name: planName, price: sub.plan?.price ?? 0, trial: 0, active: 0, ended: 0,
    };
    if (state === "trial") entry.trial += 1;
    else if (state === "active") entry.active += 1;
    else entry.ended += 1;
    byPlan.set(planKey, entry);

    if (state === "active") {
      providers[sub.paymentProvider] = (providers[sub.paymentProvider] ?? 0) + 1;
      activePaidValue += Number(sub.amountPaid) || 0;
    }
    if (state === "active" || state === "trial") {
      const left = new Date(sub.endDate).getTime() - now;
      if (left <= 7 * DAY_MS) expiring7 += 1;
      if (left <= 30 * DAY_MS) expiring30 += 1;
    }
  }

  return {
    totalFirms: firmIds.length,
    states,
    paidActive: states.active,
    byPlan: [...byPlan.values()].sort((a, b) => b.active - a.active || a.price - b.price),
    providers,
    activePaidValue,
    expiringWithin7Days: expiring7,
    expiringWithin30Days: expiring30,
  };
}

// Escapes user text so it can be used in a RegExp safely (search box input).
function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  DAY_MS,
  effectiveSubscriptionState,
  lastMonthKeys,
  fillMonths,
  monthKeyOf,
  summarizeSubscriptions,
  escapeRegExp,
};
