// Mirrors Backend/seed/seedSubscriptionPlans.js exactly -- that seed file is
// the authoritative source for plan price/features (also what SubscribePage
// fetches live post-login). Keep this in sync if the seed changes; do not
// invent features or pricing here.
export const PRICING_PLANS = [
  {
    key: "basic",
    name: "Basic",
    price: 999,
    interval: "/month",
    maxStaff: 3,
    features: [
      "Stock & raw material inventory",
      "Live gold / silver / diamond rates",
      "GST-compliant billing & invoicing",
      "Customer & Udhar (credit) tracking",
      "Up to 3 staff accounts",
      "Excel export / backup",
    ],
    highlighted: false,
  },
  {
    key: "pro",
    name: "Pro",
    price: 1999,
    interval: "/month",
    maxStaff: null,
    features: [
      "Everything in Basic",
      "Unlimited staff accounts",
      "Girvi / pledge loan management with auto interest",
      "Priority support",
    ],
    highlighted: true,
  },
];
