const mongoose = require("mongoose");
const ActivitesShecma = new mongoose.Schema(
  {
    // Not required -- system-triggered activities (cron jobs: live rate
    // updates, monthly interest, weekly export) have no acting User and
    // must be able to log with this simply omitted, rather than a bogus
    // placeholder value that fails ObjectId casting (see Utils/cronJobs.js).
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    firm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      default: null,
    },
    activityType: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activities", ActivitesShecma);
