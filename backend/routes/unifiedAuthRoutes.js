import { Router } from "express";
import { body } from "express-validator";
import { validateRequest, PASSWORD_VALIDATOR } from "../middleware/validateRequest.js";
import { unifiedLogin, unifiedLogout, unifiedForgotPassword, unifiedResetPassword } from "../controllers/unifiedAuthController.js";

const router = Router();

router.post(
  "/login",
  body("email").isEmail().withMessage("Valid email required.").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
  validateRequest,
  unifiedLogin
);

router.post(
  "/forgot-password",
  body("email").isEmail().withMessage("Valid email required.").normalizeEmail(),
  validateRequest,
  unifiedForgotPassword
);

router.post(
  "/reset-password",
  body("token").notEmpty().withMessage("Token is required."),
  body("password").custom(PASSWORD_VALIDATOR),
  validateRequest,
  unifiedResetPassword
);

router.post("/logout", unifiedLogout);

export default router;
