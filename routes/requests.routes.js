import express from "express";

import { getMyRequests, submitRequest } from "../controllers/requests.controller.js";
import { uploadReceipt } from "../config/cloudinary.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  requireRole("student"),
  uploadReceipt.single("receipt"),
  submitRequest,
);

router.get("/my", authenticate, requireRole("student"), getMyRequests);

export default router;

