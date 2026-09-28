// Read-only diagnostic -- makes NO changes to the database. Run this
// BEFORE deploying the new unique index on
// Subscription.appleOriginalTransactionId (Backend/Models/SubscriptionModel.js)
// against any real/existing database.
//
// Why: Mongo refuses to build a unique index over a field that already has
// duplicate values across documents. If that happens, Mongo logs the
// failure and leaves the collection/data untouched -- it does NOT delete
// or merge anything -- but the index (and the ownership protection it
// backstops) then silently never activates. This script finds any such
// duplicates ahead of time so they can be resolved deliberately.
//
// Usage (run from the Backend/ directory so it picks up the same .env as
// the server):
//   node scripts/checkAppleOriginalTransactionIdDuplicates.js

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../Config/DbConnection");
const SubscriptionModel = require("../Models/SubscriptionModel");

async function main() {
  await connectDB();

  const duplicates = await SubscriptionModel.aggregate([
    { $match: { appleOriginalTransactionId: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: "$appleOriginalTransactionId",
        count: { $sum: 1 },
        subscriptionIds: { $push: "$_id" },
        firmIds: { $push: "$firm" },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  if (duplicates.length === 0) {
    console.log(
      "No duplicate appleOriginalTransactionId values found -- safe to deploy the unique index."
    );
  } else {
    console.log(
      `Found ${duplicates.length} appleOriginalTransactionId value(s) shared by more than one Subscription doc:\n`
    );
    for (const dup of duplicates) {
      console.log(`  appleOriginalTransactionId: ${dup._id}`);
      console.log(`    subscriptionIds: ${dup.subscriptionIds.join(", ")}`);
      console.log(`    firmIds:         ${dup.firmIds.join(", ")}\n`);
    }
    console.log(
      "ACTION REQUIRED before the unique index can build: decide, per group above, which\n" +
        "Subscription doc legitimately owns that Apple transaction (e.g. whichever firm's\n" +
        "admin actually purchased it) and clear appleOriginalTransactionId on the other\n" +
        "doc(s) manually -- do NOT run an automated delete/merge without reviewing each case."
    );
  }

  await mongoose.disconnect();
  process.exit(duplicates.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("Duplicate check failed:", error);
  process.exit(2);
});
