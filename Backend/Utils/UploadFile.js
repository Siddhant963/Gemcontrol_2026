// const express = require("express");
// const multer = require("multer");
// const cloudinary = require("cloudinary").v2;
// const { CloudinaryStorage } = require("multer-storage-cloudinary");

// const router = express.Router();

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.Cloudnary_CLOUD_NAME,
//   api_key: process.env.Cloudnary_API_KEY,
//   api_secret: process.env.Cloudnary_API_SECRET,
// });

// // Map fieldnames to Cloudinary folders
// const fieldToDir = {
//   logo: "firm",
//   CategoryImg: "category",
//   stockImg: "stock",
//   rawMaterialImg: "rawMaterial",
//   girviItemImg: "girviItem",
// };

// // Configure Cloudinary Storage
// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: async (req, file) => {
//     // Determine folder based on fieldname
//     const folder = fieldToDir[file.fieldname] || "others";

//     // Generate unique filename
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     const publicId = `${file.fieldname}-${uniqueSuffix}`;

//     // Store the relative path for later use (Cloudinary format)
//     // NOTE: Don't include folder in publicId, it's separate
//     req.uploadedFileRelativePath = `${folder}/${publicId}`;

//     return {
//       folder: folder,
//       public_id: publicId,
//       resource_type: "auto", // Automatically detect file type
//       allowed_formats: ["jpg", "jpeg", "png", "gif", "pdf", "webp"], // Adjust as needed
//     };
//   },
// });

// const upload = multer({ storage: storage });

// module.exports = { upload, cloudinary };

const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Get upload path from environment or use default inside Backend/Uploads
const uploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../Uploads');

// Map fieldnames to folders
const fieldToFolder = {
  logo: 'firm',
  firmStamp: 'firm',
  ownerSignature: 'firm',
  secondLogo: 'firm',
  CategoryImg: 'category',
  stockImg: 'stock',
  rawMaterial: 'rawMaterial',
  rawmaterialImg: 'rawMaterial',
  girviItemImg: 'girviItem',
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine folder based on fieldname
    const folder = fieldToFolder[file.fieldname] || 'others';
    const dest = path.join(uploadPath, folder);
    
    // Ensure directory exists
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images only
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

module.exports = { upload };