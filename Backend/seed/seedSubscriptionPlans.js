// Seeds the two starter subscription plans (Basic/Pro). Prices and feature
// lists here are placeholders -- edit them directly in this file (or via a
// future admin UI) and re-run; existing plans are matched by `key` and
// updated in place rather than duplicated, so this is safe to re-run anytime
// the numbers change.
//
// Usage (run from the Backend/ directory so it picks up the same .env as the
// server):
//   node seed/seedSubscriptionPlans.js

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../Config/DbConnection");
const SubscriptionPlanModel = require("../Models/SubscriptionPlanModel");

const PLANS = [
  {
    key: "basic",
    name: "Basic",
    price: 999,
    billingInterval: "month",
    maxStaff: 3,
    features: [
      "Stock & raw material inventory",
      "Live gold / silver / diamond rates",
      "GST-compliant billing & invoicing",
      "Customer & Udhar (credit) tracking",
      "Up to 3 staff accounts",
      "Excel export / backup",
    ],
    isActive: true,
  },
  {
    key: "pro",
    name: "Pro",
    price: 1999,
    billingInterval: "month",
    maxStaff: 0, // unlimited
    features: [
      "Everything in Basic",
      "Unlimited staff accounts",
      "Girvi / pledge loan management with auto interest",
      "Priority support",
    ],
    isActive: true,
  },
];

async function main() {
  await connectDB();

  let created = 0;
  let updated = 0;
  for (const plan of PLANS) {
    const result = await SubscriptionPlanModel.findOneAndUpdate(
      { key: plan.key },
      plan,
      { upsert: true, new: true, rawResult: true }
    );
    if (result.lastErrorObject?.updatedExisting) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  console.log(`Subscription plans: ${created} created, ${updated} updated.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error("Subscription plan seeding failed:", error);
  process.exit(1);
});
