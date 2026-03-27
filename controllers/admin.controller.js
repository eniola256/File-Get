import User from "../models/User.js";

// GET /api/admin/users
// Returns all users except the requesting admin
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    return next(err);
  }
};

// POST /api/admin/users/:id/approve
// If suspended: unsuspends the user.
// If pending: promotes to rep.
export const approveUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Unsuspend flow
    if (user.suspended) {
      user.suspended = false;
      user.suspendedAt = undefined;
      user.suspendedReason = undefined;
      user.suspendedBy = undefined;
      await user.save();
      return res.json({ success: true, message: "User unsuspended", user });
    }

    // Approve pending rep flow
    if (user.role !== "pending") {
      return res.status(400).json({
        success: false,
        message: `User has role '${user.role}' — only pending reps can be approved`,
      });
    }

    user.role = "rep";
    await user.save();

    return res.json({ success: true, message: "Rep approved successfully", user });
  } catch (err) {
    return next(err);
  }
};

// POST /api/admin/users/:id/suspend
// Suspends any non-admin user with optional reason
export const suspendUser = async (req, res, next) => {
  try {
    const { reason } = req.body || {};

    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Cannot suspend an admin" });
    }

    if (user.suspended) {
      return res
        .status(400)
        .json({ success: false, message: "User is already suspended" });
    }

    user.suspended = true;
    user.suspendedAt = new Date();
    user.suspendedReason = reason || "Suspended by admin";
    user.suspendedBy = "admin";
    await user.save();

    return res.json({ success: true, message: "User suspended", user });
  } catch (err) {
    return next(err);
  }
};

// POST /api/admin/users/:id/reject
// Rejects a pending rep — deletes the account entirely
export const rejectRep = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending rep accounts can be rejected",
      });
    }

    await user.deleteOne();

    return res.json({ success: true, message: "Pending rep rejected and removed" });
  } catch (err) {
    return next(err);
  }
};

// DELETE /api/admin/users/:id
// Permanently removes any non-admin user from the platform
export const removeUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Cannot remove an admin" });
    }

    await user.deleteOne();

    return res.json({ success: true, message: "User removed from platform" });
  } catch (err) {
    return next(err);
  }
};

