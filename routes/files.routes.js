import express from "express";

import { uploadFile } from "../config/cloudinary.js";
import { uploadTextbook, listFiles, getFileById } from "../controllers/file.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public listing (adjust later if you want this protected)
router.get("/", listFiles);
router.get("/:id", getFileById);

// Textbook upload (PDF) - reps only
router.post(
  "/upload",
  authMiddleware,
  roleMiddleware("rep"),
  uploadFile.single("file"),
  uploadTextbook,
);

// Backwards compatible alias: POST /api/files
router.post(
  "/",
  authMiddleware,
  roleMiddleware("rep"),
  uploadFile.single("file"),
  uploadTextbook,
);

export default router;

