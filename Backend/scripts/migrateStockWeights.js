// One-time backfill for the P3 Stock model overhaul. Existing Stock docs only
// have the legacy `waight` field; this copies it into grossWeight/netWeight
// (with lessWeight = 0) so the new weight-breakdown UI has something to show
// without any data loss or manual re-entry.
//
// Usage (run from the Backend/ directory so it picks up the same .env as the
// server):
//   node scripts/migrateStockWeights.js

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../Config/DbConnection");
const StockModel = require("../Models/StockModel");

async function main() {
  await connectDB();

  const candidates = await StockModel.find({
    $or: [{ grossWeight: { $exists: false } }, { grossWeight: 0 }, { grossWeight: null }],
  });

  let updated = 0;
  for (const stock of candidates) {
    stock.grossWeight = stock.waight || 0;
    stock.lessWeight = stock.lessWeight || 0;
    stock.netWeight = stock.waight || 0;
    if (!stock.makingChargeConfig || stock.makingChargeConfig.value === undefined) {
      stock.makingChargeConfig = { value: stock.makingCharge || 0, unit: "fixed" };
    }
    if (!stock.wastage) {
      stock.wastage = { supplier: 0, customer: 0 };
    }
    if (!stock.stockType) {
      stock.stockType = "retail";
    }
    await stock.save();
    updated += 1;
  }

  console.log(`Migrated ${updated} of ${candidates.length} stock record(s).`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error("Stock weight migration failed:", error);
  process.exit(1);
});
