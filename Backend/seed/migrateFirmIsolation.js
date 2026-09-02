// One-time migration to backfill the `firm` field now required for tenant
// isolation. Safe to re-run: every step skips documents that already have a
// firm set.
//
// Usage (no existing Firm yet -- creates one for the sole existing admin):
//   node seed/migrateFirmIsolation.js "Shop Name" "Shop Location" 1
//
// Usage (a Firm already exists -- args are ignored, that Firm is used):
//   node seed/migrateFirmIsolation.js
//
// Run from the Backend/ directory so it picks up the same .env as the server.

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../Config/DbConnection");
const UserModel = require("../Models/UserModel");
const FirmModel = require("../Models/FirmModel");
const StockCategoryModel = require("../Models/StockCetegoryModel");
const CustomerModel = require("../Models/CustomersModel");
const ActivityModel = require("../Models/ActivitesModel");

async function resolveTargetFirm() {
  const firms = await FirmModel.find({ removeAt: null });

  if (firms.length === 1) {
    console.log(`Using existing firm: ${firms[0].name} (${firms[0]._id})`);
    return firms[0];
  }

  if (firms.length > 1) {
    throw new Error(
      `Found ${firms.length} existing firms -- this script only handles the ` +
        `single-firm starting state. Resolve firm assignment manually before ` +
        `re-running.`
    );
  }

  // Zero firms exist -- find the one admin to create a firm for.
  const admins = await UserModel.find({ role: "admin", removeAt: null });
  if (admins.length !== 1) {
    throw new Error(
      `Found 0 firms and ${admins.length} admin user(s) -- expected exactly ` +
        `1 admin to bootstrap a firm for. Resolve manually before re-running.`
    );
  }

  const [name, location, size] = process.argv.slice(2);
  if (!name || !location || !size) {
    throw new Error(
      'No firm exists yet. Usage: node seed/migrateFirmIsolation.js ' +
        '"Shop Name" "Shop Location" 1'
    );
  }

  const admin = admins[0];
  const newFirm = new FirmModel({
    name,
    location,
    size: Number(size),
    owner: admin._id,
  });
  await newFirm.save();
  console.log(`Created firm "${name}" (${newFirm._id}) owned by ${admin.email}`);
  return newFirm;
}

async function assertNoDuplicateKeyConflicts(firmId) {
  const categoryDupes = await StockCategoryModel.aggregate([
    { $match: { firm: firmId } },
    { $group: { _id: { firm: "$firm", name: "$name" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  if (categoryDupes.length > 0) {
    throw new Error(
      `Found ${categoryDupes.length} duplicate category name(s) within the ` +
        `target firm -- resolve before the compound unique index can be built.`
    );
  }

  for (const field of ["email", "contact"]) {
    const customerDupes = await CustomerModel.aggregate([
      { $match: { firm: firmId } },
      { $group: { _id: { firm: "$firm", value: `$${field}` }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]);
    if (customerDupes.length > 0) {
      throw new Error(
        `Found ${customerDupes.length} duplicate customer ${field}(s) within ` +
          `the target firm -- resolve before the compound unique index can be built.`
      );
    }
  }
}

async function main() {
  await connectDB();

  const firm = await resolveTargetFirm();

  const userResult = await UserModel.updateMany({ firm: null }, { firm: firm._id });
  console.log(`Backfilled firm on ${userResult.modifiedCount} user(s)`);

  const categoryResult = await StockCategoryModel.updateMany(
    { firm: { $exists: false } },
    { firm: firm._id }
  );
  console.log(`Backfilled firm on ${categoryResult.modifiedCount} stock categor(y/ies)`);

  const activityResult = await ActivityModel.updateMany(
    { firm: { $exists: false } },
    { firm: firm._id }
  );
  console.log(`Backfilled firm on ${activityResult.modifiedCount} activit(y/ies)`);

  await assertNoDuplicateKeyConflicts(firm._id);

  // Drop the old global-unique indexes explicitly (predictable + logged),
  // then let Mongoose build the new compound-unique indexes declared in the
  // schemas.
  const dropIndexIfExists = async (model, indexName) => {
    try {
      await model.collection.dropIndex(indexName);
      console.log(`Dropped index ${indexName} on ${model.collection.collectionName}`);
    } catch (error) {
      if (error.codeName === "IndexNotFound" || error.code === 27) {
        console.log(`Index ${indexName} on ${model.collection.collectionName} already gone`);
      } else {
        throw error;
      }
    }
  };
  await dropIndexIfExists(StockCategoryModel, "name_1");
  await dropIndexIfExists(CustomerModel, "email_1");
  await dropIndexIfExists(CustomerModel, "contact_1");

  await StockCategoryModel.syncIndexes();
  await CustomerModel.syncIndexes();
  console.log("Synced new compound-unique indexes");

  console.log("Migration complete.");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
