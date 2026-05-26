import crypto from "crypto";
import User from "../models/User.js";
import Customer from "../models/Customer.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateAccessToken, generateRefreshToken, generateCustomerAccessToken, createPasswordResetToken } from "../utils/tokens.js";
import { COOKIE_OPTIONS } from "../utils/sanitize.js";
import { enqueue } from "../utils/jobQueue.js";

const setRefreshCookie = (res, token, role) => {
  const path = role === "admin" ? "/api/auth" : "/api/customers/auth";
  const name = role === "admin" ? "refreshToken" : "customerRefreshToken";
  res.cookie(name, token, { ...COOKIE_OPTIONS, path });
};

export const unifiedLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select("+password +refreshToken +loginAttempts +lockUntil");
  if (user && user.role === "admin") {
    if (user.isLocked()) {
      res.status(429);
      throw new Error("Account temporarily locked. Try again in 15 minutes.");
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      res.status(401);
      throw new Error("Invalid email or password.");
    }
    await user.resetLoginAttempts();

    const refreshToken = generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setRefreshCookie(res, refreshToken, "admin");
    const token = generateAccessToken(user._id);

    return res.json({
      token,
      role: "admin",
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  }

  const customer = await Customer.findOne({ email: normalizedEmail, deletedAt: null }).select("+password +refreshToken +loginAttempts +lockUntil");
  if (customer) {
    if (customer.isLocked()) {
      res.status(429);
      throw new Error("Account temporarily locked. Try again in 15 minutes.");
    }
    const isMatch = await customer.matchPassword(password);
    if (!isMatch) {
      await customer.incrementLoginAttempts();
      res.status(401);
      throw new Error("Invalid email or password.");
    }
    await customer.resetLoginAttempts();

    customer.lastLoginIp = req.ip;
    customer.lastLoginAt = new Date();
    customer.lastLoginDevice = (req.headers["user-agent"] || "").slice(0, 255);

    const refreshToken = generateRefreshToken();
    customer.refreshToken = refreshToken;
    await customer.save({ validateBeforeSave: false });

    setRefreshCookie(res, refreshToken, "customer");
    const token = generateCustomerAccessToken(customer._id);

    return res.json({
      token,
      role: "customer",
      user: customer.toPublicProfile()
    });
  }

  res.status(401);
  throw new Error("Invalid email or password.");
});

export const unifiedLogout = asyncHandler(async (req, res) => {
  const adminToken = req.cookies.refreshToken;
  const customerToken = req.cookies.customerRefreshToken;

  if (adminToken) {
    await User.findOneAndUpdate({ refreshToken: adminToken }, { refreshToken: null });
  }
  if (customerToken) {
    await Customer.findOneAndUpdate({ refreshToken: customerToken, deletedAt: null }, { refreshToken: null });
  }

  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.clearCookie("customerRefreshToken", { path: "/api/customers/auth" });
  res.json({ message: "Logged out." });
});

export const unifiedForgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (user && user.role === "admin") {
    const { raw, hashed, expiresAt } = createPasswordResetToken();
    user.passwordResetToken = hashed;
    user.passwordResetExpires = expiresAt;
    await user.save({ validateBeforeSave: false });

    enqueue("admin-password-reset-email", async () => {
      const { sendPasswordResetEmail } = await import("../services/emailService.js");
      await sendPasswordResetEmail(user, raw);
    });
  }

  const customer = await Customer.findOne({ email: normalizedEmail, deletedAt: null });
  if (customer) {
    const { raw, hashed, expiresAt } = createPasswordResetToken();
    customer.passwordResetToken = hashed;
    customer.passwordResetExpires = expiresAt;
    await customer.save({ validateBeforeSave: false });

    enqueue("customer-password-reset-email", async () => {
      const { sendCustomerPasswordResetEmail } = await import("../services/emailService.js");
      await sendCustomerPasswordResetEmail(customer, raw);
    });
  }

  res.json({ message: "If an account with that email exists, a password reset link has been sent." });
});

export const unifiedResetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (user) {
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = null;
    await user.save();
    return res.json({ message: "Password reset successful." });
  }

  const customer = await Customer.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
    deletedAt: null
  });

  if (customer) {
    customer.password = password;
    customer.passwordResetToken = undefined;
    customer.passwordResetExpires = undefined;
    customer.refreshToken = null;
    await customer.save();
    return res.json({ message: "Password reset successful." });
  }

  res.status(400);
  throw new Error("Invalid or expired reset token.");
});
