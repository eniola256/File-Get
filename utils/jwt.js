import jwt from "jsonwebtoken";

function requireJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === "") {
    const err = new Error("Missing JWT_SECRET");
    err.statusCode = 500;
    throw err;
  }
  return secret;
}

export function signToken(payload) {
  const secret = requireJwtSecret();

  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token) {
  const secret = requireJwtSecret();
  return jwt.verify(token, secret);
}
