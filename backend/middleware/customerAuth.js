import Customer from "../models/Customer.js";
import { verifyCustomerToken } from "../utils/tokens.js";

export const protectCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      res.status(401);
      throw new Error("Authentication required.");
    }

    const decoded = verifyCustomerToken(token);
    const customer = await Customer.findById(decoded.id).select("-password -refreshToken -refreshTokenHistory -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires");

    if (!customer || customer.deletedAt) {
      res.status(401);
      throw new Error("Account not found.");
    }

    req.customer = customer;
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

export const optionalCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    if (token) {
      const decoded = verifyCustomerToken(token);
      const customer = await Customer.findById(decoded.id).select("-password -refreshToken -refreshTokenHistory -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires");
      if (customer && !customer.deletedAt) req.customer = customer;
    }
  } catch {}
  next();
};
