// One-time fix for firms created before the firm-scoped unique index
// migration: the collection may still carry the old global unique indexes
// (email_1, contact_1) alongside the new compound ones, which incorrectly
// rejects customers that only collide across different firms.
//
// Unlike migrateFirmIsolation.js, this does not assume a single firm --
// it just checks per-firm duplicates, drops the stale global indexes, and
// rebuilds the compound ones declared in the schema.
//
// Run from the Backend/ directory: node seed/fixCustomerIndexes.js

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../Config/DbConnection");
const CustomerModel = require("../Models/CustomersModel");

async function assertNoDuplicateKeyConflicts() {
  for (const field of ["email", "contact"]) {
    const dupes = await CustomerModel.aggregate([
      { $group: { _id: { firm: "$firm", value: `$${field}` }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]);
    if (dupes.length > 0) {
      throw new Error(
        `Found ${dupes.length} duplicate customer ${field}(s) within the same firm -- ` +
          `resolve before the compound unique index can be built: ` +
          JSON.stringify(dupes.slice(0, 10))
      );
    }
  }
}

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

async function main() {
  await connectDB();

  await assertNoDuplicateKeyConflicts();

  await dropIndexIfExists(CustomerModel, "email_1");
  await dropIndexIfExists(CustomerModel, "contact_1");

  await CustomerModel.syncIndexes();
  console.log("Synced compound-unique indexes on customers");

  const indexes = await CustomerModel.collection.indexes();
  console.log("Current indexes:", indexes.map((i) => i.name));

  console.log("Fix complete.");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error("Fix failed:", error.message);
  process.exit(1);
});
