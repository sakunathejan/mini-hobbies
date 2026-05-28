import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import { generateAccessToken, generateRefreshToken, createPasswordResetToken } from "../utils/tokens.js";
import { COOKIE_OPTIONS } from "../utils/sanitize.js";
import User from "../models/User.js";

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, COOKIE_OPTIONS);
};

export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required.");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials.");
  }

  if (user.role !== "admin") {
    res.status(403);
    throw new Error("Access denied.");
  }

  if (user.isLocked()) {
    res.status(429);
    throw new Error("Account locked. Try again in 15 minutes.");
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    res.status(401);
    throw new Error("Invalid credentials.");
  }

  user.resetLoginAttempts();
  user.lastLoginIp = req.ip;
  user.lastLoginAt = new Date();
  const refreshToken = generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save();

  setRefreshCookie(res, refreshToken);

  res.json({
    token: generateAccessToken(user._id),
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    res.status(401);
    throw new Error("Refresh token missing.");
  }

  const user = await User.findOne({ refreshToken: token });

  if (!user) {
    res.status(401);
    throw new Error("Invalid refresh token.");
  }

  const newRefresh = generateRefreshToken();
  user.refreshToken = newRefresh;
  user.lastLoginIp = req.ip;
  user.lastLoginAt = new Date();
  await user.save();

  setRefreshCookie(res, newRefresh);

  res.json({
    token: generateAccessToken(user._id),
    refreshToken: newRefresh,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await User.updateOne({ refreshToken: token }, { $set: { refreshToken: null } });
  }
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.json({ message: "Logged out." });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

export const updateAdminProfile = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user._id);
  if (!admin) {
    res.status(404);
    throw new Error("Admin not found.");
  }

  const { name, email, currentPassword, newPassword } = req.body;

  if (name) admin.name = name.trim();

  if (email && email.toLowerCase() !== admin.email) {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409);
      throw new Error("Email already in use.");
    }
    admin.email = email.toLowerCase().trim();
  }

  if (currentPassword && newPassword) {
    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(400);
      throw new Error("Current password is incorrect.");
    }
    if (newPassword.length < 8) {
      res.status(400);
      throw new Error("New password must be at least 8 characters.");
    }
    admin.password = newPassword;
  }

  await admin.save();

  const refreshToken = generateRefreshToken();
  admin.refreshToken = refreshToken;
  await admin.save();
  setRefreshCookie(res, refreshToken);

  res.json({
    token: generateAccessToken(admin._id),
    user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error("Email is required.");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    res.json({ message: "If the email exists, a reset link has been sent." });
    return;
  }

  const { raw, hashed, expiresAt } = createPasswordResetToken();
  user.passwordResetToken = hashed;
  user.passwordResetExpires = expiresAt;
  await user.save();

  const { sendPasswordResetEmail } = await import("../services/emailService.js");
  try {
    await sendPasswordResetEmail(user, raw);
  } catch {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.status(500);
    throw new Error("Could not send reset email. Try again later.");
  }

  res.json({ message: "If the email exists, a reset link has been sent." });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    res.status(400);
    throw new Error("Token and password are required.");
  }

  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired reset token.");
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken = null;
  await user.save();

  res.json({ message: "Password reset successful. Please log in." });
});
