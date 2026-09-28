const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contact: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ["admin", "staff", "user"], // Added "user" to the enum
  },
  firm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Firm",
    default: null,
  },
  removeAt: { type: Date, default: null },
  // Set when the user (or their firm's admin) requests self-service account
  // deletion (Controllers/adminController.js's deleteMyAccount) -- distinct
  // from removeAt, which an admin removing a staff member also sets, since
  // that case is NOT a privacy deletion request and must not be purged.
  // Utils/cronJobs.js's daily purge job scrubs PII on any User whose
  // deletionRequestedAt is more than the grace period old and isn't
  // purgedAt yet.
  deletionRequestedAt: { type: Date, default: null },
  purgedAt: { type: Date, default: null },
});

module.exports = mongoose.model("User", userSchema);
