const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Cloudinary is durable, CDN-backed storage -- unlike writing to local disk,
// uploaded files survive server restarts/redeploys. This was always the
// intended storage backend: every consumer of an uploaded file's stored
// path already special-cases and passes a Cloudinary URL through unchanged
// (Controllers/adminController.js's getRelativeFilePath, the web app's
// src/utils/imageUtils.js, Flutter's resolveUploadUrl in
// lib/core/api/api_client.dart). At some point this was swapped for plain
// multer.diskStorage writing into Backend/Uploads/ and never switched back
// -- on Render (and most PaaS hosts), the filesystem is EPHEMERAL, so every
// uploaded image (firm logos/stamps/signatures, stock/category/raw-material/
// girvi images) was being silently wiped on every deploy or restart, which
// is why images across the whole app were 404ing.
cloudinary.config({
  cloud_name: process.env.Cloudnary_CLOUD_NAME,
  api_key: process.env.Cloudnary_API_KEY,
  api_secret: process.env.Cloudnary_API_SECRET,
});

// Map fieldnames to Cloudinary folders -- must stay in sync with the field
// names each upload route actually sends (see upload.fields(...)/
// upload.single(...) calls in Routes/AdminRoutes.js).
const fieldToFolder = {
  logo: "firm",
  firmStamp: "firm",
  ownerSignature: "firm",
  secondLogo: "firm",
  CategoryImg: "category",
  stockImg: "stock",
  rawMaterial: "rawMaterial",
  rawmaterialImg: "rawMaterial",
  girviItemImg: "girviItem",
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const folder = fieldToFolder[file.fieldname] || "others";
    // Deliberately NOT derived from file.originalname -- an uploaded
    // filename is arbitrary client input. Phone-exported names in
    // particular (e.g. "WhatsApp Image 2026-08-14 at 2.46.51 PM.jpeg")
    // carry spaces and locale-specific Unicode space characters that, once
    // embedded in a stored path and later URL-encoded for display, produced
    // mangled/broken image URLs. A random, collision-free id sidesteps
    // that whole class of bug.
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    return {
      folder,
      public_id: `${file.fieldname}-${uniqueSuffix}`,
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images only -- check the extension, not just the declared
    // mimetype (a client can lie about Content-Type, but Cloudinary's own
    // allowed_formats above is the real backstop either way).
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = (file.originalname.split(".").pop() || "").toLowerCase();
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && allowedTypes.test(ext)) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

module.exports = { upload, cloudinary };
