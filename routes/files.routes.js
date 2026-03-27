import express from "express";

import {
  deleteFile,
  getAllFiles,
  getMyFiles,
  uploadTextbook,
} from "../controllers/files.controller.js";
import { uploadFile } from "../config/cloudinary.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Browse all textbooks — any authenticated user
router.get("/", authenticate, getAllFiles);

// Rep's own uploaded files — rep only
// Note: /my must be defined before /:id if you later add GET /:id
router.get("/my", authenticate, requireRole("rep"), getMyFiles);

// Upload a textbook — rep only
router.post("/", authenticate, requireRole("rep"), uploadFile.single("file"), uploadTextbook);

// Delete a file — rep (own files) or admin (any file)
router.delete("/:id", authenticate, requireRole("rep", "admin"), deleteFile);

export default router;
