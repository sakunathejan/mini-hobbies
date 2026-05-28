import crypto from "crypto";
import Customer from "../models/Customer.js";
import LoginHistory from "../models/LoginHistory.js";
import asyncHandler from "../utils/asyncHandler.js";
import { enqueue } from "../utils/jobQueue.js";
import { generateCustomerAccessToken, generateRefreshToken, createPasswordResetToken, createEmailVerificationToken } from "../utils/tokens.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/customers/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const setRefreshCookie = (res, token) => {
  res.cookie("customerRefreshToken", token, COOKIE_OPTIONS);
};

const sendAuthResponse = async (res, customer, statusCode = 200) => {
  const refreshToken = generateRefreshToken();
  customer.refreshToken = refreshToken;
  await customer.save();
  setRefreshCookie(res, refreshToken);
  res.status(statusCode).json({
    token: generateCustomerAccessToken(customer._id),
    customer: customer.toPublicProfile(),
  });
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existing = await Customer.findOne({ email: email.toLowerCase().trim(), deletedAt: null });
  if (existing) {
    res.status(409);
    throw new Error("An account with this email already exists.");
  }

  const { raw, hashed, expiresAt } = createEmailVerificationToken();

  const customer = await Customer.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    phone: phone || "",
    emailVerificationToken: hashed,
    emailVerificationExpires: expiresAt,
  });

  enqueue("customer-welcome-email", async () => {
    const { sendCustomerWelcomeEmail } = await import("../services/emailService.js");
    await sendCustomerWelcomeEmail(customer, raw);
  });

  await sendAuthResponse(res, customer, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required.");
  }

  const customer = await Customer.findOne({ email: email.toLowerCase().trim(), deletedAt: null });

  if (!customer) {
    LoginHistory.create({
      ip: req.ip,
      device: req.get("user-agent")?.slice(0, 255) || "",
      userAgent: req.get("user-agent")?.slice(0, 500) || "",
      success: false,
      failureReason: "account_not_found",
    }).catch(() => {});
    res.status(401);
    throw new Error("Invalid email or password.");
  }



  if (customer.isLocked()) {
    LoginHistory.create({
      customer: customer._id,
      ip: req.ip,
      device: req.get("user-agent")?.slice(0, 255) || "",
      userAgent: req.get("user-agent")?.slice(0, 500) || "",
      success: false,
      failureReason: "account_locked",
    }).catch(() => {});
    res.status(429);
    res.status(429);
    throw new Error("Account temporarily locked. Try again in 15 minutes.");
  }

  const isMatch = await customer.matchPassword(password);
  if (!isMatch) {
    await customer.incrementLoginAttempts();
    LoginHistory.create({
      customer: customer._id,
      ip: req.ip,
      device: req.get("user-agent")?.slice(0, 255) || "",
      userAgent: req.get("user-agent")?.slice(0, 500) || "",
      success: false,
      failureReason: "invalid_password",
    }).catch(() => {});
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  customer.resetLoginAttempts();
  customer.lastLoginIp = req.ip;
  customer.lastLoginAt = new Date();
  customer.lastLoginDevice = req.get("user-agent")?.slice(0, 255) || "";

  LoginHistory.create({
    customer: customer._id,
    ip: req.ip,
    device: req.get("user-agent")?.slice(0, 255) || "",
    userAgent: req.get("user-agent")?.slice(0, 500) || "",
    success: true,
  }).catch(() => {});

  await sendAuthResponse(res, customer);
});

