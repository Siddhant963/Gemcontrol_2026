const express = require("express");
const { isLoggedIn, isSuperAdmin } = require("../Utils/islogedin");
const {
  getOverview,
  getFirms,
  getFirmDetail,
  getUsage,
} = require("../Controllers/platformController");

// Platform-owner panel. Every route is READ ONLY and gated by isLoggedIn +
// isSuperAdmin. Mounted in server.js BEFORE the main admin router, because
// that router applies requireActiveSubscription to everything after it and a
// platform owner has no firm (so would be rejected as "no subscription").
const router = express.Router();

router.use(isLoggedIn, isSuperAdmin);

router.get("/overview", getOverview);
router.get("/firms", getFirms);
router.get("/firms/:id", getFirmDetail);
router.get("/usage", getUsage);

module.exports = router;
