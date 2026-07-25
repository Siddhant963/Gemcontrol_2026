const mongoose = require("mongoose");
const farmSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
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
  lastInvoiceNumber: {
    type: Number,
    default: 0,
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
