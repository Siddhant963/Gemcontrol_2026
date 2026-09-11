const express = require("express");
const router = express.Router();
const multer = require("multer");
const { upload } = require("../Utils/UploadFile.js");
const { isLoggedIn, isAdmin, isStaff } = require("../Utils/islogedin");
const { requireActiveSubscription } = require("../Utils/subscription");

// Bulk stock Excel uploads are parsed in memory (not saved to disk like
// product images) since they're read once and discarded.
const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExt = /\.(xlsx|xls)$/i;
    if (allowedExt.test(file.originalname)) return cb(null, true);
    cb(new Error("Only .xlsx or .xls files are allowed"));
  },
});

const {
  RegisterUser,
  GetAllUsers,
  removeUser,
  UpdateUser,
  loginUser,
  logoutUser,
  createFirm,
  updateFirm,
  getAllFirms,
  removeFirm,
  AddCustomer,
  updateCustomer,
  removeCustomer,
  getAllCustomers,
  createStockCategory,
  updateStockCategory,
  getAllStockCategories,
  removeStockCategory,
  Addstock,
  updateStock,
  getAllStocks,
  removeStock,
  getStockbyCategory,
  getStockbyFirm,
  createRawMaterial,
  updateRawMaterial,
  getAllRawMaterials,
  getRawMaterialbyFirm,
  getRawMaterialbyType,
  AddRawMaterialStock,
  createDailrate,
  getAllDailrates,
  getTodayDailrate,
  removeRawMaterial,
  createSale,
  getAllSales,
  removeSale,
  getSaleByCustomer,
  getSaleByFirm,
  getSaleByDate,
  getSaleByPaymentMethod,
  getAllPayments,
  getPaymentByCustomer,
  getPaymentByFirm,
  getPaymentByPaymentMethod,
  getAllUdhar,
  getUdharByCustomer,
  getUdharByFirm,
  getUdharByDate,
  getPaymentBydate,
  setelUdhar,
  getAllUdharSetelment,
  getUdharSetelmentByCustomer,
  getUdharsetelmentBydate,
  getFiveMonthlySales,
  AddGierviItem,
  getAllGierviItems,
  removeGierviItem,
  changelastdatetoTake,
  updateGirviItem,
  getDashboardData,
  getMonthlySalesData,
  updateDailrate,
  getRecentActivities,
  getAllActivities,
  downloadStockBulkTemplate,
  bulkImportStock,
  getDayBook,
  // New Girvi Interest functions
  calculateGirviInterest,
  updateGirviInterestMonthly,
  addGirviPayment,
  getGirviInterestHistory,
  getAllPendingInterests,
  redeemGirviItem,
  getGirviSummary,
  // Export function
  exportAllDataToExcel,
  // Subscription functions
  getSubscriptionPlans,
  getMySubscription,
  activateTestSubscription,
} = require("../Controllers/adminController");

// Public self-signup: no auth required, but the controller forces role="staff"
// regardless of what's sent, so this can't be used to mint an admin account.
// (Self-signup with a new firm, which does mint an admin, is the other
// branch of RegisterUser -- see the controller.)
router.post("/register", RegisterUser);
router.post("/login", loginUser);
// Always reachable even with an expired subscription -- a locked-out admin
// must still be able to log out.
router.get("/logout", logoutUser);

// Subscription routes must stay reachable without an active subscription --
// otherwise a firm whose trial expired could never see plans or resubscribe.
router.get("/getSubscriptionPlans", isLoggedIn, getSubscriptionPlans);
router.get("/getMySubscription", isLoggedIn, getMySubscription);
router.post("/activateTestSubscription", isLoggedIn, isAdmin, activateTestSubscription);

