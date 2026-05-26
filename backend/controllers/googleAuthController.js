import crypto from "crypto";
import Customer from "../models/Customer.js";
import LoginHistory from "../models/LoginHistory.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateCustomerAccessToken, generateRefreshToken } from "../utils/tokens.js";

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

export const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    res.status(400);
    throw new Error("Google credential is required.");
  }

  let payload;
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      res.status(401);
      throw new Error("Invalid Google credential.");
    }

    payload = await response.json();
  } catch (err) {
    if (err.message === "Invalid Google credential.") throw err;
    res.status(502);
    throw new Error("Failed to verify Google credential. Please try again.");
  }

  const expectedAudience = process.env.GOOGLE_CLIENT_ID;
  if (payload.aud !== expectedAudience) {
    res.status(401);
    throw new Error("Invalid token audience.");
  }

  if (payload.iss !== "accounts.google.com" && payload.iss !== "https://accounts.google.com") {
    res.status(401);
    throw new Error("Invalid token issuer.");
  }

  if (payload.exp * 1000 < Date.now()) {
    res.status(401);
    throw new Error("Google credential has expired.");
  }

  const { sub: googleId, email, name, picture } = payload;

  if (!email) {
    res.status(400);
    throw new Error("Google account must have a verified email address.");
  }

  if (!payload.email_verified) {
    res.status(400);
    throw new Error("Google account email must be verified.");
  }

  const normalizedEmail = email.toLowerCase();

  let customer = await Customer.findOne({
    $or: [
      { googleId },
      { email: normalizedEmail },
    ],
    deletedAt: null,
  });

  const isNew = !customer;

  if (customer) {
    if (customer.googleId && customer.googleId !== googleId) {
      res.status(409);
      throw new Error("This Google account is already linked to another account.");
    }

    if (!customer.googleId) {
      customer.googleId = googleId;
      customer.authProvider = customer.authProvider === "local" ? "both" : customer.authProvider;
    }

    if (!customer.emailVerified) {
      customer.emailVerified = true;
      customer.emailVerifiedAt = new Date();
    }

    customer.lastLoginIp = req.ip;
    customer.lastLoginAt = new Date();
    customer.lastLoginDevice = req.get("user-agent")?.slice(0, 255) || "";
  } else {
    customer = new Customer({
      name,
      email: normalizedEmail,
      password: crypto.randomBytes(48).toString("hex"),
      emailVerified: true,
      emailVerifiedAt: new Date(),
      googleId,
      authProvider: "google",
      avatar: picture || "",
      lastLoginIp: req.ip,
      lastLoginAt: new Date(),
      lastLoginDevice: req.get("user-agent")?.slice(0, 255) || "",
    });
  }

  LoginHistory.create({
    customer: customer._id,
    ip: req.ip,
    device: req.get("user-agent")?.slice(0, 255) || "",
    userAgent: req.get("user-agent")?.slice(0, 500) || "",
    success: true,
  }).catch(() => {});

  await sendAuthResponse(res, customer, isNew ? 201 : 200);
});