export const refreshCustomerToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.customerRefreshToken;

  if (!token) {
    res.status(401);
    throw new Error("Session expired. Please log in again.");
  }

  const customer = await Customer.findOne({ refreshToken: token, deletedAt: null });

  if (!customer) {
    res.status(401);
    throw new Error("Invalid session. Please log in again.");
  }

  await sendAuthResponse(res, customer);
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.customerRefreshToken;
  if (token) {
    await Customer.updateOne({ refreshToken: token }, { $set: { refreshToken: null } });
  }
  res.clearCookie("customerRefreshToken", { path: "/api/customers/auth" });
  res.json({ message: "Logged out successfully." });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    res.status(400);
    throw new Error("Verification token is required.");
  }

  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  const customer = await Customer.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: Date.now() },
    deletedAt: null,
  });

  if (!customer) {
    res.status(400);
    throw new Error("Invalid or expired verification token.");
  }

  customer.emailVerified = true;
  customer.emailVerifiedAt = new Date();
  customer.emailVerificationToken = undefined;
  customer.emailVerificationExpires = undefined;
  await customer.save();

  res.json({ message: "Email verified successfully." });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const customer = req.customer;

  if (customer.emailVerified) {
    res.status(400);
    throw new Error("Email is already verified.");
  }

  const { raw, hashed, expiresAt } = createEmailVerificationToken();
  customer.emailVerificationToken = hashed;
  customer.emailVerificationExpires = expiresAt;
  await customer.save();

  enqueue("customer-verification-email", async () => {
    const { sendCustomerVerificationEmail } = await import("../services/emailService.js");
    await sendCustomerVerificationEmail(customer, raw);
  });

  res.json({ message: "Verification email sent." });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error("Email is required.");
  }

  const customer = await Customer.findOne({ email: email.toLowerCase().trim(), deletedAt: null });
  if (!customer) {
    res.json({ message: "If the email exists, a reset link has been sent." });
    return;
  }

  const { raw, hashed, expiresAt } = createPasswordResetToken();
  customer.passwordResetToken = hashed;
  customer.passwordResetExpires = expiresAt;
  await customer.save();

  enqueue("customer-password-reset-email", async () => {
    const { sendCustomerPasswordResetEmail } = await import("../services/emailService.js");
    await sendCustomerPasswordResetEmail(customer, raw);
  });

  res.json({ message: "If the email exists, a reset link has been sent." });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    res.status(400);
    throw new Error("Token and password are required.");
  }

  const hashed = crypto.createHash("sha256").update(token).digest("hex");

  const customer = await Customer.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
    deletedAt: null,
  });

  if (!customer) {
    res.status(400);
    throw new Error("Invalid or expired reset token.");
  }

  customer.password = password;
  customer.passwordResetToken = undefined;
  customer.passwordResetExpires = undefined;
  customer.refreshToken = null;
  await customer.save();

  res.json({ message: "Password reset successful. Please log in." });
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json(req.customer.toPublicProfile());
});

export const updateProfile = asyncHandler(async (req, res) => {
  const customer = req.customer;
  const { name, phone, avatar } = req.body;

  if (name !== undefined) customer.name = name.trim();
  if (phone !== undefined) customer.phone = phone.trim();
  if (avatar !== undefined) customer.avatar = avatar;

  await customer.save();
  res.json(customer.toPublicProfile());
});

export const changePassword = asyncHandler(async (req, res) => {
  const customer = req.customer;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Current password and new password are required.");
  }

  const isMatch = await customer.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(400);
    throw new Error("Current password is incorrect.");
  }

  customer.password = newPassword;
  customer.refreshToken = null;
  await customer.save();

  res.json({ message: "Password changed successfully. Please log in again." });
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const customer = req.customer;
  const { emailNotifications, marketingEmails } = req.body;

  if (emailNotifications !== undefined) customer.preferences.emailNotifications = emailNotifications;
  if (marketingEmails !== undefined) customer.preferences.marketingEmails = marketingEmails;

  await customer.save();
  res.json(customer.toPublicProfile());
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const customer = req.customer;
  const { password } = req.body;

  if (!password) {
    res.status(400);
    throw new Error("Password is required to delete your account.");
  }

  const isMatch = await customer.matchPassword(password);
  if (!isMatch) {
    res.status(400);
    throw new Error("Password is incorrect.");
  }

  customer.deletedAt = new Date();
  customer.refreshToken = null;
  customer.email = `deleted_${customer._id}@minihobbies.lk`;
  await customer.save();

  res.clearCookie("customerRefreshToken", { path: "/api/customers/auth" });
  res.json({ message: "Account deleted successfully." });
});

// --- Addresses ---
export const getAddresses = asyncHandler(async (req, res) => {
  res.json(req.customer.addresses || []);
});

export const addAddress = asyncHandler(async (req, res) => {
  const customer = req.customer;
  const { label, fullName, phone, addressLine, city, district, isDefault } = req.body;

  if (!fullName || !phone || !addressLine || !city || !district) {
    res.status(400);
    throw new Error("All address fields are required.");
  }

  if (isDefault) {
    customer.addresses.forEach((a) => { a.isDefault = false; });
  }

  customer.addresses.push({ label, fullName, phone, addressLine, city, district, isDefault: !!isDefault });
  await customer.save();

  res.status(201).json(customer.addresses);
});

export const updateAddress = asyncHandler(async (req, res) => {
  const customer = req.customer;
  const addressId = req.params.addressId;
  const updates = req.body;

  const address = customer.addresses.id(addressId);
  if (!address) {
    res.status(404);
    throw new Error("Address not found.");
  }

  if (updates.isDefault) {
    customer.addresses.forEach((a) => { a.isDefault = false; });
  }

  Object.assign(address, updates);
  await customer.save();

  res.json(customer.addresses);
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const customer = req.customer;
  const addressId = req.params.addressId;

  const address = customer.addresses.id(addressId);
  if (!address) {
    res.status(404);
    throw new Error("Address not found.");
  }

  address.deleteOne();
  await customer.save();

  res.json(customer.addresses);
});
