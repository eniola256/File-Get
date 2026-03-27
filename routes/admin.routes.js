import express from "express";

import {
  approveUser,
  getAllUsers,
  rejectRep,
  removeUser,
  suspendUser,
} from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All admin routes require a valid JWT + admin role
router.use(authenticate, requireRole("admin"));

router.get("/users", getAllUsers);
router.post("/users/:id/approve", approveUser);
router.post("/users/:id/suspend", suspendUser);
router.post("/users/:id/reject", rejectRep);
router.delete("/users/:id", removeUser);

export default router;

