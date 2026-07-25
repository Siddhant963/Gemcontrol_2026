const mongoose = require("mongoose");
const farmSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  size: {
    type: Number,
    required: true,
  },
  logo: {
    type: String,
    default: "",
  },
  gst: {
    type: String,
    default: "",
  },
  email: {
    type: String,
    default: "",
  },
  contact: {
    type: String,
    default: "",
  },
  bankName: {
    type: String,
    default: "",
  },
  branch: {
    type: String,
    default: "",
  },
  accountNo: {
    type: String,
    default: "",
  },
  ifscCode: {
    type: String,
    default: "",
  },
  proprietorName: {
    type: String,
    default: "",
  },
  firmStamp: {
    type: String,
    default: "",
  },
  ownerSignature: {
    type: String,
    default: "",
  },
  // Second logo shown top-right on the invoice (hallmark/BIS-style mark).
  secondLogo: {
    type: String,
    default: "",
  },
  lastInvoiceNumber: {
    type: Number,
    default: 0,
  },
  // ---- Registration / identity details ----
  registrationNo: {
    type: String,
    default: "",
  },
  shopName: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "",
  },
  city: {
    type: String,
    default: "",
  },
  pincode: {
    type: String,
    default: "",
  },
  firmStartDate: {
    type: Date,
    default: null,
  },
  panNo: {
    type: String,
    default: "",
  },
  // ---- GST configuration used to auto-calculate every invoice ----
  gstConfig: {
    enabled: {
      type: Boolean,
      default: true,
    },
    cgstRate: {
      type: Number,
      default: 1.5,
    },
    sgstRate: {
      type: Number,
      default: 1.5,
    },
    igstRate: {
      type: Number,
      default: 0,
    },
  },
  // ---- Invoice numbering ----
  // e.g. "IS" produces invoice numbers like IS/297/24-25
  invoicePrefix: {
    type: String,
    default: "",
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
module.exports = mongoose.model("Firm", farmSchema);
