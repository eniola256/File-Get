import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";

function sanitizeUser(userDoc) {
  return {
    id: userDoc._id,
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role,
    suspended: userDoc.suspended,
  };
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
    });

    const token = signToken({ id: user._id, role: user.role });
    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Email already in use" });
    }
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken({ id: user._id, role: user.role });
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    return next(err);
  }
}

export async function me(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return next(err);
  }
}
