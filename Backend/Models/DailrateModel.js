const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema(
  {
    gold: {
      // The user only ever enters 24K; 23K/22K/20K/18K are derived from it via
      // GOLD_PURITY_FACTORS (see adminController.js) and stored here so
      // historical rates stay stable even if the factors change later.
      "24K": {
        type: Number,
        required: true,
      },
      "23K": {
        type: Number,
        default: 0,
      },

      "22K": {
        type: Number,
        default: 0,
      },
      "20K": {
        type: Number,
        default: 0,
      },
      "18K": {
        type: Number,
        default: 0,
      },
    },
    silver: {
      type: Number,
      required: true,
    },
    daimond: {
      "0_5 Carat": {
        type: Number,
        required: true,
      },
      "1 Carat": {
        type: Number,
        required: true,
      },
      "1_5 Carat": {
        type: Number,
        required: true,
      },
      "2 Carat": {
        type: Number,
        required: true,
      },
      "2_5 Carat": {
        type: Number,
        required: true,
      },
      "3 Carat": {
        type: Number,
        required: true,
      },
    },
  },

  { _id: false },
  { timestamps: true }
);
const dailrateSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    rate: {
      type: materialSchema,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dailrate", dailrateSchema);