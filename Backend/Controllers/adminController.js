const mongoose = require("mongoose");
const UserModel = require("../Models/UserModel.js");
const FirmModel = require("../Models/FirmModel");
const StockCategoryModel = require("../Models/StockCetegoryModel.js");
const CustomerModel = require("../Models/CustomersModel.js"); // Added missing import
const StockModel = require("../Models/StockModel.js");
const RawMaterialModel = require("../Models/RawMaterialModel.js");
const DailrateModel = require("../Models/DailrateModel.js");
const SaleModel = require("../Models/SaleModel.js");
const PaymentModel = require("../Models/PaymentModel.js");
const UdharModel = require("../Models/UdharModel.js");
const udharsetelmentModel = require("../Models/udharSetalmentModel.js");
const GirviModel = require("../Models/GirviModel.js");
const GirviInterestModel = require("../Models/GirviInterestModel.js");
const ActivityModel = require("../Models/ActivitesModel.js");
const path = require("path");
const baseUploadDir = path.join(__dirname, "../../Uploads");
const fs = require("fs");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Helper function to convert absolute file path to relative URL path
function getRelativeFilePath(absolutePath) {
  if (!absolutePath) return null;
  
  // If it's already a URL (Cloudinary), return as is for backward compatibility
  if (absolutePath.startsWith('http://') || absolutePath.startsWith('https://')) {
    return absolutePath;
  }
  
  // Convert absolute path to relative path from Uploads folder
  // Example: C:\path\to\Uploads\firm\image.jpg -> /Uploads/firm/image.jpg
  const uploadsIndex = absolutePath.indexOf('Uploads');
  if (uploadsIndex !== -1) {
    const relativePath = absolutePath.substring(uploadsIndex).replace(/\\/g, '/');
    return `/${relativePath}`;
  }
  
  return absolutePath;
}

// Builds invoice numbers like "IS/297/24-25" — prefix from the firm's
// invoicePrefix (falling back to its name), the running counter, and the
// Indian financial year (April-March) the sale falls in.
function buildInvoiceNumber(firm, date = new Date()) {
  const prefix =
    (firm?.invoicePrefix || firm?.name || "INV")
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6) || "INV";
  const counter = firm?.lastInvoiceNumber || 1;
  const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  const fyStart = String(year).slice(-2);
  const fyEnd = String(year + 1).slice(-2);
  return `${prefix}/${counter}/${fyStart}-${fyEnd}`;
}

// Public /register (no auth): a brand-new shop owner signing up creates
// their own Firm and becomes its admin in one step -- there is no other
// self-service way to get a firm today.
// Admin-panel /admin/register (isLoggedIn + isAdmin): the calling admin
// adds a teammate to their OWN firm -- role may be admin or staff, but the
// firm is always forced server-side, never taken from the request.
module.exports.RegisterUser = async (req, res) => {
  const { name, email, contact, password } = req.body;
  const isAdminCaller = req.user && req.user.role?.toLowerCase() === "admin";

  if (!name || !email || !contact || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await UserModel.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    if (isAdminCaller) {
      if (!req.user.firm) {
        return res
          .status(403)
          .json({ message: "Your account has no firm associated with it" });
      }
      const role = req.body.role || "staff";
      const newUser = new UserModel({
        name,
        email,
        contact,
        password: hashedPassword,
        role,
        firm: req.user.firm,
      });
      await newUser.save();
      return res
        .status(201)
        .json({ message: "User registered successfully", user: newUser });
    }

    // Public self-signup: also create the new shop (Firm) this account owns.
    const { firmName, firmLocation, firmSize } = req.body;
    if (!firmName || !firmLocation || !firmSize) {
      return res.status(400).json({
        message: "Shop name, location and size are required to sign up",
      });
    }

    const session = await mongoose.startSession();
    try {
      let newUser;
      await session.withTransaction(async () => {
        newUser = new UserModel({
          name,
          email,
          contact,
          password: hashedPassword,
          role: "admin",
        });
        const newFirm = new FirmModel({
          name: firmName,
          location: firmLocation,
          size: firmSize,
          owner: newUser._id,
        });
        newUser.firm = newFirm._id;
        await newFirm.save({ session });
        await newUser.save({ session });
      });
      res
        .status(201)
        .json({ message: "Shop registered successfully", user: newUser });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Somthing went wrong" });
  }
};

module.exports.GetAllUsers = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const users = await UserModel.find({ removeAt: null, firm: req.user.firm });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.removeUser = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const user = await UserModel.findOne({ _id: userId, firm: req.user.firm });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.removeAt = new Date();
    await user.save();
    res.status(200).json({ message: "User removed successfully" });
  } catch (error) {
    console.error("Error removing user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.UpdateUser = async (req, res) => {
  const { userId } = req.query;
  const { name, contact, role } = req.body;
  try {
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const user = await UserModel.findOne({ _id: userId, firm: req.user.firm });
    if (!user || user.removeAt) {
      return res.status(404).json({ message: "User not found" });
    }
    if (name) user.name = name;
    if (contact) user.contact = contact;
    if (role) user.role = role;
    await user.save();
    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email: email, removeAt: null });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role, firm: user.firm },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const crossSiteCookie = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: crossSiteCookie ? "none" : "lax",
      secure: crossSiteCookie,
    });
    // TEMP DIAGNOSTIC — remove once the spurious-logout cause is found.
    console.log(`[loginUser] issued token for userId=${user._id} dbName=${UserModel.db.name}`);
    res
      .status(200)
      .json({ message: "Login successful", token, role: user.role, firm: user.firm });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.logoutUser = (req, res) => {
  const crossSiteCookie = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: crossSiteCookie ? "none" : "lax",
    secure: crossSiteCookie,
  });
  res.status(200).json({ message: "Logout successful" });
};

