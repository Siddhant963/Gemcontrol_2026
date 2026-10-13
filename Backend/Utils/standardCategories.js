const mongoose = require("mongoose");
const StockCategoryModel = require("../Models/StockCetegoryModel");
const FirmModel = require("../Models/FirmModel");

// Common jewellery categories every firm starts with. A firm can add its own on
// top, or remove any of these -- each firm owns its own copy.
const STANDARD_CATEGORIES = [
  ["Payal", "Anklets / payal"],
  ["Chain", "Chains"],
  ["Mangalsutra", "Mangalsutra"],
  ["Bichiya", "Toe rings / bichiya"],
  ["Kardhan", "Waist chain / kardhan"],
  ["Kamarbandh", "Waist belt / kamarbandh"],
  ["Jhumka", "Jhumka earrings"],
  ["Bali", "Bali earrings"],
  ["Earring", "Earrings / studs / tops"],
  ["Bendi", "Bendi / forehead ornament"],
  ["Chudi", "Chudi bangles"],
  ["Kada", "Kada / heavy bangles"],
  ["Bangles", "Bangles"],
  ["Hathphool", "Hand harness / hathphool"],
  ["Mahur", "Mahur"],
  ["Ring", "Rings"],
  ["Necklace", "Necklaces"],
  ["Haar", "Long traditional haar sets"],
  ["Pendant", "Pendants / lockets"],
  ["Bracelet", "Bracelets"],
  ["Bajubandh", "Armlets worn on the upper arm"],
  ["Nose Pin", "Nose pins / nath"],
  ["Tika", "Maang tika"],
  ["Set", "Jewellery sets"],
].map(([name, description]) => ({ name, description }));

let staleIndexDropped = false;

// Older databases may still carry a GLOBAL unique index on `name`, which makes one
// firm's category block every other firm. Categories are unique per firm only.
const dropStaleNameIndex = async () => {
  if (staleIndexDropped) return;
  try {
    await StockCategoryModel.collection.dropIndex("name_1");
  } catch (error) {
    // IndexNotFound / NamespaceNotFound -- nothing to drop.
  }
  staleIndexDropped = true;
};

// Gives a firm the standard categories once. Categories the firm already has
// (active or removed) are left untouched, so a deleted one is never resurrected.
const ensureStandardCategories = async (firmId) => {
  if (!firmId) return;
  const firm = await FirmModel.findById(firmId).select("standardCategoriesSeeded");
  if (!firm || firm.standardCategoriesSeeded) return;

  await dropStaleNameIndex();
  const existing = await StockCategoryModel.find({ firm: firmId }).select("name");
  const have = new Set(existing.map((c) => c.name.trim().toLowerCase()));
  const toCreate = STANDARD_CATEGORIES.filter((c) => !have.has(c.name.toLowerCase())).map((c) => ({
    ...c,
    firm: new mongoose.Types.ObjectId(firmId),
  }));
  if (toCreate.length) {
    await StockCategoryModel.insertMany(toCreate, { ordered: false }).catch(() => {});
  }
  await FirmModel.updateOne({ _id: firmId }, { $set: { standardCategoriesSeeded: true } });
};

module.exports = { STANDARD_CATEGORIES, ensureStandardCategories, dropStaleNameIndex };
