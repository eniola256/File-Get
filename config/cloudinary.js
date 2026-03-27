import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Textbook uploads use memoryStorage so `req.file.buffer` is available
// for SHA-256 hashing before we manually push to Cloudinary.
export const uploadFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      return cb(null, true);
    }

    const err = new Error("Only PDF files are allowed");
    err.statusCode = 400;
    return cb(err, false);
  },
});

// Storage for payment receipt images
const receiptStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "receipts",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

export const uploadReceipt = multer({
  storage: receiptStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      return cb(null, true);
    }

    const err = new Error("Only JPG, PNG, or WEBP images are allowed");
    err.statusCode = 400;
    return cb(err, false);
  },
});
export default cloudinary;
