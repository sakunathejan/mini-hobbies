import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { verifyAccessToken } from "../utils/tokens.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      res.status(401);
      throw new Error("Authentication required.");
    }

    const decoded = verifyAccessToken(token);
    req.user = await User.findById(decoded.id).select("-password -refreshToken -twoFactorSecret -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires");

    if (!req.user) {
      res.status(401);
      throw new Error("User not found.");
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.status(401);
      return next(new Error("Token expired. Refresh required."));
    }
    if (error.name === "JsonWebTokenError") {
      res.status(401);
      return next(new Error("Invalid token."));
    }
    next(error);
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    res.status(403);
    throw new Error("Admin access required.");
  }
  next();
};

export const auditLog = (action, resource) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode < 400) {
        AuditLog.create({
          admin: req.user?._id,
          action,
          resource,
          resourceId: req.params?.id || body?._id || body?.order?._id || null,
          details: { method: req.method, path: req.originalUrl },
          ip: req.ip,
          userAgent: req.get("user-agent")?.slice(0, 255)
        }).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
};
