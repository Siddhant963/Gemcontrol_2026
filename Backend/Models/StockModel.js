const mongoose = require("mongoose");

// Shared shape for a charge that can be entered per-gram, per-kg, per-mg, as a
// percentage (of price), or as a flat fixed amount — making charge, labour
// charge, etc. all use this.
const ChargeConfigSchema = {
  value: { type: Number, default: 0 },
  unit: {
    type: String,
    enum: ["per_gram", "per_kg", "per_mg", "percent", "fixed"],
    default: "fixed",
  },
};

const StockSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  materialgitType: {
    type: String,
    required: true,
    enum: ["gold", "silver", "platinum", "diamond", "other"],
  },
  stockImg: {
    type: String,
    default: "",
  },
  stockcode: {
    type: String,
    required: true,
    unique: true,
  },
  // wholesale = bulk-added stock (e.g. via Excel import), retail = added one
  // item at a time.
  stockType: {
    type: String,
    enum: ["wholesale", "retail"],
    default: "retail",
  },
  // Legacy total-weight field. Kept (rather than removed) so historical
  // records and any code path still reading it keep working; new records
  // mirror it from netWeight. See migrateStockWeights.js for the backfill.
  waight: {
    type: Number,
    required: true,
  },
  // Total weight before removing stones/moti etc.
  grossWeight: {
    type: Number,
    default: 0,
  },
  // Weight of artificial stone / moti / anything not counted as metal.
  lessWeight: {
    type: Number,
    default: 0,
  },
  // grossWeight - lessWeight; this is the metal weight actually priced.
  netWeight: {
    type: Number,
    default: 0,
  },
  karat: {
    type: String,
    default: "",
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StockCategory",
    required: true,
  },
  firm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Firm",
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  // Wastage percentages — supplier is what the karigar/supplier charged the
  // firm (informational), customer is what the firm charges onward and is
  // folded into totalValue.
  wastage: {
    supplier: { type: Number, default: 0 },
    customer: { type: Number, default: 0 },
  },
  // Flat computed making-charge amount, kept for backward compatibility with
  // sale/invoice code that reads it as a plain number.
  makingCharge: {
    type: Number,
    required: true,
  },
  // How makingCharge was actually entered/computed.
  makingChargeConfig: ChargeConfigSchema,
  // Polishing etc.
  labourCharge: ChargeConfigSchema,
  stoneCharge: {
    type: Number,
    default: 0,
  },
  // GST HSN code printed on the invoice line.
  hsnCode: {
    type: String,
    default: "",
  },
  totalValue: {
    type: Number,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  removeAt: {
    type: Date,
    default: null,
  },
});
module.exports = mongoose.model("Stock", StockSchema);