// Every route below requires the caller to be logged in AND their firm to
// have a non-expired subscription (trial or paid) -- see Utils/subscription.js.
// isLoggedIn must run here too (not just inline per-route below) since this
// blanket middleware runs before any of those, so req.user wouldn't be set
// yet otherwise -- requireActiveSubscription would then see no req.user and
// misreport an unauthenticated request as "no firm" (403) instead of the
// correct 401. isLoggedIn running again per-route below is harmless (an
// already-decoded token, no extra DB round trip avoided either way).
router.use(isLoggedIn, requireActiveSubscription);

// Admin-panel user creation: requires an authenticated admin, who may choose any role.
router.post("/admin/register", isLoggedIn, isAdmin, RegisterUser);
router.get("/GetallUsers", isLoggedIn, isAdmin, GetAllUsers);
router.get("/remove/:userId", isLoggedIn, isAdmin, removeUser);
router.post("/UpdateUser", isLoggedIn, isAdmin, UpdateUser);
const firmUploads = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "firmStamp", maxCount: 1 },
  { name: "ownerSignature", maxCount: 1 },
  { name: "secondLogo", maxCount: 1 },
]);
router.post("/createFirm", isLoggedIn, isAdmin, firmUploads, createFirm);
router.put("/updateFirm", isLoggedIn, isAdmin, firmUploads, updateFirm);
router.get("/getAllFirms", isLoggedIn, getAllFirms);
router.get("/removeFirm", isLoggedIn, isAdmin, removeFirm);
router.post("/AddCustomer", isLoggedIn, AddCustomer);
router.post("/UpdateCustomer", isLoggedIn, updateCustomer);
router.get("/getAllCustomers", isLoggedIn, getAllCustomers);
router.get("/removeCustomer", isLoggedIn, isAdmin, removeCustomer);
// Categories are shared reference data every user needs while adding items
// day-to-day, so creating one isn't gated behind isAdmin — only removing a
// category (which can affect items already filed under it) stays admin-only.
router.post(
  "/createStockCategory",
  isLoggedIn,
  upload.single("CategoryImg"),
  createStockCategory
);
router.post(
  "/updateStockCategory",
  isLoggedIn,
  upload.single("CategoryImg"),
  updateStockCategory
);
router.get("/getAllStockCategories", isLoggedIn, getAllStockCategories);
router.get("/removeStockCategory", isLoggedIn, isAdmin, removeStockCategory);
router.post("/Addstock", isLoggedIn, upload.single("stock"), Addstock);
router.put(
  "/updateStock/:stockId",
  isLoggedIn,
  upload.single("stock"),
  updateStock
);
router.get("/getAllStocks", isLoggedIn, getAllStocks);
router.get("/removeStock", isLoggedIn, isAdmin, removeStock);
router.get("/getStockbyCategory", isLoggedIn, getStockbyCategory);
router.get("/getStockbyFirm", isLoggedIn, getStockbyFirm);
router.get("/downloadStockBulkTemplate", isLoggedIn, downloadStockBulkTemplate);
router.post(
  "/bulkImportStock",
  isLoggedIn,
  uploadExcel.single("file"),
  bulkImportStock
);
router.post(
  "/createRawMaterial",
  isLoggedIn,
  upload.single("rawMaterial"),
  createRawMaterial
);
router.put(
  "/updateRawMaterial/:rawMaterialId",
  isLoggedIn,
  upload.single("rawMaterial"),
  updateRawMaterial
);
router.get("/getAllRawMaterials", isLoggedIn, getAllRawMaterials);
router.get("/removeRawMaterial", isLoggedIn, isAdmin, removeRawMaterial);
router.get("/getRawMaterialbyFirm", isLoggedIn, getRawMaterialbyFirm);
router.get("/getRawMaterialbyType", isLoggedIn, getRawMaterialbyType);
router.post("/AddRawMaterialStock", isLoggedIn, AddRawMaterialStock);
router.post("/createDailrate", isLoggedIn, isAdmin, createDailrate);
router.get("/getAllDailrates", isLoggedIn, getAllDailrates);
router.get("/getTodayDailrate", isLoggedIn, getTodayDailrate);
router.put("/updateDailrate", isLoggedIn, isAdmin, updateDailrate);
router.post("/createSale", isLoggedIn, createSale);
router.get("/getAllSales", isLoggedIn, getAllSales);
router.get("/removeSale", isLoggedIn, isAdmin, removeSale);
router.get("/getSaleByCustomer", isLoggedIn, getSaleByCustomer);
router.get("/getSaleByFirm", isLoggedIn, getSaleByFirm);
router.get("/getSaleByDate", isLoggedIn, getSaleByDate);
router.get("/getSaleByPaymentMethod", isLoggedIn, getSaleByPaymentMethod);
router.get("/getAllPayments", isLoggedIn, getAllPayments);
router.get("/getPaymentByCustomer", isLoggedIn, getPaymentByCustomer);
router.get("/getPaymentByFirm", isLoggedIn, getPaymentByFirm);
router.get("/getPaymentByDate", isLoggedIn, getPaymentBydate);
router.get("/getPaymentByPaymentMethod", isLoggedIn, getPaymentByPaymentMethod);
router.get("/getAllUdhar", isLoggedIn, getAllUdhar);
router.get("/getUdharByCustomer", isLoggedIn, getUdharByCustomer);
router.get("/getUdharByFirm", isLoggedIn, getUdharByFirm);
router.get("/getUdharByDate", isLoggedIn, getUdharByDate);
router.post("/setelUdhar", isLoggedIn, isAdmin, setelUdhar);
router.get("/getAllUdharSetelment", isLoggedIn, getAllUdharSetelment);
router.get(
  "/getUdharSetelmentByCustomer",
  isLoggedIn,
  getUdharSetelmentByCustomer
);
router.get("/getUdharSetelmentByDate", isLoggedIn, getUdharsetelmentBydate);
router.get("/getFiveMonthlySales", isLoggedIn, getFiveMonthlySales);
router.get("/getDayBook", isLoggedIn, getDayBook);
router.post(
  "/AddGirviItem",
  isLoggedIn,
  isAdmin,
  upload.single("girviItemImg"),
  AddGierviItem
);
router.get("/getAllGirviItems", isLoggedIn, isAdmin, getAllGierviItems);
router.get("/removeGirviItem", isLoggedIn, isAdmin, removeGierviItem);
router.post("/changelastdatetoTake", isLoggedIn, isAdmin, changelastdatetoTake);
router.put(
  "/updateGirviItem",
  isLoggedIn,
  isAdmin,
  upload.single("girviItemImg"),
  updateGirviItem
);
router.get("/getDashboardData", isLoggedIn, getDashboardData);
router.get("/getMonthlySalesData", isLoggedIn, getMonthlySalesData);
router.get("/getRecentActivities", isLoggedIn, getRecentActivities);
router.get("/getAllActivities", isLoggedIn, getAllActivities);

// ============ NEW GIRVI INTEREST MANAGEMENT ROUTES ============
// Borrows/Girvi management is an admin-only module end to end.
router.get("/calculateGirviInterest/:girviId", isLoggedIn, isAdmin, calculateGirviInterest);
router.post("/updateGirviInterestMonthly", isLoggedIn, isAdmin, updateGirviInterestMonthly);
router.post("/addGirviPayment", isLoggedIn, isAdmin, addGirviPayment);
router.get("/getGirviInterestHistory/:girviId", isLoggedIn, isAdmin, getGirviInterestHistory);
router.get("/getAllPendingInterests", isLoggedIn, isAdmin, getAllPendingInterests);
router.post("/redeemGirviItem", isLoggedIn, isAdmin, redeemGirviItem);
router.get("/getGirviSummary", isLoggedIn, isAdmin, getGirviSummary);

// ============ EXPORT DATA TO EXCEL ROUTE ============
router.get("/exportAllDataToExcel", isLoggedIn, isAdmin, exportAllDataToExcel);

module.exports = router;
