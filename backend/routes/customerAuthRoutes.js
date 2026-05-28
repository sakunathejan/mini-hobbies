import express from "express";
import { body } from "express-validator";
import { protectCustomer, identifyCustomer } from "../middleware/customerAuth.js";
import { requireActiveAccount } from "../moderation-system/middleware/enforcement.js";
import { validateRequest, PASSWORD_VALIDATOR } from "../middleware/validateRequest.js";
import {
  register, login, refreshCustomerToken, logout,
  verifyEmail, resendVerification,
  forgotPassword, resetPassword,
  getProfile, updateProfile, changePassword, updatePreferences, deleteAccount,
  getAddresses, addAddress, updateAddress, deleteAddress,
} from "../controllers/customerAuthController.js";
import { googleAuth } from "../controllers/googleAuthController.js";
import { getMyOrders, getMyOrder } from "../controllers/customerOrderController.js";

const router = express.Router();

router.post(
  "/auth/register",
  [
    body("name").trim().isLength({ min: 1, max: 100 }).withMessage("Name is required."),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
    body("password").custom(PASSWORD_VALIDATOR),
    body("phone").optional().trim(),
  ],
  validateRequest,
  register
);

router.post(
  "/auth/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  validateRequest,
  login
);

router.post("/auth/google", googleAuth);
router.post("/auth/refresh", refreshCustomerToken);
router.post("/auth/logout", logout);

router.get("/auth/verify-email/:token", verifyEmail);

router.post(
  "/auth/resend-verification",
  protectCustomer, requireActiveAccount,
  resendVerification
);

router.post(
  "/auth/forgot-password",
  [body("email").isEmail().normalizeEmail()],
  validateRequest,
  forgotPassword
);

router.post(
  "/auth/reset-password",
  [body("token").notEmpty(), body("password").custom(PASSWORD_VALIDATOR)],
  validateRequest,
  resetPassword
);

// --- Protected profile routes ---
router.get("/auth/me", protectCustomer, getProfile);

router.put(
  "/auth/me",
  protectCustomer, requireActiveAccount,
  [
    body("name").optional().trim().isLength({ min: 1, max: 100 }),
    body("phone").optional().trim(),
    body("avatar").optional().trim(),
  ],
  validateRequest,
  updateProfile
);

router.put(
  "/auth/me/password",
  protectCustomer, requireActiveAccount,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required."),
    body("newPassword").custom(PASSWORD_VALIDATOR),
  ],
  validateRequest,
  changePassword
);

router.put(
  "/auth/me/preferences",
  protectCustomer, requireActiveAccount,
  [
    body("emailNotifications").optional().isBoolean(),
    body("marketingEmails").optional().isBoolean(),
  ],
  validateRequest,
  updatePreferences
);

router.post(
  "/auth/me/delete",
  protectCustomer, requireActiveAccount,
  [body("password").notEmpty().withMessage("Password is required.")],
  validateRequest,
  deleteAccount
);

// --- Address routes ---
router.get("/auth/addresses", protectCustomer, requireActiveAccount, getAddresses);

router.post(
  "/auth/addresses",
  protectCustomer, requireActiveAccount,
  [
    body("label").optional().trim(),
    body("fullName").trim().notEmpty().withMessage("Full name is required."),
    body("phone").trim().notEmpty().withMessage("Phone is required."),
    body("addressLine").trim().notEmpty().withMessage("Address is required."),
    body("city").trim().notEmpty().withMessage("City is required."),
    body("district").trim().notEmpty().withMessage("District is required."),
    body("isDefault").optional().isBoolean(),
  ],
  validateRequest,
  addAddress
);

router.put("/auth/addresses/:addressId", protectCustomer, requireActiveAccount, updateAddress);
router.delete("/auth/addresses/:addressId", protectCustomer, requireActiveAccount, deleteAddress);

// --- Customer order routes ---
router.get("/auth/orders", protectCustomer, requireActiveAccount, getMyOrders);
router.get("/auth/orders/:id", protectCustomer, requireActiveAccount, getMyOrder);

export default router;
