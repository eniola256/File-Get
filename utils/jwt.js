import jwt from "jsonwebtoken";

export function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === "") {
    const err = new Error("Missing JWT_SECRET");
    err.statusCode = 500;
    throw err;
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

