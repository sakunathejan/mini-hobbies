import express from "express";
import { body } from "express-validator";
import { loginAdmin, refreshToken, logout, getMe, updateAdminProfile, forgotPassword, resetPassword } from "../controllers/authController.js";
import { adminOnly, protect, auditLog } from "../middleware/authMiddleware.js";
import { validateRequest, PASSWORD_VALIDATOR } from "../middleware/validateRequest.js";
import { getStats } from "../controllers/dashboardController.js";

const router = express.Router();

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  validateRequest,
  loginAdmin
);

router.post("/refresh", refreshToken);

router.post("/logout", logout);

router.get("/me", protect, adminOnly, getMe);

router.put(
  "/profile",
  protect,
  adminOnly,
  [
    body("name").optional().trim().isLength({ min: 1, max: 100 }),
    body("email").optional().isEmail().normalizeEmail(),
    body("currentPassword").optional().notEmpty(),
    body("newPassword").optional().custom(PASSWORD_VALIDATOR)
  ],
  validateRequest,
  auditLog("update_profile", "admin"),
  updateAdminProfile
);

router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail()],
  validateRequest,
  forgotPassword
);

router.post(
  "/reset-password",
  [body("token").notEmpty(), body("password").custom(PASSWORD_VALIDATOR)],
  validateRequest,
  resetPassword
);

router.get("/dashboard", protect, adminOnly, getStats);

export default router;
