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

module.exports.RegisterUser = async (req, res) => {
  const { name, email, contact, password } = req.body;
  // Only an already-authenticated admin (isAdmin middleware on /admin/register) may pick a
  // role other than "staff" -- the public /register endpoint (no auth) always creates staff
  // accounts regardless of what's sent in the request body.
  const isAdminCaller = req.user && req.user.role?.toLowerCase() === "admin";
  const role = isAdminCaller ? (req.body.role || "staff") : "staff";

  try {
    const existingUser = await UserModel.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    if (!name || !email || !contact || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({
      name,
      email,
      contact,
      password: hashedPassword,
      role,
    });
    await newUser.save();
    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
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
    const users = await UserModel.find({ removeAt: null });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.removeUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await UserModel.findById(userId);
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
    const user = await UserModel.findById(userId);
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
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, { httpOnly: true });
    res
      .status(200)
      .json({ message: "Login successful", token, role: user.role });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.logoutUser = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout successful" });
};

module.exports.createFirm = async (req, res) => {
  try {
    const {
      name, location, size, gst, email, contact,
      bankName, branch, accountNo, ifscCode, proprietorName,
    } = req.body;

    // Validate required fields
    if (!name || !location || !size) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const logoUrl = req.files?.logo?.[0] ? getRelativeFilePath(req.files.logo[0].path) : "";
    const firmStampUrl = req.files?.firmStamp?.[0] ? getRelativeFilePath(req.files.firmStamp[0].path) : "";
    const ownerSignatureUrl = req.files?.ownerSignature?.[0] ? getRelativeFilePath(req.files.ownerSignature[0].path) : "";

    const newFirm = new FirmModel({
      name,
      location,
      size,
      logo: logoUrl,
      firmStamp: firmStampUrl,
      ownerSignature: ownerSignatureUrl,
      owner: req.user?._id,
      proprietorName: proprietorName || "",
      gst: gst || "",
      email: email || "",
      contact: contact || "",
      bankName: bankName || "",
      branch: branch || "",
      accountNo: accountNo || "",
      ifscCode: ifscCode || "",
    });

    await newFirm.save();

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
    const { firmId } = req.body;
    if (!firmId) {
      return res.status(400).json({ message: "Firm ID is required for update." });
    }

    const firm = await FirmModel.findById(firmId);
    if (!firm) {
      return res.status(404).json({ message: "Firm not found." });
    }

    const {
      name, location, size, gst, email, contact,
      bankName, branch, accountNo, ifscCode, proprietorName,
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

// Firms belong to the shop, not to whichever individual login created them —
// every authenticated user (admin or staff) needs to see all of them, e.g.
// staff picking a firm while creating a sale.
module.exports.getAllFirms = async (req, res) => {
  try {
    const firms = await FirmModel.find({
      removeAt: null,
    }).populate("owner", "name email");
    res.status(200).json(firms);
  } catch (error) {
    console.error("Error fetching firms:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.removeFirm = async (req, res) => {
  const { firmId } = req.query;
  try {
    const firm = await FirmModel.findOne({ _id: firmId, removeAt: null });
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
  const { name, email, contact, firm, address } = req.body;
  try {
    if (!name || !email || !contact || !firm || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingCustomer = await CustomerModel.findOne({
      email: email,
      removeAt: null,
    });
    if (existingCustomer) {
      return res.status(400).json({ message: "Customer already exists" });
    }
    const newCustomer = new CustomerModel({
      name,
      email,
      contact,
      firm,
      address,
    });
    await newCustomer.save();
    addActivity(
      req.user._id,
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
    const customers = await CustomerModel.find({ removeAt: null }).populate(
      "firm",
      "name"
    );
    res.status(200).json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.removeCustomer = async (req, res) => {
  const { customerId } = req.query;
  try {
    const customer = await CustomerModel.findById(customerId);
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
      CategoryImg: imagePath,
    });
    await newCategory.save();
    addActivity(
      req.user._id,
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
    const categories = await StockCategoryModel.find({ removeAt: null });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching stock categories:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.removeStockCategory = async (req, res) => {
  const { categoryId } = req.query;
  try {
    const category = await StockCategoryModel.findById(categoryId);
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
    firm,
    quantity,
    price,
    makingCharge,
  } = req.body;
  //   console.log("Received data:", req.body
  // , req.file ? req.file.path : "No file uploaded"
  //   );

  try {
    if (
      !name ||
      !materialgitType ||
      !waight ||
      !category ||
      !firm ||
      !quantity ||
      !price ||
      !makingCharge
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if ((materialgitType === "gold" || materialgitType === "diamond") && !karat) {
      return res.status(400).json({ message: "Karat is required for gold and diamond items" });
    }
    const stockcode = `STOCK-${Date.now()}-${Math.random()
      .toString(10)
      .substring(2, 10)}`; // Generate a unique stock code
    pricenum = Number(price);
    const makingChargeNum = Number(makingCharge);
    const totalValue = pricenum + makingChargeNum;
    // Calculate total value
    const newStock = new StockModel({
      name,
      materialgitType,
      waight,
      karat: materialgitType === "silver" ? "" : karat || "",
      category,
      firm,
      quantity,
      price,
      makingCharge,
      stockcode,
      totalValue,
      stockImg: req.file ? getRelativeFilePath(req.file.path) : null, // Handle file upload
    });

    await newStock.save();

    addActivity(req.user._id, "addStock", `Added new Stock: ${name}`);
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
    firm,
    quantity,
    price,
    makingCharge,
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

    // Trim and validate string fields
    const trimmedName = name ? String(name).trim() : "";
    const trimmedType = materialgitType ? String(materialgitType).trim() : "";
    const trimmedCategory = category ? String(category).trim() : "";
    const trimmedFirm = firm ? String(firm).trim() : "";

    // Validate numeric fields
    const waightNum = parseFloat(waight);
    const quantityNum = parseFloat(quantity);
    const priceNum = parseFloat(price);
    const makingChargeNum = parseFloat(makingCharge);

    console.log("Parsed values:", {
      trimmedName,
      trimmedType,
      waightNum,
      trimmedCategory,
      trimmedFirm,
      quantityNum,
      priceNum,
      makingChargeNum,
    });

    if (
      !trimmedName ||
      !trimmedType ||
      isNaN(waightNum) ||
      waightNum <= 0 ||
      !trimmedCategory ||
      !trimmedFirm ||
      isNaN(quantityNum) ||
      quantityNum < 0 ||
      isNaN(priceNum) ||
      priceNum < 0 ||
      isNaN(makingChargeNum) ||
      makingChargeNum < 0
    ) {
      console.log("Validation failed with parsed values");
      return res.status(400).json({
        message: "All fields are required and must have valid values",
      });
    }

    if ((trimmedType === "gold" || trimmedType === "diamond") && !karat) {
      return res.status(400).json({ message: "Karat is required for gold and diamond items" });
    }

    // Find existing stock
    const stock = await StockModel.findById(stockId);
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    // Calculate new total value
    const totalValue = priceNum + makingChargeNum;

    // Update stock fields
    stock.name = trimmedName;
    stock.materialgitType = trimmedType;
    stock.waight = waightNum;
    stock.karat = trimmedType === "silver" ? "" : karat || "";
    stock.category = trimmedCategory;
    stock.firm = trimmedFirm;
    stock.quantity = quantityNum;
    stock.price = priceNum;
    stock.makingCharge = makingChargeNum;
    stock.totalValue = totalValue;

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

    addActivity(req.user._id, "updateStock", `Updated Stock: ${name}`);

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
    const stocks = await StockModel.find({ removeAt: null })
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
    const stock = await StockModel.findById(stockId);
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
    const stocks = await StockModel.find({
      category: categoryId,
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

module.exports.getStockbyFirm = async (req, res) => {
  const { firmId } = req.query;
  try {
    const stocks = await StockModel.find({ firm: firmId, removeAt: null })
      .populate("category", "name")
      .populate("firm", "name");
    res.status(200).json(stocks);
  } catch (error) {
    console.error("Error fetching stocks by firm:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.createRawMaterial = async (req, res) => {
  const { name, materialType, quantity, firm } = req.body;

  try {
    if (!name || !materialType || !quantity || !firm) {
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
      firm,
    });
    await newRawMaterial.save();
    addActivity(
      req.user._id,
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
    const rawMaterials = await RawMaterialModel.find({
      removeAt: null,
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
    const rawMaterial = await RawMaterialModel.findById(rawMaterialId);
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
module.exports.getRawMaterialbyFirm = async (req, res) => {
  const { firmId } = req.query;
  try {
    const rawMaterials = await RawMaterialModel.find({
      firm: firmId,
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
    const rawMaterials = await RawMaterialModel.find({
      materialType,
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
    if (rawMaterialId && quantity) {
      const rawMaterial = await RawMaterialModel.findById(rawMaterialId);
      if (!rawMaterial) {
        return res.status(404).json({ message: "Raw material not found" });
      }
      const baseQuantity = Number(rawMaterial.quantity ?? rawMaterial.weight ?? 0);
      rawMaterial.quantity = baseQuantity + Number(quantity);
      await rawMaterial.save();
      addActivity(
        req.user._id,
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

module.exports.createDailrate = async (req, res) => {
  const { date, rate } = req.body;
  try {
    if (!date || !rate) {
      return res.status(400).json({ message: "Date and rate are required" });
    }
    const existingRate = await DailrateModel.findOne({ date: new Date(date) });
    if (existingRate) {
      return res
        .status(400)
        .json({ message: "Rate for this date already exists" });
    }
    const newDailrate = new DailrateModel({
      date: new Date(date),
      rate,
    });
    await newDailrate.save();
    addActivity(req.user._id, "todaysRateAdded", ` todays rate Added.`);
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
        date: new Date(date), // Ensure date is stored as a Date object

        rate: {
          gold: {
            "24K": rate.gold["24K"],
            "23K": rate.gold["23K"],
            "22K": rate.gold["22K"],
            "20K": rate.gold["20K"],
            "18K": rate.gold["18K"],
          },
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

    addActivity(req.user._id, "updateDailrate", `Updated daily rate for date.`);

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
    firm,
    totalAmount,
    paymentMethod,
    paymentAmount,
    UdharAmount,
    udharAmount,
  } = req.body;
  console.log("Received sale data:", req.body); // Debug log

  try {
    if (
      !items ||
      !customer ||
      !firm ||
      !totalAmount ||
      !paymentMethod ||
      !paymentAmount
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Subtract value of stock and raw material
    for (const item of items) {
      if (item.saleType === "stock") {
        const stock = await StockModel.findById(item.salematerialId);
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
      } else {
        const rawMaterial = await RawMaterialModel.findById(
          item.salematerialId
        );
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
      }
    }

    // Atomically bump the firm's invoice counter so numbers are unique and
    // sequential per firm even under concurrent sale creation.
    const firmForInvoice = await FirmModel.findByIdAndUpdate(
      firm,
      { $inc: { lastInvoiceNumber: 1 } },
      { new: true }
    );
    const invoicePrefix = (firmForInvoice?.name || "INV")
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6) || "INV";
    const invoiceNumber = `${invoicePrefix}-${String(
      firmForInvoice?.lastInvoiceNumber || 1
    ).padStart(5, "0")}`;

    // Create Sale
    const newSale = new SaleModel({
      invoiceNumber,
      items,
      customer,
      firm,
      totalAmount,
      saleDate: new Date().toISOString().slice(0, 10),
      paymentMethod,
      udharAmount: UdharAmount || udharAmount || 0,
      paymentAmount,
    });
    await newSale.save();

    // Create Payment
    const payment = new PaymentModel({
      paymentType: paymentMethod,
      paymentRefrence: `PAY-${newSale._id}`,
      amount: paymentAmount,
      paymentDate: new Date().toISOString().slice(0, 10),
      sale: newSale._id,
      customer,
      firm,
    });
    await payment.save();

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
    const customerDoc = await CustomerModel.findById(customer);
    const CustomerName = customerDoc.name;
    addActivity(
      req.user._id,
      "sale",
      `Sale created for Customer : ${CustomerName} Product : ${items
        .map((item) => item.saleType.name)
        .join(
          ", "
        )} for Amount : ${totalAmount} Payment Method : ${paymentMethod} Payment Amount : ${paymentAmount} Udhar Amount : ${udharAmountValue} `
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
    const sales = await SaleModel.find({ removeAt: null })
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
    const sale = await SaleModel.findById(saleId);
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
    const sales = await SaleModel.find({ customer: customerId, removeAt: null })
      .populate("customer")
      .populate({ path: "firm", populate: { path: "owner", select: "name email" } })
      .populate("items.saleType", "name");
    res.status(200).json(sales);
  } catch (error) {
    console.error("Error fetching sales by customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getSaleByFirm = async (req, res) => {
  const { firmId } = req.query;
  try {
    const sales = await SaleModel.find({ firm: firmId, removeAt: null })
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
    const sales = await SaleModel.find({
      saleDate: new Date(date),
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
    const sales = await SaleModel.find({
      paymentMethod,
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
    const payments = await PaymentModel.find({ removeAt: null })
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
    const payments = await PaymentModel.find({
      customer: customerId,
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

module.exports.getPaymentByFirm = async (req, res) => {
  const { firmId } = req.query;
  try {
    const payments = await PaymentModel.find({
      firm: firmId,
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
    const payments = await PaymentModel.find({
      paymentDate: new Date(date),
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
    const payments = await PaymentModel.find({
      paymentType: paymentMethod,
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
    const udhar = await UdharModel.find({ removeAt: null })
      .populate("customer", "name email")
      .populate("firm", "name");
    res.status(200).json(udhar);
  } catch (error) {
    console.error("Error fetching udhar:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getUdharByCustomer = async (req, res) => {
  const { customerId } = req.query;
  try {
    const udhar = await UdharModel.find({
      customer: customerId,
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

module.exports.getUdharByFirm = async (req, res) => {
  const { firmId } = req.query;
  try {
    const udhar = await UdharModel.find({
      firm: firmId,
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
    const udhar = await UdharModel.find({
      createdAt: new Date(date),
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
    const udhar = await UdharModel.findById(udharId);
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
    const udharSetelments = await udharsetelmentModel
      .find({ removeAt: null })
      .populate("udhar", "amount")
      .populate("customer", "name email")
      .populate("firm", "name");
    res.status(200).json(udharSetelments);
  } catch (error) {
    console.error("Error fetching udhar setelments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.getUdharSetelmentByCustomer = async (req, res) => {
  const { customerId } = req.query;
  try {
    const udharSetelments = await udharsetelmentModel
      .find({
        customer: customerId,
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
    const udharSetelments = await udharsetelmentModel
      .find({
        paymentDate: date,
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
    firm,
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
    !firm ||
    !lastDateToTake ||
    !itemImage
  ) {
    return res.status(400).json({ message: "All fields (including item image) are required" });
  }
  try {
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
      firm,
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
    firm,
    lastDateToTake,
  } = req.body;

  if (!_id) {
    return res
      .status(400)
      .json({ message: "Girvi item ID is required for update." });
  }

  try {
    const gierviItem = await GirviModel.findById(_id);

    if (!gierviItem) {
      return res.status(404).json({ message: "Girvi item not found." });
    }

    // principalAmount and interestRate are fixed at creation time and are
    // intentionally not editable here — changing them after money has
    // changed hands would invalidate the loan's interest history.
    gierviItem.itemName = itemName;
    gierviItem.itemType = itemType;
    gierviItem.itemWeight = itemWeight;
    gierviItem.itemValue = itemValue;
    gierviItem.itemDescription = itemDescription;
    gierviItem.Customer = Customer;
    gierviItem.firm = firm;
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
    const gierviItems = await GirviModel.find({ removeAt: null })
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
    const gierviItem = await GirviModel.findById(girviItemId);

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
    const gierviItem = await GirviModel.findById(gierviItemId);
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
    const totalCustomers = await CustomerModel.countDocuments({
      removeAt: null,
    });
    
    // Fix: Calculate total sales revenue instead of count
    const totalSalesData = await SaleModel.aggregate([
      { $match: { removeAt: null } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]);
    const totalSalesRevenue = totalSalesData.length > 0 ? totalSalesData[0].totalRevenue : 0;
    
    // Also get the count of sales for reference
    const totalSalesCount = await SaleModel.countDocuments({ removeAt: null });
    
    const totalStocks = await StockModel.aggregate([
      { $match: { removeAt: null } },
      { $group: { _id: null, totalValue: { $sum: "$totalValue" } } },
    ]);
    const totalRawMaterials = await RawMaterialModel.aggregate([
      { $match: { removeAt: null } },
      { $group: { _id: null, totalWeight: { $sum: "$weight" } } },
    ]);
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
const addActivity = async (userId, activityType, description) => {
  try {
    const newActivity = new ActivityModel({
      userId,
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
//admins see everyone's activity; staff only ever see their own
module.exports.getRecentActivities = async (req, res) => {
  try {
    const filter = req.user.role?.toLowerCase() === "admin" ? {} : { userId: req.user._id };
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
//admins see everyone's activity; staff only ever see their own
module.exports.getAllActivities = async (req, res) => {
  try {
    const filter = req.user.role?.toLowerCase() === "admin" ? {} : { userId: req.user._id };
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
    const girviItem = await GirviModel.findById(girviId)
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

// Update Girvi with calculated interest (monthly cron job function)
module.exports.updateGirviInterestMonthly = async (req, res) => {
  try {
    const activeGirviItems = await GirviModel.find({
      status: 'active',
      removeAt: null
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

    const girviItem = await GirviModel.findById(girviId).populate('Customer', 'name email');
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
    const interestHistory = await GirviInterestModel.find({ girvi: girviId })
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
    const pendingInterests = await GirviInterestModel.find({ 
      status: 'pending',
      removeAt: null 
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

    const girviItem = await GirviModel.findById(girviId)
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
    const summary = await GirviModel.aggregate([
      { $match: { removeAt: null } },
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
      removeAt: null
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
async function buildFullExportWorkbook() {
    console.log('Starting Excel export...');
    const XLSX = require('xlsx');

    console.log('Fetching data from database...');
    // Fetch all data from database with simpler queries
    const customers = await CustomerModel.find({ removeAt: null }).lean();
    console.log(`Fetched ${customers.length} customers`);
    
    const sales = await SaleModel.find({ removeAt: null }).lean();
    console.log(`Fetched ${sales.length} sales`);
    
    const stocks = await StockModel.find({ removeAt: null }).lean();
    console.log(`Fetched ${stocks.length} stocks`);
    
    const rawMaterials = await RawMaterialModel.find({ removeAt: null }).lean();
    console.log(`Fetched ${rawMaterials.length} raw materials`);
    
    const payments = await PaymentModel.find({ removeAt: null }).lean();
    console.log(`Fetched ${payments.length} payments`);
    
    const udhar = await UdharModel.find({ removeAt: null }).lean();
    console.log(`Fetched ${udhar.length} udhar records`);
    
    const girvi = await GirviModel.find({ removeAt: null }).lean();
    console.log(`Fetched ${girvi.length} girvi records`);
    
    const girviInterest = await GirviInterestModel.find().lean();
    console.log(`Fetched ${girviInterest.length} girvi interest records`);
    
    const firms = await FirmModel.find({ removeAt: null }).lean();
    console.log(`Fetched ${firms.length} firms`);
    
    const users = await UserModel.find({ removeAt: null }).select('-password').lean();
    console.log(`Fetched ${users.length} users`);
    
    const categories = await StockCategoryModel.find({ removeAt: null }).lean();
    console.log(`Fetched ${categories.length} categories`);
    
    const dailRates = await DailrateModel.find().lean();
    console.log(`Fetched ${dailRates.length} daily rates`);
    
    const udharSettlements = await udharsetelmentModel.find({ removeAt: null }).lean();
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
    const excelBuffer = await buildFullExportWorkbook();

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
