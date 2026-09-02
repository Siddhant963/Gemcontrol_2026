const mongoose = require("mongoose");
const CoustomersSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  firm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Firm",
    required: true,
  },

  address: {
    type: String,
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
// Email/contact only need to be unique within a firm — two different shops
// can have customers who happen to share an email or phone number.
CoustomersSchema.index({ firm: 1, email: 1 }, { unique: true });
CoustomersSchema.index({ firm: 1, contact: 1 }, { unique: true });
module.exports = mongoose.model("Customer", CoustomersSchema);
