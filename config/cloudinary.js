import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Both textbooks and receipts use memoryStorage so `req.file.buffer` is available:
// - Textbooks: SHA-256 hashing before upload
// - Receipts: image hash + EXIF/visual checks before upload
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

export const uploadReceipt = multer({
  storage: multer.memoryStorage(),
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

export const streamToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });

    stream.end(buffer);
  });

export default cloudinary;
