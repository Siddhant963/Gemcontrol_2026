// One-time backfill: grants every pre-existing Firm (created before the
// subscription gate existed) an active subscription so requireActiveSubscription
// doesn't instantly lock out everyone already using the app. Firms that
// already have a Subscription row are left untouched. New signups going
// forward get the normal 14-day trial via ensureTrialSubscription instead.
//
// Usage (run from the Backend/ directory so it picks up the same .env as the
// server), AFTER seed/seedSubscriptionPlans.js:
//   node seed/backfillExistingSubscriptions.js

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../Config/DbConnection");
const FirmModel = require("../Models/FirmModel");
const SubscriptionModel = require("../Models/SubscriptionModel");
const SubscriptionPlanModel = require("../Models/SubscriptionPlanModel");

// Long runway (1 year) rather than a short trial -- these are firms already
// mid-use, not new signups being onboarded.
const GRANDFATHER_DAYS = 365;

async function main() {
  await connectDB();

  const proPlan = await SubscriptionPlanModel.findOne({ key: "pro" });
  if (!proPlan) {
    throw new Error("Pro plan not found -- run seed/seedSubscriptionPlans.js first");
  }

  const firms = await FirmModel.find({ removeAt: null });
  let created = 0;
  for (const firm of firms) {
    const existing = await SubscriptionModel.findOne({ firm: firm._id });
    if (existing) continue;

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + GRANDFATHER_DAYS * 24 * 60 * 60 * 1000);
    await SubscriptionModel.create({
      firm: firm._id,
      plan: proPlan._id,
      status: "active",
      startDate,
      endDate,
      paymentProvider: "manual",
    });
    created += 1;
  }

  console.log(`Backfilled ${created} of ${firms.length} firm(s) (rest already had a subscription).`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error("Subscription backfill failed:", error);
  process.exit(1);
});
