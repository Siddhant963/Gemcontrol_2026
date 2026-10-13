// Gives EVERY existing firm the common jewellery categories (Payal, Chain,
// Mangalsutra, ...) and drops the old global unique index on category name.
// New firms get the same list automatically the first time they open Categories,
// so running this is optional -- it just does all existing firms at once.
// Safe to re-run: categories a firm already has (even removed ones) are skipped.
//
// Usage (run from the Backend/ directory so it picks up the same .env):
//   node scripts/seedJewelleryCategories.js

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../Config/DbConnection");
const FirmModel = require("../Models/FirmModel");
const { ensureStandardCategories, dropStaleNameIndex } = require("../Utils/standardCategories");

async function main() {
  await connectDB();
  await dropStaleNameIndex();

  const firms = await FirmModel.find({}).select("_id");
  for (const firm of firms) {
    await ensureStandardCategories(firm._id);
  }

  console.log(`Standard categories ensured for ${firms.length} firm(s).`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error("Category seeding failed:", error);
  process.exit(1);
});
