// Seeds the standard jewellery categories a jeweller expects to exist out of
// the box, so item entry never blocks on "create a category first". Safe to
// re-run — existing categories (matched by name) are left untouched.
//
// Usage (run from the Backend/ directory so it picks up the same .env as the
// server):
//   node scripts/seedJewelleryCategories.js

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../Config/DbConnection");
const StockCategoryModel = require("../Models/StockCetegoryModel");

const STANDARD_CATEGORIES = [
  { name: "Necklace", description: "Necklaces" },
  { name: "Haar", description: "Long traditional haar sets" },
  { name: "Mangalsutra", description: "Mangalsutra" },
  { name: "Earring", description: "Earrings / studs" },
  { name: "Ring", description: "Rings" },
  { name: "Bangles", description: "Bangles" },
  { name: "Bajubandh", description: "Armlets worn on the upper arm" },
  { name: "Hath Phool", description: "Hand harness / hath phool" },
  { name: "Kamarbandh", description: "Waist belt / kamarbandh" },
  { name: "Payal", description: "Anklets / payal" },
  { name: "Bichiya", description: "Toe rings" },
  { name: "Manchali", description: "Manchali sets" },
  { name: "Chain", description: "Chains" },
  { name: "Pendant", description: "Pendants" },
  { name: "Bracelet", description: "Bracelets" },
  { name: "Nose Pin", description: "Nose pins" },
];

async function main() {
  await connectDB();

  let created = 0;
  for (const category of STANDARD_CATEGORIES) {
    const existing = await StockCategoryModel.findOne({ name: category.name });
    if (existing) continue;
    await StockCategoryModel.create(category);
    created += 1;
  }

  console.log(`Created ${created} of ${STANDARD_CATEGORIES.length} standard categories (rest already existed).`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error("Category seeding failed:", error);
  process.exit(1);
});
