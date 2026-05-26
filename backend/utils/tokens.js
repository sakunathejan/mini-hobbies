import crypto from "crypto";
import jwt from "jsonwebtoken";

const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

export const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRY });

export const generateRefreshToken = () =>
  crypto.randomBytes(40).toString("hex");

export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);

export const createPasswordResetToken = () => {
  const raw = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hashed, expiresAt: Date.now() + 60 * 60 * 1000 };
};

export const createEmailVerificationToken = () => {
  const raw = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hashed, expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
};

export const generateCustomerAccessToken = (customerId) =>
  jwt.sign({ id: customerId, type: "customer" }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRY });

export const verifyCustomerToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type !== "customer") throw new Error("Invalid token type.");
  return decoded;
};