// Bootstrap safety net only -- ordinarily a firm is created together with
// its admin at public /register. Only usable by an admin who doesn't
// already have a firm (e.g. an account created via the createAdmin.js seed
// script), and it can only ever be used once per admin.
module.exports.createFirm = async (req, res) => {
  try {
    if (req.user.firm) {
      return res
        .status(400)
        .json({ message: "Your account already has a firm" });
    }

    const {
      name, location, size, gst, email, contact,
      bankName, branch, accountNo, ifscCode, proprietorName,
      registrationNo, shopName, description, address, city, pincode,
      firmStartDate, panNo, invoicePrefix,
      cgstRate, sgstRate, igstRate, gstEnabled,
    } = req.body;

    // Validate required fields
    if (!name || !location || !size) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const logoUrl = req.files?.logo?.[0] ? getRelativeFilePath(req.files.logo[0].path) : "";
    const firmStampUrl = req.files?.firmStamp?.[0] ? getRelativeFilePath(req.files.firmStamp[0].path) : "";
    const ownerSignatureUrl = req.files?.ownerSignature?.[0] ? getRelativeFilePath(req.files.ownerSignature[0].path) : "";
    const secondLogoUrl = req.files?.secondLogo?.[0] ? getRelativeFilePath(req.files.secondLogo[0].path) : "";

    const newFirm = new FirmModel({
      name,
      location,
      size,
      logo: logoUrl,
      firmStamp: firmStampUrl,
      ownerSignature: ownerSignatureUrl,
      secondLogo: secondLogoUrl,
      owner: req.user?._id,
      proprietorName: proprietorName || "",
      gst: gst || "",
      email: email || "",
      contact: contact || "",
      bankName: bankName || "",
      branch: branch || "",
      accountNo: accountNo || "",
      ifscCode: ifscCode || "",
      registrationNo: registrationNo || "",
      shopName: shopName || "",
      description: description || "",
      address: address || "",
      city: city || "",
      pincode: pincode || "",
      firmStartDate: firmStartDate || null,
      panNo: panNo || "",
      invoicePrefix: invoicePrefix || "",
      gstConfig: {
        enabled: gstEnabled === undefined ? true : gstEnabled === "true" || gstEnabled === true,
        cgstRate: cgstRate !== undefined ? Number(cgstRate) : 1.5,
        sgstRate: sgstRate !== undefined ? Number(sgstRate) : 1.5,
        igstRate: igstRate !== undefined ? Number(igstRate) : 0,
      },
    });

    await newFirm.save();

    req.user.firm = newFirm._id;
    await req.user.save();

    return res.status(201).json({
      message: "Firm created successfully",
      firm: newFirm,
    });
  } catch (error) {
    console.error("Error creating firm:", error);
    console.error("Error details:", error.message);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.updateFirm = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }

    // Ignore any client-sent firmId -- an admin can only ever update their
    // own firm.
    const firm = await FirmModel.findOne({ _id: req.user.firm, removeAt: null });
    if (!firm) {
      return res.status(404).json({ message: "Firm not found." });
    }

    const {
      name, location, size, gst, email, contact,
      bankName, branch, accountNo, ifscCode, proprietorName,
      registrationNo, shopName, description, address, city, pincode,
      firmStartDate, panNo, invoicePrefix,
      cgstRate, sgstRate, igstRate, gstEnabled,
    } = req.body;

    if (name) firm.name = name;
    if (location) firm.location = location;
    if (size) firm.size = size;
    if (proprietorName !== undefined) firm.proprietorName = proprietorName;
    if (gst !== undefined) firm.gst = gst;
    if (email !== undefined) firm.email = email;
    if (contact !== undefined) firm.contact = contact;
    if (bankName !== undefined) firm.bankName = bankName;
    if (branch !== undefined) firm.branch = branch;
    if (accountNo !== undefined) firm.accountNo = accountNo;
    if (ifscCode !== undefined) firm.ifscCode = ifscCode;
    if (registrationNo !== undefined) firm.registrationNo = registrationNo;
    if (shopName !== undefined) firm.shopName = shopName;
    if (description !== undefined) firm.description = description;
    if (address !== undefined) firm.address = address;
    if (city !== undefined) firm.city = city;
    if (pincode !== undefined) firm.pincode = pincode;
    if (firmStartDate !== undefined) firm.firmStartDate = firmStartDate || null;
    if (panNo !== undefined) firm.panNo = panNo;
    if (invoicePrefix !== undefined) firm.invoicePrefix = invoicePrefix;
    if (!firm.gstConfig) firm.gstConfig = {};
    if (gstEnabled !== undefined) firm.gstConfig.enabled = gstEnabled === "true" || gstEnabled === true;
    if (cgstRate !== undefined) firm.gstConfig.cgstRate = Number(cgstRate);
    if (sgstRate !== undefined) firm.gstConfig.sgstRate = Number(sgstRate);
    if (igstRate !== undefined) firm.gstConfig.igstRate = Number(igstRate);

    const replaceImage = (field, file) => {
      if (!file) return;
      if (firm[field]) {
        const oldPath = path.join(__dirname, "../../", firm[field]);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      firm[field] = getRelativeFilePath(file.path);
    };
    replaceImage("logo", req.files?.logo?.[0]);
    replaceImage("firmStamp", req.files?.firmStamp?.[0]);
    replaceImage("ownerSignature", req.files?.ownerSignature?.[0]);
    replaceImage("secondLogo", req.files?.secondLogo?.[0]);

    await firm.save();

    return res.status(200).json({
      message: "Firm updated successfully",
      firm,
    });
  } catch (error) {
    console.error("Error updating firm:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GemControl is single-firm-per-shop: a user only ever belongs to (and may
// only ever see) their own firm.
module.exports.getAllFirms = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const firms = await FirmModel.find({
      _id: req.user.firm,
      removeAt: null,
    }).populate("owner", "name email");
    res.status(200).json(firms);
  } catch (error) {
    console.error("Error fetching firms:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.removeFirm = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    // Ignore any client-sent firmId -- an admin can only ever remove their
    // own firm.
    const firm = await FirmModel.findOne({ _id: req.user.firm, removeAt: null });
    if (!firm) {
      return res.status(404).json({ message: "Firm not found" });
    }
    firm.removeAt = new Date();
    await firm.save();
    res.status(200).json({ message: "Firm removed successfully" });
  } catch (error) {
    console.error("Error removing firm:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.AddCustomer = async (req, res) => {
  const { name, email, contact, address } = req.body;
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    if (!name || !email || !contact || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingCustomer = await CustomerModel.findOne({
      email: email,
      firm: req.user.firm,
      removeAt: null,
    });
    if (existingCustomer) {
      return res.status(400).json({ message: "Customer already exists" });
    }
    const newCustomer = new CustomerModel({
      name,
      email,
      contact,
      firm: req.user.firm,
      address,
    });
    await newCustomer.save();
    addActivity(
      req.user._id,
      req.user.firm,
      "newCustomerAdded",
      `Added new Customer: ${name}`
    );
    res
      .status(201)
      .json({ message: "Customer added successfully", customer: newCustomer });
  } catch (error) {
    console.error("Error adding customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getAllCustomers = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const customers = await CustomerModel.find({
      removeAt: null,
      firm: req.user.firm,
    }).populate("firm", "name");
    res.status(200).json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.removeCustomer = async (req, res) => {
  const { customerId } = req.query;
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const customer = await CustomerModel.findOne({ _id: customerId, firm: req.user.firm });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    customer.removeAt = new Date();
    await customer.save();
    res.status(200).json({ message: "Customer removed successfully" });
  } catch (error) {
    console.error("Error removing customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.createStockCategory = async (req, res) => {
  const { name, description } = req.body;
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    if (!name || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }
    // Convert absolute path to relative URL path for local storage
    const imagePath = req.file ? getRelativeFilePath(req.file.path) : "";
    if (req.file) {
      console.log("Category image path:", req.file.path);
      console.log("Category image URL for database:", imagePath);
    }

    const newCategory = new StockCategoryModel({
      name,
      description,
      firm: req.user.firm,
      CategoryImg: imagePath,
    });
    await newCategory.save();
    addActivity(
      req.user._id,
      req.user.firm,
      "addStockCategory",
      `Added new Stock category: ${name}`
    );
    res.status(201).json({
      message: "Stock category created successfully",
      category: newCategory,
    });
  } catch (error) {
    console.error("Error creating stock category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getAllStockCategories = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const categories = await StockCategoryModel.find({
      removeAt: null,
      firm: req.user.firm,
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching stock categories:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.removeStockCategory = async (req, res) => {
  const { categoryId } = req.query;
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const category = await StockCategoryModel.findOne({ _id: categoryId, firm: req.user.firm });
    if (!category) {
      return res.status(404).json({ message: "Stock category not found" });
    }
    category.removeAt = new Date();
    await category.save();
    res.status(200).json({ message: "Stock category removed successfully" });
  } catch (error) {
    console.error("Error removing stock category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.Addstock = async (req, res) => {
  const {
    name,
    materialgitType,
    waight,
    karat,
    category,
    quantity,
    price,
    makingCharge, // legacy flat number, still accepted if makingChargeUnit isn't sent
    stockType,
    grossWeight,
    lessWeight,
    hsnCode,
    wastageSupplier,
    wastageCustomer,
    makingChargeValue,
    makingChargeUnit,
    labourChargeValue,
    labourChargeUnit,
    stoneCharge,
  } = req.body;

  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }

    const grossWeightNum = grossWeight !== undefined && grossWeight !== ""
      ? Number(grossWeight)
      : Number(waight) || 0;
    const lessWeightNum = Number(lessWeight) || 0;
    const netWeightNum = Math.max(grossWeightNum - lessWeightNum, 0) || Number(waight) || 0;

    if (
      !name ||
      !materialgitType ||
      !netWeightNum ||
      !category ||
      !quantity ||
      !price
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if ((materialgitType === "gold" || materialgitType === "diamond") && !karat) {
      return res.status(400).json({ message: "Karat is required for gold and diamond items" });
    }
    const categoryDoc = await StockCategoryModel.findOne({ _id: category, firm: req.user.firm });
    if (!categoryDoc) {
      return res.status(400).json({ message: "Category not found" });
    }
    const stockcode = `STOCK-${Date.now()}-${Math.random()
      .toString(10)
      .substring(2, 10)}`; // Generate a unique stock code
    const priceNum = Number(price);

    const makingConfig = makingChargeUnit
      ? { value: Number(makingChargeValue) || 0, unit: makingChargeUnit }
      : { value: Number(makingCharge) || 0, unit: "fixed" };
    const labourConfig = labourChargeUnit
      ? { value: Number(labourChargeValue) || 0, unit: labourChargeUnit }
      : { value: 0, unit: "fixed" };
    const stoneChargeNum = Number(stoneCharge) || 0;
    const wastageSupplierNum = Number(wastageSupplier) || 0;
    const wastageCustomerNum = Number(wastageCustomer) || 0;

    const makingChargeAmount = computeChargeAmount(makingConfig, netWeightNum, priceNum);
    const labourChargeAmount = computeChargeAmount(labourConfig, netWeightNum, priceNum);
    const wastageAmount = priceNum * (wastageCustomerNum / 100);
    const totalValue =
      priceNum + makingChargeAmount + labourChargeAmount + stoneChargeNum + wastageAmount;

    const newStock = new StockModel({
      name,
      materialgitType,
      stockType: stockType === "wholesale" ? "wholesale" : "retail",
      waight: netWeightNum,
      grossWeight: grossWeightNum || netWeightNum,
      lessWeight: lessWeightNum,
      netWeight: netWeightNum,
      karat: materialgitType === "silver" ? "" : karat || "",
      category,
      firm: req.user.firm,
      quantity,
      price: priceNum,
      wastage: { supplier: wastageSupplierNum, customer: wastageCustomerNum },
      makingCharge: Math.round(makingChargeAmount * 100) / 100,
      makingChargeConfig: makingConfig,
      labourCharge: labourConfig,
      stoneCharge: stoneChargeNum,
      hsnCode: hsnCode || "",
      stockcode,
      totalValue: Math.round(totalValue * 100) / 100,
      stockImg: req.file ? getRelativeFilePath(req.file.path) : null, // Handle file upload
    });

    await newStock.save();

    addActivity(req.user._id, req.user.firm, "addStock", `Added new Stock: ${name}`);
    res
      .status(201)
      .json({ message: "Stock added successfully", stock: newStock });
  } catch (error) {
    console.error("Error adding stock:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.updateStock = async (req, res) => {
  const { stockId } = req.params;
  const {
    name,
    materialgitType,
    waight,
    karat,
    category,
    quantity,
    price,
    makingCharge, // legacy flat number, still accepted if makingChargeUnit isn't sent
    stockType,
    grossWeight,
    lessWeight,
    hsnCode,
    wastageSupplier,
    wastageCustomer,
    makingChargeValue,
    makingChargeUnit,
    labourChargeValue,
    labourChargeUnit,
    stoneCharge,
  } = req.body;

  console.log("updateStock called with:", {
    stockId,
    body: req.body,
    file: req.file ? req.file.path : "No file",
  });

  try {
    if (!stockId) {
      return res.status(400).json({ message: "Stock ID is required" });
    }
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }

    // Trim and validate string fields
    const trimmedName = name ? String(name).trim() : "";
    const trimmedType = materialgitType ? String(materialgitType).trim() : "";
    const trimmedCategory = category ? String(category).trim() : "";

    // Validate numeric fields
    const grossWeightNum = grossWeight !== undefined && grossWeight !== ""
      ? parseFloat(grossWeight)
      : parseFloat(waight) || 0;
    const lessWeightNum = parseFloat(lessWeight) || 0;
    const netWeightNum = Math.max(grossWeightNum - lessWeightNum, 0) || parseFloat(waight) || 0;
    const quantityNum = parseFloat(quantity);
    const priceNum = parseFloat(price);

    console.log("Parsed values:", {
      trimmedName,
      trimmedType,
      netWeightNum,
      trimmedCategory,
      trimmedFirm,
      quantityNum,
      priceNum,
    });

    if (
      !trimmedName ||
      !trimmedType ||
      isNaN(netWeightNum) ||
      netWeightNum <= 0 ||
      !trimmedCategory ||
      isNaN(quantityNum) ||
      quantityNum < 0 ||
      isNaN(priceNum) ||
      priceNum < 0
    ) {
      console.log("Validation failed with parsed values");
      return res.status(400).json({
        message: "All fields are required and must have valid values",
      });
    }

    if ((trimmedType === "gold" || trimmedType === "diamond") && !karat) {
      return res.status(400).json({ message: "Karat is required for gold and diamond items" });
    }

    // Find existing stock -- scoped to the caller's firm so one firm can't
    // edit another firm's stock item by ID.
    const stock = await StockModel.findOne({ _id: stockId, firm: req.user.firm });
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    const categoryDoc = await StockCategoryModel.findOne({
      _id: trimmedCategory,
      firm: req.user.firm,
    });
    if (!categoryDoc) {
      return res.status(400).json({ message: "Category not found" });
    }

    const makingConfig = makingChargeUnit
      ? { value: Number(makingChargeValue) || 0, unit: makingChargeUnit }
      : makingCharge !== undefined
      ? { value: Number(makingCharge) || 0, unit: "fixed" }
      : stock.makingChargeConfig || { value: stock.makingCharge || 0, unit: "fixed" };
    const labourConfig = labourChargeUnit
      ? { value: Number(labourChargeValue) || 0, unit: labourChargeUnit }
      : stock.labourCharge || { value: 0, unit: "fixed" };
    const stoneChargeNum = stoneCharge !== undefined ? Number(stoneCharge) || 0 : stock.stoneCharge || 0;
    const wastageSupplierNum = wastageSupplier !== undefined ? Number(wastageSupplier) || 0 : stock.wastage?.supplier || 0;
    const wastageCustomerNum = wastageCustomer !== undefined ? Number(wastageCustomer) || 0 : stock.wastage?.customer || 0;

    const makingChargeAmount = computeChargeAmount(makingConfig, netWeightNum, priceNum);
    const labourChargeAmount = computeChargeAmount(labourConfig, netWeightNum, priceNum);
    const wastageAmount = priceNum * (wastageCustomerNum / 100);

    // Calculate new total value
    const totalValue =
      priceNum + makingChargeAmount + labourChargeAmount + stoneChargeNum + wastageAmount;

    // Update stock fields
    stock.name = trimmedName;
    stock.materialgitType = trimmedType;
    stock.stockType = stockType === "wholesale" ? "wholesale" : stockType === "retail" ? "retail" : stock.stockType;
    stock.waight = netWeightNum;
    stock.grossWeight = grossWeightNum || netWeightNum;
    stock.lessWeight = lessWeightNum;
    stock.netWeight = netWeightNum;
    stock.karat = trimmedType === "silver" ? "" : karat || "";
    stock.category = trimmedCategory;
    stock.quantity = quantityNum;
    stock.price = priceNum;
    stock.wastage = { supplier: wastageSupplierNum, customer: wastageCustomerNum };
    stock.makingCharge = Math.round(makingChargeAmount * 100) / 100;
    stock.makingChargeConfig = makingConfig;
    stock.labourCharge = labourConfig;
    stock.stoneCharge = stoneChargeNum;
    if (hsnCode !== undefined) stock.hsnCode = hsnCode;
    stock.totalValue = Math.round(totalValue * 100) / 100;

    // Update image only if new file is provided
    if (req.file) {
      // Delete old image if it exists
      if (stock.stockImg) {
        const oldImagePath = path.join(__dirname, "../../", stock.stockImg);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      stock.stockImg = getRelativeFilePath(req.file.path);
    }

    await stock.save();

    // Populate references for response
    const updatedStock = await StockModel.findById(stockId)
      .populate("category", "name")
      .populate("firm", "name");

    addActivity(req.user._id, req.user.firm, "updateStock", `Updated Stock: ${name}`);

    res
      .status(200)
      .json({ message: "Stock updated successfully", stock: updatedStock });
  } catch (error) {
    console.error("Error updating stock:", error.message);
    console.error("Full error:", error);
    res.status(500).json({
      message: error.message || "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports.getAllStocks = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const stocks = await StockModel.find({ removeAt: null, firm: req.user.firm })
      .populate("category", "name")
      .populate("firm", "name");
    res.status(200).json(stocks);
  } catch (error) {
    console.error("Error fetching stocks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.removeStock = async (req, res) => {
  const { stockId } = req.query;
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const stock = await StockModel.findOne({ _id: stockId, firm: req.user.firm });
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }
    stock.removeAt = new Date();
    await stock.save();
    res.status(200).json({ message: "Stock removed successfully" });
  } catch (error) {
    console.error("Error removing stock:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getStockbyCategory = async (req, res) => {
  const { categoryId } = req.query;
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const stocks = await StockModel.find({
      category: categoryId,
      firm: req.user.firm,
      removeAt: null,
    })
      .populate("category", "name")
      .populate("firm", "name");
    res.status(200).json(stocks);
  } catch (error) {
    console.error("Error fetching stocks by category:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// There is only ever one legitimate firm for the caller now, so this no
// longer takes a client-supplied firmId -- it's equivalent to getAllStocks,
// kept for backwards API compatibility with existing callers.
module.exports.getStockbyFirm = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const stocks = await StockModel.find({ firm: req.user.firm, removeAt: null })
      .populate("category", "name")
      .populate("firm", "name");
    res.status(200).json(stocks);
  } catch (error) {
    console.error("Error fetching stocks by firm:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

// ============ BULK STOCK EXCEL IMPORT / EXPORT (wholesale add) ============

const STOCK_BULK_COLUMNS = [
  "name",
  "materialgitType",
  "stockType",
  "category",
  "grossWeight",
  "lessWeight",
  "karat",
  "quantity",
  "price",
  "wastageSupplier",
  "wastageCustomer",
  "makingChargeValue",
  "makingChargeUnit",
  "labourChargeValue",
  "labourChargeUnit",
  "stoneCharge",
  "hsnCode",
];

module.exports.downloadStockBulkTemplate = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const XLSX = require("xlsx");
    const categories = await StockCategoryModel.find({ removeAt: null, firm: req.user.firm });

    const exampleRow = {
      name: "Gold Ring 22K",
      materialgitType: "gold",
      stockType: "wholesale",
      category: categories[0]?.name || "Ring",
      grossWeight: 10,
      lessWeight: 0.5,
      karat: "22K",
      quantity: 5,
      price: 55000,
      wastageSupplier: 2,
      wastageCustomer: 4,
      makingChargeValue: 500,
      makingChargeUnit: "per_gram",
      labourChargeValue: 0,
      labourChargeUnit: "fixed",
      stoneCharge: 0,
      hsnCode: "7113",
    };

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet([exampleRow], { header: STOCK_BULK_COLUMNS });
    XLSX.utils.book_append_sheet(workbook, sheet, "Stock");

    const instructions = [
      { field: "materialgitType", validValues: "gold, silver, platinum, diamond, other" },
      { field: "stockType", validValues: "wholesale, retail" },
      { field: "makingChargeUnit / labourChargeUnit", validValues: "fixed, per_gram, per_kg, per_mg, percent" },
      { field: "category", validValues: categories.map((c) => c.name).join(", ") || "(create a category first)" },
      { field: "karat", validValues: "24K, 23K, 22K, 20K, 18K (gold/diamond only, leave blank for silver)" },
    ];
    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Valid Values");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=stock-bulk-template.xlsx");
    res.send(buffer);
  } catch (error) {
    console.error("Error generating stock bulk template:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.bulkImportStock = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "An Excel file is required" });
    }
    const XLSX = require("xlsx");
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    if (rows.length === 0) {
      return res.status(400).json({ message: "The uploaded sheet has no data rows" });
    }

    const categories = await StockCategoryModel.find({ removeAt: null, firm: req.user.firm });
    // Trim defensively — category names entered via their own form aren't
    // trimmed on save, so stray leading/trailing whitespace ("Rings ")
    // would otherwise silently fail every case-insensitive match against a
    // clean name typed into the spreadsheet.
    const categoryByName = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c]));
    const validMaterialTypes = ["gold", "silver", "platinum", "diamond", "other"];
    const validChargeUnits = ["fixed", "per_gram", "per_kg", "per_mg", "percent"];

    const errors = [];
    const toInsert = [];

    rows.forEach((row, index) => {
      const rowNum = index + 2; // header is row 1 in the spreadsheet
      const name = String(row.name || "").trim();
      const materialgitType = String(row.materialgitType || "").trim().toLowerCase();
      const categoryName = String(row.category || "").trim();
      const grossWeight = Number(row.grossWeight) || 0;
      const lessWeight = Number(row.lessWeight) || 0;
      const netWeight = Math.max(grossWeight - lessWeight, 0);
      const quantity = Number(row.quantity);
      const price = Number(row.price);
      const karat = String(row.karat || "").trim();

      const rowErrors = [];
      if (!name) rowErrors.push("name is required");
      if (!validMaterialTypes.includes(materialgitType)) {
        rowErrors.push(`materialgitType must be one of ${validMaterialTypes.join(", ")}`);
      }
      const category = categoryByName.get(categoryName.toLowerCase());
      if (!category) rowErrors.push(`category "${categoryName}" not found`);
      if (!netWeight) rowErrors.push("grossWeight (after lessWeight) must be greater than 0");
      if (!quantity || isNaN(quantity) || quantity <= 0) rowErrors.push("quantity must be a positive number");
      if (!price || isNaN(price) || price <= 0) rowErrors.push("price must be a positive number");
      if ((materialgitType === "gold" || materialgitType === "diamond") && !karat) {
        rowErrors.push("karat is required for gold and diamond items");
      }
      const makingChargeUnit = validChargeUnits.includes(row.makingChargeUnit) ? row.makingChargeUnit : "fixed";
      const labourChargeUnit = validChargeUnits.includes(row.labourChargeUnit) ? row.labourChargeUnit : "fixed";

      if (rowErrors.length > 0) {
        errors.push({ row: rowNum, name: name || "(blank)", message: rowErrors.join("; ") });
        return;
      }

      const makingConfig = { value: Number(row.makingChargeValue) || 0, unit: makingChargeUnit };
      const labourConfig = { value: Number(row.labourChargeValue) || 0, unit: labourChargeUnit };
      const stoneChargeNum = Number(row.stoneCharge) || 0;
      const wastageSupplierNum = Number(row.wastageSupplier) || 0;
      const wastageCustomerNum = Number(row.wastageCustomer) || 0;

      const makingChargeAmount = computeChargeAmount(makingConfig, netWeight, price);
      const labourChargeAmount = computeChargeAmount(labourConfig, netWeight, price);
      const wastageAmount = price * (wastageCustomerNum / 100);
      const totalValue = price + makingChargeAmount + labourChargeAmount + stoneChargeNum + wastageAmount;

      toInsert.push({
        name,
        materialgitType,
        stockType: "wholesale",
        stockcode: `STOCK-${Date.now()}-${index}-${Math.random().toString(10).substring(2, 8)}`,
        waight: netWeight,
        grossWeight,
        lessWeight,
        netWeight,
        karat: materialgitType === "silver" ? "" : karat,
        category: category._id,
        firm: req.user.firm,
        quantity,
        price,
        wastage: { supplier: wastageSupplierNum, customer: wastageCustomerNum },
        makingCharge: Math.round(makingChargeAmount * 100) / 100,
        makingChargeConfig: makingConfig,
        labourCharge: labourConfig,
        stoneCharge: stoneChargeNum,
        hsnCode: String(row.hsnCode || ""),
        totalValue: Math.round(totalValue * 100) / 100,
      });
    });

    let inserted = [];
    if (toInsert.length > 0) {
      inserted = await StockModel.insertMany(toInsert);
      addActivity(
        req.user._id,
        req.user.firm,
        "bulkAddStock",
        `Bulk-imported ${inserted.length} stock item(s) via Excel`
      );
    }

    res.status(errors.length > 0 && inserted.length === 0 ? 400 : 200).json({
      message: `Imported ${inserted.length} of ${rows.length} row(s)`,
      insertedCount: inserted.length,
      totalRows: rows.length,
      errors,
    });
  } catch (error) {
    console.error("Error bulk importing stock:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.createRawMaterial = async (req, res) => {
  const { name, materialType, quantity } = req.body;

  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    if (!name || !materialType || !quantity) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const RawMaterialcode = `RAW-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}`; // Generate a unique raw material code
    const newRawMaterial = new RawMaterialModel({
      name,
      materialType,
      quantity,
      rawmaterialImg: req.file ? getRelativeFilePath(req.file.path) : "",
      RawMaterialcode,
      firm: req.user.firm,
    });
    await newRawMaterial.save();
    addActivity(
      req.user._id,
      req.user.firm,
      "addRawMaterial",
      `Added new Raw material: ${name}`
    );
    res.status(201).json({
      message: "Raw material created successfully",
      rawMaterial: newRawMaterial,
    });
  } catch (error) {
    console.error("Error creating raw material:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getAllRawMaterials = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const rawMaterials = await RawMaterialModel.find({
      removeAt: null,
      firm: req.user.firm,
    }).populate("firm", "name");
    res.status(200).json(rawMaterials);
  } catch (error) {
    console.error("Error fetching raw materials:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.removeRawMaterial = async (req, res) => {
  const { rawMaterialId } = req.query;
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const rawMaterial = await RawMaterialModel.findOne({
      _id: rawMaterialId,
      firm: req.user.firm,
    });
    if (!rawMaterial) {
      return res.status(404).json({ message: "Raw material not found" });
    }
    rawMaterial.removeAt = new Date();
    await rawMaterial.save();
    res.status(200).json({ message: "Raw material removed successfully" });
  } catch (error) {
    console.error("Error removing raw material:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// There is only ever one legitimate firm for the caller now, so this no
// longer takes a client-supplied firmId -- kept for backwards API
// compatibility with existing callers.
module.exports.getRawMaterialbyFirm = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const rawMaterials = await RawMaterialModel.find({
      firm: req.user.firm,
      removeAt: null,
    }).populate("firm", "name");
    res.status(200).json(rawMaterials);
  } catch (error) {
    console.error("Error fetching raw materials by firm:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getRawMaterialbyType = async (req, res) => {
  const { materialType } = req.query;
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const rawMaterials = await RawMaterialModel.find({
      materialType,
      firm: req.user.firm,
      removeAt: null,
    }).populate("firm", "name");
    res.status(200).json(rawMaterials);
  } catch (error) {
    console.error("Error fetching raw materials by type:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.AddRawMaterialStock = async (req, res) => {
  const { rawMaterialId, quantity } = req.body;
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    if (rawMaterialId && quantity) {
      const rawMaterial = await RawMaterialModel.findOne({
        _id: rawMaterialId,
        firm: req.user.firm,
      });
      if (!rawMaterial) {
        return res.status(404).json({ message: "Raw material not found" });
      }
      const baseQuantity = Number(rawMaterial.quantity ?? rawMaterial.weight ?? 0);
      rawMaterial.quantity = baseQuantity + Number(quantity);
      await rawMaterial.save();
      addActivity(
        req.user._id,
        req.user.firm,
        "addRawMaterialStock",
        `Added raw material stock for ${rawMaterial.name} for quantity ${quantity}`
      );
      res.status(200).json({
        message: "Raw material stock updated successfully",
        rawMaterial,
      });
    }
  } catch (error) {
    console.error("Error updating raw material stock:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// User only ever keys in the 24K rate; every other purity is derived from it
// so the daily rate entry stays a single-number job.
const GOLD_PURITY_FACTORS = {
  "24K": 1,
  "23K": 0.9583,
  "22K": 0.9167,
  "20K": 0.8333,
  "18K": 0.75,
};

// Daily rates are keyed one-per-calendar-day, but the date sent by clients
// carries the current time of day, not midnight. Storing it un-normalized
// meant getTodayDailrate/getDashboardData's exact-match "today" queries
// (which compare against midnight UTC) could never find a rate created a
// few hours after midnight -- "today's rate" would look permanently missing.
function normalizeToUtcDate(dateInput) {
  const d = new Date(dateInput);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function deriveGoldPurities(gold24K) {
  const base = Number(gold24K) || 0;
  return Object.fromEntries(
    Object.entries(GOLD_PURITY_FACTORS).map(([karat, factor]) => [
      karat,
      Math.round(base * factor * 100) / 100,
    ])
  );
}

module.exports.GOLD_PURITY_FACTORS = GOLD_PURITY_FACTORS;
module.exports.deriveGoldPurities = deriveGoldPurities;

// Turns a { value, unit } charge config into a flat rupee amount.
// per_gram/per_kg/per_mg scale against the item's net weight; percent scales
// against the item's price; fixed is used as-is.
function computeChargeAmount(config, netWeightGrams, baseAmount) {
  if (!config) return 0;
  const value = Number(config.value) || 0;
  const weight = Number(netWeightGrams) || 0;
  switch (config.unit) {
    case "per_gram":
      return value * weight;
    case "per_kg":
      return value * (weight / 1000);
    case "per_mg":
      return value * (weight * 1000);
    case "percent":
      return (Number(baseAmount) || 0) * (value / 100);
    case "fixed":
    default:
      return value;
  }
}
module.exports.computeChargeAmount = computeChargeAmount;

module.exports.createDailrate = async (req, res) => {
  const { date, rate } = req.body;
  try {
    if (!date || !rate || !rate.gold || !rate.gold["24K"]) {
      return res
        .status(400)
        .json({ message: "Date and 24K gold rate are required" });
    }
    const normalizedDate = normalizeToUtcDate(date);
    const existingRate = await DailrateModel.findOne({ date: normalizedDate });
    if (existingRate) {
      return res
        .status(400)
        .json({ message: "Rate for this date already exists" });
    }
    const newDailrate = new DailrateModel({
      date: normalizedDate,
      rate: {
        ...rate,
        gold: deriveGoldPurities(rate.gold["24K"]),
      },
    });
    await newDailrate.save();
    addActivity(req.user._id, req.user.firm, "todaysRateAdded", ` todays rate Added.`);
    res.status(201).json({
      message: "Daily rate created successfully",
      dailrate: newDailrate,
    });
  } catch (error) {
    console.error("Error creating daily rate:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getAllDailrates = async (req, res) => {
  try {
    const dailrates = await DailrateModel.find().sort({ date: -1 });
    res.status(200).json(dailrates);
  } catch (error) {
    console.error("Error fetching daily rates:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getTodayDailrate = async (req, res) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // 2025-07-18T00:00:00.000Z

    // option B: ISO date string
    const todayStr = new Date().toISOString().slice(0, 10); // "2025-07-18"

    console.log("Today's date:", todayStr); // Debug log

    const dailrate = await DailrateModel.findOne({ date: today });
    if (!dailrate) {
      return res
        .status(404)
        .json({ message: "Daily rate for today not found" });
    }
    res.status(200).json(dailrate);
  } catch (error) {
    console.error("Error fetching today's daily rate:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.updateDailrate = async (req, res) => {
  const { _id, date, rate } = req.body;

  if (!_id || !date || !rate) {
    return res
      .status(400)
      .json({ message: "ID, date, and rate data are required for update." });
  }

  try {
    const updatedDailrate = await DailrateModel.findByIdAndUpdate(
      _id,
      {
        date: normalizeToUtcDate(date), // Normalized to midnight UTC so "today" lookups match

        rate: {
          gold: deriveGoldPurities(rate.gold["24K"]),
          silver: rate.silver,
          daimond: {
            "0_5 Carat": rate.daimond["0_5 Carat"],
            "1 Carat": rate.daimond["1 Carat"],
            "1_5 Carat": rate.daimond["1_5 Carat"],
            "2 Carat": rate.daimond["2 Carat"],
            "2_5 Carat": rate.daimond["2_5 Carat"],
            "3 Carat": rate.daimond["3 Carat"],
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedDailrate) {
      return res
        .status(404)
        .json({ message: "Daily rate record not found for update." });
    }

    addActivity(req.user._id, req.user.firm, "updateDailrate", `Updated daily rate for date.`);

    res.status(200).json({
      message: "Daily rate updated successfully",
      dailrate: updatedDailrate,
    });
  } catch (error) {
    console.error("Error updating daily rate:", error);
    // If you try to update the date to a date that already exists with another document, this will catch it
    if (error.code === 11000) {
      // MongoDB duplicate key error (for unique date index)
      return res.status(400).json({
        message: "A rate for this date already exists (duplicate key error).",
      });
    }
    res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};

module.exports.createSale = async (req, res) => {
  const {
    items,
    customer,
    totalAmount,
    paymentMethod,
    paymentAmount,
    UdharAmount,
    udharAmount,
    payments, // new: [{ method, amount, reference }] — split payment across modes
    discount, // new: { type: 'percent'|'fixed', value, amount }
    subtotal, // new: items subtotal before discount/GST
    gst, // new: { cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount }
  } = req.body;
  console.log("Received sale data:", req.body); // Debug log

  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const firm = req.user.firm;
    const hasSplitPayments = Array.isArray(payments) && payments.length > 0;
    if (
      !items ||
      !customer ||
      !totalAmount ||
      (!hasSplitPayments && (!paymentMethod || paymentAmount === undefined))
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const customerDocForFirmCheck = await CustomerModel.findOne({ _id: customer, firm });
    if (!customerDocForFirmCheck) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Subtract value of stock and raw material, and snapshot the details
    // needed to reprint this exact invoice later even if the stock's price,
    // rate or making charge changes afterwards.
    for (const item of items) {
      if (item.saleType === "stock") {
        const stock = await StockModel.findOne({ _id: item.salematerialId, firm });
        if (!stock) {
          return res.status(404).json({ message: "Stock not found" });
        }
        if (!stock.materialgitType) {
          // Check materialgitType
          return res.status(400).json({
            message: `Stock ${stock.name} is missing required field: materialgitType`,
          });
        }
        if (!stock.waight) {
          // Check waight
          return res.status(400).json({
            message: `Stock ${stock.name} is missing required field: waight`,
          });
        }
        if (stock.quantity < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${stock.name}. Available: ${stock.quantity}, Required: ${item.quantity}`,
          });
        } else if (stock.quantity === item.quantity) {
          stock.quantity = 0; // Set quantity to 0 if it matches exactly
          stock.removeAt = new Date();
        } else {
          stock.quantity -= item.quantity;
        }
        await stock.save();

        const netWeight = stock.netWeight || stock.waight || 0;
        item.name = stock.name;
        item.hsnCode = stock.hsnCode || "";
        item.karat = stock.karat || "";
        item.grossWeight = stock.grossWeight || stock.waight || 0;
        item.lessWeight = stock.lessWeight || 0;
        item.netWeight = netWeight;
        item.rate = netWeight ? Math.round((stock.price / netWeight) * 100) / 100 : 0;
        item.makingCharge = stock.makingCharge || 0;
        item.wastageAmount =
          Math.round(stock.price * ((stock.wastage?.customer || 0) / 100) * 100) / 100;
      } else {
        const rawMaterial = await RawMaterialModel.findOne({
          _id: item.salematerialId,
          firm,
        });
        if (!rawMaterial) {
          return res.status(404).json({ message: "Raw material not found" });
        }
        const availableQuantity = Number(
          rawMaterial.quantity ?? rawMaterial.weight ?? 0
        );
        if (availableQuantity < item.quantity) {
          return res.status(400).json({
            message: `Insufficient raw material for ${rawMaterial.name}. Available: ${availableQuantity}, Required: ${item.quantity}`,
          });
        } else if (availableQuantity === item.quantity) {
          rawMaterial.quantity = 0; // Set quantity to 0 if it matches exactly
          rawMaterial.removeAt = new Date();
        } else {
          rawMaterial.quantity = availableQuantity - item.quantity;
        }
        await rawMaterial.save();
        item.name = rawMaterial.name;
      }
    }

    // Atomically bump the firm's invoice counter so numbers are unique and
    // sequential per firm even under concurrent sale creation.
    const firmForInvoice = await FirmModel.findByIdAndUpdate(
      firm,
      { $inc: { lastInvoiceNumber: 1 } },
      { new: true }
    );
    const invoiceNumber = buildInvoiceNumber(firmForInvoice);

    // Snapshot discount + GST. Rates fall back to the firm's own gstConfig
    // (never hardcoded) if the caller doesn't send an explicit breakdown, so
    // older callers that only send totalAmount still get a correct split.
    const subtotalNum =
      subtotal !== undefined
        ? Number(subtotal)
        : items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    const discountObj = {
      type: discount?.type === "percent" ? "percent" : "fixed",
      value: Number(discount?.value) || 0,
      amount: Number(discount?.amount) || 0,
    };
    const taxableAmountNum = Math.max(subtotalNum - discountObj.amount, 0);
    const firmGstConfig = firmForInvoice?.gstConfig || {
      enabled: true,
      cgstRate: 1.5,
      sgstRate: 1.5,
      igstRate: 0,
    };
    const cgstRate = gst?.cgstRate ?? (firmGstConfig.enabled ? firmGstConfig.cgstRate : 0);
    const sgstRate = gst?.sgstRate ?? (firmGstConfig.enabled ? firmGstConfig.sgstRate : 0);
    const igstRate = gst?.igstRate ?? (firmGstConfig.enabled ? firmGstConfig.igstRate : 0);
    const cgstAmount = gst?.cgstAmount ?? Math.round(taxableAmountNum * (cgstRate / 100) * 100) / 100;
    const sgstAmount = gst?.sgstAmount ?? Math.round(taxableAmountNum * (sgstRate / 100) * 100) / 100;
    const igstAmount = gst?.igstAmount ?? Math.round(taxableAmountNum * (igstRate / 100) * 100) / 100;

    // Build the payment breakdown — a single legacy entry if the caller
    // didn't split, otherwise one row per mode actually used.
    const paymentsArr = hasSplitPayments
      ? payments
          .map((p) => ({
            method: p.method,
            amount: Number(p.amount) || 0,
            reference: p.reference || "",
          }))
          .filter((p) => p.amount > 0)
      : [{ method: paymentMethod, amount: Number(paymentAmount) || 0, reference: "" }];
    const primaryPaymentMethod =
      paymentsArr.length > 1 ? "split" : paymentsArr[0]?.method || paymentMethod;

    // Create Sale
    const newSale = new SaleModel({
      invoiceNumber,
      items,
      customer,
      firm,
      subtotal: subtotalNum,
      discount: discountObj,
      taxableAmount: taxableAmountNum,
      gst: { cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount },
      totalAmount,
      saleDate: new Date().toISOString().slice(0, 10),
      paymentMethod: primaryPaymentMethod,
      payments: paymentsArr,
      udharAmount: UdharAmount || udharAmount || 0,
    });
    await newSale.save();

    // Create one Payment doc per mode actually used
    for (const p of paymentsArr) {
      const payment = new PaymentModel({
        paymentType: p.method,
        paymentRefrence: p.reference || `PAY-${newSale._id}`,
        amount: p.amount,
        paymentDate: new Date().toISOString().slice(0, 10),
        sale: newSale._id,
        customer,
        firm,
      });
      await payment.save();
    }

    // Handle Udhar if any
    const udharAmountValue = UdharAmount || udharAmount || 0;
    if (udharAmountValue > 0) {
      const udhar = new UdharModel({
        customer,
        firm,
        amount: udharAmountValue,
        sale: newSale._id,
      });
      await udhar.save();
    }
    const CustomerName = customerDocForFirmCheck.name;
    const paidTotal = paymentsArr.reduce((sum, p) => sum + p.amount, 0);
    addActivity(
      req.user._id,
      req.user.firm,
      "sale",
      `Sale created for Customer : ${CustomerName} Product : ${items
        .map((item) => item.name || item.saleType)
        .join(
          ", "
        )} for Amount : ${totalAmount} Payment Method : ${primaryPaymentMethod} Payment Amount : ${paidTotal} Udhar Amount : ${udharAmountValue} `
    );
    // Populate refs for immediate UI rendering without refresh
    const populatedSale = await SaleModel.findById(newSale._id)
      .populate("customer")
      .populate({ path: "firm", populate: { path: "owner", select: "name email" } })
      .populate("items.saleType", "name");

    // Success response
    res.status(201).json({
      message: "Sale created successfully",
      sale: populatedSale,
    });
  } catch (error) {
    console.error("Error creating sale:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getAllSales = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const sales = await SaleModel.find({ removeAt: null, firm: req.user.firm })
      .populate("customer")
      .populate({ path: "firm", populate: { path: "owner", select: "name email" } })
      .populate("items.saleType", "name");
    res.status(200).json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.removeSale = async (req, res) => {
  const { saleId } = req.query;
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const sale = await SaleModel.findOne({ _id: saleId, firm: req.user.firm });
    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }
    sale.removeAt = new Date();
    await sale.save();
    res.status(200).json({ message: "Sale removed successfully" });
  } catch (error) {
    console.error("Error removing sale:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getSaleByCustomer = async (req, res) => {
  const { customerId } = req.query;
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const sales = await SaleModel.find({
      customer: customerId,
      firm: req.user.firm,
      removeAt: null,
    })
      .populate("customer")
      .populate({ path: "firm", populate: { path: "owner", select: "name email" } })
      .populate("items.saleType", "name");
    res.status(200).json(sales);
  } catch (error) {
    console.error("Error fetching sales by customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// There is only ever one legitimate firm for the caller now, so this no
// longer takes a client-supplied firmId -- kept for backwards API
// compatibility with existing callers.
module.exports.getSaleByFirm = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const sales = await SaleModel.find({ firm: req.user.firm, removeAt: null })
      .populate("customer")
      .populate({ path: "firm", populate: { path: "owner", select: "name email" } })
      .populate("items.saleType", "name");
    res.status(200).json(sales);
  } catch (error) {
    console.error("Error fetching sales by firm:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getSaleByDate = async (req, res) => {
  const { date } = req.query;
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const sales = await SaleModel.find({
      saleDate: new Date(date),
      firm: req.user.firm,
      removeAt: null,
    })
      .populate("customer")
      .populate({ path: "firm", populate: { path: "owner", select: "name email" } })
      .populate("items.saleType", "name");
    res.status(200).json(sales);
  } catch (error) {
    console.error("Error fetching sales by date:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getSaleByPaymentMethod = async (req, res) => {
  const { paymentMethod } = req.query;
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const sales = await SaleModel.find({
      paymentMethod,
      firm: req.user.firm,
      removeAt: null,
    })
      .populate("customer")
      .populate({ path: "firm", populate: { path: "owner", select: "name email" } })
      .populate("items.saleType", "name");
    res.status(200).json(sales);
  } catch (error) {
    console.error("Error fetching sales by payment method:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getAllPayments = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const payments = await PaymentModel.find({ removeAt: null, firm: req.user.firm })
      .populate("sale", "items totalAmount")
      .populate("customer", "name email")
      .populate("firm", "name");
    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getPaymentByCustomer = async (req, res) => {
  const { customerId } = req.query;
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const payments = await PaymentModel.find({
      customer: customerId,
      firm: req.user.firm,
      removeAt: null,
    })
      .populate("sale", "items totalAmount")
      .populate("customer", "name email")
      .populate("firm", "name");
    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching payments by customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// There is only ever one legitimate firm for the caller now, so this no
// longer takes a client-supplied firmId -- kept for backwards API
// compatibility with existing callers.
module.exports.getPaymentByFirm = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const payments = await PaymentModel.find({
      firm: req.user.firm,
      removeAt: null,
    })
      .populate("sale", "items totalAmount")
      .populate("customer", "name email")
      .populate("firm", "name");
    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching payments by firm:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getPaymentBydate = async (req, res) => {
  const { date } = req.query;
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const payments = await PaymentModel.find({
      paymentDate: new Date(date),
      firm: req.user.firm,
      removeAt: null,
    })
      .populate("sale", "items totalAmount")
      .populate("customer", "name email")
      .populate("firm", "name");
    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching payments by date:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getPaymentByPaymentMethod = async (req, res) => {
  const { paymentMethod } = req.query;
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const payments = await PaymentModel.find({
      paymentType: paymentMethod,
      firm: req.user.firm,
      removeAt: null,
    })
      .populate("sale", "items totalAmount")
      .populate("customer", "name email")
      .populate("firm", "name");
    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching payments by payment method:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getAllUdhar = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const udhar = await UdharModel.find({ removeAt: null, firm: req.user.firm })
      .populate("customer", "name email")
      .populate("firm", "name")
      .populate("sale", "invoiceNumber");
    res.status(200).json(udhar);
  } catch (error) {
    console.error("Error fetching udhar:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getUdharByCustomer = async (req, res) => {
  const { customerId } = req.query;
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const udhar = await UdharModel.find({
      customer: customerId,
      firm: req.user.firm,
      removeAt: null,
    })
      .populate("customer", "name email")
      .populate("firm", "name");
    res.status(200).json(udhar);
  } catch (error) {
    console.error("Error fetching udhar by customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// There is only ever one legitimate firm for the caller now, so this no
// longer takes a client-supplied firmId -- kept for backwards API
// compatibility with existing callers.
module.exports.getUdharByFirm = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const udhar = await UdharModel.find({
      firm: req.user.firm,
      removeAt: null,
    })
      .populate("customer", "name email")
      .populate("firm", "name");
    res.status(200).json(udhar);
  } catch (error) {
    console.error("Error fetching udhar by firm:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getUdharByDate = async (req, res) => {
  const { date } = req.query;
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const udhar = await UdharModel.find({
      createdAt: new Date(date),
      firm: req.user.firm,
      removeAt: null,
    })
      .populate("customer", "name email")
      .populate("firm", "name");
    res.status(200).json(udhar);
  } catch (error) {
    console.error("Error fetching udhar by date:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.setelUdhar = async (req, res) => {
  const { udharId, amount } = req.body;
  try {
    if (!udharId || !amount) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const udhar = await UdharModel.findOne({ _id: udharId, firm: req.user.firm });
    if (!udhar) {
      return res.status(404).json({ message: "Udhar not found" });
    }
    if (udhar.amount < amount) {
      return res.status(400).json({
        message: `Insufficient udhar amount. Available: ${udhar.amount}, Required: ${amount}`,
      });
    } else if (udhar.amount === amount) {
      udhar.amount = 0; // Set amount to 0 if it matches exactly
      udhar.removeAt = new Date();
    } else {
      udhar.amount -= amount; // Subtract the amount from udhar
    }
    await udhar.save();
    //add payment for udhar settlement
    const udharPayment = new PaymentModel({
      paymentType: "udharsetelment",
      paymentRefrence: `UDHAR-${udhar._id}`,
      amount: amount,
      paymentDate: new Date().toISOString().slice(0, 10),
      sale: udhar.sale,
      customer: udhar.customer,
      firm: udhar.firm,
    });
    await udharPayment.save();
    // Create udhar settlement record
    const udharSettlement = new udharsetelmentModel({
      udhar: udhar._id,
      customer: udhar.customer,
      firm: udhar.firm,
      sale: udhar.sale,
      amount: amount,
      paymentDate: new Date().toISOString().slice(0, 10),
    });
    await udharSettlement.save();
    const customer = await CustomerModel.findById(udhar.customer);
    const CustomerName = customer.name;

    addActivity(
      req.user._id,
      req.user.firm,
      "udharSettlement",
      `Settled udhar for Customer : ${CustomerName} Amount : ${amount}`
    );
    res.status(200).json({
      message: "Udhar settled successfully",
      udhar: udhar,
      udharSettlement: udharSettlement,
    });
  } catch (error) {
    console.error("Error creating udhar setelment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getAllUdharSetelment = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const udharSetelments = await udharsetelmentModel
      .find({ removeAt: null, firm: req.user.firm })
      .populate("udhar", "amount")
      .populate("customer", "name email")
      .populate("firm", "name")
      .populate("sale", "invoiceNumber");
    res.status(200).json(udharSetelments);
  } catch (error) {
    console.error("Error fetching udhar setelments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getUdharSetelmentByCustomer = async (req, res) => {
  const { customerId } = req.query;
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const udharSetelments = await udharsetelmentModel
      .find({
        customer: customerId,
        firm: req.user.firm,
        removeAt: null,
      })
      .populate("udhar", "amount")
      .populate("customer", "name email")
      .populate("firm", "name");
    res.status(200).json(udharSetelments);
  } catch (error) {
    console.error("Error fetching udhar setelments by customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getUdharsetelmentBydate = async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ message: "Date is required" });
  }
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const udharSetelments = await udharsetelmentModel
      .find({
        paymentDate: date,
        firm: req.user.firm,
        removeAt: null,
      })
      .populate("udhar", "amount")
      .populate("customer", "name email")
      .populate("firm", "name");
    res.status(200).json(udharSetelments);
  } catch (error) {
    console.error("Error fetching udhar setelments by date:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// API TO FIND MONTHLY SALE total revenue FOR PREVIOUS 5 MONTHS separately

module.exports.getFiveMonthlySales = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const today = new Date();
    const lastFiveMonths = [];
    for (let i = 0; i < 5; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      lastFiveMonths.push(month);
    }

    const monthlySales = await Promise.all(
      lastFiveMonths.map(async (month) => {
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        const endOfMonth = new Date(
          month.getFullYear(),
          month.getMonth() + 1,
          0
        );
        const sales = await SaleModel.aggregate([
          {
            $match: {
              saleDate: { $gte: startOfMonth, $lte: endOfMonth },
              removeAt: null,
              firm: req.user.firm,
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$totalAmount" },
            },
          },
        ]);
        return {
          month: month.toLocaleString("default", { month: "long" }),
          year: month.getFullYear(),
          totalRevenue: sales.length > 0 ? sales[0].totalRevenue : 0,
        };
      })
    );

    res.status(200).json(monthlySales);
  } catch (error) {
    console.error("Error fetching monthly sales:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ============ DAY BOOK — one day's full ledger, date-filterable ============
module.exports.getDayBook = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const firm = req.user.firm;
    const { date } = req.query;
    const day = date ? new Date(date) : new Date();
    if (isNaN(day.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }
    const startOfDay = new Date(day);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);
    const range = { $gte: startOfDay, $lte: endOfDay };

    const [sales, payments, newStock, udharGiven, udharSettled] = await Promise.all([
      SaleModel.find({ saleDate: range, removeAt: null, firm })
        .populate("customer", "name contact")
        .populate("firm", "name")
        .sort({ createdAt: -1 }),
      PaymentModel.find({ paymentDate: range, removeAt: null, firm })
        .populate("customer", "name")
        .populate("firm", "name"),
      StockModel.find({ createdAt: range, firm })
        .populate("category", "name")
        .populate("firm", "name"),
      UdharModel.find({ createdAt: range, removeAt: null, firm }).populate("customer", "name"),
      udharsetelmentModel
        .find({ createdAt: range, removeAt: null, firm })
        .populate("customer", "name"),
    ]);

    const paymentsByMode = payments.reduce((acc, p) => {
      acc[p.paymentType] = (acc[p.paymentType] || 0) + p.amount;
      return acc;
    }, {});

    const summary = {
      salesCount: sales.length,
      totalSalesAmount: sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
      totalPaymentsReceived: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      newStockCount: newStock.length,
      udharGivenAmount: udharGiven.reduce((sum, u) => sum + (u.amount || 0), 0),
      udharSettledAmount: udharSettled.reduce((sum, u) => sum + (u.amount || 0), 0),
    };

    res.status(200).json({
      date: startOfDay,
      sales,
      payments,
      paymentsByMode,
      newStock,
      udharGiven,
      udharSettled,
      summary,
    });
  } catch (error) {
    console.error("Error fetching day book:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.AddGierviItem = async (req, res) => {
  const {
    itemName,
    itemType,
    itemWeight,
    itemValue,
    principalAmount,
    itemDescription,
    interestRate,
    Customer,
    lastDateToTake,
  } = req.body;

  const itemImage = req.file ? getRelativeFilePath(req.file.path) : null;

  // Backward compatibility: if principalAmount is not provided, use itemValue
  const principal = principalAmount || itemValue;

  if (
    !itemName ||
    !itemType ||
    !itemWeight ||
    !itemValue ||
    !itemDescription ||
    !interestRate ||
    !Customer ||
    !lastDateToTake ||
    !itemImage
  ) {
    return res.status(400).json({ message: "All fields (including item image) are required" });
  }
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const customerDoc = await CustomerModel.findOne({ _id: Customer, firm: req.user.firm });
    if (!customerDoc) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const newGierviItem = new GirviModel({
      itemName,
      itemType,
      itemWeight,
      itemValue,
      principalAmount: principal,
      outstandingPrincipal: principal,
      accruedInterest: 0,
      currentOutstandingAmount: principal, // Initially same as principal
      itemDescription,
      interestRate,
      Customer,
      firm: req.user.firm,
      lastDateToTake,
      itemImage: itemImage,
      status: 'active',
      lastInterestAccrualDate: new Date(),
      totalInterestPaid: 0,
      totalInterestDue: 0,
      payments: [],
    });
    await newGierviItem.save();
    addActivity(
      req.user._id,
      req.user.firm,
      "addGierviItem",
      `Added new Girvi item: ${itemName} for ₹${principal} at ${interestRate}% interest`
    );
    res.status(201).json({
      message: "Girvi item added successfully",
      gierviItem: newGierviItem,
    });
  } catch (error) {
    console.error("Error adding girvi item:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.updateGirviItem = async (req, res) => {
  const {
    _id,
    itemName,
    itemType,
    itemWeight,
    itemValue,
    itemDescription,
    Customer,
    lastDateToTake,
  } = req.body;

  if (!_id) {
    return res
      .status(400)
      .json({ message: "Girvi item ID is required for update." });
  }

  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const gierviItem = await GirviModel.findOne({ _id, firm: req.user.firm });

    if (!gierviItem) {
      return res.status(404).json({ message: "Girvi item not found." });
    }

    if (Customer) {
      const customerDoc = await CustomerModel.findOne({ _id: Customer, firm: req.user.firm });
      if (!customerDoc) {
        return res.status(404).json({ message: "Customer not found" });
      }
    }

    // principalAmount, interestRate, and firm are fixed at creation time and
    // are intentionally not editable here — changing them after money has
    // changed hands would invalidate the loan's interest history (and a
    // firm's items must always stay theirs).
    gierviItem.itemName = itemName;
    gierviItem.itemType = itemType;
    gierviItem.itemWeight = itemWeight;
    gierviItem.itemValue = itemValue;
    gierviItem.itemDescription = itemDescription;
    gierviItem.Customer = Customer;
    gierviItem.lastDateToTake = lastDateToTake;

    if (req.file) {
      // Delete old image if it exists
      if (gierviItem.itemImage) {
        const oldImagePath = path.join(__dirname, "../../", gierviItem.itemImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      gierviItem.itemImage = getRelativeFilePath(req.file.path);
      console.log("Updated Girvi item image path:", req.file.path);
    }

    await gierviItem.save();
    res.status(200).json({
      message: "Girvi item updated successfully",
      girviItem: gierviItem,
    });
  } catch (error) {
    console.error("Error updating girvi item:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getAllGierviItems = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const gierviItems = await GirviModel.find({ removeAt: null, firm: req.user.firm })
      .populate("Customer", "name email")
      .populate("firm", "name");
    res.status(200).json(gierviItems);
  } catch (error) {
    console.error("Error fetching giervi items:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.removeGierviItem = async (req, res) => {
  const { girviItemId } = req.query;

  if (!girviItemId) {
    return res
      .status(400)
      .json({ message: "Girvi item ID is required for deletion." });
  }

  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const gierviItem = await GirviModel.findOne({ _id: girviItemId, firm: req.user.firm });

    if (!gierviItem) {
      return res.status(404).json({ message: "Girvi item not found." });
    }

    gierviItem.removeAt = new Date();
    await gierviItem.save();

    if (gierviItem.itemImage) {
      const imagePathToDelete = path.join(baseUploadDir, gierviItem.itemImage);
      fs.unlink(imagePathToDelete, (err) => {
        if (err) {
          console.warn(
            `Could not delete image file during soft-delete: ${imagePathToDelete}`,
            err
          );
        } else {
          console.log(`Deleted image file: ${imagePathToDelete}`);
        }
      });
    }

    res
      .status(200)
      .json({ message: "Girvi item successfully marked as removed." });
  } catch (error) {
    console.error("Error removing girvi item:", error);
    res
      .status(500)
      .json({ message: "Internal server error: " + error.message });
  }
};
module.exports.changelastdatetoTake = async (req, res) => {
  const { gierviItemId, newLastDate } = req.body;
  try {
    if (!gierviItemId || !newLastDate) {
      return res
        .status(400)
        .json({ message: "Giervi item ID and new last date are required" });
    }
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const gierviItem = await GirviModel.findOne({ _id: gierviItemId, firm: req.user.firm });
    if (!gierviItem) {
      return res.status(404).json({ message: "Giervi item not found" });
    }
    gierviItem.lastDateToTake = new Date(newLastDate);
    await gierviItem.save();
    res
      .status(200)
      .json({ message: "Last date to take updated successfully", gierviItem });
  } catch (error) {
    console.error("Error updating last date to take:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// deshbord api to show all total customers , total sales   total stock value  todays rate of gold  sliver and daimond
module.exports.getDashboardData = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const firm = req.user.firm;

    const totalCustomers = await CustomerModel.countDocuments({
      removeAt: null,
      firm,
    });

    // Fix: Calculate total sales revenue instead of count
    const totalSalesData = await SaleModel.aggregate([
      { $match: { removeAt: null, firm } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]);
    const totalSalesRevenue = totalSalesData.length > 0 ? totalSalesData[0].totalRevenue : 0;

    // Also get the count of sales for reference
    const totalSalesCount = await SaleModel.countDocuments({ removeAt: null, firm });

    const totalStocks = await StockModel.aggregate([
      { $match: { removeAt: null, firm } },
      { $group: { _id: null, totalValue: { $sum: "$totalValue" } } },
    ]);
    const totalRawMaterials = await RawMaterialModel.aggregate([
      { $match: { removeAt: null, firm } },
      { $group: { _id: null, totalWeight: { $sum: "$weight" } } },
    ]);
    // Daily rates are intentionally global/shared across all firms.
    const todayRate = await DailrateModel.findOne({
      date: new Date().toISOString().slice(0, 10),
    });

    res.status(200).json({
      totalCustomers,
      totalSales: totalSalesRevenue, // Total revenue from all sales
      totalSalesCount: totalSalesCount, // Number of sales transactions
      totalStockValue: totalStocks.length > 0 ? totalStocks[0].totalValue : 0,
      totalRawMaterialWeight:
        totalRawMaterials.length > 0 ? totalRawMaterials[0].totalWeight : 0,
      todayRate: todayRate ? todayRate.rate : "No rate available for today",
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//api to show total sales monthly for the last 5 months
module.exports.getMonthlySalesData = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const today = new Date();
    const lastFiveMonths = [];
    for (let i = 0; i < 5; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      lastFiveMonths.push(month);
    }

    const monthlySales = await Promise.all(
      lastFiveMonths.map(async (month) => {
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        const endOfMonth = new Date(
          month.getFullYear(),
          month.getMonth() + 1,
          0
        );
        const sales = await SaleModel.aggregate([
          {
            $match: {
              saleDate: { $gte: startOfMonth, $lte: endOfMonth },
              removeAt: null,
              firm: req.user.firm,
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$totalAmount" },
            },
          },
        ]);
        return {
          month: month.toLocaleString("default", { month: "long" }),
          year: month.getFullYear(),
          totalRevenue: sales.length > 0 ? sales[0].totalRevenue : 0,
        };
      })
    );

    res.status(200).json(monthlySales);
  } catch (error) {
    console.error("Error fetching monthly sales data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//write a funxtion to add activites
const addActivity = async (userId, firm, activityType, description) => {
  try {
    const newActivity = new ActivityModel({
      userId,
      firm,
      activityType,
      description,
      timestamp: new Date(),
    });
    // Await the asynchronous save operation
    const savedActivity = await newActivity.save();
    return savedActivity; // Return the saved activity document
  } catch (error) {
    console.error("Error adding activity:", error);
    throw new Error("Internal server error");
  }
};

//api to get recent 10 activities ONLY SHOW THE DESC AND TYPE AND TIMESTAMP
//admins see their whole firm's activity; staff only ever see their own
module.exports.getRecentActivities = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const filter =
      req.user.role?.toLowerCase() === "admin"
        ? { firm: req.user.firm }
        : { firm: req.user.firm, userId: req.user._id };
    const activities = await ActivityModel.find(filter)
      .select("description activityType timestamp")
      .sort({ timestamp: -1 })
      .limit(10);
    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//api to get all activities only show description and activityType
//admins see their whole firm's activity; staff only ever see their own
module.exports.getAllActivities = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const filter =
      req.user.role?.toLowerCase() === "admin"
        ? { firm: req.user.firm }
        : { firm: req.user.firm, userId: req.user._id };
    const activities = await ActivityModel.find(filter).select(
      "description activityType"
    );
    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching all activities:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ============ NEW GIRVI INTEREST MANAGEMENT FUNCTIONS ============

// Calculate interest for a specific Girvi item
module.exports.calculateGirviInterest = async (req, res) => {
  const { girviId } = req.params;

  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const girviItem = await GirviModel.findOne({ _id: girviId, firm: req.user.firm })
      .populate('Customer', 'name email')
      .populate('firm', 'name');

    if (!girviItem) {
      return res.status(404).json({ message: "Girvi item not found" });
    }

    if (girviItem.status !== 'active') {
      return res.status(400).json({ message: "Cannot calculate interest for inactive Girvi item" });
    }

    const interestCalculation = girviItem.previewInterest();

    res.status(200).json({
      girviItem: {
        _id: girviItem._id,
        itemName: girviItem.itemName,
        principalAmount: girviItem.principalAmount,
        outstandingPrincipal: girviItem.outstandingPrincipal,
        interestRate: girviItem.interestRate,
        customer: girviItem.Customer,
        firm: girviItem.firm
      },
      interestCalculation
    });
  } catch (error) {
    console.error("Error calculating Girvi interest:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Manually trigger the monthly interest accrual for the caller's own firm
// (the same accrual also runs system-wide on a schedule -- see cronJobs.js).
module.exports.updateGirviInterestMonthly = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const activeGirviItems = await GirviModel.find({
      status: 'active',
      removeAt: null,
      firm: req.user.firm,
    });

    const updatedItems = [];

    for (const girviItem of activeGirviItems) {
      const preview = girviItem.previewInterest();

      if (preview.monthsElapsed > 0) {
        const interestRecord = new GirviInterestModel({
          girvi: girviItem._id,
          customer: girviItem.Customer,
          firm: girviItem.firm,
          interestAmount: preview.interestAmount,
          monthsCalculated: preview.monthsElapsed,
        });
        await interestRecord.save();

        girviItem.accrueInterest();
        await girviItem.save();

        updatedItems.push({
          girviId: girviItem._id,
          itemName: girviItem.itemName,
          interestAdded: preview.interestAmount,
          newOutstandingAmount: girviItem.currentOutstandingAmount
        });

        addActivity(
          req.user?._id || 'system',
          girviItem.firm,
          'girviInterestCalculated',
          `Monthly interest calculated for ${girviItem.itemName}: ₹${preview.interestAmount}`
        );
      }
    }

    res.status(200).json({
      message: `Interest updated for ${updatedItems.length} Girvi items`,
      updatedItems
    });
  } catch (error) {
    console.error("Error updating monthly Girvi interest:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Record a customer payment against a Girvi loan: applied interest-first, then principal.
module.exports.addGirviPayment = async (req, res) => {
  const { girviId, amount, paymentMethod, paymentReference } = req.body;

  try {
    if (!girviId || !amount || !paymentMethod) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }

    const girviItem = await GirviModel.findOne({ _id: girviId, firm: req.user.firm }).populate(
      'Customer',
      'name email'
    );
    if (!girviItem) {
      return res.status(404).json({ message: "Girvi item not found" });
    }

    if (girviItem.status !== 'active') {
      return res.status(400).json({ message: "Cannot record a payment for an inactive Girvi item" });
    }

    let paymentEntry;
    try {
      paymentEntry = girviItem.applyPayment({
        amount: Number(amount),
        method: paymentMethod,
        reference: paymentReference,
      });
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

    await girviItem.save();

    const payment = new PaymentModel({
      paymentType: paymentMethod,
      paymentRefrence: paymentReference || `GIRVI-PAY-${girviId}-${Date.now()}`,
      amount: paymentEntry.amount,
      paymentDate: new Date(),
      sale: null,
      customer: girviItem.Customer._id,
      firm: girviItem.firm
    });
    await payment.save();

    addActivity(
      req.user._id,
      req.user.firm,
      girviItem.status === 'redeemed' ? 'girviRedeemed' : 'girviPayment',
      girviItem.status === 'redeemed'
        ? `${girviItem.itemName} fully redeemed by ${girviItem.Customer.name} with a final payment of ₹${paymentEntry.amount}`
        : `Payment of ₹${paymentEntry.amount} received for ${girviItem.itemName} (₹${paymentEntry.interestPortion} interest, ₹${paymentEntry.principalPortion} principal)`
    );

    res.status(200).json({
      message: girviItem.status === 'redeemed' ? "Payment recorded and Girvi item redeemed" : "Payment recorded successfully",
      girviItem,
      payment: paymentEntry,
    });
  } catch (error) {
    console.error("Error processing Girvi payment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all interest records for a Girvi item
module.exports.getGirviInterestHistory = async (req, res) => {
  const { girviId } = req.params;

  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const interestHistory = await GirviInterestModel.find({
      girvi: girviId,
      firm: req.user.firm,
    })
      .populate('customer', 'name email')
      .populate('firm', 'name')
      .sort({ calculationDate: -1 });

    res.status(200).json(interestHistory);
  } catch (error) {
    console.error("Error fetching Girvi interest history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all pending interest payments
module.exports.getAllPendingInterests = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json([]);
    }
    const pendingInterests = await GirviInterestModel.find({
      status: 'pending',
      removeAt: null,
      firm: req.user.firm,
    })
    .populate({
      path: 'girvi',
      select: 'itemName itemType principalAmount interestRate currentOutstandingAmount',
      populate: {
        path: 'Customer',
        select: 'name email contact'
      }
    })
    .populate('firm', 'name')
    .sort({ calculationDate: 1 });
    
    res.status(200).json(pendingInterests);
  } catch (error) {
    console.error("Error fetching pending interests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Redeem Girvi item (customer takes back their item) — settles the full outstanding balance in one payment.
module.exports.redeemGirviItem = async (req, res) => {
  const { girviId, paymentMethod, paymentReference } = req.body;

  try {
    if (!girviId || !paymentMethod) {
      return res.status(400).json({ message: "Girvi ID and payment method are required" });
    }
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }

    const girviItem = await GirviModel.findOne({ _id: girviId, firm: req.user.firm })
      .populate('Customer', 'name email');

    if (!girviItem) {
      return res.status(404).json({ message: "Girvi item not found" });
    }

    if (girviItem.status !== 'active') {
      return res.status(400).json({ message: "Girvi item is not active" });
    }

    girviItem.accrueInterest();
    const finalAmount = girviItem.outstandingPrincipal + girviItem.accruedInterest;

    const paymentEntry = girviItem.applyPayment({
      amount: finalAmount,
      method: paymentMethod,
      reference: paymentReference || `GIRVI-REDEEM-${girviId}-${Date.now()}`,
    });

    await girviItem.save();

    const finalPayment = new PaymentModel({
      paymentType: paymentMethod,
      paymentRefrence: paymentReference || `GIRVI-REDEEM-${girviId}-${Date.now()}`,
      amount: finalAmount,
      paymentDate: new Date(),
      sale: null,
      customer: girviItem.Customer._id,
      firm: girviItem.firm
    });
    await finalPayment.save();

    addActivity(
      req.user._id,
      req.user.firm,
      'girviRedeemed',
      `${girviItem.itemName} redeemed by ${girviItem.Customer.name} for ₹${finalAmount}`
    );

    res.status(200).json({
      message: "Girvi item redeemed successfully",
      girviItem: {
        _id: girviItem._id,
        itemName: girviItem.itemName,
        customer: girviItem.Customer.name,
        finalAmount: finalAmount,
        redeemedAt: girviItem.redeemedAt
      }
    });
  } catch (error) {
    console.error("Error redeeming Girvi item:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Girvi summary for dashboard
module.exports.getGirviSummary = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(200).json({ summary: [], pendingInterestRecords: 0 });
    }
    const summary = await GirviModel.aggregate([
      { $match: { removeAt: null, firm: req.user.firm } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalPrincipal: { $sum: '$principalAmount' },
          totalOutstandingPrincipal: { $sum: '$outstandingPrincipal' },
          totalOutstanding: { $sum: { $add: ['$outstandingPrincipal', '$accruedInterest'] } },
          totalInterestDue: { $sum: '$accruedInterest' }
        }
      }
    ]);

    const pendingInterests = await GirviInterestModel.countDocuments({
      status: 'pending',
      removeAt: null,
      firm: req.user.firm,
    });

    res.status(200).json({
      summary,
      pendingInterestRecords: pendingInterests
    });
  } catch (error) {
    console.error("Error fetching Girvi summary:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// Builds the full-data export workbook and returns it as a Buffer. Shared by the
// manual "Export All Data to Excel" HTTP handler below and the weekly automatic
// export cron job (Backend/Utils/cronJobs.js), so both stay in sync.
// firmFilter: pass {} (the default) for a full, unscoped, system-wide backup
// -- only ever used internally (the weekly cron export in cronJobs.js), never
// reachable via any per-tenant HTTP route. Pass { firm: <id> } to scope the
// export to one firm, which is what the HTTP route below always does.
async function buildFullExportWorkbook(firmFilter = {}) {
    console.log('Starting Excel export...');
    const XLSX = require('xlsx');
    // Firms are identified by _id, not a `firm` field, so build their own
    // filter from the same firmFilter.firm value.
    const firmIdFilter = firmFilter.firm ? { _id: firmFilter.firm } : {};

    console.log('Fetching data from database...');
    // Fetch all data from database with simpler queries
    const customers = await CustomerModel.find({ removeAt: null, ...firmFilter }).lean();
    console.log(`Fetched ${customers.length} customers`);

    const sales = await SaleModel.find({ removeAt: null, ...firmFilter }).lean();
    console.log(`Fetched ${sales.length} sales`);

    const stocks = await StockModel.find({ removeAt: null, ...firmFilter }).lean();
    console.log(`Fetched ${stocks.length} stocks`);

    const rawMaterials = await RawMaterialModel.find({ removeAt: null, ...firmFilter }).lean();
    console.log(`Fetched ${rawMaterials.length} raw materials`);

    const payments = await PaymentModel.find({ removeAt: null, ...firmFilter }).lean();
    console.log(`Fetched ${payments.length} payments`);

    const udhar = await UdharModel.find({ removeAt: null, ...firmFilter }).lean();
    console.log(`Fetched ${udhar.length} udhar records`);

    const girvi = await GirviModel.find({ removeAt: null, ...firmFilter }).lean();
    console.log(`Fetched ${girvi.length} girvi records`);

    const girviInterest = await GirviInterestModel.find(firmFilter).lean();
    console.log(`Fetched ${girviInterest.length} girvi interest records`);

    const firms = await FirmModel.find({ removeAt: null, ...firmIdFilter }).lean();
    console.log(`Fetched ${firms.length} firms`);

    const users = await UserModel.find({ removeAt: null, ...firmFilter }).select('-password').lean();
    console.log(`Fetched ${users.length} users`);

    const categories = await StockCategoryModel.find({ removeAt: null, ...firmFilter }).lean();
    console.log(`Fetched ${categories.length} categories`);

    // Daily rates are intentionally global/shared across all firms -- never
    // filtered, even in a per-firm export.
    const dailRates = await DailrateModel.find().lean();
    console.log(`Fetched ${dailRates.length} daily rates`);

    const udharSettlements = await udharsetelmentModel
      .find({ removeAt: null, ...firmFilter })
      .lean();
    console.log(`Fetched ${udharSettlements.length} udhar settlements`);

    console.log('Creating workbook...');
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Helper function to convert data to simple format
    const prepareData = (data) => {
      if (!data || data.length === 0) return [];
      
      return data.map(item => {
        const cleanItem = {};
        for (const key in item) {
          if (key === '__v' || key === 'removeAt') continue;
          
          const value = item[key];
          if (value === null || value === undefined) {
            cleanItem[key] = '';
          } else if (typeof value === 'object' && value._id) {
            cleanItem[key] = value._id.toString();
          } else if (Array.isArray(value)) {
            cleanItem[key] = JSON.stringify(value);
          } else if (value instanceof Date) {
            cleanItem[key] = value.toISOString().split('T')[0];
          } else if (typeof value === 'object') {
            cleanItem[key] = JSON.stringify(value);
          } else {
            cleanItem[key] = value;
          }
        }
        return cleanItem;
      });
    };

    // Add sheets with data
    console.log('Adding Customers sheet...');
    if (customers.length > 0) {
      const customersSheet = XLSX.utils.json_to_sheet(prepareData(customers));
      XLSX.utils.book_append_sheet(workbook, customersSheet, 'Customers');
    }

    console.log('Adding Sales sheet...');
    if (sales.length > 0) {
      const salesSheet = XLSX.utils.json_to_sheet(prepareData(sales));
      XLSX.utils.book_append_sheet(workbook, salesSheet, 'Sales');
    }

    console.log('Adding Stock sheet...');
    if (stocks.length > 0) {
      const stocksSheet = XLSX.utils.json_to_sheet(prepareData(stocks));
      XLSX.utils.book_append_sheet(workbook, stocksSheet, 'Stock');
    }

    console.log('Adding Raw Materials sheet...');
    if (rawMaterials.length > 0) {
      const rawMaterialsSheet = XLSX.utils.json_to_sheet(prepareData(rawMaterials));
      XLSX.utils.book_append_sheet(workbook, rawMaterialsSheet, 'Raw Materials');
    }

    console.log('Adding Payments sheet...');
    if (payments.length > 0) {
      const paymentsSheet = XLSX.utils.json_to_sheet(prepareData(payments));
      XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'Payments');
    }

    console.log('Adding Udhar sheet...');
    if (udhar.length > 0) {
      const udharSheet = XLSX.utils.json_to_sheet(prepareData(udhar));
      XLSX.utils.book_append_sheet(workbook, udharSheet, 'Udhar');
    }

    console.log('Adding Girvi sheet...');
    if (girvi.length > 0) {
      const girviSheet = XLSX.utils.json_to_sheet(prepareData(girvi));
      XLSX.utils.book_append_sheet(workbook, girviSheet, 'Girvi (Borrow)');
    }

    console.log('Adding Girvi Interest sheet...');
    if (girviInterest.length > 0) {
      const girviInterestSheet = XLSX.utils.json_to_sheet(prepareData(girviInterest));
      XLSX.utils.book_append_sheet(workbook, girviInterestSheet, 'Girvi Interest');
    }

    console.log('Adding Firms sheet...');
    if (firms.length > 0) {
      const firmsSheet = XLSX.utils.json_to_sheet(prepareData(firms));
      XLSX.utils.book_append_sheet(workbook, firmsSheet, 'Firms');
    }

    console.log('Adding Users sheet...');
    if (users.length > 0) {
      const usersSheet = XLSX.utils.json_to_sheet(prepareData(users));
      XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users');
    }

    console.log('Adding Categories sheet...');
    if (categories.length > 0) {
      const categoriesSheet = XLSX.utils.json_to_sheet(prepareData(categories));
      XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categories');
    }

    console.log('Adding Daily Rates sheet...');
    if (dailRates.length > 0) {
      const dailRatesSheet = XLSX.utils.json_to_sheet(prepareData(dailRates));
      XLSX.utils.book_append_sheet(workbook, dailRatesSheet, 'Daily Rates');
    }

    console.log('Adding Udhar Settlements sheet...');
    if (udharSettlements.length > 0) {
      const udharSettlementsSheet = XLSX.utils.json_to_sheet(prepareData(udharSettlements));
      XLSX.utils.book_append_sheet(workbook, udharSettlementsSheet, 'Udhar Settlements');
    }

    console.log('Generating Excel file...');
    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return excelBuffer;
}

// Export all data to Excel
module.exports.buildFullExportWorkbook = buildFullExportWorkbook;
module.exports.exportAllDataToExcel = async (req, res) => {
  try {
    if (!req.user.firm) {
      return res.status(403).json({ message: "No firm associated with this account" });
    }
    const excelBuffer = await buildFullExportWorkbook({ firm: req.user.firm });

    console.log('Sending file to client...');
    const fileName = `GemControl_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);
    console.log('Excel export completed successfully!');
  } catch (error) {
    console.error('Error exporting data to Excel:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Failed to export data',
      error: error.message
    });
  }
};
