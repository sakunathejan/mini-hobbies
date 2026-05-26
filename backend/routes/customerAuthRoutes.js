import express from "express";
import { body } from "express-validator";
import { protectCustomer } from "../middleware/customerAuth.js";
import { validateRequest, PASSWORD_VALIDATOR } from "../middleware/validateRequest.js";
import {
  register, login, refreshCustomerToken, logout,
  verifyEmail, resendVerification,
  forgotPassword, resetPassword,
  getProfile, updateProfile, changePassword, updatePreferences, deleteAccount,
  getAddresses, addAddress, updateAddress, deleteAddress,
} from "../controllers/customerAuthController.js";
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

router.post("/auth/refresh", refreshCustomerToken);
router.post("/auth/logout", logout);

router.get("/auth/verify-email/:token", verifyEmail);

router.post(
  "/auth/resend-verification",
  protectCustomer,
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
  protectCustomer,
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
  protectCustomer,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required."),
    body("newPassword").custom(PASSWORD_VALIDATOR),
  ],
  validateRequest,
  changePassword
);

router.put(
  "/auth/me/preferences",
  protectCustomer,
  [
    body("emailNotifications").optional().isBoolean(),
    body("marketingEmails").optional().isBoolean(),
  ],
  validateRequest,
  updatePreferences
);

router.post(
  "/auth/me/delete",
  protectCustomer,
  [body("password").notEmpty().withMessage("Password is required.")],
  validateRequest,
  deleteAccount
);

// --- Address routes ---
router.get("/auth/addresses", protectCustomer, getAddresses);

router.post(
  "/auth/addresses",
  protectCustomer,
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

router.put("/auth/addresses/:addressId", protectCustomer, updateAddress);
router.delete("/auth/addresses/:addressId", protectCustomer, deleteAddress);

// --- Customer order routes ---
router.get("/auth/orders", protectCustomer, getMyOrders);
router.get("/auth/orders/:id", protectCustomer, getMyOrder);

export default router;
