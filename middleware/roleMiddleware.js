export default function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) {
      return res.status(401).json({ error: "Not authorized" });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
}

export const requireRole = (...allowedRoles) => roleMiddleware(...allowedRoles);
