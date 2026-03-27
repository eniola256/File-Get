import User from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";

export default async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const userId = decoded?.id || decoded?._id;
    if (!userId) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (user.suspended) {
      return res.status(403).json({
        message: "Your account has been suspended. Contact your administrator.",
      });
    }

    req.user = user;
    return next();
  } catch (err) {
    const statusCode =
      Number.isInteger(err?.statusCode) && err.statusCode >= 400
        ? err.statusCode
        : 401;

    const message =
      statusCode === 500
        ? "Server misconfigured"
        : "Invalid or expired token";

    return res.status(statusCode).json({ message });
  }
}

export const authenticate = authMiddleware;
