// Display helpers shared by the platform-owner panel pages.

export const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export const num = (n) => Number(n || 0).toLocaleString("en-IN");

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

// "2026-09" -> "Sep 26" (UTC, to match the backend's month buckets)
export const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" });
};

// Subscription state -> label + MUI Chip colour. Same states as
// Backend/Utils/platformStats.js effectiveSubscriptionState.
export const STATE_META = {
  active: { label: "Active", color: "success" },
  trial: { label: "Trial", color: "info" },
  expired: { label: "Expired", color: "warning" },
  cancelled: { label: "Cancelled", color: "error" },
  none: { label: "No subscription", color: "default" },
};

export const PROVIDER_LABEL = {
  razorpay: "Razorpay (Web/Android)",
  apple_iap: "Apple In-App Purchase",
  manual: "Manual",
  none: "Trial / none",
};
