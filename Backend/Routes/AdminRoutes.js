const express = require("express");
const router = express.Router();
const { upload } = require("../Utils/UploadFile.js");
const { isLoggedIn, isAdmin, isStaff } = require("../Utils/islogedin");

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
  removeCustomer,
  getAllCustomers,
  createStockCategory,
  getAllStockCategories,
  removeStockCategory,
  Addstock,
  updateStock,
  getAllStocks,
  removeStock,
  getStockbyCategory,
  getStockbyFirm,
  createRawMaterial,
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
} = require("../Controllers/adminController");

// Public self-signup: no auth required, but the controller forces role="staff"
// regardless of what's sent, so this can't be used to mint an admin account.
router.post("/register", RegisterUser);
// Admin-panel user creation: requires an authenticated admin, who may choose any role.
router.post("/admin/register", isLoggedIn, isAdmin, RegisterUser);
router.get("/GetallUsers", isLoggedIn, isAdmin, GetAllUsers);
router.get("/remove/:userId", isLoggedIn, isAdmin, removeUser);
router.post("/UpdateUser", isLoggedIn, isAdmin, UpdateUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
const firmUploads = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "firmStamp", maxCount: 1 },
  { name: "ownerSignature", maxCount: 1 },
]);
router.post("/createFirm", isLoggedIn, isAdmin, firmUploads, createFirm);
router.put("/updateFirm", isLoggedIn, isAdmin, firmUploads, updateFirm);
router.get("/getAllFirms", isLoggedIn, getAllFirms);
router.get("/removeFirm", isLoggedIn, isAdmin, removeFirm);
router.post("/AddCustomer", isLoggedIn, AddCustomer);
router.get("/getAllCustomers", isLoggedIn, getAllCustomers);
router.get("/removeCustomer", isLoggedIn, isAdmin, removeCustomer);
router.post(
  "/createStockCategory",
  isLoggedIn,
  isAdmin,
  upload.single("CategoryImg"),
  createStockCategory
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
router.post(
  "/createRawMaterial",
  isLoggedIn,
  upload.single("rawMaterial"),
  createRawMaterial
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
