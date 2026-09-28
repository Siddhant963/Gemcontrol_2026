// Permanently deletes every User account except sid@gmail.com. Firms and
// all other data (stock, customers, sales, etc.) are left untouched -- only
// the login accounts themselves are removed.
//
// Safety: dry-run by default -- it only PRINTS which accounts would be
// deleted. Nothing is actually removed unless you pass --confirm.
//
// Usage (run from the Backend/ directory so it picks up the same .env as
// the server -- needs network access to the MongoDB Atlas cluster):
//   node scripts/deleteUsersExceptSid.js            (dry run, no changes)
//   node scripts/deleteUsersExceptSid.js --confirm   (actually deletes)

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../Config/DbConnection");
const UserModel = require("../Models/UserModel");

const KEEP_EMAIL = "sid@gmail.com";
const confirmed = process.argv.includes("--confirm");

async function main() {
  await connectDB();

  const filter = { email: { $not: new RegExp(`^${KEEP_EMAIL}$`, "i") } };
  const toDelete = await UserModel.find(filter).select("name email role firm").lean();

  if (toDelete.length === 0) {
    console.log(`No users to delete -- only ${KEEP_EMAIL} (or nothing) exists.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`${confirmed ? "Deleting" : "[DRY RUN] Would delete"} ${toDelete.length} user(s):`);
  toDelete.forEach((u) => {
    console.log(`  - ${u.email} | name=${u.name} | role=${u.role} | firm=${u.firm || "none"}`);
  });

  if (!confirmed) {
    console.log("\nNo changes made. Re-run with --confirm to actually delete these accounts.");
    await mongoose.disconnect();
    process.exit(0);
  }

  const result = await UserModel.deleteMany(filter);
  console.log(`\nDeleted ${result.deletedCount} user(s). Kept: ${KEEP_EMAIL}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error("Delete-users script failed:", error);
  process.exit(1);
});
