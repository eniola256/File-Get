import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for textbook files (PDFs)
const fileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "textbooks",
    resource_type: "raw", // required for non-image files like PDFs
    allowed_formats: ["pdf"],
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

export const uploadFile = multer({ storage: fileStorage });
export const uploadReceipt = multer({ storage: receiptStorage });
export default cloudinary;

